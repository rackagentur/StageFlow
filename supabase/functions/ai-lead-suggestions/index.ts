// supabase/functions/ai-lead-suggestions/index.ts
// Uses Claude to suggest new venues/promoters based on the user's existing pipeline

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      console.error("Missing ANTHROPIC_API_KEY env var");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { currentLead, existingLeads, artistGenre } = await req.json();

    if (!currentLead?.name) {
      return new Response(JSON.stringify({ error: "Missing lead data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit number of leads used for context to avoid token explosions
    const safeLeads = (existingLeads || []).slice(0, 12);
    const pipelineSummary = safeLeads
      .map((l: { name: string; city?: string; country?: string; tag?: string; tier?: string }) =>
        `${l.name}${l.city ? ` (${l.city}${l.country ? ", " + l.country : ""})` : ""} — ${l.tag || "??"} ${l.tier || ""}`
      )
      .join("\n");

    const systemPrompt = `You are a DJ booking strategy expert. Your job is to suggest real, bookable venues and promoters a DJ should target next based on their current pipeline. Return ONLY a valid JSON array with exactly 5 items. No explanation text, no markdown, no code blocks — just the raw JSON array.`;

    const userPrompt = `A DJ who plays ${artistGenre || "Electronic music"} wants similar venues to: ${currentLead.name}${currentLead.city ? ` in ${currentLead.city}` : ""}${currentLead.country ? `, ${currentLead.country}` : ""} (${currentLead.tag || "Electronic"}, ${currentLead.tier || "A2"}).\n\nTheir existing pipeline includes:\n${pipelineSummary || "No existing leads yet"}\n\nSuggest 5 NEW venues or promoters they haven't targeted yet. Be specific with real venue/event names. Focus on similar scene, scale and geography. Slightly expand the geography if local scene is saturated.\n\nReturn this exact JSON format: [ { "name": "Venue or event name", "city": "City", "country": "Country code (e.g. DE, NL, UK)", "tag": "One of: TECHNO, HOUSE, CIRCUIT, FESTIVAL, TECH-HOUSE, MELODIC, OTHER", "tier": "A1, A2, or A3", "instagram": "@handle or empty string", "notes": "One sentence on why this is a good fit" } ]`;

    // Fetch with timeout + retries and deterministic params
    const endpoint = "https://api.anthropic.com/v1/messages";
    const maxAttempts = 3;
    const baseDelay = 1000;
    let lastErr: any = null;
    let raw = "[]";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 400,
            temperature: 0.0,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        clearTimeout(timeout);

        if (!resp.ok) {
          const text = await resp.text();
          lastErr = new Error(`Anthropic HTTP ${resp.status}: ${text}`);
          // Retry on 429 or 5xx
          if (resp.status === 429 || resp.status >= 500) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          console.error("Anthropic error:", text);
          return new Response(JSON.stringify({ error: "AI generation failed" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await resp.json();
        // Log token usage for cost visibility
        if (data.usage) {
          console.log(`[ai-lead-suggestions] tokens — input: ${data.usage.input_tokens}, output: ${data.usage.output_tokens}`);
        }
        raw = data.content?.[0]?.text || JSON.stringify(data);
        break;
      } catch (err) {
        clearTimeout(timeout);
        lastErr = err;
        // If abort, that's a transient error; retry with backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }

    if (raw === "[]" && lastErr) {
      console.error("Anthropic request failed after retries:", lastErr);
      return new Response(JSON.stringify({ error: "AI generation failed after retries" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON safely and validate schema
    let suggestions: any[] = [];
    try {
      suggestions = JSON.parse(raw);
    } catch (parseErr) {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
        } catch (e) {
          console.error("Failed to parse suggestions from raw response:", raw);
          return new Response(JSON.stringify({ error: "AI returned malformed JSON" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("No JSON array found in Anthropic response:", raw);
        return new Response(JSON.stringify({ error: "AI returned non-JSON response" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    function validateSuggestions(arr: any[]): boolean {
      if (!Array.isArray(arr) || arr.length !== 5) return false;
      const allowedTags = ["TECHNO", "HOUSE", "CIRCUIT", "FESTIVAL", "TECH-HOUSE", "MELODIC", "OTHER"];
      const allowedTiers = ["A1", "A2", "A3"];
      for (const it of arr) {
        if (!it || typeof it !== "object") return false;
        if (typeof it.name !== "string" || it.name.trim() === "") return false;
        if (typeof it.city !== "string") return false;
        if (typeof it.country !== "string" || it.country.length < 2 || it.country.length > 3) return false;
        if (typeof it.tag !== "string" || !allowedTags.includes(it.tag.toUpperCase())) return false;
        if (typeof it.tier !== "string" || !allowedTiers.includes(it.tier.toUpperCase())) return false;
        if (typeof it.instagram !== "string") return false;
        if (typeof it.notes !== "string") return false;
      }
      return true;
    }

    if (!validateSuggestions(suggestions)) {
      console.error("Suggestion schema validation failed. Raw response:", raw);
      return new Response(JSON.stringify({ error: "AI returned invalid suggestion format" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ai-lead-suggestions error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
