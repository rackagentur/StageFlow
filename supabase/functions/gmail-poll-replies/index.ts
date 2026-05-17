// supabase/functions/gmail-poll-replies/index.ts
// Polls Gmail threads for replies to outreach emails.
// Called manually (Refresh button in Reply Hub) or by a cron job.
//
// Flow:
//   1. Load user's Gmail connection (with token auto-refresh)
//   2. Load all sent threads from email_sends where provider=gmail and thread_id IS NOT NULL
//   3. For each thread, fetch all messages from Gmail API
//   4. Identify messages that are NOT from the user (= replies)
//   5. Insert new replies into email_replies (skip already-stored ones)
//   Returns: { ok: true, new_replies: N }

const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY     = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) { console.error("Token refresh failed:", await res.text()); return null; }
  return res.json();
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getGmailConnection(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.gmail&select=*&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function updateTokens(userId: string, accessToken: string, expiresAt: string) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.gmail`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: accessToken, token_expires_at: expiresAt }),
    }
  );
}

async function getSentThreads(userId: string): Promise<Array<{
  thread_id: string;
  lead_id: string;
  from_email: string;
  message_id: string;
}>> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_sends?user_id=eq.${userId}&provider=eq.gmail&thread_id=not.is.null&select=thread_id,lead_id,from_email,message_id&order=created_at.desc`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

async function getExistingReplyMessageIds(userId: string): Promise<Set<string>> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_replies?user_id=eq.${userId}&select=gmail_message_id`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (!res.ok) return new Set();
  const rows: Array<{ gmail_message_id: string }> = await res.json();
  return new Set(rows.map(r => r.gmail_message_id).filter(Boolean));
}

async function insertReply(params: {
  userId: string;
  leadId: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: string;
  gmailMessageId: string;
  gmailThreadId: string;
}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/email_replies`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify({
      user_id:          params.userId,
      lead_id:          params.leadId,
      from_email:       params.fromEmail,
      subject:          params.subject,
      snippet:          params.snippet,
      body_text:        params.bodyText,
      received_at:      params.receivedAt,
      is_read:          false,
      gmail_message_id: params.gmailMessageId,
      gmail_thread_id:  params.gmailThreadId,
    }),
  });
  return res.ok;
}

// Auto-advance lead to "replied" stage if not already replied/booked
async function advanceLeadToReplied(leadId: string, userId: string) {
  // Only advance if current stage is contacted / followup1 / followup2
  await fetch(
    `${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}&user_id=eq.${userId}&stage=in.(contacted,followup1,followup2)`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ stage: "replied" }),
    }
  );
}

// ── Gmail API helpers ─────────────────────────────────────────────────────────

async function fetchThread(threadId: string, accessToken: string): Promise<{
  messages: Array<{
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
      headers: Array<{ name: string; value: string }>;
      parts?: Array<{ mimeType: string; body: { data?: string } }>;
      body?: { data?: string };
    };
    internalDate: string;
  }>;
} | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    console.error(`Thread fetch failed for ${threadId}:`, await res.text());
    return null;
  }
  return res.json();
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function decodeBase64(data: string): string {
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return atob(base64);
  } catch {
    return "";
  }
}

function extractBody(payload: {
  parts?: Array<{ mimeType: string; body: { data?: string } }>;
  body?: { data?: string };
}): string {
  // Try plain text part first
  if (payload.parts) {
    const textPart = payload.parts.find(p => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64(textPart.body.data);
    // Try nested parts (multipart/alternative inside multipart/mixed)
    for (const part of payload.parts) {
      if ((part as any).parts) {
        const nested = (part as any).parts.find((p: any) => p.mimeType === "text/plain");
        if (nested?.body?.data) return decodeBase64(nested.body.data);
      }
    }
  }
  if (payload.body?.data) return decodeBase64(payload.body.data);
  return "";
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify user JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: authHeader },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { id: userId } = await userRes.json();

  // Load Gmail connection
  const conn = await getGmailConnection(userId);
  if (!conn) {
    return new Response(JSON.stringify({ ok: true, new_replies: 0, reason: "no_gmail_connection" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Refresh token if needed
  let accessToken: string = conn.access_token;
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null;
  if (!expiresAt || expiresAt.getTime() - Date.now() < 60_000) {
    if (!conn.refresh_token) {
      return new Response(JSON.stringify({ ok: false, error: "Token expired — reconnect Gmail" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const refreshed = await refreshAccessToken(conn.refresh_token);
    if (!refreshed) {
      return new Response(JSON.stringify({ ok: false, error: "Token refresh failed" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    accessToken = refreshed.access_token;
    await updateTokens(userId, accessToken, new Date(Date.now() + refreshed.expires_in * 1000).toISOString());
  }

  // Load sent threads + already-stored reply message IDs
  const [sentThreads, existingIds] = await Promise.all([
    getSentThreads(userId),
    getExistingReplyMessageIds(userId),
  ]);

  if (sentThreads.length === 0) {
    return new Response(JSON.stringify({ ok: true, new_replies: 0, reason: "no_sent_threads" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // De-duplicate threads (keep one entry per thread_id with its lead_id)
  const threadMap = new Map<string, { lead_id: string; from_email: string; sent_message_ids: Set<string> }>();
  for (const s of sentThreads) {
    if (!threadMap.has(s.thread_id)) {
      threadMap.set(s.thread_id, { lead_id: s.lead_id, from_email: s.from_email, sent_message_ids: new Set() });
    }
    if (s.message_id) threadMap.get(s.thread_id)!.sent_message_ids.add(s.message_id);
  }

  let newRepliesCount = 0;

  // Poll each thread for replies
  for (const [threadId, { lead_id, from_email, sent_message_ids }] of threadMap) {
    const thread = await fetchThread(threadId, accessToken);
    if (!thread?.messages) continue;

    // Each message in the thread that isn't one we sent = a reply
    for (const msg of thread.messages) {
      // Skip our own sent messages
      if (sent_message_ids.has(msg.id)) continue;
      // Skip if SENT label is on it (message sent by us, not tracked in email_sends)
      if (msg.labelIds?.includes("SENT")) continue;
      // Skip if already stored
      if (existingIds.has(msg.id)) continue;

      const headers = msg.payload?.headers ?? [];
      const replyFrom    = getHeader(headers, "From");
      const replySubject = getHeader(headers, "Subject");
      const bodyText     = extractBody(msg.payload);
      const receivedAt   = new Date(parseInt(msg.internalDate)).toISOString();

      const inserted = await insertReply({
        userId,
        leadId:         lead_id,
        fromEmail:      replyFrom || from_email,
        subject:        replySubject,
        snippet:        msg.snippet?.slice(0, 300) ?? "",
        bodyText:       bodyText.slice(0, 10000),
        receivedAt,
        gmailMessageId: msg.id,
        gmailThreadId:  threadId,
      });

      if (inserted) {
        // Auto-advance the lead to "replied" stage if not already replied/booked
        await advanceLeadToReplied(lead_id, userId);
      }

      existingIds.add(msg.id); // prevent double-insert within same poll
      newRepliesCount++;
    }
  }

  return new Response(JSON.stringify({ ok: true, new_replies: newRepliesCount }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
