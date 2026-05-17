// supabase/functions/outlook-oauth/index.ts
// Handles the Microsoft / Outlook OAuth 2.0 flow:
//   GET  /outlook-oauth?action=url&user_id=xxx  → returns the Microsoft auth URL
//   GET  /outlook-oauth/callback?code=xxx&state=xxx  → exchanges code, stores tokens
//   DELETE /outlook-oauth  → removes the stored connection

const MICROSOFT_CLIENT_ID     = Deno.env.get("MICROSOFT_CLIENT_ID")!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET")!;
const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY        = Deno.env.get("SERVICE_ROLE_KEY")!;

// Must match the redirect URI registered in Azure App Registration
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/outlook-oauth/callback`;

// Scopes: send + read mail (read needed for reply polling) + profile + refresh token
const SCOPES = [
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/User.Read",
  "offline_access",
].join(" ");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Supabase DB helper ────────────────────────────────────────────────────────

async function upsertConnection(userId: string, data: {
  email: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scope?: string;
}) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_connections`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_id:          userId,
        provider:         "outlook",
        email:            data.email,
        access_token:     data.access_token,
        refresh_token:    data.refresh_token ?? null,
        token_expires_at: data.token_expires_at ?? null,
        scope:            data.scope ?? null,
      }),
    }
  );
  return res.ok;
}

// ── Token exchange ────────────────────────────────────────────────────────────

async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
} | null> {
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    "authorization_code",
        scope:         SCOPES,
      }),
    }
  );
  if (!res.ok) {
    console.error("Token exchange failed:", await res.text());
    return null;
  }
  return res.json();
}

async function getUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  // `mail` is the SMTP address; fall back to userPrincipalName for M365 accounts
  return data.mail ?? data.userPrincipalName ?? null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname;

  // ── 1. Generate auth URL ─────────────────────────────────────────────────
  if (req.method === "GET" && url.searchParams.get("action") === "url") {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const state = encodeURIComponent(JSON.stringify({ userId }));
    const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    authUrl.searchParams.set("client_id",     MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri",  REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope",         SCOPES);
    authUrl.searchParams.set("prompt",        "select_account"); // always let user pick account
    authUrl.searchParams.set("state",         state);

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 2. OAuth callback ────────────────────────────────────────────────────
  if (path.endsWith("/callback")) {
    const code  = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const appBase = "https://app.noxreach.com";

    if (error || !code || !state) {
      return Response.redirect(`${appBase}?outlook_error=${error ?? "missing_code"}`, 302);
    }

    let userId: string;
    try {
      const parsed = JSON.parse(decodeURIComponent(state));
      userId = parsed.userId;
    } catch {
      return Response.redirect(`${appBase}?outlook_error=invalid_state`, 302);
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code);
    if (!tokens) {
      return Response.redirect(`${appBase}?outlook_error=token_exchange_failed`, 302);
    }

    // Get the connected email address
    const email = await getUserEmail(tokens.access_token);
    if (!email) {
      return Response.redirect(`${appBase}?outlook_error=userinfo_failed`, 302);
    }

    // Store in DB
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    await upsertConnection(userId, {
      email,
      access_token:     tokens.access_token,
      refresh_token:    tokens.refresh_token,
      token_expires_at: expiresAt,
      scope:            tokens.scope,
    });

    // Redirect back to app settings with success flag
    return Response.redirect(`${appBase}?outlook_connected=1`, 302);
  }

  // ── 3. Disconnect (DELETE) ───────────────────────────────────────────────
  if (req.method === "DELETE") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: authHeader },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { id: userId } = await userRes.json();

    await fetch(
      `${SUPABASE_URL}/rest/v1/email_connections?user_id=eq.${userId}&provider=eq.outlook`,
      {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
