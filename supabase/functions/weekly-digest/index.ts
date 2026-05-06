// supabase/functions/weekly-digest/index.ts
// Triggered weekly via cron to send follow-up digest

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const FROM = "Gregorgus (GEEZ) <info@soundofgeez.com>";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function digestEmailHTML(displayName: string, followUps: any[], overdue: any[]) {
  const total = followUps.length + overdue.length;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your week ahead</title>
<style>
  body { margin: 0; padding: 0; background: #060608; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f0f0f0; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 48px 24px; }
  .card { background: #0f0f18; border: 1px solid #1c1c2e; border-radius: 16px; padding: 40px; }
  .greeting { font-size: 18px; font-weight: 600; color: #9090a8; margin: 0 0 24px; }
  p { font-size: 15px; color: #9090a8; line-height: 1.85; margin: 0 0 18px; }
  .punch { font-size: 16px; color: #f0f0f0; font-weight: 700; margin: 24px 0; }
  .stat { font-size: 48px; font-weight: 800; color: #6B2FD4; font-family: 'Courier New', monospace; text-align: center; margin: 20px 0; }
  .divider { border: none; border-top: 1px solid #1c1c2e; margin: 32px 0; }
  .lead-list { margin: 0; padding: 0; list-style: none; }
  .lead-item { padding: 14px 16px; margin-bottom: 10px; background: #0a0a10; border: 1px solid #1c1c2e; border-radius: 10px; }
  .lead-name { font-size: 14px; font-weight: 700; color: #f0f0f0; margin-bottom: 4px; }
  .lead-date { font-size: 12px; color: #9090a8; }
  .overdue { border-color: #D4AF37; background: rgba(212, 175, 55, 0.08); }
  .overdue .lead-date { color: #D4AF37; }
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
    
    ${total === 0 ? `
      <p>Clean slate this week. No follow-ups scheduled.</p>
      <p>That's either a sign you're crushing it, or it's time to add more leads to the pipeline.</p>
    ` : `
      <p>You've got follow-ups due this week.</p>
      <div class="stat">${total}</div>
      <p class="punch">${overdue.length > 0 ? `${overdue.length} overdue. Handle those first.` : 'Stay on top of them and replies come.'}</p>
      
      ${overdue.length > 0 ? `
        <hr class="divider" />
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #D4AF37; margin-bottom: 16px;">⚠ OVERDUE</p>
        <ul class="lead-list">
          ${overdue.slice(0, 5).map(lead => `
            <li class="lead-item overdue">
              <div class="lead-name">${lead.name}</div>
              <div class="lead-date">Due ${new Date(lead.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </li>
          `).join('')}
          ${overdue.length > 5 ? `<p style="font-size: 12px; color: #9090a8; margin-top: 10px;">+ ${overdue.length - 5} more overdue</p>` : ''}
        </ul>
      ` : ''}
      
      ${followUps.length > 0 ? `
        <hr class="divider" />
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6B2FD4; margin-bottom: 16px;">THIS WEEK</p>
        <ul class="lead-list">
          ${followUps.slice(0, 5).map(lead => `
            <li class="lead-item">
              <div class="lead-name">${lead.name}</div>
              <div class="lead-date">Follow up by ${new Date(lead.follow_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            </li>
          `).join('')}
          ${followUps.length > 5 ? `<p style="font-size: 12px; color: #9090a8; margin-top: 10px;">+ ${followUps.length - 5} more this week</p>` : ''}
        </ul>
      ` : ''}
    `}
    
    <hr class="divider" />
    <p style="margin:0">Set aside 20 minutes Monday morning. Knock them out before the week gets messy.</p>
    
    <div class="cta-wrap">
      <a href="https://app.noxreach.com" class="btn">Open Follow-ups →</a>
    </div>
    
    <div class="sig">
      <div class="sig-name">Gregorgus (GEEZ)</div>
      <div class="sig-title">Founder, NoxReach</div>
    </div>
  </div>
  <div class="footer">
    Weekly digest · <a href="https://app.noxreach.com/settings">Manage preferences</a><br />
    <a href="mailto:hello@noxreach.io">hello@noxreach.io</a>
  </div>
</div>
</body>
</html>`;
}

async function sendDigest(email: string, displayName: string, followUps: any[], overdue: any[]) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: overdue.length > 0 
        ? `⚠ ${overdue.length + followUps.length} follow-ups this week (${overdue.length} overdue)`
        : followUps.length > 0
        ? `📌 ${followUps.length} follow-ups due this week`
        : "✓ Clean slate this week",
      html: digestEmailHTML(displayName, followUps, overdue),
    }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    // Get all Pro users (or all users for testing)
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("is_pro", true); // Remove this line to send to all users during testing

    if (profileError) throw profileError;

    const results = [];

    for (const profile of profiles || []) {
      // Get user's email
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      // Get follow-ups for this user
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", profile.id)
        .eq("archived", false)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", weekFromNow.toISOString().split('T')[0]);

      if (!leads || leads.length === 0) {
        // Skip users with no follow-ups
        continue;
      }

      // Split into overdue vs upcoming
      const overdue = leads.filter(l => new Date(l.follow_up_date) < today);
      const upcoming = leads.filter(l => new Date(l.follow_up_date) >= today);

      const displayName = profile.display_name || profile.username || user.email.split("@")[0];
      
      const result = await sendDigest(user.email, displayName, upcoming, overdue);
      results.push({ email: user.email, result });
      
      console.log(`Digest sent to: ${user.email}`, result);
    }

    return new Response(JSON.stringify({ ok: true, sent: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("weekly-digest error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
