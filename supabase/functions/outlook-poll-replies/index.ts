// supabase/functions/outlook-poll-replies/index.ts
// Polls Outlook/Microsoft 365 threads for replies to outreach emails.
// Mirrors gmail-poll-replies but uses Microsoft Graph API.
//
// Flow:
//   1. Load user's Outlook connection (with token auto-refresh)
//   2. Load all sent threads from email_sends where provider=outlook and thread_id IS NOT NULL
//      (thread_id holds the Outlook conversationId, captured by the draft-send flow in outlook-send)
//   3. For each conversationId, fetch matching messages from inbox via Graph
//   4. Identify messages NOT sent by the user (= replies)
//   5. Insert new replies into email_replies (skip already-stored ones)
//   Returns: { ok: true, new_replies: N }

const MICROSOFT_CLIENT_ID     = Deno.env.get("MICROSOFT_CLIENT_ID")!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET")!;
const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY         = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id:     MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        grant_type:    "refresh_token",
        scope: [
          "https://graph.microsoft.com/Mail.ReadWrite",
          "https://graph.microsoft.com/User.Read",
          "offline_access",
        ].join(" "),
      }),
    }
  );
  if (!res.ok) { console.error("Token refresh failed:", await res.text()); return null; }
  return res.json();
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getOutlookConnection(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.outlook&select=*&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function updateTokens(userId: string, accessToken: string, expiresAt: string) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.outlook`,
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

async function getSentConversations(userId: string): Promise<Array<{
  thread_id: string;   // conversationId
  lead_id: string;
  from_email: string;
  message_id: string;
}>> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_sends?user_id=eq.${userId}&provider=eq.outlook&thread_id=not.is.null&select=thread_id,lead_id,from_email,message_id&order=created_at.desc`,
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
  outlookMessageId: string;
  outlookConversationId: string;
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
      // reuse gmail_message_id column to store Outlook message ID
      gmail_message_id: params.outlookMessageId,
      gmail_thread_id:  params.outlookConversationId,
    }),
  });
  return res.ok;
}

async function advanceLeadToReplied(leadId: string, userId: string) {
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

// ── Graph API helpers ─────────────────────────────────────────────────────────

interface GraphMessage {
  id: string;
  conversationId: string;
  internetMessageId: string;
  receivedDateTime: string;
  subject: string;
  bodyPreview: string;
  body: { content: string; contentType: string };
  from: { emailAddress: { address: string; name: string } };
  isDraft: boolean;
  sentDateTime?: string;
}

async function fetchConversationMessages(
  conversationId: string,
  accessToken: string
): Promise<GraphMessage[]> {
  const filter = encodeURIComponent(`conversationId eq '${conversationId}'`);
  const select = "id,conversationId,internetMessageId,receivedDateTime,subject,bodyPreview,body,from,isDraft,sentDateTime";
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?$filter=${filter}&$select=${select}&$orderby=receivedDateTime asc&$top=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    console.error(`Conversation fetch failed for ${conversationId}:`, await res.text());
    return [];
  }
  const data = await res.json();
  return data.value ?? [];
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

  // Load Outlook connection
  const conn = await getOutlookConnection(userId);
  if (!conn) {
    return new Response(JSON.stringify({ ok: true, new_replies: 0, reason: "no_outlook_connection" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Refresh token if needed
  let accessToken: string = conn.access_token;
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null;
  if (!expiresAt || expiresAt.getTime() - Date.now() < 60_000) {
    if (!conn.refresh_token) {
      return new Response(JSON.stringify({ ok: false, error: "Token expired — reconnect Outlook" }), {
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

  // Load sent conversations + already-stored reply IDs
  const [sentConversations, existingIds] = await Promise.all([
    getSentConversations(userId),
    getExistingReplyMessageIds(userId),
  ]);

  if (sentConversations.length === 0) {
    return new Response(JSON.stringify({ ok: true, new_replies: 0, reason: "no_sent_conversations" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // De-duplicate: one entry per conversationId
  const convMap = new Map<string, { lead_id: string; from_email: string; sent_message_ids: Set<string> }>();
  for (const s of sentConversations) {
    if (!convMap.has(s.thread_id)) {
      convMap.set(s.thread_id, { lead_id: s.lead_id, from_email: s.from_email, sent_message_ids: new Set() });
    }
    if (s.message_id) convMap.get(s.thread_id)!.sent_message_ids.add(s.message_id);
  }

  let newRepliesCount = 0;

  // Poll each conversation for replies
  for (const [conversationId, { lead_id, from_email, sent_message_ids }] of convMap) {
    const messages = await fetchConversationMessages(conversationId, accessToken);

    for (const msg of messages) {
      // Skip drafts
      if (msg.isDraft) continue;
      // Skip messages we sent: match by sender address OR by stored internetMessageId
      const senderAddress = msg.from?.emailAddress?.address?.toLowerCase() ?? "";
      const ownAddress    = (conn.email as string).toLowerCase();
      if (senderAddress === ownAddress) continue;
      if (msg.internetMessageId && sent_message_ids.has(msg.internetMessageId)) continue;
      // Skip already-stored replies
      if (existingIds.has(msg.id)) continue;

      const bodyText = msg.body?.contentType === "html"
        ? msg.body.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : (msg.body?.content ?? "");

      const inserted = await insertReply({
        userId,
        leadId:               lead_id,
        fromEmail:            msg.from?.emailAddress?.address ?? from_email,
        subject:              msg.subject ?? "",
        snippet:              msg.bodyPreview?.slice(0, 300) ?? "",
        bodyText:             bodyText.slice(0, 10000),
        receivedAt:           msg.receivedDateTime,
        outlookMessageId:     msg.id,
        outlookConversationId: conversationId,
      });

      if (inserted) {
        await advanceLeadToReplied(lead_id, userId);
      }

      existingIds.add(msg.id);
      newRepliesCount++;
    }
  }

  return new Response(JSON.stringify({ ok: true, new_replies: newRepliesCount }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
