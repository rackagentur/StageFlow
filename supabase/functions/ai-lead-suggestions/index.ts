// supabase/functions/ai-lead-suggestions/index.ts
// Uses Claude to suggest new venues/promoters based on the user's existing pipeline

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { currentLead, existingLeads, artistGenre } = await req.json();

    if (!currentLead?.name) {
      return new Response(JSON.stringify({ error: "Missing lead data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Summarize existing pipeline for context (top 15 leads)
    const pipelineSummary = (existingLeads || [])
      .slice(0, 15)
      .map((l: { name: string; city?: string; country?: string; tag?: string; tier?: string }) =>
        `${l.name}${l.city ? ` (${l.city}${l.country ? ", " + l.country : ""})` : ""} — ${l.tag || "??"} ${l.tier || ""}`
      )
      .join("\n");

    const systemPrompt = `You are a DJ booking strategy expert. Your job is to suggest real, bookable venues and promoters a DJ should target next based on their current pipeline. Return ONLY a valid JSON array with exactly 5 items. No explanation text, no markdown, no code blocks — just the raw JSON array.`;

    const userPrompt = `A DJ who plays ${artistGenre || "Electronic music"} wants similar venues to: ${currentLead.name}${currentLead.city ? ` in ${currentLead.city}` : ""}${currentLead.country ? `, ${currentLead.country}` : ""} (${currentLead.tag || "Electronic"}, ${currentLead.tier || "A2"}).

Their existing pipeline includes:
${pipelineSummary || "No existing leads yet"}

Suggest 5 NEW venues or promoters they haven't targeted yet. Be specific with real venue/event names. Focus on similar scene, scale and geography. Slightly expand the geography if local scene is saturated.

Return this exact JSON format:
[
  {
    "name": "Venue or event name",
    "city": "City",
    "country": "Country code (e.g. DE, NL, UK)",
    "tag": "One of: TECHNO, HOUSE, CIRCUIT, FESTIVAL, TECH-HOUSE, MELODIC, OTHER",
    "tier": "A1, A2, or A3",
    "instagram": "@handle or empty string",
    "notes": "One sentence on why this is a good fit"
  }
]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "[]";

    // Parse JSON safely
    let suggestions = [];
    try {
      suggestions = JSON.parse(raw);
    } catch {
      // Try to extract JSON array from the text
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) suggestions = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ai-lead-suggestions error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
