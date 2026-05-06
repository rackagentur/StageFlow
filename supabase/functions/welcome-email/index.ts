// supabase/functions/welcome-email/index.ts
// Triggered on new user signup via DB webhook on auth.users INSERT

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Gregorgus (GEEZ) <info@soundofgeez.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function welcomeEmailHTML(displayName: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to NoxReach</title>
<style>
  body { margin: 0; padding: 0; background: #060608; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f0f0f0; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 48px 24px; }
  .card { background: #0f0f18; border: 1px solid #1c1c2e; border-radius: 16px; padding: 44px 40px; }
  .greeting { font-size: 18px; font-weight: 600; color: #9090a8; margin: 0 0 24px; }
  p { font-size: 15px; color: #9090a8; line-height: 1.85; margin: 0 0 18px; }
  p strong { color: #f0f0f0; font-weight: 600; }
  p.punch { font-size: 15px; color: #f0f0f0; font-weight: 600; margin: 0 0 28px; }
  .divider { border: none; border-top: 1px solid #1c1c2e; margin: 32px 0; }
  .action-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6B2FD4; margin-bottom: 20px; }
  .action-list { margin: 0 0 8px; padding: 0; list-style: none; }
  .action-list li { font-size: 14px; color: #9090a8; padding: 14px 0; border-bottom: 1px solid #1c1c2e; display: flex; gap: 14px; align-items: flex-start; line-height: 1.65; }
  .action-list li:last-child { border-bottom: none; }
  .action-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
  .action-text strong { color: #f0f0f0; display: block; margin-bottom: 3px; font-size: 14px; font-weight: 700; }
  .cta-wrap { text-align: center; margin: 36px 0 0; }
  .btn { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #6B2FD4, #8B4FFF); color: #fff; font-size: 15px; font-weight: 800; text-decoration: none; border-radius: 10px; }
  .sig { margin-top: 36px; padding-top: 28px; border-top: 1px solid #1c1c2e; }
  .sig-name { font-size: 15px; font-weight: 700; color: #f0f0f0; margin-bottom: 3px; }
  .sig-title { font-size: 12px; color: #50506a; font-family: 'Courier New', monospace; }
  .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #50506a; line-height: 1.7; }
  .footer a { color: #6B2FD4; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="greeting">Hey ${displayName} —</div>
    <p>I'm Gregorgus. I built NoxReach because I was tired of losing gigs to bad follow-through.</p>
    <p>I had the music. I had the resume. But venues were slipping through cracks in my spreadsheet. Follow-ups went silent. Emails got buried. Someone else got the slot.</p>
    <p class="punch">NoxReach fixes that.</p>
    <hr class="divider" />
    <div class="action-label">Your first 3 moves</div>
    <ul class="action-list">
      <li>
        <span class="action-icon">📌</span>
        <span class="action-text">
          <strong>Add your first 5 target venues</strong>
          Go to Pipeline → Add Lead. Put in the venue name, contact email, and tag them by tier (A1 for dream bookings, A2 for solid spots, A3 for volume). That's your hit list.
        </span>
      </li>
      <li>
        <span class="action-icon">✉</span>
        <span class="action-text">
          <strong>Reach out and mark as Contacted</strong>
          Send your pitch (email or DM). Then move the lead to "Contacted" in your pipeline. NoxReach will remind you to follow up in 5 days. Then 14. Automatically.
        </span>
      </li>
      <li>
        <span class="action-icon">🎛️</span>
        <span class="action-text">
          <strong>Set up your Booking Kit</strong>
          Settings → Booking Kit. Drop your EPK link, SoundCloud, rates. When venues reply, you'll have everything ready to send in one click.
        </span>
      </li>
    </ul>
    <hr class="divider" />
    <p>You've got 30 days to try everything. If it's not clicking, just let me know. If it is — upgrade to Pro and the follow-ups keep running.</p>
    <p style="margin:0">Let's lock in some dates.</p>
    <div class="cta-wrap">
      <a href="https://app.noxreach.com" class="btn">Open NoxReach →</a>
    </div>
    <div class="sig">
      <div class="sig-name">Gregorgus (GEEZ)</div>
      <div class="sig-title">Founder, NoxReach · Tech House · Tribal Circuit · Cologne</div>
    </div>
  </div>
  <div class="footer">
    You're receiving this because you signed up for NoxReach.<br />
    <a href="mailto:hello@noxreach.io">hello@noxreach.io</a> · <a href="https://noxreach.com/privacy.html">Privacy</a>
  </div>
</div>
</body>
</html>`;
}

async function sendWelcomeEmail(email: string, displayName: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "You're in. Here's how to start booking.",
      html: welcomeEmailHTML(displayName),
    }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    
    const email = payload.record?.email || payload.email;
    const displayName = payload.record?.raw_user_meta_data?.full_name || 
                       payload.display_name || 
                       email?.split("@")[0] || 
                       "DJ";

    if (!email) throw new Error("No email provided");

    const result = await sendWelcomeEmail(email, displayName);
    console.log("Welcome email sent to:", email, result);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("welcome-email error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
