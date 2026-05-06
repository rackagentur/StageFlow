// supabase/functions/daily-routine/index.ts
// Runs daily at 6 AM UTC - handles all automated email tasks

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const FROM = "Gregorgus (GEEZ) <info@soundofgeez.com>";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function digestEmailHTML(displayName: string, followUps: any[], overdue: any[], type: "daily" | "weekly") {
  const total = followUps.length + overdue.length;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your follow-ups</title>
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
      <p>Clean slate ${type === "daily" ? "today" : "this week"}. No follow-ups scheduled.</p>
      <p>That's either a sign you're crushing it, or it's time to add more leads to the pipeline.</p>
    ` : `
      <p>${type === "daily" ? "You've got follow-ups due today." : "You've got follow-ups due this week."}</p>
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
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6B2FD4; margin-bottom: 16px;">${type === "daily" ? "TODAY" : "THIS WEEK"}</p>
        <ul class="lead-list">
          ${followUps.slice(0, 5).map(lead => `
            <li class="lead-item">
              <div class="lead-name">${lead.name}</div>
              <div class="lead-date">Follow up by ${new Date(lead.follow_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            </li>
          `).join('')}
          ${followUps.length > 5 ? `<p style="font-size: 12px; color: #9090a8; margin-top: 10px;">+ ${followUps.length - 5} more ${type === "daily" ? "today" : "this week"}</p>` : ''}
        </ul>
      ` : ''}
    `}
    
    <hr class="divider" />
    <p style="margin:0">${type === "daily" ? "Set aside 20 minutes this morning. Knock them out before the day gets messy." : "Set aside 20 minutes Monday morning. Knock them out before the week gets messy."}</p>
    
    <div class="cta-wrap">
      <a href="https://app.noxreach.com" class="btn">Open Follow-ups →</a>
    </div>
    
    <div class="sig">
      <div class="sig-name">Gregorgus (GEEZ)</div>
      <div class="sig-title">Founder, NoxReach</div>
    </div>
  </div>
  <div class="footer">
    ${type === "daily" ? "Daily" : "Weekly"} digest · <a href="https://app.noxreach.com/settings">Manage preferences</a><br />
    <a href="mailto:hello@noxreach.io">hello@noxreach.io</a>
  </div>
</div>
</body>
</html>`;
}

async function sendDigest(email: string, displayName: string, followUps: any[], overdue: any[], type: "daily" | "weekly") {
  const total = followUps.length + overdue.length;
  
  // Don't send if no follow-ups (clean slate emails can be annoying daily)
  if (type === "daily" && total === 0) return null;
  
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
        ? `⚠ ${total} follow-up${total > 1 ? 's' : ''} ${type === "daily" ? "today" : "this week"} (${overdue.length} overdue)`
        : total > 0
        ? `📌 ${total} follow-up${total > 1 ? 's' : ''} due ${type === "daily" ? "today" : "this week"}`
        : `✓ Clean slate ${type === "daily" ? "today" : "this week"}`,
      html: digestEmailHTML(displayName, followUps, overdue, type),
    }),
  });
  return res.json();
}

Deno.serve(async (_req) => {
  try {
    const today = new Date();
    const isMonday = today.getDay() === 1; // Send weekly on Mondays instead of Sundays
    
    // Get all users (remove is_pro filter for testing)
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name");

    if (profileError) throw profileError;

    const results = {
      daily: [],
      weekly: [],
      healthChecks: [],
    };

    for (const profile of profiles || []) {
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      // Get today's follow-ups
      const todayStr = today.toISOString().split('T')[0];
      const { data: todayLeads } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", profile.id)
        .eq("archived", false)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", todayStr);

      if (todayLeads && todayLeads.length > 0) {
        const overdue = todayLeads.filter(l => new Date(l.follow_up_date) < today);
        const todayOnly = todayLeads.filter(l => new Date(l.follow_up_date).toDateString() === today.toDateString());
        
        const displayName = profile.display_name || profile.username || user.email.split("@")[0];
        const result = await sendDigest(user.email, displayName, todayOnly, overdue, "daily");
        
        if (result) {
          results.daily.push({ email: user.email, result });
        }
      }

      // Weekly digest on Mondays
      if (isMonday) {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        
        const { data: weekLeads } = await supabase
          .from("leads")
          .select("*")
          .eq("user_id", profile.id)
          .eq("archived", false)
          .not("follow_up_date", "is", null)
          .lte("follow_up_date", weekFromNow.toISOString().split('T')[0]);

        if (weekLeads && weekLeads.length > 0) {
          const overdue = weekLeads.filter(l => new Date(l.follow_up_date) < today);
          const upcoming = weekLeads.filter(l => new Date(l.follow_up_date) >= today);
          
          const displayName = profile.display_name || profile.username || user.email.split("@")[0];
          const result = await sendDigest(user.email, displayName, upcoming, overdue, "weekly");
          
          if (result) {
            results.weekly.push({ email: user.email, result });
          }
        }
      }

      // Health check - calculate user state
      const { data: allLeads } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", profile.id)
        .eq("archived", false);

      const daysSinceSignup = Math.floor((today.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const contacted = allLeads?.filter(l => l.stage !== "Target").length || 0;
      const replied = allLeads?.filter(l => l.stage === "Replied").length || 0;
      const booked = allLeads?.filter(l => l.stage === "Booked").length || 0;

      let healthStatus = "active";
      if (allLeads?.length === 0 && daysSinceSignup >= 2) healthStatus = "no_leads_added";
      else if (allLeads && allLeads.length > 0 && contacted === 0 && daysSinceSignup >= 5) healthStatus = "leads_not_contacted";
      else if (replied > 0 && booked === 0 && daysSinceSignup >= 10) healthStatus = "replies_no_bookings";

      // Update health status in profiles
      await supabase
        .from("profiles")
        .update({ 
          health_status: healthStatus,
          last_health_check: today.toISOString(),
        })
        .eq("id", profile.id);

      results.healthChecks.push({ 
        userId: profile.id, 
        email: user.email, 
        status: healthStatus, 
        leadCount: allLeads?.length || 0,
        contacted,
        replied,
        booked,
      });
    }

    console.log("Daily routine complete:", {
      dailyDigestsSent: results.daily.length,
      weeklyDigestsSent: results.weekly.length,
      healthChecksCompleted: results.healthChecks.length,
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      date: today.toISOString(),
      isMonday,
      results,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("daily-routine error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
