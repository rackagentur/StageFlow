// supabase/functions/resend-send/index.ts
// Sends email via Resend API using the user's stored connection.
// Falls back to NoxReach's own RESEND_API_KEY if the user didn't provide one.
// Credentials stored in email_connections: provider="resend",
//   email=from_address, access_token=api_key (or "resend" for default),
//   metadata={from_name}

import { fetchWithRetry } from "../_lib/fetchWithRetry.ts";

const RESEND_API_KEY_DEFAULT = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL            = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY        = Deno.env.get("SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getResendConnection(userId: string) {
  const res = await fetchWithRetry(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.resend&select=*&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    3,
    5000
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function logSend(params: {
  userId: string;
  leadId?: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
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
      provider:   "resend",
      from_email: params.fromEmail,
      to_email:   params.toEmail,
      subject:    params.subject,
      body_text:  params.bodyText,
      thread_id:  null,
      message_id: null,
    }),
  }, 3, 5000);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Runtime env validation
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables for resend-send");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

  const { to, subject, message, lead_id } = await req.json();
  if (!to || !subject || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields: to, subject, message" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const conn = await getResendConnection(userId);
  if (!conn) {
    return new Response(JSON.stringify({ error: "No Resend connection found. Configure email in Settings first." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fromEmail  = conn.email as string;
  const fromName   = conn.metadata?.from_name as string | undefined;
  const fromDisplay = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const apiKey     = (conn.access_token && conn.access_token !== "resend")
    ? conn.access_token as string
    : RESEND_API_KEY_DEFAULT;

  const res = await fetchWithRetry("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    fromDisplay,
      to:      [to],
      subject,
      text:    message,
    }),
  }, 3, 10000);

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend API error:", errText);
    return new Response(JSON.stringify({ error: "Resend API error", detail: errText }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await logSend({ userId, leadId: lead_id, fromEmail, toEmail: to, subject, bodyText: message });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
