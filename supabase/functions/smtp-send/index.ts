// supabase/functions/smtp-send/index.ts
// Sends email via user-configured SMTP (e.g. smtp.ionos.de).
// Credentials stored in email_connections: provider="smtp",
//   access_token=password, email=from_address,
//   metadata={host, port, from_name}

import { SMTPClient } from "https://deno.land/x/denomailer@1.0.1/mod.ts";
import { fetchWithRetry } from "../_lib/fetchWithRetry.ts";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getSmtpConnection(userId: string) {
  const res = await fetchWithRetry(
    `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.smtp&select=*&limit=1`,
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
      provider:   "smtp",
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
    console.error("Missing required environment variables for smtp-send");
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

  const conn = await getSmtpConnection(userId);
  if (!conn) {
    return new Response(JSON.stringify({ error: "No SMTP connection found. Configure SMTP in Settings first." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const host      = conn.metadata?.host as string;
  const port      = parseInt(conn.metadata?.port ?? "465", 10);
  const password  = conn.access_token as string;
  const fromEmail = conn.email as string;
  const fromName  = conn.metadata?.from_name as string | undefined;
  const fromDisplay = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  if (!host || !password) {
    return new Response(JSON.stringify({ error: "SMTP configuration incomplete — missing host or password." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: {
        username: fromEmail,
        password,
      },
    },
  });

  try {
    await client.send({
      from: fromDisplay,
      to,
      subject,
      content: message,
    });
    await client.close();
  } catch (err) {
    console.error("SMTP send error:", err);
    await client.close().catch(() => {});
    return new Response(JSON.stringify({ error: "SMTP send failed", detail: String(err.message ?? err) }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await logSend({ userId, leadId: lead_id, fromEmail, toEmail: to, subject, bodyText: message });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
