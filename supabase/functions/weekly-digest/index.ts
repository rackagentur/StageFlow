// supabase/functions/weekly-digest/index.ts
// Sends a weekly status + tip digest to every NoxReach user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY          = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Rotating weekly tips ──────────────────────────────────────────────────────
const TIPS = [
  {
    headline: "Add 5 leads every week — no exceptions.",
    body: "The artists who book the most aren't the most talented — they're the most consistent. 5 new leads a week = 260 pitches a year. Your calendar fills from there.",
  },
  {
    headline: "Always set a follow-up date.",
    body: "If it's not on the schedule, it won't happen. The moment you contact a venue, set a follow-up date in NoxReach. One click, then forget — we'll remind you.",
  },
  {
    headline: "Personalize the first line.",
    body: "Mention their last event, their room's vibe, or a specific night they ran. One sentence of research doubles your reply rate. Bookers can spot a template from a mile away.",
  },
  {
    headline: "Move leads to 'Replied' the second they respond.",
    body: "Even a two-word reply counts. Keeping replied leads visible at the top of your pipeline makes sure you never leave a warm conversation cold.",
  },
  {
    headline: "Follow up once more after silence.",
    body: "Venue went quiet after replying? Send one more message with two specific dates and your rate. Make it easy to say yes. Most bookings close on the third touch.",
  },
  {
    headline: "Your EPK should be one click away.",
    body: "Link your best mix in the first message. Booking managers decide in the first 2 minutes of listening — don't make them search for it. Add your EPK link in Settings → Assets.",
  },
  {
    headline: "Tag your leads by genre.",
    body: "Tech-House rooms want a different pitch than Melodic Techno rooms. Tagging lets you filter and stay focused — so you're always speaking the right language to the right booker.",
  },
  {
    headline: "Know your rate. Stick to it.",
    body: "The fee isn't just money — it's positioning. Discount strategically, not defensively. When you say your rate with confidence, venues hear confidence.",
  },
  {
    headline: "Log every gig with the fee.",
    body: "Tracking earnings in your calendar turns gigging from a hobby into a business. After every booking, add it to your NoxReach calendar with the confirmed fee.",
  },
  {
    headline: "Aim for 20+ active leads at all times.",
    body: "If your pipeline is thin today, your calendar will be thin in 60 days. Treat prospecting like training — consistent, even when you don't feel like it.",
  },
  {
    headline: "Target venues one tier above your usual.",
    body: "You'll be surprised how often bigger rooms are easier to book than mid-tier ones — less competition, more professional bookers, and faster decisions.",
  },
  {
    headline: "The Reply Hub is your morning ritual.",
    body: "Check it every morning. Replied leads are hot — they have momentum. A fast, professional response at 9am hits differently than one at 5pm.",
  },
];

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function emailHTML(
  name: string,
  leadCount: number,
  contactedCount: number,
  repliedCount: number,
  upcomingGig: { venue: string; date: string } | null,
  overdueCount: number,
  tip: typeof TIPS[number],
): string {
  const gigBlock = upcomingGig
    ? `
    <table role="presentation" style="width:100%;background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:12px;margin:0 0 28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">Next confirmed gig</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">${upcomingGig.venue}</p>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">${new Date(upcomingGig.date).toLocaleDateString("en-US",{weekday:"short",month:"long",day:"numeric"})}</p>
      </td></tr>
    </table>`
    : "";

  const overdueBlock = overdueCount > 0
    ? `<p style="margin:0 0 20px;font-size:14px;color:#fbbf24;font-weight:600;">⚠️ ${overdueCount} overdue follow-up${overdueCount > 1 ? "s" : ""} — handle these first.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your weekly NoxReach digest</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
  <tr><td style="padding:40px 20px;">
    <table role="presentation" style="max-width:600px;margin:0 auto;border-collapse:collapse;">

      <!-- Logo -->
      <tr><td style="padding:0 0 36px;text-align:center;">
        <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:3px;color:#8b5cf6;">NOXREACH</h1>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:0 0 24px;">
        <p style="margin:0;font-size:16px;line-height:1.6;color:#a1a1aa;">Hey ${name},</p>
      </td></tr>

      <!-- Stats row -->
      <tr><td style="padding:0 0 28px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          <tr>
            ${[
              ["Leads", leadCount.toString(), "#fff"],
              ["Contacted", contactedCount.toString(), "#a78bfa"],
              ["Replied", repliedCount.toString(), "#34d399"],
            ].map(([label, val, color]) => `
            <td style="width:33%;padding:0 6px 0 0;text-align:center;">
              <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px 8px;">
                <div style="font-size:28px;font-weight:800;color:${color};font-family:monospace;">${val}</div>
                <div style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">${label}</div>
              </div>
            </td>`).join("")}
          </tr>
        </table>
      </td></tr>

      ${overdueBlock ? `<tr><td style="padding:0 0 8px;">${overdueBlock}</td></tr>` : ""}
      ${gigBlock ? `<tr><td style="padding:0 0 8px;">${gigBlock}</td></tr>` : ""}

      <!-- Tip of the week -->
      <tr><td style="padding:0 0 28px;">
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;letter-spacing:1px;">💡 Tip of the week</p>
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#fff;line-height:1.4;">${tip.headline}</p>
          <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.7;">${tip.body}</p>
        </div>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:0 0 32px;">
        <a href="https://app.noxreach.com"
           style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Open NoxReach →
        </a>
      </td></tr>

      <!-- Signature -->
      <tr><td style="padding:0 0 0;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#fff;">Gregorgus Geez</p>
        <p style="margin:0;font-size:13px;color:#71717a;">Founder, NoxReach</p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:36px 0 0;border-top:1px solid #27272a;margin-top:36px;">
        <p style="margin:0;font-size:11px;color:#52525b;text-align:center;line-height:1.7;">
          You're receiving this weekly digest because you signed up for NoxReach.<br/>
          <a href="https://app.noxreach.com" style="color:#52525b;">app.noxreach.com</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now      = new Date();
    const weekNum  = getISOWeek(now);
    const year     = now.getFullYear();
    const weekKey  = `weekly_digest_${year}_W${String(weekNum).padStart(2, "0")}`;
    const tip      = TIPS[weekNum % TIPS.length];

    // One week window for follow-up overdue check
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, display_name");

    if (profilesError) throw new Error(`Profiles fetch failed: ${profilesError.message}`);

    const results = [];

    for (const profile of profiles || []) {
      const userId = profile.id;
      const email  = profile.email;
      if (!email) continue;

      const name = profile.display_name || email.split("@")[0];

      // Skip if already sent this week
      const { data: alreadySent } = await supabase
        .from("email_sends")
        .select("id")
        .eq("user_id", userId)
        .eq("email_type", weekKey)
        .single();

      if (alreadySent) {
        console.log(`  ⏩ Already sent ${weekKey} to ${email}`);
        continue;
      }

      // Fetch leads
      const { data: leads } = await supabase
        .from("leads")
        .select("name, stage, follow_up_date, created_at")
        .eq("user_id", userId)
        .eq("archived", false);

      const leadCount      = leads?.length || 0;
      const contactedCount = leads?.filter(l => l.stage !== "target").length || 0;
      const repliedCount   = leads?.filter(l => l.stage === "replied" || l.stage === "booked").length || 0;
      const overdueCount   = leads?.filter(l => l.follow_up_date && l.follow_up_date < todayStr).length || 0;

      // Skip users with zero leads and no activity — they'd find the email meaningless
      if (leadCount === 0) {
        console.log(`  ⏩ No leads yet for ${email} — skipping digest`);
        continue;
      }

      // Fetch next upcoming confirmed gig
      const { data: gigs } = await supabase
        .from("gigs")
        .select("venue, date")
        .eq("user_id", userId)
        .eq("status", "confirmed")
        .gte("date", todayStr)
        .order("date", { ascending: true })
        .limit(1);

      const upcomingGig = gigs?.[0] || null;

      // Build subject line
      let subject = `Your NoxReach digest — week ${weekNum}`;
      if (overdueCount > 0) subject = `⚠️ ${overdueCount} overdue follow-up${overdueCount > 1 ? "s" : ""} + your weekly tip`;
      else if (upcomingGig) subject = `📅 ${upcomingGig.venue} coming up — your weekly digest`;
      else if (repliedCount > 0) subject = `🔥 ${repliedCount} venue${repliedCount > 1 ? "s" : ""} replied — close the deal`;

      // Send via Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "NoxReach <noxreach@soundofgeez.com>",
          to: [email],
          subject,
          html: emailHTML(name, leadCount, contactedCount, repliedCount, upcomingGig, overdueCount, tip),
        }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        console.error(`  ❌ Resend error for ${email}:`, resendData);
        results.push({ email, success: false, error: JSON.stringify(resendData) });
        continue;
      }

      // Log the send so it never fires again this week
      await supabase.from("email_sends").insert({
        user_id:    userId,
        email_type: weekKey,
        resend_id:  resendData.id,
        metadata:   { email, name, weekKey, leadCount, repliedCount },
      });

      console.log(`  ✅ Digest sent → ${email}`);
      results.push({ email, success: true });
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.filter(r => r.success).length, skipped: (profiles?.length || 0) - results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("weekly-digest error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
