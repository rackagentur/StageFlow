// supabase/functions/ai-outreach/index.ts
// Generates a personalized outreach message for a DJ lead using Claude API

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  name: string;
  city?: string;
  country?: string;
  tag?: string;
  tier?: string;
  notes?: string;
  instagram?: string;
  stage?: string;
}

interface ArtistData {
  display_name?: string;
  tagline?: string;
  location?: string;
  genres?: string;
  bio?: string;
  booking_email?: string;
  soundcloud?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead, artist, format } = await req.json() as {
      lead: LeadData;
      artist: ArtistData;
      format: "email" | "dm";
    };

    if (!lead?.name) {
      return new Response(JSON.stringify({ error: "Missing lead name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const artistName  = artist?.display_name || "the artist";
    const artistGenre = artist?.genres || lead?.tag || "Electronic music";
    const artistBio   = artist?.bio   || "";
    const artistLoc   = artist?.location || "";
    const artistTag   = artist?.tagline || "";

    const venueNotes = lead.notes ? `\nVenue notes: ${lead.notes}` : "";
    const venueCity  = [lead.city, lead.country].filter(Boolean).join(", ");
    const venueIG    = lead.instagram ? `Instagram: ${lead.instagram}` : "";

    const systemPrompt = format === "email"
      ? `You are a professional booking assistant writing cold outreach emails for a DJ/artist. Write concise, personable emails that feel personal — not templated. No generic opener lines like "I hope this message finds you well." Get straight to the point. Keep it under 120 words. Use plain text, no markdown, no subject line.`
      : `You are a booking assistant writing short Instagram DM or WhatsApp outreach messages for a DJ. Keep it under 60 words. Friendly, direct, no cringe. No emojis unless they fit naturally. Plain text only.`;

    const userPrompt = `Write a ${format === "email" ? "cold booking email" : "short DM"} from ${artistName} to ${lead.name}.

Artist info:
- Name: ${artistName}
- Genre: ${artistGenre}
- Location: ${artistLoc}
${artistTag ? `- Style: ${artistTag}` : ""}
${artistBio ? `- Bio: ${artistBio}` : ""}

Venue/lead info:
- Venue: ${lead.name}
${venueCity ? `- Location: ${venueCity}` : ""}
${lead.tag ? `- Event type: ${lead.tag}` : ""}
${lead.tier ? `- Priority tier: ${lead.tier}` : ""}
${venueNotes}
${venueIG}

Write the ${format === "email" ? "email body only (no subject line)" : "DM message"}. Be specific to this venue. Do not use placeholder text like [your name] — sign off as ${artistName}.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
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
    const message = data.content?.[0]?.text || "";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ai-outreach error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
