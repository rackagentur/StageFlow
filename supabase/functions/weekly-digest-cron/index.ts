// supabase/functions/weekly-digest-cron/index.ts
// Cron trigger that calls the weekly-digest function

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

Deno.serve(async (_req) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/weekly-digest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    console.log("Weekly digest triggered:", result);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cron trigger error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
