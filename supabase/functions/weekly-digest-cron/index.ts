// supabase/functions/weekly-digest-cron/index.ts
// Cron trigger that calls the weekly-digest function.
// Sends an alert email to the admin if the digest fails or if any
// individual sends error out.

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL      = "info@soundofgeez.com";

async function sendAdminAlert(subject: string, body: string) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NoxReach Alerts <noreply@noxreach.io>",
        to: [ADMIN_EMAIL],
        subject,
        html: `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,sans-serif;color:#f0f0f0">
<div style="max-width:520px;margin:0 auto;padding:40px 20px">
  <div style="background:#0f0f18;border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:32px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#ef4444;margin-bottom:12px">⚠ NoxReach Alert</div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#fff">${subject}</h2>
    <pre style="margin:0;font-size:12px;color:#a1a1aa;white-space:pre-wrap;line-height:1.6">${body}</pre>
  </div>
  <div style="text-align:center;margin-top:20px;font-size:11px;color:#3a3a5a">
    Powered by <span style="color:#22D3EE;font-weight:700">NoxReach</span>
  </div>
</div>
</body>
</html>`,
      }),
    });
  } catch (alertErr) {
    console.error("Failed to send admin alert email:", alertErr);
  }
}

Deno.serve(async (_req) => {
  const firedAt = new Date().toISOString();

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/weekly-digest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // ── Hard failure (5xx from the function itself) ──────────────────────────
    if (!res.ok) {
      const errText = await res.text();
      console.error("Weekly digest function returned error:", res.status, errText);

      await sendAdminAlert(
        `Weekly digest failed (HTTP ${res.status})`,
        `Fired at: ${firedAt}\nStatus: ${res.status}\nResponse:\n${errText}`,
      );

      return new Response(JSON.stringify({ ok: false, status: res.status, error: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    console.log("Weekly digest triggered:", result);

    // ── Soft failure (function ran but reported errors) ──────────────────────
    const failedSends: { email: string; error?: string }[] = (result.results || []).filter(
      (r: { success: boolean }) => !r.success,
    );

    if (!result.success || failedSends.length > 0) {
      const lines = [
        `Fired at: ${firedAt}`,
        `Sent: ${result.sent ?? "?"} | Skipped: ${result.skipped ?? "?"}`,
        "",
        failedSends.length > 0
          ? `Failed sends (${failedSends.length}):\n${failedSends.map(f => `  • ${f.email}: ${f.error ?? "unknown"}`).join("\n")}`
          : `Function reported success=false with no individual failures.\n${JSON.stringify(result, null, 2)}`,
      ].join("\n");

      await sendAdminAlert(
        failedSends.length > 0
          ? `Weekly digest: ${failedSends.length} send(s) failed`
          : "Weekly digest: function reported failure",
        lines,
      );
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Cron trigger error:", err.message);

    await sendAdminAlert(
      "Weekly digest cron threw an exception",
      `Fired at: ${firedAt}\nError: ${err.message}\n${err.stack ?? ""}`,
    );

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
