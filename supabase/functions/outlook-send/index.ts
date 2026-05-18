// supabase/functions/outlook-send/index.ts
// Sends an email via Microsoft Graph API using the user's stored OAuth tokens.
// Automatically refreshes the access token if expired.
// Logs the send to email_sends table for reply tracking.

import { fetchWithRetry } from "../_lib/fetchWithRetry.ts";

const MICROSOFT_CLIENT_ID     = Deno.env.get("MICROSOFT_CLIENT_ID");
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
const SUPABASE_URL            = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY        = Deno.env.get("SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  const res = await fetchWithRetry(
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
          "https://graph.microsoft.com/Mail.Send",
          "https://graph.microsoft.com/User.Read",
          "offline_access",
        ].join(" "),
      }),
    },
    3,
    10000
  );
  if (!res.ok) { console.error("Refresh failed:", await res.text()); return null; }
  return res.json();
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getConnection(userId: string) {
  const res = await fetchWithRetry(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.outlook&select=*&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    3,
    5000
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function updateTokens(userId: string, accessToken: string, expiresAt: string) {
  await fetchWithRetry(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.outlook`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: accessToken, token_expires_at: expiresAt }),
    },
    3,
    5000
  );
}

async function logSend(params: {
  userId: string;
  leadId?: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  messageId?: string;
  conversationId?: string;
}) {
  await fetchWithRetry(`${SUPABASE_URL}/rest/v1/email_sends`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id:    params.userId,
      lead_id:    params.leadId ?? null,
      provider:   "outlook",
      from_email: params.fromEmail,
      to_email:   params.toEmail,
      subject:    params.subject,
      body_text:  params.bodyText,
      // thread_id stores the Outlook conversationId for reply polling
      thread_id:  params.conversationId ?? null,
      message_id: params.messageId ?? null,
    }),
  }, 3, 5000);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Runtime env validation
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables for outlook-send");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify user JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userRes = await fetchWithRetry(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: authHeader },
  }, 3, 5000);
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { id: userId } = await userRes.json();

  const body = await req.json();
  const { to, subject, message, lead_id } = body;

  if (!to || !subject || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields: to, subject, message" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load stored connection
  const conn = await getConnection(userId);
  if (!conn) {
    return new Response(JSON.stringify({ error: "No Outlook connection found. Connect Outlook in Settings first." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Refresh token if expired (or within 60s of expiry)
  let accessToken: string = conn.access_token;
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null;
  if (!expiresAt || expiresAt.getTime() - Date.now() < 60_000) {
    if (!conn.refresh_token) {
      return new Response(JSON.stringify({ error: "Token expired and no refresh token available. Please reconnect Outlook." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const refreshed = await refreshAccessToken(conn.refresh_token);
    if (!refreshed) {
      return new Response(JSON.stringify({ error: "Failed to refresh token. Please reconnect Outlook." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    accessToken = refreshed.access_token;
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await updateTokens(userId, accessToken, newExpiry);
  }

  // Use draft-then-send to capture conversationId for reply polling
  const draftRes = await fetchWithRetry(
    "https://graph.microsoft.com/v1.0/me/messages",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        body: { contentType: "Text", content: message },
        toRecipients: [{ emailAddress: { address: to } }],
        from: { emailAddress: { address: conn.email } },
      }),
    },
    3,
    10000
  );

  if (!draftRes.ok) {
    const errText = await draftRes.text();
    console.error("Graph draft create failed:", errText);
    return new Response(JSON.stringify({ error: "Microsoft Graph API error", detail: errText }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const draft = await draftRes.json();
  const messageId     = draft.id as string;
  const conversationId = draft.conversationId as string | undefined;
  const internetMsgId  = draft.internetMessageId as string | undefined;

  // Send the draft
  const sendRes = await fetchWithRetry(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    3,
    10000
  );

  if (!sendRes.ok) {
    const errText = await sendRes.text();
    console.error("Graph send failed:", errText);
    return new Response(JSON.stringify({ error: "Microsoft Graph API error", detail: errText }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log to email_sends (conversationId stored in thread_id for reply polling)
  await logSend({
    userId,
    leadId:         lead_id,
    fromEmail:      conn.email,
    toEmail:        to,
    subject,
    bodyText:       message,
    messageId:      internetMsgId,
    conversationId,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
