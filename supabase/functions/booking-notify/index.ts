// supabase/functions/booking-notify/index.ts
// Sends a notification email to the DJ when a booking request is submitted
// via their public booking page (/book/username).

const RESEND_API_KEY    = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SERVICE_ROLE_KEY")!;
const FROM              = "NoxReach <noreply@noxreach.io>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getDJEmail(djUserId: string): Promise<string | null> {
  // 1. Try booking_email from user_assets first (preferred contact)
  const assetsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/user_assets?user_id=eq.${djUserId}&select=booking_email&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (assetsRes.ok) {
    const assets = await assetsRes.json();
    if (assets[0]?.booking_email) return assets[0].booking_email;
  }

  // 2. Fall back to auth user email
  const authRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${djUserId}`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (authRes.ok) {
    const user = await authRes.json();
    if (user?.email) return user.email;
  }

  return null;
}

async function getDJDisplayName(djUserId: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${djUserId}&select=display_name,username&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (res.ok) {
    const profiles = await res.json();
    if (profiles[0]) return profiles[0].display_name || profiles[0].username || "you";
  }
  return "you";
}

function bookingEmailHTML(params: {
  djName: string;
  venue: string;
  contactEmail: string;
  instagram?: string;
  eventType?: string;
  date?: string;
  feeOffer?: string;
  message?: string;
}) {
  const { djName, venue, contactEmail, instagram, eventType, date, feeOffer, message } = params;

  const row = (label: string, value: string | undefined) =>
    value
      ? `<tr><td style="padding:8px 0;font-size:12px;color:#6b6b88;font-weight:600;width:120px;vertical-align:top">${label}</td><td style="padding:8px 0;font-size:14px;color:#e0e0f0">${value}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Booking Request</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0f0f0">
<div style="max-width:560px;margin:0 auto;padding:40px 20px">
  <div style="background:#0f0f18;border:1px solid #1c1c2e;border-radius:16px;padding:36px 32px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0E7490;margin-bottom:16px">New Booking Request</div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff">${venue} wants to book ${djName}</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6b6b88">A new booking enquiry just landed. Reply directly to the promoter or open NoxReach to manage it.</p>
    <div style="background:#060608;border:1px solid #1c1c2e;border-radius:12px;padding:20px 22px;margin-bottom:28px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Venue / Event", venue)}
        ${row("Contact email", contactEmail)}
        ${row("Instagram", instagram)}
        ${row("Event type", eventType)}
        ${row("Date", date)}
        ${row("Fee offer", feeOffer ? `€${feeOffer}` : undefined)}
        ${row("Message", message)}
      </table>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a href="https://app.noxreach.com" style="display:inline-block;padding:12px 24px;background:#0E7490;color:#fff;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px">Open in NoxReach →</a>
      <a href="mailto:${contactEmail}" style="display:inline-block;padding:12px 24px;background:transparent;color:#22D3EE;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;border:1px solid rgba(14,116,144,0.4)">Reply to promoter</a>
    </div>
  </div>
  <div style="text-align:center;margin-top:24px;font-size:11px;color:#3a3a5a">
    Powered by <span style="color:#22D3EE;font-weight:700">NoxReach</span>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { venue, contact_email, instagram, event_type, date, fee_offer, message, dj_user_id } = body;

    if (!dj_user_id || !venue || !contact_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [djEmail, djName] = await Promise.all([
      getDJEmail(dj_user_id),
      getDJDisplayName(dj_user_id),
    ]);

    if (!djEmail) {
      console.warn("booking-notify: no email found for DJ", dj_user_id);
      return new Response(JSON.stringify({ ok: true, skipped: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [djEmail],
        reply_to: contact_email,
        subject: `New booking request from ${venue}`,
        html: bookingEmailHTML({ djName, venue, contactEmail: contact_email, instagram, eventType: event_type, date, feeOffer: fee_offer, message }),
      }),
    });

    const result = await res.json();
    console.log("booking-notify sent to", djEmail, result);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("booking-notify error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
