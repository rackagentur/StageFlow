import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { COLORS, STAGES } from './lib/constants.js';
import { formatShortDate } from './lib/formatters.js';
import { showToast as showDomToast } from './lib/toast.js';
import { supabase } from './lib/supabaseClient.js';
import { TAB_ICONS, IconPowerOff, IconMail, IconPhone, IconInstagram, IconWhatsApp, IconOutreach, IconPlus, IconUpload, IconDashboard, IconPipeline, IconFollowUps, IconReplyHub, IconInbound, IconSettings, IconCalendar, IconBookingKit, IconAnalytics, IconCheck, IconLink, IconStar, IconContacts } from './icons/index.jsx';


// ── Design Tokens ─────────────────────────────────────────────────────────────
const BTN = {
  primary:   { padding: "10px 20px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  secondary: { padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#a1a1aa", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  ghost:     { padding: "10px 20px", background: "transparent", border: "none", borderRadius: 8, color: "#a1a1aa", fontSize: 13, cursor: "pointer" },
  danger:    { padding: "10px 20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  sm:        { padding: "5px 12px", fontSize: 11 },
  xs:        { padding: "3px 8px",  fontSize: 10 },
};

const CARD = {
  base:     { background: "#111111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 },
  elevated: { background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 },
};

const INPUT = {
  base: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8, color: "#ffffff", fontSize: 13, outline: "none",
    padding: "10px 14px", width: "100%",
  },
};

// ── Auth Styles (injected once) ───────────────────────────────────────────────
const AUTH_CSS = `
  @keyframes authFadeIn  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes authGlow    { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes authSpin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes authPulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes gridScroll  { from { transform: translateY(0); } to { transform: translateY(80px); } }
`;

// ── LoginScreen ───────────────────────────────────────────────────────────────
function LoginScreen({ onAuth }) {
  const [mode, setMode]       = useState("login"); // login | signup | reset
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  // Capture referral code from URL
  const refCode = useState(() => new URLSearchParams(window.location.search).get("ref") || "")[0];

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, color: COLORS.text, fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
    WebkitBoxShadow: `0 0 0 1000px ${COLORS.surface} inset`,
    WebkitTextFillColor: COLORS.text,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth(data.session, data.user);
      } else if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const { data, error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name.trim() } }
        });
        if (err) throw err;
        // Store referral code on the new profile
        if (refCode && data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, referred_by: refCode });
        }
        if (data.session) {
          onAuth(data.session, data.user);
        } else {
          setSuccess("Account created! Check your email to confirm, then log in.");
          setMode("login");
        }
      } else if (mode === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setSuccess("Password reset email sent. Check your inbox.");
        setMode("login");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: COLORS.bgDeep, position: "relative", overflow: "hidden",
    }}>
      <style>{AUTH_CSS}</style>

      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        animation: "gridScroll 8s linear infinite",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        width: 700, height: 500,
        background: "radial-gradient(ellipse, rgba(14,116,144,0.12) 0%, rgba(14,116,144,0.03) 50%, transparent 70%)",
        pointerEvents: "none", animation: "authGlow 4s ease infinite",
      }} />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 420, padding: "0 24px",
        animation: "authFadeIn 0.5s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src="/nr-icon.svg" width="104" height="104" style={{ borderRadius: 24, marginBottom: 14, display: "block", margin: "0 auto 14px" }} alt="NR" />
          <img src="/nr-wordmark.svg" height="18" style={{ display: "block", margin: "0 auto 6px", opacity: 0.9 }} alt="NoxReach" />
          <div style={{ fontSize: 11, color: COLORS.purple, letterSpacing: "0.14em", opacity: 0.8, marginTop: 2 }}>NIGHTLIFE OS</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, letterSpacing: "0.02em" }}>Track venues, replies, follow-ups, and booked gigs in one place.</div>
        </div>

        {/* Form card */}
        <div style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, padding: "32px 28px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}>
          {/* Tab switcher */}
          {mode !== "reset" && (
            <div style={{
              display: "flex", gap: 2, marginBottom: 28,
              background: COLORS.bg, borderRadius: 8, padding: 3,
            }}>
              {[["login", "Log in"], ["signup", "Sign up"]].map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: mode === m ? COLORS.purple : "transparent",
                    color: mode === m ? "white" : COLORS.text,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === "reset" && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Reset password</div>
              <div style={{ fontSize: 13, color: COLORS.text2 }}>Enter your email and we'll send a reset link.</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text2, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>Name</div>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your DJ name or full name"
                  style={inputStyle} required
                  onFocus={e => e.target.style.borderColor = COLORS.purple}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text2, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>Email</div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle} required
                onFocus={e => e.target.style.borderColor = COLORS.purple}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>

            {mode !== "reset" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text2, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>Password</div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                  style={inputStyle} required
                  onFocus={e => e.target.style.borderColor = COLORS.purple}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
            )}

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                color: COLORS.red, fontSize: 13, lineHeight: 1.5,
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                color: COLORS.green, fontSize: 13, lineHeight: 1.5,
              }}>{success}</div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "13px 0", borderRadius: 10, border: "none",
              background: loading ? COLORS.purpleLight + "88" : `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : "0 4px 20px rgba(14,116,144,0.30)",
              transition: "all 0.15s",
            }}>
              {loading ? (
                <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff6", borderTopColor: "#fff", borderRadius: "50%", animation: "authSpin 0.7s linear infinite" }} /> Processing...</>
              ) : mode === "login" ? "Log in →" : mode === "signup" ? "Create account →" : "Send reset link →"}
            </button>
          </form>

          {/* Try Demo */}
          {mode === "login" && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontSize: 11, color: COLORS.text3 }}>or</span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>
              <button onClick={async () => {
                setLoading(true); setError("");
                const { data, error: err } = await supabase.auth.signInWithPassword({ email: "demo@noxreach.com", password: "noxreach_demo_2026" });
                setLoading(false);
                if (err) setError("Demo unavailable right now.");
                else onAuth(data.session, data.user);
              }} disabled={loading} style={{
                width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`,
                color: "#fff", fontSize: 13, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(14,116,144,0.30)",
                transition: "all 0.15s",
              }}
              >Try Demo →</button>
            </div>
          )}
          {/* Footer links */}
          <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "center", gap: 20 }}>
            {mode === "login" && (
              <button onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
                style={{ background: "none", border: "none", color: COLORS.text3, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Forgot password?
              </button>
            )}
            {mode === "reset" && (
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                style={{ background: "none", border: "none", color: COLORS.text3, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                ← Back to log in
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: COLORS.text3 }}>
          Built for DJs who book with intent.
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.2)", display: "flex", gap: 16, justifyContent: "center" }}>
          <a href="https://noxreach.com/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Privacy Policy</a>
          <a href="https://noxreach.com/impressum.html" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Impressum</a>
          <a href="https://noxreach.com/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Terms</a>
        </div>
      </div>
    </div>
  );
}

// ── SetNewPasswordScreen ──────────────────────────────────────────────────────
// Shown when user returns from a Supabase password-reset email link
function SetNewPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, color: COLORS.text, fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
    WebkitBoxShadow: `0 0 0 1000px ${COLORS.surface} inset`,
    WebkitTextFillColor: COLORS.text,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm)  return setError("Passwords don't match.");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      setTimeout(onDone, 1600);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: COLORS.bgDeep, position: "relative", overflow: "hidden",
    }}>
      <style>{AUTH_CSS}</style>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "80px 80px", animation: "gridScroll 8s linear infinite",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)",
        width: 700, height: 500,
        background: "radial-gradient(ellipse, rgba(14,116,144,0.12) 0%, rgba(14,116,144,0.03) 50%, transparent 70%)",
        pointerEvents: "none", animation: "authGlow 4s ease infinite",
      }} />

      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "0 24px",
        animation: "authFadeIn 0.5s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src="/nr-icon.svg" width="52" height="52"
            style={{ borderRadius: 12, display: "block", margin: "0 auto 14px" }} alt="NR" />
          <img src="/nr-wordmark.svg" height="18"
            style={{ display: "block", margin: "0 auto 6px", opacity: 0.9 }} alt="NoxReach" />
          <div style={{ fontSize: 11, color: COLORS.purple, letterSpacing: "0.14em", opacity: 0.8, marginTop: 2 }}>NIGHTLIFE OS</div>
        </div>

        <div style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, padding: "32px 28px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 22, color: COLORS.green,
              }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.green, marginBottom: 6 }}>Password updated!</div>
              <div style={{ fontSize: 13, color: COLORS.text2 }}>Taking you to the app…</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Set new password</div>
                <div style={{ fontSize: 13, color: COLORS.text2 }}>Choose a new password for your account.</div>
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text2, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>New password</div>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" style={inputStyle} required autoFocus
                    onFocus={e => e.target.style.borderColor = COLORS.purple}
                    onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text2, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>Confirm password</div>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password" style={inputStyle} required
                    onFocus={e => e.target.style.borderColor = COLORS.purple}
                    onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
                {error && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                    color: COLORS.red, fontSize: 13, lineHeight: 1.5,
                  }}>{error}</div>
                )}
                <button type="submit" disabled={loading} style={{
                  padding: "13px 0", borderRadius: 10, border: "none",
                  background: loading ? COLORS.purpleLight + "88" : `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`,
                  color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 4px 20px rgba(14,116,144,0.30)",
                  transition: "all 0.15s",
                }}>
                  {loading
                    ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff6", borderTopColor: "#fff", borderRadius: "50%", animation: "authSpin 0.7s linear infinite" }} /> Updating…</>
                    : "Update password →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AuthGate ─────────────────────────────────────────────────────────────────
// Wraps the whole app — shows login screen until authenticated
function AuthGate({ children }) {
  const [session, setSession]       = useState(undefined); // undefined = loading
  const [user, setUser]             = useState(null);
  const [recoveryMode, setRecovery] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset link — show set-new-password screen
        setSession(s);
        setUser(s?.user ?? null);
        setRecovery(true);
        return;
      }
      setSession(s);
      setUser(s?.user ?? null);
      // After updateUser succeeds Supabase fires USER_UPDATED — clear recovery mode
      if (event === "USER_UPDATED") {
        setRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track login count for PWA install prompt — once per browser session
  useEffect(() => {
    if (!user) return;
    if (recoveryMode) return; // don't count recovery sessions as logins
    if (sessionStorage.getItem('noxreach_session_counted')) return;
    const prev = parseInt(localStorage.getItem('noxreach_login_count') || '0', 10);
    localStorage.setItem('noxreach_login_count', String(prev + 1));
    sessionStorage.setItem('noxreach_session_counted', 'true');
  }, [user, recoveryMode]);

  // Loading state
  if (session === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.bgDeep, flexDirection: "column", gap: 16,
      }}>
        <style>{AUTH_CSS}</style>
        <div style={{
          width: 40, height: 40, border: `2px solid ${COLORS.border}`,
          borderTopColor: COLORS.purple, borderRadius: "50%",
          animation: "authSpin 0.7s linear infinite",
        }} />
        <div style={{ fontSize: 12, color: COLORS.text3, letterSpacing: "0.1em" }}>LOADING NOXREACH</div>
      </div>
    );
  }

  // Password recovery return — show set-new-password screen
  if (recoveryMode && session) {
    return <SetNewPasswordScreen onDone={() => setRecovery(false)} />;
  }

  // Not logged in
  if (!session) {
    return <LoginScreen onAuth={(s, u) => { setSession(s); setUser(u); }} />;
  }

  // Logged in — render the app with user context
  return children({ user, session, supabase });
}



const getTemplates = (artistName) => [
  { id: "berlin",   label: "Berlin",   tone: "Underground / Tech-House", icon: "◼", text: `Hey [Name],\n\nI've been building a sound around peak-hour Tech House — tribal-driven, energetic but controlled. Been playing [venue/night] lately and the response has been strong.\n\nWould love to get on your radar. Happy to send a recent mix + EPK.\n\n— ${artistName}` },
  { id: "circuit",  label: "Circuit",  tone: "High energy / Tribal",     icon: "◈", text: `Hey [Name],\n\nI play circuit and tribal Tech House — the kind of sets that lock a room in for 4+ hours. I've played [events] and the energy has been incredible every time.\n\nWould love to discuss what a booking could look like. I can send my latest mix.\n\n— ${artistName}` },
  { id: "disco",    label: "Disco",    tone: "Groovy / Soulful",         icon: "◇", text: `Hey [Name],\n\nI blend Disco soul with Tech House drive — it's a sound built for rooms that want to move without losing the groove. My recent sets at [venue] connected really well with that crowd.\n\nWould love to explore a potential booking. EPK and mix available on request.\n\n— ${artistName}` },
  { id: "leverage", label: "Leverage", tone: "Warm connection",          icon: "◉", text: `Hey [Name],\n\n[Mutual contact] suggested I reach out — they thought my sound and your events would align.\n\nI play peak-hour Tech House and tribal circuit sets. I've been [recent gig/achievement] and would love to explore what a booking might look like.\n\nLet me know if you'd like a mix or EPK.\n\n— ${artistName}` },
];

const INITIAL_LEADS = []; // New users start with empty pipeline

const TIER_COLORS = { A1: COLORS.purpleLight, A2: COLORS.purple, A3: COLORS.textSecondary };

// Leads + Gigs now live in Supabase (per user), not localStorage
// localStorage kept only for settings, pro status, tags

// ── Release notes ─────────────────────────────────────────────────────────────
const APP_VERSION = "1.6.0";
const STORAGE_KEY_WHATS_NEW = "noxreach_whats_new_seen_v";

const RELEASE_NOTES = [
  {
    version: "1.6.0",
    date: "May 2026",
    title: "AI suggestions, PWA install & feedback",
    items: [
      { Icon: IconStar,       label: "AI outreach drafts",     desc: "One click generates a personalised cold email or DM for any lead — powered by Claude. PRO feature, available once you have 50+ leads.", badge: "PRO+" },
      { Icon: IconPipeline,   label: "AI venue suggestions",   desc: "NoxReach suggests 5 new venues similar to any lead you're targeting. Powered by Claude. PRO feature, available with 50+ leads.", badge: "PRO+" },
      { Icon: IconFollowUps,  label: "Follow-up nudges",       desc: "Going Cold section shows leads that have gone quiet for 3+ days with no date set. Tap any card to open that lead directly." },
      { Icon: IconBookingKit, label: "Booking form revamp",    desc: "\"Book this artist\" on your kit page now opens the structured booking form. You get a notification email for every enquiry." },
      { Icon: IconLink,       label: "Referral rewards",       desc: "Share your referral link — you get 30 days PRO, the DJ you invite gets a 15-day PRO trial." },
      { Icon: IconSettings,   label: "PWA install prompt",     desc: "Add NoxReach to your home screen. Appears after your 3rd login — native install on Android, step-by-step guide on iOS." },
      { Icon: IconMail,       label: "Feedback button",        desc: "The ✦ button in the bottom-right corner lets you send ideas, bug reports, or anything else straight to the founder." },
    ],
  },
  {
    version: "1.5.0",
    date: "May 2026",
    title: "Design overhaul, mobile & public pages",
    items: [
      { Icon: IconDashboard,  label: "New design system",     desc: "Unified cyan accent across every button, border, and badge. Consistent FREE/PRO chips, stronger card borders throughout." },
      { Icon: IconPipeline,   label: "Pipeline stage colors", desc: "Each lead stage has its own border heat — Target (dim) → Contacted (grey) → Follow-up (teal) → Replied (violet) → Booked (green)." },
      { Icon: IconSettings,   label: "Genre color picker",    desc: "Each genre tag gets its own persistent color. Tap the dot to pick. All genres are now deletable, including defaults." },
      { Icon: IconFollowUps,  label: "Mobile improvements",   desc: "Cleaner header on small screens, icon-only Add Lead button, full-screen lead detail overlay, safe-area fixes for iPhone." },
      { Icon: IconBookingKit, label: "Public press kit",      desc: "Share your artist kit at app.noxreach.com/kit/[username] — bio, EPK, mix links, booking CTA." },
      { Icon: IconCalendar,   label: "Public gig schedule",   desc: "app.noxreach.com/gigs/[username] is live. The Preview button in Calendar now works." },
      { Icon: IconAnalytics,  label: "Analytics alignment",   desc: "Conversion funnel matches the stat card grid. Tier and genre rows show correct colors.", badge: "PRO" },
      { Icon: IconUpload,     label: "CSV export",            desc: "Download all your active leads as a dated CSV straight from the pipeline header." },
    ],
  },
  {
    version: "1.4.0",
    date: "May 2026",
    title: "Booking form, gig logbook & smart emails",
    items: [
      { Icon: IconInbound,    label: "Public booking form",       desc: "Venues submit booking requests via app.noxreach.com/book/[username]. Leads land in your Inbound tab instantly." },
      { Icon: IconCalendar,   label: "Gig logbook",               desc: "Log recaps, setlist links, recording URLs, and crowd & promoter ratings on each past gig." },
      { Icon: IconMail,       label: "Behavioral email triggers", desc: "5 lifecycle nudges fire automatically — day 2, day 5, day 7, day 10, and first booking celebration." },
      { Icon: IconBookingKit, label: "Asset kit",                 desc: "Store your EPK, SoundCloud, Spotify, mix links, bio and press photos in one place. Share via link." },
    ],
  },
];

function WhatsNewModal({ onClose }) {
  const [tab, setTab] = useState(0);
  const release = RELEASE_NOTES[tab];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "22px 24px 0", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.violetLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>What's New</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>{release.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>v{release.version} · {release.date}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 1, borderRadius: 6 }}>✕</button>
          </div>
          {/* Version tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: -1 }}>
            {RELEASE_NOTES.map((r, i) => (
              <button key={r.version} onClick={() => setTab(i)} style={{ padding: "7px 14px", background: "none", border: "none", borderBottom: `2px solid ${tab === i ? COLORS.violetLight : "transparent"}`, color: tab === i ? COLORS.violetLight : COLORS.textMuted, fontSize: 12, fontWeight: tab === i ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                v{r.version}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div style={{ overflowY: "auto", padding: "16px 24px", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {release.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "12px 14px", background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 11, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.violetBg, border: `1px solid rgba(124,58,237,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.Icon size={15} color={COLORS.violetLight} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase",
                        padding: "2px 6px", borderRadius: 4,
                        background: item.badge === "PRO" || item.badge === "PRO+" ? "rgba(14,116,144,0.18)" : "rgba(245,158,11,0.15)",
                        border: `1px solid ${item.badge === "PRO" || item.badge === "PRO+" ? "rgba(14,116,144,0.4)" : "rgba(245,158,11,0.4)"}`,
                        color: item.badge === "PRO" || item.badge === "PRO+" ? COLORS.purpleLight : COLORS.amber,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 28px", background: COLORS.violet, border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Got it →
          </button>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY_SETTINGS = "noxreach_settings_v1";
const DEFAULT_SETTINGS = { followup1Days: 5, followup2Days: 14 };
function loadSettings() { try { const r = localStorage.getItem(STORAGE_KEY_SETTINGS); if (r) return { ...DEFAULT_SETTINGS, ...JSON.parse(r) }; } catch {} return DEFAULT_SETTINGS; }
function saveSettings(s) { try { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s)); } catch {} }

const STORAGE_KEY_PRO = "noxreach_pro_v1";
function loadIsPro(userId) { try { return localStorage.getItem(STORAGE_KEY_PRO + "_" + userId) === "true"; } catch { return false; } }
function saveIsPro(v, userId) { try { localStorage.setItem(STORAGE_KEY_PRO + "_" + userId, String(v)); } catch {} }
const FREE_LIMITS = { leads: 15, gigs: 10, templates: 2 };

const STORAGE_KEY_TAGS        = "noxreach_tags_v1";
const STORAGE_KEY_TAG_COLORS  = "noxreach_tag_colors_v1";
const DEFAULT_TAGS = ["Tech-House", "Disco", "Festival"];
const TAG_PALETTE  = ["#F59E0B","#3B82F6","#EC4899","#22C55E","#F97316","#14B8A6","#EAB308","#F43F5E","#06B6D4","#A78BFA","#84CC16","#FB923C"];

// Pick the next palette color least used by existing tags
function pickNextColor(usedColors) {
  const counts = Object.fromEntries(TAG_PALETTE.map(c => [c, 0]));
  usedColors.forEach(c => { if (counts[c] !== undefined) counts[c]++; });
  return TAG_PALETTE.reduce((a, b) => counts[a] <= counts[b] ? a : b);
}

function loadCustomTags()   { try { const r = localStorage.getItem(STORAGE_KEY_TAGS);       if (r) return JSON.parse(r); } catch {} return [...DEFAULT_TAGS]; }
function saveCustomTags(t)  { try { localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(t)); } catch {} }
function loadTagColors()    { try { const r = localStorage.getItem(STORAGE_KEY_TAG_COLORS);  if (r) return JSON.parse(r); } catch {} return {}; }
function saveTagColors(m)   { try { localStorage.setItem(STORAGE_KEY_TAG_COLORS, JSON.stringify(m)); } catch {} }

// Build a date string relative to today for sample data
const relDate = (daysFromNow) => { const d = new Date(); d.setDate(d.getDate() + daysFromNow); return d.toISOString().split("T")[0]; };

const INITIAL_GIGS = []; // New users start with empty calendar


// ─── Primitives ──────────────────────────────────────────────────────────────

function Badge({ children, color = COLORS.purple }) {
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 4, background: color + "22", color, border: `1px solid ${color}44`, textTransform: "uppercase" }}>{children}</span>;
}

function FilterPill({ label, active, color = COLORS.purple, onClick, onClear }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20,
      cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 500, letterSpacing: "0.04em",
      background: active ? color + "33" : "transparent",
      border: `1px solid ${active ? color : COLORS.border}`,
      color: active ? color : COLORS.textSecondary, transition: "all 0.15s",
    }}>
      {label}
      {active && (
        <span onClick={e => { e.stopPropagation(); onClear(); }} style={{ marginLeft: 2, opacity: 0.7, fontWeight: 800, fontSize: 12, lineHeight: 1 }}>×</span>
      )}
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const icons  = { success: "✓", schedule: "⏰", info: "◈" };
  const colors = { success: COLORS.green, schedule: COLORS.amber, info: COLORS.purple };
  const color  = colors[toast.type] || COLORS.purple;
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 2000, animation: "toastIn 0.25s ease", background: COLORS.surface, border: `1px solid ${color}55`, borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`, minWidth: 260 }}>
      <style>{`@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color, fontWeight: 800 }}>{icons[toast.type]}</div>
      <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{toast.msg}</span>
    </div>
  );
}

function Logo({ size = 24 }) {
  return (
    <img src="/nr-icon.svg" width={size} height={size} alt="NoxReach" style={{ borderRadius: size * 0.117, display: "block" }} />
  );
}

// ─── Search + Filter Bar ─────────────────────────────────────────────────────

function SearchFilterBar({ search, setSearch, filters, setFilters, resultCount, totalCount, customTags, TAG_COLORS, isMobile }) {
  const inputRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const hasAnyFilter = search || filters.tier || filters.tag || filters.stage;
  const isFiltered = hasAnyFilter && resultCount < totalCount;
  const TIERS = ["A1", "A2", "A3"];

  const toggle = (key, val) => {
    setFilters(f => ({ ...f, [key]: f[key] === val ? null : val }));
    if (isMobile) setShowFilters(false); // auto-close on mobile after selection
  };
  const clearAll = () => { setSearch(""); setFilters({ tier: null, tag: null, stage: null }); };

  const activeFilterCount = [filters.tier, filters.tag, filters.stage].filter(Boolean).length;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Search row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, fontSize: 14, pointerEvents: "none" }}>⌕</span>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search venues, contacts, notes…"
            style={{
              width: "100%", padding: "9px 12px 9px 34px",
              background: COLORS.surface, border: `1px solid ${search ? COLORS.purple : COLORS.border}`,
              borderRadius: 9, color: COLORS.text, fontSize: 13, outline: "none",
              fontFamily: "inherit", transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = COLORS.purple}
            onBlur={e => { if (!search) e.target.style.borderColor = COLORS.border; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>
        
        {/* Mobile: Filter toggle button */}
        {isMobile && (
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{ 
              padding: "9px 14px", 
              background: activeFilterCount > 0 ? COLORS.purpleBg : "transparent", 
              border: `1px solid ${activeFilterCount > 0 ? COLORS.purple : COLORS.border}`, 
              borderRadius: 9, 
              color: activeFilterCount > 0 ? COLORS.purple : COLORS.textSecondary, 
              fontSize: 12, 
              cursor: "pointer", 
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span style={{ 
                background: COLORS.purple, 
                color: COLORS.bg, 
                borderRadius: "50%", 
                width: 16, 
                height: 16, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 10, 
                fontWeight: 700 
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
        
        {/* Desktop: Clear all button */}
        {!isMobile && hasAnyFilter && (
          <button onClick={clearAll} style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.textSecondary, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            Clear all
          </button>
        )}
      </div>

      {/* Filter pills row - Desktop always shows, Mobile toggles */}
      {(!isMobile || showFilters) && (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 10,
          padding: isMobile ? "12px" : "0",
          background: isMobile ? COLORS.surface : "transparent",
          border: isMobile ? `1px solid ${COLORS.border}` : "none",
          borderRadius: isMobile ? 10 : 0,
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: isMobile ? "nowrap" : "wrap", alignItems: "center", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>Tier</span>

            {TIERS.map(t => (
              <FilterPill key={t} label={t} active={filters.tier === t} color={TIER_COLORS[t]}
                onClick={() => toggle("tier", t)} onClear={() => toggle("tier", t)} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: isMobile ? "nowrap" : "wrap", alignItems: "center", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>Tag</span>

            {customTags.map(t => (
              <FilterPill key={t} label={t} active={filters.tag === t} color={TAG_COLORS[t] || COLORS.purple}
                onClick={() => toggle("tag", t)} onClear={() => toggle("tag", t)} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: isMobile ? "nowrap" : "wrap", alignItems: "center", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>Stage</span>

            {[
              { id: "target",    label: "Target",    color: COLORS.text3,   stages: ["target"] },
              { id: "contacted", label: "Contacted", color: COLORS.purple,  stages: ["contacted"] },
              { id: "followup",  label: "Follow-up", color: COLORS.purpleLight, stages: ["followup1","followup2"] },
              { id: "replied",   label: "Replied",   color: COLORS.violetLight, stages: ["replied"] },
              { id: "booked",    label: "Booked",    color: COLORS.green,   stages: ["booked"] },
            ].map(s => (
              <FilterPill key={s.id} label={s.label} active={filters.stage === s.id} color={s.color}
                onClick={() => toggle("stage", s.id)} onClear={() => toggle("stage", s.id)} />
            ))}
          </div>

          {/* Mobile: Clear all button inside filter panel */}
          {isMobile && hasAnyFilter && (
            <button onClick={clearAll} style={{ 
              padding: "8px 12px", 
              background: "transparent", 
              border: `1px solid ${COLORS.border}`, 
              borderRadius: 8, 
              color: COLORS.textSecondary, 
              fontSize: 12, 
              cursor: "pointer",
              alignSelf: "flex-start",
            }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      {hasAnyFilter && (
        <div style={{ marginTop: 10, fontSize: 11, color: isFiltered ? COLORS.purple : COLORS.textMuted }}>
          {isFiltered
            ? `${resultCount} of ${totalCount} leads match`
            : `Showing all ${totalCount} leads`}
        </div>
      )}
    </div>
  );
}


// ─── Lead Card ────────────────────────────────────────────────────────────────


// === Bulk Actions Bar - Bundle 5.5 ===
function BulkActionsBar({ count, onMoveTo, onArchive, onDelete, onClear, isMobile }) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div style={{
      position: 'fixed', bottom: isMobile ? 56 : 0, left: 0, right: 0,
      background: COLORS.surface, borderTop: `2px solid ${COLORS.purple}`,
      padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center',
      zIndex: 10000, boxShadow: '0 -4px 12px rgba(0,0,0,0.3)'
    }}>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{count} selected</span>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowMenu(!showMenu); setConfirmDelete(false); }}
          style={{
            padding: '8px 16px', background: COLORS.purple, border: 'none',
            borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
          Move to...
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: 8, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {STAGES.map(s => (
              <button key={s.id} onClick={() => { onMoveTo(s.id); setShowMenu(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  color: COLORS.text, fontSize: 13, cursor: 'pointer', borderRadius: 4
                }}
                onMouseEnter={(e) => e.target.style.background = COLORS.surface2}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => { setShowMenu(false); setConfirmDelete(false); onArchive(); }}
        style={{
          padding: '8px 16px', background: 'transparent',
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          color: COLORS.text, fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}>
        Archive
      </button>

      {/* Delete with inline confirmation */}
      {confirmDelete ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: COLORS.red, fontWeight: 600 }}>
            Delete {count} lead{count !== 1 ? 's' : ''}? This can't be undone.
          </span>
          <button
            onClick={() => { onDelete(); setConfirmDelete(false); }}
            style={{
              padding: '7px 14px', background: COLORS.red, border: 'none',
              borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>
            Yes, delete
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{
              padding: '7px 12px', background: 'transparent',
              border: `1px solid ${COLORS.border}`, borderRadius: 6,
              color: COLORS.text, fontSize: 13, cursor: 'pointer'
            }}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setShowMenu(false); setConfirmDelete(true); }}
          style={{
            padding: '8px 16px', background: 'transparent',
            border: `1px solid rgba(239,68,68,0.45)`, borderRadius: 6,
            color: COLORS.red, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
          Delete
        </button>
      )}

      <div style={{ flex: 1 }} />

      <button onClick={() => { setConfirmDelete(false); onClear(); }}
        style={{
          padding: '8px 16px', background: 'transparent', border: 'none',
          color: COLORS.text3, fontSize: 13, cursor: 'pointer'
        }}>
        Cancel
      </button>
    </div>
  );
}

function LeadCard({ lead, onMove, onSelect, isSelected, onArchive, searchQuery, TAG_COLORS, onUpdateLead , isBulkSelected = false, onBulkSelect }) {
  isBulkSelected = Boolean(isBulkSelected);
  const showInline = !lead.archived && ["contacted","followup1","followup2"].includes(lead.stage);
  const [contactLog, setContactLog] = useState(lead.contactLog || "");
  const [logSaved, setLogSaved] = useState(false);
  const METHODS = [
    { id: "email",     Icon: IconMail,      label: "Email", color: COLORS.purple },
    { id: "instagram", Icon: IconInstagram, label: "DM",    color: COLORS.purple },
    { id: "phone",     Icon: IconPhone,     label: "Phone", color: "#22C55E" },
    { id: "other",     Icon: IconWhatsApp,  label: "Other", color: COLORS.text2 },
  ];
  const handleMethod = (e, methodId) => { e.stopPropagation(); onUpdateLead && onUpdateLead(lead.id, { outreachMethod: methodId }); };
  const handleLogBlur = () => { if (contactLog !== (lead.contactLog || "")) { onUpdateLead && onUpdateLead(lead.id, { contactLog }); setLogSaved(true); setTimeout(() => setLogSaved(false), 1500); } };
  const stageIndex = STAGES.findIndex(s => s.id === lead.stage);
  const isOverdue  = lead.followUpDate && new Date(lead.followUpDate) <= new Date();
  const STAGE_COLORS = {
    target:    "#444444",
    contacted: COLORS.purple,
    followup1: COLORS.purpleLight,
    followup2: COLORS.purpleLight,
    replied:   COLORS.violetLight,
    booked:    COLORS.green,
  };
  const stageBorder = STAGE_COLORS[lead.stage] || COLORS.border;

  // Highlight matching text
  const highlight = (text) => {
    if (!searchQuery || !text) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: COLORS.purple + "55", color: COLORS.purpleLight, borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
        <div onClick={(e) => {
          if (e.target.closest('input, button, select, textarea, label, a')) return;
          onSelect(isSelected ? null : lead);
        }} style={{

      background: (isBulkSelected || isSelected) ? COLORS.violetBg :
        lead.stage === "booked"  && !lead.archived ? "rgba(34,197,94,0.04)" :
        lead.stage === "replied" && !lead.archived ? COLORS.violetBg :
        COLORS.surface,
      border: (isBulkSelected || isSelected) ? `2px solid ${COLORS.violet}` :
        lead.stage === "booked"  && !lead.archived ? `2px solid rgba(34,197,94,0.5)` :
        `1px solid ${
        lead.archived                     ? COLORS.purpleDim :
        isOverdue                         ? COLORS.amber :
        lead.stage === "replied"          ? COLORS.violetLight :
        lead.stage === "followup1" || lead.stage === "followup2" ? COLORS.purpleLight :
        lead.stage === "contacted"        ? "rgba(255,255,255,0.22)" :
        "rgba(124,58,237,0.22)"
      }`,
      borderLeft: (isBulkSelected || isSelected) ? undefined :
        lead.stage === "booked"    && !lead.archived ? "3px solid rgba(34,197,94,0.6)" :
        lead.stage === "replied"   && !lead.archived ? `3px solid ${COLORS.violetLight}` :
        (lead.stage === "followup1" || lead.stage === "followup2") && !lead.archived ? `3px solid rgba(34,211,238,0.80)` :
        lead.stage === "contacted" && !lead.archived ? "3px solid rgba(255,255,255,0.25)" :
        lead.stage === "target"    && !lead.archived ? `3px solid ${COLORS.text3}` :
        undefined,
      boxShadow: (isBulkSelected || isSelected)
        ? `inset 4px 0 0 ${COLORS.purpleLight}, 0 0 16px rgba(124,58,237,0.20), 0 4px 16px rgba(0,0,0,0.5)`
        : lead.stage === "booked" && !lead.archived
        ? `0 0 8px rgba(34,197,94,0.08), 0 2px 12px rgba(0,0,0,0.35)`
        : lead.stage === "replied" && !lead.archived
        ? `0 0 10px rgba(139,92,246,0.12), 0 2px 12px rgba(0,0,0,0.35)`
        : `0 2px 12px rgba(0,0,0,0.35)`,
      borderRadius: 10, padding: "14px 16px", cursor: "pointer",
      transition: "all 0.15s ease", position: "relative", overflow: "hidden",
      opacity: lead.archived ? 0.45 : 1,
    }}>
      {isOverdue && !lead.archived && (
        <div style={{ position: "absolute", top: 0, right: 0, background: COLORS.amber, color: "#000", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderBottomLeftRadius: 6, letterSpacing: "0.1em" }}>FOLLOW UP</div>
      )}
      {lead.archived && (
        <div style={{ position: "absolute", top: 0, right: 0, background: COLORS.textMuted, color: COLORS.bg, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderBottomLeftRadius: 6, letterSpacing: "0.1em" }}>ARCHIVED</div>
      )}
      {isBulkSelected && !lead.archived && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: COLORS.purpleBg,
          color: COLORS.purpleLight,
          border: `1px solid ${COLORS.purpleDim}`,
          fontSize: 9,
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: 999,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          zIndex: 2
        }}>
          Selected
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, paddingRight: (isOverdue && !lead.archived) ? 72 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <button
            type="button"
            data-bulk-checkbox="true"
            data-bulk-selected={isBulkSelected ? "true" : "false"}
            aria-label={isBulkSelected ? "Deselect lead" : "Select lead"}
            title={isBulkSelected ? "Deselect lead" : "Select lead"}
            onClick={(e) => {
              e.stopPropagation();
              window.toggleLeadSelection?.(lead.id);
            }}
            style={{
              width: 22,
              height: 22,
              minWidth: 22,
              minHeight: 22,
              borderRadius: 6,
              border: isBulkSelected ? `2px solid ${COLORS.purple}` : `2px solid ${COLORS.text3}`,
              background: isBulkSelected ? COLORS.purple : COLORS.surface2,
              boxShadow: isBulkSelected
                ? `0 0 0 2px ${COLORS.purpleDim}, inset 0 0 0 1px rgba(255,255,255,0.12)`
                : "inset 0 0 0 1px rgba(255,255,255,0.04)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
              transition: "all 160ms ease",
            }}
          >
            {isBulkSelected ? (
              <span style={{ 
                color: "white", 
                fontSize: 14, 
                fontWeight: "bold", 
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>✓</span>
            ) : null}
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, minWidth: 0 }}>{highlight(lead.name)}</div>
        </div>
        {lead.stage === "followup1" && <Badge color={COLORS.purpleLight}>F1</Badge>}
        {lead.stage === "followup2" && <Badge color={COLORS.amber}>F2</Badge>}
        <Badge color={TIER_COLORS[lead.tier]}>{lead.tier}</Badge>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <Badge color={TAG_COLORS[lead.tag] || COLORS.textSecondary}>{lead.tag}</Badge>
        {lead.is_inbound && <Badge color={COLORS.purpleLight}>⬇ Inbound</Badge>}
      </div>
      {lead.notes && (
        <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.4, marginBottom: 10 }}>
          {highlight(lead.notes.slice(0, 60))}{lead.notes.length > 60 ? "…" : ""}
        </div>
      )}
      {!lead.archived ? (
        <div style={{ display: "flex", gap: 6 }}>
          {(stageIndex > 0 || lead.stage === 'followup1' || lead.stage === 'followup2') && (
            <button onClick={e => { 
              e.stopPropagation(); 
              // Determine previous stage based on current stage
              let prevStage;
              if (lead.stage === 'booked') prevStage = 'replied';
              else if (lead.stage === 'replied') prevStage = 'followup2';
              else if (lead.stage === 'followup1' || lead.stage === 'followup2') prevStage = 'contacted';
              else if (lead.stage === 'contacted') prevStage = 'target';
              else prevStage = STAGES[stageIndex - 1]?.id || 'target';
              onMove(lead.id, prevStage); 
            }} style={{ flex: 1, padding: "5px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textSecondary, fontSize: 11, cursor: "pointer" }}>← Back</button>
          )}
          {stageIndex < STAGES.length - 1 && (
            <button onClick={e => { 
              e.stopPropagation(); 
              // Determine next stage based on current stage
              let nextStage;
              if (lead.stage === 'target') nextStage = 'contacted';
              else if (lead.stage === 'contacted') nextStage = 'followup1';
              else if (lead.stage === 'followup1' || lead.stage === 'followup2') nextStage = 'replied';
              else if (lead.stage === 'replied') nextStage = 'booked';
              else nextStage = STAGES[stageIndex + 1]?.id || 'contacted';
              onMove(lead.id, nextStage); 
            }} style={{ flex: 2, padding: "5px", background: stageIndex === STAGES.length - 2 ? "rgba(34,197,94,0.12)" : COLORS.purpleBg, border: `1px solid ${stageIndex === STAGES.length - 2 ? "rgba(34,197,94,0.4)" : COLORS.purpleDim}`, borderRadius: 6, color: stageIndex === STAGES.length - 2 ? COLORS.green : COLORS.purpleLight, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
              {stageIndex === STAGES.length - 2 ? "✓ Book" : "Advance →"}
            </button>
          )}
          {lead.stage === "replied" ? (
            <button onClick={e => { e.stopPropagation(); onArchive(lead.id); }} style={{ padding: "5px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 6, color: COLORS.red, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>Not this time</button>
          ) : (
            <button onClick={e => { e.stopPropagation(); onArchive(lead.id); }} title="Archive" style={{ padding: "5px 8px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, fontSize: 11, cursor: "pointer" }}>◻</button>
          )}
        </div>
      ) : (
        <button onClick={e => { e.stopPropagation(); onArchive(lead.id); }} style={{ width: "100%", padding: "5px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textSecondary, fontSize: 11, cursor: "pointer" }}>↩ Restore</button>
      )}
      {showInline && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>How did you reach out?</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {METHODS.map(m => {
              const active = lead.outreachMethod === m.id;
              return (
                <button key={m.id} onClick={e => handleMethod(e, m.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, cursor: "pointer", background: active ? m.color + "33" : COLORS.bg, border: `1px solid ${active ? m.color : COLORS.border}`, color: active ? m.color : COLORS.textSecondary, fontSize: 11, fontWeight: active ? 700 : 500, transition: "all 0.15s" }}><m.Icon size={12} color={active ? m.color : COLORS.textSecondary} /><span>{m.label}</span></button>
              );
            })}
          </div>
          <textarea value={contactLog} onChange={e => setContactLog(e.target.value)} onBlur={handleLogBlur} onClick={e => e.stopPropagation()} placeholder="How did it go? Quick note..." rows={2} style={{ width: "100%", background: COLORS.bg, border: `1px solid ${logSaved ? COLORS.green : COLORS.border}`, borderRadius: 6, padding: "6px 8px", color: COLORS.text, fontSize: 11, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5, transition: "border-color 0.2s" }} />
          {logSaved && <div style={{ fontSize: 9, color: COLORS.green, marginTop: 3 }}>Saved</div>}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline View ────────────────────────────────────────────────────────────

function PipelineView({ leads, onMove, onSelect, selectedLead, onArchive, search, filters, TAG_COLORS, customTags, onUpdateLead, isMobile, onOpenNewLead, onClearFilters, selectedLeads = new Set(), onSelectAll, onToggleLeadSelection }) {
  const [showArchived, setShowArchived] = useState(false);

  const isLeadBulkSelected = (leadId) => {
    if (!selectedLeads) return false;
    return Array.from(selectedLeads).some(id => String(id) === String(leadId));
  };

  const applyFilters = (list) => list.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const hit = [l.name, l.contact, l.instagram, l.notes, l.tag, l.tier].some(f => f && f.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (filters.tier  && l.tier    !== filters.tier)  return false;
    if (filters.tag   && l.tag     !== filters.tag)   return false;
    if (filters.stage) {
      const stageMap = { followup: ["followup1","followup2"] };
      const allowed = stageMap[filters.stage] || [filters.stage];
      if (!allowed.includes(l.stage)) return false;
    }
    return true;
  });

  const activeLeads   = applyFilters(leads.filter(l => !l.archived));
  const archivedLeads = applyFilters(leads.filter(l =>  l.archived));
  const hasFilter     = search || filters.tier || filters.tag || filters.stage;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => setShowArchived(false)} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, background: !showArchived ? COLORS.purpleBg : "transparent", border: `1px solid ${!showArchived ? COLORS.purple : COLORS.border}`, color: !showArchived ? COLORS.purpleLight : COLORS.textSecondary }}>
          Active <span style={{ fontFamily: "'DM Mono', monospace", marginLeft: 4 }}>{leads.filter(l => !l.archived).length}</span>
        </button>
        <button onClick={() => setShowArchived(true)} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, background: showArchived ? COLORS.surface : "transparent", border: `1px solid ${showArchived ? COLORS.borderHover : COLORS.border}`, color: showArchived ? COLORS.textSecondary : COLORS.textMuted }}>
          Archived <span style={{ fontFamily: "'DM Mono', monospace", marginLeft: 4 }}>{leads.filter(l => l.archived).length}</span>
        </button>
        {hasFilter && (
          <div style={{ marginLeft: 4, fontSize: 11, color: COLORS.purple }}>
            {(showArchived ? archivedLeads : activeLeads).length} result{(showArchived ? archivedLeads : activeLeads).length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Full-pipeline empty state (zero active leads, no filter) ── */}
      {!showArchived && leads.filter(l => !l.archived).length === 0 && !hasFilter && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "64px 24px", textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, marginBottom: 20,
          }}>◈</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Your pipeline is empty</div>
          <div style={{ fontSize: 13, color: COLORS.text2, lineHeight: 1.6, maxWidth: 280, marginBottom: 28 }}>
            Add your first venue or promoter to start tracking outreach and bookings.
          </div>
          <button
            onClick={onOpenNewLead}
            style={{
              padding: "13px 32px", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`,
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 20px ${COLORS.purpleDim}`,
            }}
          >
            + Add your first lead
          </button>
        </div>
      )}

      {/* ── No-results state (filter returns nothing) ── */}
      {!showArchived && leads.filter(l => !l.archived).length > 0 && activeLeads.length === 0 && hasFilter && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "56px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 22, marginBottom: 12, opacity: 0.4 }}>⌕</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>No leads match</div>
          <div style={{ fontSize: 13, color: COLORS.text2, marginBottom: 20 }}>Try adjusting or clearing your filters.</div>
          <button
            onClick={onClearFilters}
            style={{
              padding: "9px 20px", background: "transparent",
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              color: COLORS.textSecondary, fontSize: 13, cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {showArchived ? (
        <div>
          {archivedLeads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: COLORS.textMuted, fontSize: 13 }}>
              {hasFilter ? "No archived leads match your filters" : "No archived leads yet"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {archivedLeads.map(lead => (
                <LeadCard
                      key={lead.id}
                      lead={lead}
                      onMove={onMove}
                      onSelect={onSelect}
                      isSelected={selectedLead?.id === lead.id}
                      isBulkSelected={isLeadBulkSelected(lead.id)}
                      onBulkSelect={() => onToggleLeadSelection?.(lead.id)}
                      onArchive={onArchive}
                      searchQuery={search}
                      TAG_COLORS={TAG_COLORS}
                      onUpdateLead={onUpdateLead}
                    />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {[
            { id: "target",    label: "Target",    color: COLORS.text3,  stages: ["target"] },
            { id: "contacted", label: "Contacted", color: COLORS.purple, stages: ["contacted"] },
            { id: "followup",  label: "Follow-up", color: COLORS.purpleLight, stages: ["followup1","followup2"] },
            { id: "replied",   label: "Replied",   color: COLORS.violetLight, stages: ["replied"] },
            { id: "booked",    label: "Booked",    color: COLORS.green,  stages: ["booked"] },
          ].map(col => {
            const isFiltered = filters.stage && !col.stages.includes(filters.stage);
            const colLeads = activeLeads.filter(l => col.stages.includes(l.stage));
            return (
              <div key={col.id} style={{ minWidth: 220, flex: 1, opacity: isFiltered ? 0.3 : 1, transition: "opacity 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>{col.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {colLeads.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAll?.(col.id);
                        }}
                        style={{
                          padding: "3px 7px",
                          background: "transparent",
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 6,
                          color: COLORS.textSecondary,
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Select All
                      </button>
                    )}
                    <span style={{ fontSize: 11, color: colLeads.length > 0 ? COLORS.textSecondary : COLORS.textMuted, fontFamily: "'DM Mono', monospace" }}>{colLeads.length}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 100 }}>
                  {colLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onMove={onMove}
                      onSelect={onSelect}
                      isSelected={selectedLead?.id === lead.id}
                      isBulkSelected={isLeadBulkSelected(lead.id)}
                      onBulkSelect={() => onToggleLeadSelection?.(lead.id)}
                      onArchive={onArchive}
                      searchQuery={search}
                      TAG_COLORS={TAG_COLORS}
                      onUpdateLead={onUpdateLead}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: "20px 14px", textAlign: "center" }}>
                      {hasFilter ? (
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>No matches</div>
                      ) : col.id === "replied" ? (
                        <>
                          <div style={{ fontSize: 16, marginBottom: 6 }}>✉</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>No replies yet</div>
                          <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 4 }}>Keep following up — replies come with persistence</div>
                        </>
                      ) : col.id === "booked" ? (
                        <>
                          <div style={{ fontSize: 16, marginBottom: 6 }}>📅</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>No bookings yet</div>
                          <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 4 }}>Your first confirmed gig starts with one follow-up</div>
                        </>
                      ) : col.id === "target" ? (
                        <>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>Add your first lead</div>
                          <button 
                            onClick={onOpenNewLead}
                            style={{
                              padding: "8px 12px",
                              background: COLORS.purple,
                              border: "none",
                              borderRadius: 6,
                              color: COLORS.bg,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              width: "100%",
                            }}
                          >
                            + Add Lead
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>Empty</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Lead Detail ──────────────────────────────────────────────────────────────

function AssetCopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}</span>
      <button onClick={copy} style={{
        fontSize: 10, fontWeight: 700, cursor: "pointer",
        color: copied ? COLORS.green : COLORS.purple,
        background: copied ? COLORS.green + "15" : "none",
        border: `1px solid ${copied ? COLORS.green + "55" : COLORS.purpleDim}`,
        borderRadius: 5, padding: "2px 8px",
        transition: "all 0.2s",
      }}>{copied ? "✓ Copied!" : "Copy →"}</button>
    </div>
  );
}

function LeadDetail({ lead, onClose, onMove, onArchive, onDelete, supabase, userId, onUpdate, TAG_COLORS, assets, setShowTemplatePicker, isPro, onUpgradeClick, totalLeads = 0, isAdmin = false, customTags = [] }) {
  const [editing, setEditing] = useState(false);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Email compose
  const [emailConn, setEmailConn]         = useState(null); // { provider, email }
  const [composeOpen, setComposeOpen]     = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody]     = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeSent, setComposeSent]     = useState(false);
  const [composeError, setComposeError]   = useState("");

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase.from("email_connections").select("provider, email").eq("user_id", userId)
      .then(({ data }) => {
        if (!data?.length) return;
        const conn = data.find(c => c.provider === "resend") || data.find(c => c.provider === "smtp") || data.find(c => c.provider === "gmail") || data.find(c => c.provider === "outlook") || data[0];
        setEmailConn(conn);
      });
  }, [userId]);

  const sendEmail = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) return;
    setComposeSending(true); setComposeError("");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!emailConn) { setComposeError("Connect an email account in Settings first."); setComposeSending(false); return; }
      const fn = emailConn.provider === "gmail" ? "gmail-send" : emailConn.provider === "outlook" ? "outlook-send" : emailConn.provider === "smtp" ? "smtp-send" : emailConn.provider === "resend" ? "resend-send" : null;
      if (!fn) { setComposeError("Email provider not supported. Reconnect in Settings."); setComposeSending(false); return; }
      const res = await fetch(`${supabase.supabaseUrl}/functions/v1/${fn}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.contact, subject: composeSubject, message: composeBody, lead_id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) { setComposeError(data.detail || data.error || "Send failed"); }
      else { setComposeSent(true); setTimeout(() => { setComposeOpen(false); setComposeSent(false); setComposeSubject(""); setComposeBody(""); }, 2000); }
    } catch (e) { setComposeError("Network error. Try again."); }
    setComposeSending(false);
  };

  // AI outreach draft
  const [aiOpen, setAiOpen]         = useState(false);
  const [aiFormat, setAiFormat]     = useState("email");
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiDraft, setAiDraft]       = useState("");
  const [aiCopied, setAiCopied]     = useState(false);
  const [aiError, setAiError]       = useState("");
  const [aiSubject, setAiSubject]   = useState("");
  const [aiSending, setAiSending]   = useState(false);
  const [aiSent, setAiSent]         = useState(false);
  const [aiSendError, setAiSendError] = useState("");

  const generateDraft = async () => {
    setAiLoading(true); setAiError(""); setAiDraft(""); setAiSent(false); setAiSendError(""); setAiSubject("");
    try {
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).single();
      const { data: assetData } = await supabase.from("user_assets").select("*").eq("user_id", userId).maybeSingle();
      const res = await supabase.functions.invoke("ai-outreach", {
        body: {
          lead: { name: lead.name, city: lead.city, country: lead.country, tag: lead.tag, tier: lead.tier, notes: lead.notes, instagram: lead.instagram, stage: lead.stage },
          artist: { display_name: profile?.display_name, tagline: assetData?.tagline, location: assetData?.location, genres: assetData?.genres, bio: assetData?.bio, booking_email: assetData?.booking_email, soundcloud: assetData?.soundcloud },
          format: aiFormat,
        },
      });
      if (res.error) throw new Error(res.error.message);
      setAiDraft(res.data?.message || "");
      // Auto-populate subject so Send button is immediately active
      if (aiFormat === "email" && !aiSubject) {
        setAiSubject(res.data?.subject || `Booking Inquiry — ${lead.name}`);
      }
    } catch (e) {
      setAiError("Generation failed — check your connection and try again.");
    }
    setAiLoading(false);
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(aiDraft);
    setAiCopied(true); setTimeout(() => setAiCopied(false), 2000);
  };

  const sendAiDraft = async () => {
    if (!aiSubject.trim() || !aiDraft.trim() || !lead.contact || !emailConn) return;
    setAiSending(true); setAiSendError("");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const fn = emailConn.provider === "gmail" ? "gmail-send" : emailConn.provider === "outlook" ? "outlook-send" : emailConn.provider === "smtp" ? "smtp-send" : emailConn.provider === "resend" ? "resend-send" : null;
      if (!fn) { setAiSendError("Email provider not supported. Reconnect in Settings."); setAiSending(false); return; }
      const res = await fetch(`${supabase.supabaseUrl}/functions/v1/${fn}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.contact, subject: aiSubject, message: aiDraft, lead_id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) { setAiSendError(data.detail || data.error || "Send failed"); }
      else { setAiSent(true); setTimeout(() => setAiSent(false), 3000); }
    } catch (e) { setAiSendError("Network error. Try again."); }
    setAiSending(false);
  };

  const [form, setForm] = useState({
    name: lead.name || "",
    contact: lead.contact || "",
    instagram: lead.instagram || "",
    notes: lead.notes || "",
    follow_up_date: lead.follow_up_date || "",
    tag: lead.tag || "",
    tier: lead.tier || "A2",
  });
  const [saving, setSaving] = useState(false);

  // Keep form in sync if lead changes (switching cards)
  useEffect(() => {
    setForm({
      name: lead.name || "",
      contact: lead.contact || "",
      instagram: lead.instagram || "",
      notes: lead.notes || "",
      follow_up_date: lead.follow_up_date || "",
      tag: lead.tag || "",
      tier: lead.tier || "A2",
    });
    setEditing(false);
    loadActivity();
  }, [lead.id]);
  
  async function loadActivity() {
    setLoadingActivity(true);
    const { data, error } = await supabase
      .from('lead_history')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setActivity(data);
    }
    setLoadingActivity(false);
  }

  const stageIndex = STAGES.findIndex(s => s.id === lead.stage);
  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) <= new Date();

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        name: form.name.trim(),
        contact: form.contact.trim(),
        instagram: form.instagram.trim(),
        notes: form.notes.trim(),
        follow_up_date: form.follow_up_date || null,
        tag: form.tag || lead.tag,
        tier: form.tier || lead.tier,
      };
      const { error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", lead.id)
        .eq("user_id", userId);
      if (!error) {
        onUpdate({ ...lead, ...updates });
        setEditing(false);
      }
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  };

   const inputStyle = {
  width: "100%",
  background: COLORS.bg,
  WebkitBoxShadow: `0 0 0 1000px ${COLORS.bg} inset`,
  WebkitTextFillColor: COLORS.text,
  colorScheme: "dark",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: "6px 10px",
    color: COLORS.text,
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    marginTop: 3,
  };

  const labelStyle = {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginTop: 12,
  };

  return (
    <div style={{
      width: 280,
      borderLeft: `3px solid ${COLORS.violetLight}`,
      background: COLORS.surface,
      display: "flex",
      flexDirection: "column",
      padding: "14px 16px",
      overflowY: "auto",
      flexShrink: 0,
      boxShadow: `-4px 0 24px rgba(14,116,144,0.12)`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoComplete="off" style={{ ...inputStyle, fontSize: 14, fontWeight: 700, marginTop: 0 }}
              autoFocus
            />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, lineHeight: 1.3 }}>{lead.name}</div>
          )}
          {editing ? (
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                style={{ padding: "4px 8px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 11, outline: "none", cursor: "pointer" }}>
                {["A1","A2","A3"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                style={{ padding: "4px 8px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 11, outline: "none", cursor: "pointer" }}>
                {customTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              <Badge color={TIER_COLORS[lead.tier]}>{lead.tier}</Badge>
              {lead.tag && <Badge color={TAG_COLORS?.[lead.tag] || COLORS.purple}>{lead.tag}</Badge>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ fontSize: 11, padding: "4px 10px", background: COLORS.purple, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
              >
                {saving ? "…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setForm({ name: lead.name || "", contact: lead.contact || "", instagram: lead.instagram || "", notes: lead.notes || "", follow_up_date: lead.follow_up_date || "" }); }}
                style={{ fontSize: 11, padding: "4px 8px", background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{ fontSize: 11, padding: "4px 10px", background: "transparent", color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer" }}
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}
          >×</button>
        </div>
      </div>

      {/* Follow-up overdue badge */}
      {isOverdue && !lead.archived && (
        <div style={{ background: COLORS.amber + "22", border: `1px solid ${COLORS.amber}44`, borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.amber, fontWeight: 600 }}>Follow-up overdue</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>{formatShortDate(lead.follow_up_date)}</div>
        </div>
      )}

      {/* Post-booking mini-pipeline */}
      {!lead.archived && lead.stage === "booked" && (() => {
        const BOOKING_STEPS = [
          { id: "fee_confirmed",    label: "Fee confirmed",   required: true },
          { id: "contract_sent",    label: "Contract sent",   required: false },
          { id: "contract_signed",  label: "Contract signed", required: false },
          { id: "confirmed",        label: "Confirmed",       required: false },
        ];
        const status = lead.bookingStatus || [];
        const allDone = BOOKING_STEPS.every(s => status.includes(s.id));
        const toggle = async (stepId) => {
          const next = status.includes(stepId)
            ? status.filter(s => s !== stepId)
            : [...status, stepId];
          const { error } = await supabase.from("leads").update({ booking_status: next }).eq("id", lead.id).eq("user_id", userId);
          if (!error) onUpdate({ ...lead, bookingStatus: next });
        };
        return (
          <div style={{ background: allDone ? "rgba(34,197,94,0.08)" : COLORS.surface, border: `1px solid ${allDone ? "rgba(34,197,94,0.35)" : COLORS.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
            {/* Primary CTA — Create Gig */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switchToCalendar', {
                  detail: { venue: lead.name, tag: lead.tag }
                }));
              }}
              style={{ width: "100%", marginBottom: 12, padding: "10px 14px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <span>📅</span>
              <span>Create Gig in Calendar</span>
            </button>
            <div style={{ fontSize: 10, color: allDone ? COLORS.green : COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              {allDone ? "✓ Booking complete" : "Booking checklist"}
            </div>
            {BOOKING_STEPS.map((step, i) => {
              const done = status.includes(step.id);
              return (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < BOOKING_STEPS.length - 1 ? `1px solid ${COLORS.border}22` : "none" }}>
                  <button
                    onClick={() => toggle(step.id)}
                    style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${done ? COLORS.green : COLORS.border}`, background: done ? COLORS.green : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                  >
                    {done && <span style={{ fontSize: 10, color: "#000", fontWeight: 700 }}>✓</span>}
                  </button>
                  <span style={{ fontSize: 12, color: done ? COLORS.text : COLORS.textMuted, textDecoration: done ? "none" : "none", fontWeight: done ? 600 : 400 }}>{step.label}</span>
                  {!step.required && !done && <span style={{ fontSize: 9, color: COLORS.textMuted, marginLeft: "auto", opacity: 0.6 }}>optional</span>}
                </div>
              );
            })}
            
          </div>
        );
      })()}

      {/* Mark as Contacted */}
      {!lead.archived && lead.stage === "target" && (
        <button
          onClick={() => onMove(lead.id, "contacted")}
          style={{ width: "100%", padding: "8px 0", background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 12 }}
        >
          Mark as Contacted
          <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>Follow-up reminder in 5 days</div>
        </button>
      )}

      {/* EPK prompt on Replied */}
      {!lead.archived && lead.stage === "replied" && assets && (assets?.epk_url || assets?.soundcloud || assets?.booking_email) && (
        <div style={{ background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.violetLight, marginBottom: 8 }}>✓ They replied — send your kit</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              assets?.epk_url      && { label: "EPK PDF",       value: assets.epk_url },
              assets?.soundcloud   && { label: "SoundCloud",    value: assets.soundcloud },
              assets?.booking_email && { label: "Booking email", value: assets.booking_email },
            ].filter(Boolean).map(item => (
              <AssetCopyRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </div>
      )}

      {/* Manual Compose Button */}
      {!lead.archived && lead.stage !== "booked" && lead.contact && emailConn && (
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => { setComposeOpen(o => !o); setComposeError(""); setComposeSent(false); }}
            style={{ width: "100%", padding: "8px 12px", background: composeOpen ? COLORS.surface2 : "transparent", border: `1px solid ${composeOpen ? COLORS.border : COLORS.border}`, borderRadius: 8, color: composeOpen ? COLORS.text : COLORS.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>✉</span> Compose Email
            </span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>{composeOpen ? "▲" : "▼"}</span>
          </button>
          {composeOpen && (
            <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>To: <span style={{ color: COLORS.text }}>{lead.contact}</span> · via <span style={{ color: COLORS.purpleLight }}>{emailConn?.email}</span></div>
              <input
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                placeholder="Subject"
                onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
                style={{ ...INPUT.base, fontSize: 12, padding: "7px 10px" }}
              />
              <textarea
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                placeholder="Write your message…"
                rows={6}
                style={{ ...INPUT.base, fontSize: 12, padding: "8px 10px", resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
              />
              {composeError && <div style={{ fontSize: 11, color: "#ef4444" }}>{composeError}</div>}
              {composeSent && <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>✓ Email sent!</div>}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setComposeOpen(false)} style={{ fontSize: 11, padding: "5px 10px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, cursor: "pointer" }}>Cancel</button>
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={composeSending || !composeSubject.trim() || !composeBody.trim()}
                  style={{ fontSize: 11, padding: "5px 14px", background: COLORS.purple, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontWeight: 700, opacity: composeSending ? 0.6 : 1 }}
                >
                  {composeSending ? "Sending…" : composeSent ? "✓ Sent!" : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Draft Panel */}
      {!lead.archived && lead.stage !== "booked" && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => (isAdmin || totalLeads >= 50) && setAiOpen(o => !o)}
            style={{ width: "100%", padding: "8px 12px", background: aiOpen ? `rgba(139,92,246,0.15)` : COLORS.surface2, border: `1px solid ${aiOpen ? COLORS.violetLight : COLORS.border}`, borderRadius: 8, color: (isAdmin || totalLeads >= 50) ? (aiOpen ? COLORS.violetLight : COLORS.text2) : COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: (isAdmin || totalLeads >= 50) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              AI Outreach Draft
              {!isAdmin && totalLeads < 50 && (
                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: "rgba(14,116,144,0.15)", border: `1px solid rgba(14,116,144,0.35)`, color: COLORS.purpleLight }}>PRO+</span>
              )}
            </span>
            {(isAdmin || totalLeads >= 50) && <span style={{ fontSize: 10, opacity: 0.6 }}>{aiOpen ? "▲" : "▼"}</span>}
          </button>

          {aiOpen && (
            <div style={{ background: `rgba(139,92,246,0.06)`, border: `1px solid rgba(139,92,246,0.20)`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: "12px 12px 14px" }}>
              {/* Format toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {["email", "dm"].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => { setAiFormat(fmt); setAiDraft(""); setAiError(""); }}
                    style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: `1px solid ${aiFormat === fmt ? COLORS.violetLight : COLORS.border}`, background: aiFormat === fmt ? `rgba(139,92,246,0.18)` : "transparent", color: aiFormat === fmt ? COLORS.violetLight : COLORS.text2, fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    {fmt === "email" ? "📧 Email" : "💬 DM"}
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={generateDraft}
                disabled={aiLoading}
                style={{ width: "100%", padding: "7px 0", background: aiLoading ? "rgba(124,58,237,0.3)" : COLORS.violet, border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {aiLoading ? (
                  <>
                    <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Generating…
                  </>
                ) : (
                  <>✦ Generate {aiFormat === "email" ? "Email" : "DM"}</>
                )}
              </button>

              {/* Error */}
              {aiError && (
                <div style={{ fontSize: 11, color: COLORS.red, marginBottom: 8, padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6 }}>{aiError}</div>
              )}

              {/* Draft textarea + copy */}
              {aiDraft && (
                <div>
                  {aiFormat === "email" && (
                    <input
                      value={aiSubject}
                      onChange={e => setAiSubject(e.target.value)}
                      placeholder="Subject line…"
                      onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
                      style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, padding: "7px 12px", marginBottom: 6, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                    />
                  )}
                  <textarea
                    value={aiDraft}
                    onChange={e => setAiDraft(e.target.value)}
                    rows={aiFormat === "email" ? 8 : 4}
                    style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, lineHeight: 1.6, padding: "10px 12px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={copyDraft}
                      style={{ flex: 1, padding: "6px 0", background: aiCopied ? COLORS.green : "rgba(139,92,246,0.15)", border: `1px solid ${aiCopied ? COLORS.green : COLORS.violetLight}`, borderRadius: 7, color: aiCopied ? "#fff" : COLORS.violetLight, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                    >
                      {aiCopied ? "✓ Copied!" : "Copy"}
                    </button>
                    {aiFormat === "email" && lead.contact && emailConn && (
                      <button
                        type="button"
                        onClick={sendAiDraft}
                        disabled={aiSending || !aiSubject.trim()}
                        style={{ flex: 1, padding: "6px 0", background: aiSent ? COLORS.green : COLORS.purple, border: "none", borderRadius: 7, color: "#fff", fontSize: 11, fontWeight: 700, cursor: aiSending || !aiSubject.trim() ? "not-allowed" : "pointer", opacity: aiSending ? 0.6 : 1, transition: "all 0.2s" }}
                      >
                        {aiSent ? "✓ Sent!" : aiSending ? "Sending…" : "✉ Send"}
                      </button>
                    )}
                  </div>
                  {aiSendError && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{aiSendError}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fields */}
      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Contact Info</div>

      <div style={labelStyle}>Email</div>
      {editing ? (
        <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={inputStyle} placeholder="booking@venue.com" />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
          <div style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{lead.contact || <span style={{ color: COLORS.textMuted }}>—</span>}</div>
          {lead.contact && emailConn && (
            <button
              type="button"
              onClick={() => { setComposeOpen(o => !o); setComposeError(""); setComposeSent(false); }}
              style={{ fontSize: 10, padding: "3px 8px", background: composeOpen ? COLORS.purple : "transparent", border: `1px solid ${composeOpen ? COLORS.purple : COLORS.border}`, borderRadius: 5, color: composeOpen ? "#fff" : COLORS.textMuted, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}
            >
              ✉ Send
            </button>
          )}
          {lead.contact && !emailConn && (
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>Connect email in Settings</span>
          )}
        </div>
      )}

      {/* Inline compose panel */}
      {composeOpen && !editing && (
        <div style={{ marginTop: 10, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>To: <span style={{ color: COLORS.text }}>{lead.contact}</span> · via <span style={{ color: COLORS.purpleLight }}>{emailConn?.email}</span></div>
          <input
            value={composeSubject}
            onChange={e => setComposeSubject(e.target.value)}
            placeholder="Subject"
            onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
            style={{ ...INPUT.base, fontSize: 12, padding: "7px 10px" }}
          />
          <textarea
            value={composeBody}
            onChange={e => setComposeBody(e.target.value)}
            placeholder="Write your message…"
            rows={5}
            style={{ ...INPUT.base, fontSize: 12, padding: "8px 10px", resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
          />
          {composeError && <div style={{ fontSize: 11, color: "#ef4444" }}>{composeError}</div>}
          {composeSent && <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>✓ Email sent!</div>}
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setComposeOpen(false)} style={{ fontSize: 11, padding: "5px 10px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, cursor: "pointer" }}>Cancel</button>
            <button
              type="button"
              onClick={sendEmail}
              disabled={composeSending || !composeSubject.trim() || !composeBody.trim()}
              style={{ fontSize: 11, padding: "5px 12px", background: COLORS.purple, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontWeight: 700, opacity: composeSending ? 0.6 : 1 }}
            >
              {composeSending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      )}

      <div style={labelStyle}>Instagram</div>
      {editing ? (
        <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} style={inputStyle} placeholder="https://instagram.com/venue" />
      ) : (
        <div style={{ fontSize: 12, color: COLORS.text, marginTop: 3, wordBreak: "break-all" }}>{lead.instagram || <span style={{ color: COLORS.textMuted }}>—</span>}</div>
      )}

      <div style={labelStyle}>Follow-up Date</div>
      {editing ? (
        <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
      ) : (
        <div style={{ fontSize: 12, color: COLORS.text, marginTop: 3 }}>{lead.follow_up_date ? formatShortDate(lead.follow_up_date) : <span style={{ color: COLORS.textMuted }}>Not set</span>}</div>
      )}

      <div style={labelStyle}>Last Contact</div>
      <div style={{ fontSize: 12, color: COLORS.text, marginTop: 3 }}>{lead.last_contact || <span style={{ color: COLORS.textMuted }}>Never</span>}</div>

      {/* Fee — booked leads only */}
      {lead.stage === "booked" && (
        <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...labelStyle }}>Fee (€)</div>
            <input
              type="number"
              key={lead.id + "fee"}
              defaultValue={lead.fee || ""}
              onBlur={async e => { const v = parseInt(e.target.value); if (!isNaN(v)) { await supabase.from("leads").update({ fee: v }).eq("id", lead.id).eq("user_id", userId); onUpdate({ ...lead, fee: v }); } }}
              placeholder="e.g. 800"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "7px 10px", color: COLORS.text, fontSize: 13, marginTop: 3, colorScheme: "dark" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...labelStyle }}>Deposit</div>
            <div
              onClick={async () => { const newVal = !lead.deposit_paid; await supabase.from("leads").update({ deposit_paid: newVal }).eq("id", lead.id).eq("user_id", userId); onUpdate({ ...lead, deposit_paid: newVal }); }}
              style={{ cursor: "pointer", marginTop: 3, background: lead.deposit_paid ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${lead.deposit_paid ? "rgba(74,222,128,0.35)" : COLORS.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 13, color: lead.deposit_paid ? "#4ade80" : COLORS.textMuted, textAlign: "center", userSelect: "none" }}
            >
              {lead.deposit_paid ? "Deposit received ✓" : "No deposit yet"}
            </div>
          </div>
        </div>
      )}
      {/* Notes */}
      <div style={{ ...labelStyle, marginTop: 14 }}>Notes</div>
      {editing ? (
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          autoComplete="off" style={{ ...inputStyle, minHeight: 72, resize: "vertical", marginTop: 3, colorScheme: "dark" }}
          placeholder="Context, connections, vibe of the venue…"
        />
      ) : (
        lead.notes ? (
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 12, color: COLORS.text, marginTop: 3, lineHeight: 1.5 }}>{lead.notes}</div>
        ) : (
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>—</div>
        )
      )}

      {/* Contact Log */}
      {(lead.contactLog || lead.outreachMethod) && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Contact Log</div>
          {lead.outreachMethod && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>Via</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.purpleLight, textTransform: "capitalize" }}>{lead.outreachMethod === "instagram" ? "Instagram DM" : lead.outreachMethod}</span>
            </div>
          )}
          {lead.contactLog && (
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>{lead.contactLog}</div>
          )}
        </div>
      )}


      {/* Template Picker & Smart Suggestions - Bundle 5.2-5.4 */}
      {!lead.archived && ['target', 'contacted', 'followup1', 'followup2'].includes(lead.stage) && (
        <button
          onClick={() => {
            setShowTemplatePicker(true);
          }}
          style={{
            marginTop: 16,
            padding: '10px 16px',
            backgroundColor: COLORS.purple,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'center'
          }}
        >
          📝 Use Template
        </button>
      )}

      {!lead.archived && (
        <SmartSuggestionsButton
          supabase={supabase}
          user={{ id: userId }}
          lead={lead}
          artistGenre={assets?.genres}
          totalLeads={totalLeads}
          isAdmin={isAdmin}
          onLeadAdded={(newLead) => { if (onUpdate) onUpdate(newLead); }}
        />
      )}

      {/* Stage tracker */}
      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 16, marginBottom: 6 }}>All Stages</div>
      {STAGES.map(s => (
        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
            <div style={{ fontSize: 12, color: lead.stage === s.id ? COLORS.text : COLORS.textMuted, fontWeight: lead.stage === s.id ? 600 : 400 }}>{s.label}</div>
          </div>
          {lead.stage === s.id && <span style={{ fontSize: 10, color: COLORS.purple, fontWeight: 600 }}>← current</span>}
        </div>
      ))}

      {/* Archive / Delete */}
      {!lead.archived && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => onArchive(lead.id)}

            style={{ fontSize: 11, padding: "6px 0", background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer" }}
          >
            ☐ Archive lead
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            style={{ fontSize: 11, padding: "6px 0", background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}44`, borderRadius: 6, cursor: "pointer" }}
          >
            × Delete permanently
          </button>
        </div>
      )}
      
      {/* Activity Timeline */}
      {!loadingActivity && activity && activity.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>
            Activity Timeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activity.map(event => (
                <div key={event.id} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <div style={{ color: COLORS.text3, minWidth: 120, fontSize: 12 }}>
                    {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ color: COLORS.text2 }}>
                    {event.event_type === 'stage_change' && (
                      <span>Moved from <strong style={{ color: COLORS.text }}>{event.old_value}</strong> to <strong style={{ color: COLORS.text }}>{event.new_value}</strong></span>
                    )}
                    {event.event_type === 'created' && <span>Lead created</span>}
                    {event.event_type === 'archived' && <span>Archived</span>}
                    {event.event_type === 'restored' && <span>Restored from archive</span>}
                    {!['stage_change', 'created', 'archived', 'restored'].includes(event.event_type) && (
                      <span>{event.event_type}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Add Lead Modal ───────────────────────────────────────────────────────────

function Input({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: COLORS.purple, marginLeft: 3 }}>*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 13, outline: "none", width: "100%", fontFamily: "inherit", transition: "border-color 0.15s", WebkitBoxShadow: `0 0 0 1000px ${COLORS.bg} inset`, WebkitTextFillColor: COLORS.text }}
        onFocus={e => e.target.style.borderColor = COLORS.purple}
        onBlur={e => e.target.style.borderColor = COLORS.border} />
    </div>
  );
}

function SelectPill({ options, value, onChange, colorMap }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(opt => {
        const color  = colorMap?.[opt] || COLORS.purple;
        const active = value === opt;
        return (
          <button key={opt} onClick={() => onChange(opt)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s", background: active ? color + "33" : "transparent", border: `1px solid ${active ? color : COLORS.border}`, color: active ? color : COLORS.textSecondary }}>{opt}</button>
        );
      })}
    </div>
  );
}

function AddGenreRow({ onAdd }) {
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handle = () => {
    const clean = input.trim();
    if (!clean) { setAdding(false); setError(""); return; }
    if (clean.length > 20) { setError("Max 20 characters"); return; }
    const ok = onAdd(clean);
    if (ok === false) { setError("Already exists"); return; }
    setInput(""); setAdding(false); setError("");
  };

  if (!adding) return (
    <button onClick={() => setAdding(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "transparent", border: `1px dashed ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, cursor: "pointer", width: "100%", textAlign: "left" }}>
      <span style={{ fontSize: 14 }}>+</span> Add genre
    </button>
  );

  const previewColor = null; // color preview requires TAG_COLORS prop — skipped for now
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: COLORS.bg, border: `1px solid ${error ? COLORS.red : previewColor || COLORS.purple}`, borderLeft: previewColor ? `3px solid ${previewColor}` : `1px solid ${COLORS.purple}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}>
          {previewColor && <div style={{ width: 8, height: 8, borderRadius: "50%", background: previewColor, marginLeft: 10, flexShrink: 0, boxShadow: `0 0 6px ${previewColor}88` }} />}
          <input
            autoFocus
            value={input}
            onChange={e => { setInput(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handle(); if (e.key === "Escape") { setAdding(false); setInput(""); setError(""); } }}
            placeholder="e.g. Afrobeats, Reggaeton…"
            style={{ flex: 1, padding: "9px 12px", background: "transparent", border: "none", color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <button onClick={handle} style={{ padding: "9px 16px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Add</button>
        <button onClick={() => { setAdding(false); setInput(""); setError(""); }} style={{ padding: "9px 10px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>✕</button>
      </div>
      {error && <div style={{ fontSize: 11, color: COLORS.red, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function GenreSelector({ tags, value, onChange, TAG_COLORS, onAddTag }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput]   = useState("");
  const inputRef = useRef(null);

  const handleAdd = () => {
    const clean = input.trim();
    if (!clean) { setAdding(false); return; }
    onAddTag(clean);
    onChange(clean);
    setInput("");
    setAdding(false);
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {tags.map(tag => {
        const color  = TAG_COLORS[tag] || COLORS.textMuted;
        const active = value === tag;
        return (
          <button key={tag} onClick={() => onChange(tag)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s",
            background: active ? color + "33" : "transparent",
            border: `1px solid ${active ? color : COLORS.border}`,
            color: active ? color : COLORS.textSecondary,
          }}>{tag}</button>
        );
      })}
      {adding ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setInput(""); } }}
            placeholder="e.g. Afrobeats"
            style={{ padding: "5px 10px", background: COLORS.bg, border: `1px solid ${COLORS.purple}`, borderRadius: 20, color: COLORS.text, fontSize: 12, outline: "none", width: 110, fontFamily: "inherit" }}
          />
          <button onClick={handleAdd} style={{ padding: "5px 10px", background: COLORS.purple, border: "none", borderRadius: 20, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add</button>
          <button onClick={() => { setAdding(false); setInput(""); }} style={{ padding: "5px 8px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 20, color: COLORS.textSecondary, fontSize: 11, cursor: "pointer" }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          cursor: "pointer", background: "transparent",
          border: `1px dashed ${COLORS.border}`, color: COLORS.textMuted,
          transition: "all 0.15s",
        }}>+ Add genre</button>
      )}
    </div>
  );
}

function AddLeadModal({ onClose, onAdd, customTags, TAG_COLORS, onAddTag }) {
  const EMPTY = { name: "", contact: "", instagram: "", tier: "A2", tag: "Tech-House", stage: "target", notes: "" };
  const [form, setForm]   = useState(EMPTY);
  const [step, setStep]   = useState(1);
  const [errors, setErrors] = useState({});
  const set = key => val  => setForm(f => ({ ...f, [key]: val }));
  const validateStep1 = () => { const e = {}; if (!form.name.trim()) e.name = "Venue name is required"; if (!form.contact.trim() && !form.instagram.trim()) e.contact = "Add at least one contact method"; setErrors(e); return !Object.keys(e).length; };
  const handleNext   = () => { if (validateStep1()) setStep(2); };
    const handleSubmit = () => { onAdd({ ...form, id: crypto.randomUUID(), followUpDate: null, lastContact: null }); onClose(); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 18, width: 480, maxWidth: "95vw", boxShadow: "0 0 60px rgba(14,116,144,0.12), 0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "slideUp 0.2s ease" }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }`}</style>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.purple }}>+</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text }}>New Lead</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 1 }}>Step {step} of 2 — {step === 1 ? "Contact info" : "Classification"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 5 }}>{[1,2].map(s => <div key={s} style={{ width: s === step ? 16 : 6, height: 6, borderRadius: 3, background: s === step ? COLORS.purple : s < step ? COLORS.purpleDim : COLORS.border, transition: "all 0.2s" }} />)}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>
        </div>
        {step === 1 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Venue / Promoter Name" value={form.name} onChange={set("name")} placeholder="e.g. Tresor Berlin" required />
            {errors.name    && <div style={{ fontSize: 11, color: COLORS.red, marginTop: -10 }}>{errors.name}</div>}
            <Input label="Email"     value={form.contact}   onChange={set("contact")}   placeholder="booking@venue.com" type="email" />
            <Input label="Instagram" value={form.instagram} onChange={set("instagram")} placeholder="@venuename" />
            {errors.contact && <div style={{ fontSize: 11, color: COLORS.red, marginTop: -10 }}>{errors.contact}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Notes</label>
              <textarea value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="Context, connections, vibe of the venue..." rows={3}
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 13, outline: "none", width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border} />
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Priority Tier <span style={{ color: COLORS.purple }}>*</span></label>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ tier: "A1", desc: "Dream venues", color: COLORS.purpleLight }, { tier: "A2", desc: "Strong targets", color: COLORS.purple }, { tier: "A3", desc: "Long shots", color: COLORS.textSecondary }].map(({ tier, desc, color }) => (
                  <button key={tier} onClick={() => set("tier")(tier)} style={{ flex: 1, padding: "12px 10px", borderRadius: 10, cursor: "pointer", background: form.tier === tier ? color + "22" : COLORS.bg, border: `1px solid ${form.tier === tier ? color : COLORS.border}`, transition: "all 0.15s", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: form.tier === tier ? color : COLORS.textSecondary }}>{tier}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Scene / Genre <span style={{ color: COLORS.purple }}>*</span></label>
              <GenreSelector tags={customTags} value={form.tag} onChange={set("tag")} TAG_COLORS={TAG_COLORS} onAddTag={(tag) => { if (onAddTag(tag)) set("tag")(tag); }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pipeline Stage</label>
              <SelectPill options={STAGES.map(s => s.label)} value={STAGES.find(s => s.id === form.stage)?.label} onChange={label => set("stage")(STAGES.find(s => s.label === label)?.id)} colorMap={Object.fromEntries(STAGES.map(s => [s.label, s.color]))} />
            </div>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Preview</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{form.name || "Venue Name"}</div>
                <div style={{ display: "flex", gap: 6 }}><Badge color={TIER_COLORS[form.tier]}>{form.tier}</Badge><Badge color={TAG_COLORS[form.tag]}>{form.tag}</Badge></div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{form.contact || form.instagram || "No contact yet"}</div>
            </div>
          </div>
        )}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", gap: 10 }}>
          {step === 1
            ? <button onClick={onClose}      style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.textSecondary, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            : <button onClick={() => setStep(1)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.textSecondary, fontSize: 13, cursor: "pointer" }}>← Back</button>}
          {step === 1
            ? <button onClick={handleNext}   style={{ padding: "10px 28px", background: COLORS.purple, border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Next →</button>
            : <button onClick={handleSubmit} style={{ padding: "10px 28px", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`, border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(14,116,144,0.35)" }}>Add to Pipeline ✓</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Other Views (Outreach, Follow-ups, Dashboard, Assets) ───────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: "calc(50% - 7px)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent || COLORS.purple, opacity: 0.7 }} />
      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: accent || COLORS.purple, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DashboardView({ leads, gigs = [], onNavigate, isPro, onUpgradeClick }) {
  const today    = new Date();
  const active   = leads.filter(l => !l.archived);

  // Revenue panel — gigs with a fee
  const gigsWithFee    = gigs.filter(g => g.fee && parseFloat(g.fee) > 0);
  const thisMonth      = gigsWithFee.filter(g => { const d = new Date(g.date); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth(); });
  const upcomingGigs   = gigsWithFee.filter(g => new Date(g.date) > today);
  const gigRevMonth    = thisMonth.reduce((s, g) => s + (parseFloat(g.fee) || 0), 0);
  const gigRevTotal    = gigsWithFee.reduce((s, g) => s + (parseFloat(g.fee) || 0), 0);
  const gigRevUpcoming = upcomingGigs.reduce((s, g) => s + (parseFloat(g.fee) || 0), 0);
  const avgFee         = gigsWithFee.length > 0 ? Math.round(gigRevTotal / gigsWithFee.length) : 0;
  const showRevenue    = gigsWithFee.length > 0;
  const booked   = active.filter(l => l.stage === "booked").length;
  const bookedLeadsAll = active.filter(l => l.stage === "booked");
  const totalRevenue = bookedLeadsAll.reduce((sum, l) => sum + (l.fee || 0), 0);
  const unpaidCount  = bookedLeadsAll.filter(l => l.fee && !l.deposit_paid).length;
  const replied  = active.filter(l => l.stage === "replied" || l.stage === "booked").length;
  const contacted = active.filter(l => l.stage !== "target").length;
  const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;

  // Next Actions — leads that need action today, sorted by urgency
  const nextActions = active
    .filter(l => l.stage !== "booked" && l.stage !== "target")
    .map(l => {
      const daysAgo = l.followUpDate
        ? Math.ceil((today - new Date(l.followUpDate)) / (1000 * 60 * 60 * 24))
        : null;
      const isOverdue = daysAgo !== null && daysAgo >= 0;
      const stageIdx  = STAGES.findIndex(s => s.id === l.stage);
      const stageLabel = l.stage === "contacted" ? "F1" : l.stage === "followup1" ? "F2" : l.stage === "followup2" ? "F3" : l.stage === "replied" ? "Reply" : "?";
      const daysLabel  = l.followUpDate ? (isOverdue ? (daysAgo === 0 ? "Today" : `${daysAgo}d overdue`) : (Math.abs(daysAgo) === 1 ? "Tomorrow" : `in ${Math.abs(daysAgo)}d`)) : "No date set";
      const urgency    = isOverdue ? 0 : daysAgo !== null && Math.abs(daysAgo) <= 2 ? 1 : daysAgo === null ? 3 : 2;
      const urgencyColor = isOverdue ? COLORS.red : (daysAgo !== null && Math.abs(daysAgo) <= 2) ? COLORS.amber : COLORS.textSecondary;
      return { ...l, stageLabel, daysLabel, isOverdue, urgency, urgencyColor, stageIdx };
    })
    .sort((a, b) => a.urgency - b.urgency || (a.followUpDate || "z").localeCompare(b.followUpDate || "z"))
    .slice(0, 5);

  // Conversion funnel
  const total      = active.length;
  const fContacted = active.filter(l => l.stage !== "target").length;
  const fReplied   = active.filter(l => ["replied","booked"].includes(l.stage)).length;
  const fBooked    = active.filter(l => l.stage === "booked").length;
  const funnel = [
    { label: "Total Leads",  count: total,      color: COLORS.textSecondary, pct: 100 },
    { label: "Contacted",    count: fContacted, color: COLORS.purple,        pct: total > 0 ? Math.round(fContacted / total * 100) : 0 },
    { label: "Replied",      count: fReplied,   color: COLORS.violetLight,   pct: total > 0 ? Math.round(fReplied / total * 100) : 0 },
    { label: "Booked",       count: fBooked,    color: COLORS.green,         pct: total > 0 ? Math.round(fBooked / total * 100) : 0 },
  ];
  // Drop-off rates between stages
  const dropoffs = [
    fContacted > 0 ? Math.round((1 - fReplied / fContacted) * 100) : null,
    fReplied   > 0 ? Math.round((1 - fBooked  / fReplied)   * 100) : null,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label="Total Leads"   value={total}           sub="in pipeline"                                         accent={COLORS.textSecondary} />
        <StatCard label="Outreach Sent" value={contacted}       sub={`${active.filter(l => l.stage === "target").length} still in target`} accent={COLORS.purple} />
        <StatCard label="Reply Rate"    value={`${replyRate}%`} sub={`${replied} replies`}                                accent={COLORS.violetLight} />
        <StatCard label="Booked"        value={booked}          sub="confirmed gigs"                                      accent={COLORS.green} />
        {totalRevenue > 0 && <StatCard label="Total Fees" value={`€${totalRevenue.toLocaleString()}`} sub="booked gigs" accent={COLORS.green} />}
        {unpaidCount > 0 && <StatCard label="Deposit Due" value={unpaidCount} sub="awaiting deposit" accent={COLORS.amber} />}
      </div>

      {/* ── Revenue Panel ── */}
      {showRevenue && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Revenue Tracker</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Based on gig fees</div>
            </div>
            <button onClick={() => onNavigate("calendar")} style={{ fontSize: 11, color: COLORS.purple, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View calendar →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              { label: "This Month", value: gigRevMonth > 0 ? `€${gigRevMonth.toLocaleString()}` : "—", sub: `${thisMonth.length} gig${thisMonth.length !== 1 ? "s" : ""}`, color: COLORS.green },
              { label: "All Time",   value: gigRevTotal > 0 ? `€${gigRevTotal.toLocaleString()}` : "—",  sub: `${gigsWithFee.filter(g => new Date(g.date) <= today).length} paid gig${gigsWithFee.filter(g => new Date(g.date) <= today).length !== 1 ? "s" : ""}`, color: COLORS.text },
              { label: "Upcoming",   value: gigRevUpcoming > 0 ? `€${gigRevUpcoming.toLocaleString()}` : "—", sub: `${upcomingGigs.length} booked ahead`, color: COLORS.purpleLight },
              { label: "Avg per Gig",value: avgFee > 0 ? `€${avgFee.toLocaleString()}` : "—", sub: "across all gigs", color: COLORS.textSecondary },
            ].map((card, i) => (
              <div key={card.label} style={{ padding: "18px 20px", borderRight: i < 3 ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ProGate isPro={isPro} reason="funnel" onUpgradeClick={onUpgradeClick} label="Next Actions — Pro feature">
          {/* ── Next Actions ── */}
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Next Actions</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>What to do today</div>
              </div>
              <button onClick={() => onNavigate("followups")} style={{ fontSize: 11, color: COLORS.purple, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all →</button>
            </div>
            {nextActions.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>All caught up — add more leads to grow your pipeline</div>
              </div>
            ) : (
              <div>
                {nextActions.map((lead, i) => (
                  <div key={lead.id} onClick={() => onNavigate("pipeline")} style={{ padding: "13px 20px", borderBottom: i < nextActions.length - 1 ? `1px solid ${COLORS.border}` : "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = COLORS.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: lead.urgencyColor + "22", border: `1px solid ${lead.urgencyColor + "55"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: lead.urgencyColor, letterSpacing: "0.04em" }}>{lead.stageLabel}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                      {lead.name}
                      {lead.stage === "booked" && lead.fee && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: lead.deposit_paid ? COLORS.green : COLORS.amber, background: lead.deposit_paid ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>
                          €{lead.fee}{lead.deposit_paid ? " ✓" : ""}
                        </span>
                      )}
                    </div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                        {lead.stage === "replied" ? "They replied — close this booking" :
                         lead.stage === "contacted" ? "Send follow-up 1" :
                         lead.stage === "followup1" ? "Send follow-up 2" :
                         lead.stage === "followup2" ? "Final follow-up — last attempt" : "Take action"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: lead.urgencyColor }}>{lead.daysLabel}</div>
                      <Badge color={TIER_COLORS[lead.tier]}>{lead.tier}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ProGate>

        <ProGate isPro={isPro} reason="funnel" onUpgradeClick={onUpgradeClick} label="Conversion Funnel — Pro feature">
          {/* ── Conversion Funnel ── */}
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Conversion Funnel</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Where leads drop off</div>
            </div>
            {funnel.map((stage, i) => (
              <div key={stage.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: stage.color }} />
                    <span style={{ fontSize: 12, color: COLORS.text }}>{stage.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "'DM Mono', monospace" }}>{stage.count}</span>
                    <span style={{ fontSize: 11, color: stage.color, fontFamily: "'DM Mono', monospace", minWidth: 36, textAlign: "right" }}>{stage.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: COLORS.bg, borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${stage.pct}%`, background: stage.color, borderRadius: 4, transition: "width 0.7s ease", opacity: 0.85 }} />
                </div>
                {i < funnel.length - 1 && dropoffs[i] !== null && dropoffs[i] > 0 && dropoffs[i] < 100 && total >= 3 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 8px 14px" }}>
                    <div style={{ width: 1, height: 12, background: COLORS.border }} />
                    <span style={{ fontSize: 10, color: dropoffs[i] > 50 ? COLORS.red : COLORS.textMuted }}>↓ {dropoffs[i]}% drop-off</span>
                  </div>
                )}
                {i < funnel.length - 1 && (dropoffs[i] === null || dropoffs[i] === 0) && <div style={{ height: 12, marginBottom: 8 }} />}
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "12px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Overall Conversion</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>Target → Booked</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.green, fontFamily: "'DM Mono', monospace" }}>
                {total >= 3 ? `${Math.round(fBooked / total * 100)}%` : "—"}
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: COLORS.purpleLight }}>↗</span>
              <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Industry avg reply rate: <strong style={{ color: COLORS.purpleLight }}>18%</strong></span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: "auto" }}>DJ outreach benchmark</span>
            </div>
          </div>
        </ProGate>
      </div>
    </div>
  );
}

function FollowUpsView({ leads, onNavigate, onOpenLead }) {
  const today  = new Date();
  const active = leads.filter(l => !l.archived);

  // Leads with an explicit follow-up date that's past
  const due = active
    .filter(l => l.followUpDate && new Date(l.followUpDate) <= today)
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  // Leads in active stages with no follow-up date set, stale for 3+ days
  const stale = active
    .filter(l => {
      if (!["contacted","followup1","followup2","replied"].includes(l.stage)) return false;
      if (l.followUpDate) return false;
      if (!l.updatedAt) return true; // no timestamp — show anyway
      const days = (today - new Date(l.updatedAt)) / (1000 * 60 * 60 * 24);
      return days >= 3;
    })
    .sort((a, b) => {
      // Oldest stale first
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    });

  // Leads with a future follow-up date
  const upcoming = active
    .filter(l => l.followUpDate && new Date(l.followUpDate) > today)
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  const openLead = (lead) => {
    if (onOpenLead) onOpenLead(lead);
    else onNavigate("pipeline");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Due Now ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, boxShadow: `0 0 8px ${COLORS.red}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.red, letterSpacing: "0.08em", textTransform: "uppercase" }}>Due Now</span>
          <Badge color={COLORS.red}>{due.length}</Badge>
        </div>
        {due.length === 0 ? (
          <div style={{ padding: "20px", background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderLeft: `3px solid ${COLORS.green}`, borderRadius: 10, color: COLORS.green, fontSize: 12, textAlign: "center", fontWeight: 600 }}>All caught up ✓</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {due.map(lead => {
              const daysOverdue = Math.floor((today - new Date(lead.followUpDate)) / (1000 * 60 * 60 * 24));
              return (
                <div key={lead.id} onClick={() => openLead(lead)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.red}44`, borderLeft: `3px solid ${COLORS.red}`, borderRadius: 10, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{lead.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Badge color={TIER_COLORS[lead.tier]}>{lead.tier}</Badge>
                      <Badge color={COLORS.textSecondary}>{STAGES.find(s => s.id === lead.stage)?.label || lead.stage}</Badge>
                      <span style={{ fontSize: 11, color: COLORS.red, fontWeight: 600 }}>
                        {daysOverdue === 0 ? "Due today" : `${daysOverdue}d overdue`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openLead(lead); }}
                    style={{ padding: "7px 14px", background: COLORS.purple, border: "none", borderRadius: 7, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                  >
                    Open Lead →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Going Cold ── */}
      {stale.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.amber, boxShadow: `0 0 8px ${COLORS.amber}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.amber, letterSpacing: "0.08em", textTransform: "uppercase" }}>Going Cold</span>
            <Badge color={COLORS.amber}>{stale.length}</Badge>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>No follow-up scheduled</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stale.map(lead => {
              const stageLabel = { contacted: "Contacted", followup1: "Follow-up 1", followup2: "Follow-up 2", replied: "Replied" }[lead.stage] || lead.stage;
              const isReplied  = lead.stage === "replied";
              const daysStale  = lead.updatedAt ? Math.floor((today - new Date(lead.updatedAt)) / (1000 * 60 * 60 * 24)) : null;
              const accentColor = isReplied ? COLORS.amber : COLORS.red;
              return (
                <div key={lead.id} onClick={() => openLead(lead)} style={{ background: COLORS.surface, border: `1px solid ${accentColor}33`, borderLeft: `3px solid ${accentColor}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{lead.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge color={TIER_COLORS[lead.tier]}>{lead.tier}</Badge>
                      <Badge color={accentColor}>{stageLabel}</Badge>
                      {daysStale !== null && (
                        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{daysStale}d no activity</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 5 }}>
                      {isReplied ? "⚠ They replied — schedule your next move" : "Set a date before this goes cold"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openLead(lead); }}
                    style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${accentColor}`, borderRadius: 8, color: accentColor, fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                  >
                    Set Date →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Upcoming ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.purple, boxShadow: `0 0 8px ${COLORS.purple}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.purpleLight, letterSpacing: "0.08em", textTransform: "uppercase" }}>Upcoming</span>
          <Badge color={COLORS.purple}>{upcoming.length}</Badge>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ padding: "20px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textMuted, fontSize: 12, textAlign: "center" }}>No upcoming follow-ups scheduled</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(lead => {
              const daysLeft = Math.ceil((new Date(lead.followUpDate) - today) / (1000 * 60 * 60 * 24));
              const nudge = daysLeft <= 2
                ? { text: "Get your message ready", color: COLORS.purpleLight }
                : daysLeft <= 5
                ? { text: "Coming up soon", color: COLORS.textSecondary }
                : { text: "On track", color: COLORS.textMuted };
              return (
                <div key={lead.id} onClick={() => openLead(lead)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderLeft: `3px solid ${nudge.color}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{lead.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Badge color={COLORS.textSecondary}>{STAGES.find(s => s.id === lead.stage)?.label || lead.stage}</Badge>
                      <span style={{ fontSize: 11, color: nudge.color }}>{nudge.text}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: daysLeft <= 2 ? COLORS.purpleLight : COLORS.textSecondary, fontFamily: "'DM Mono', monospace" }}>
                      {daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{formatShortDate(lead.followUpDate)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function OutreachView({ isPro, onUpgradeClick, supabase, userId, isMobile }) {
  const [selected, setSelected] = useState("berlin");
  const [artistName, setArtistName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase.from("user_assets").select("artist_name").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (data?.artist_name) setArtistName(data.artist_name); });
  }, [userId]);

  const TEMPLATES = getTemplates(artistName);
  const template = TEMPLATES.find(t => t.id === selected);

  const copy = () => { navigator.clipboard.writeText(template.text); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const freeTemplateIds = ["berlin", "circuit"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, padding: "0 4px" }}>Message Templates</div>
        {TEMPLATES.map(t => {
          const locked = !isPro && !freeTemplateIds.includes(t.id);
          return (
            <button key={t.id} onClick={() => locked ? onUpgradeClick("templates") : setSelected(t.id)} style={{ padding: "14px 16px", borderRadius: 10, textAlign: "left", cursor: "pointer", background: selected === t.id ? COLORS.purpleBg : COLORS.surface, border: `1px solid ${selected === t.id ? COLORS.purple : COLORS.border}`, transition: "all 0.15s", position: "relative", opacity: locked ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 16, color: locked ? COLORS.textMuted : COLORS.purple }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{t.label}</span>
                {locked && <span style={{ marginLeft: "auto", fontSize: 9, color: COLORS.purpleLight, background: COLORS.purpleBg, border: `1px solid ${COLORS.purple}`, borderRadius: 4, padding: "1px 6px", fontWeight: 700, letterSpacing: "0.06em" }}>PRO</span>}
              </div>
              <div style={{ fontSize: 10, color: COLORS.textSecondary, letterSpacing: "0.04em" }}>{t.tone}</div>
            </button>
          );
        })}
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{template.label} Template</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{template.tone}</div>
          </div>
          <button onClick={copy} style={{ padding: "8px 16px", background: copied ? COLORS.green + "22" : COLORS.purple, border: copied ? `1px solid ${COLORS.green}` : "none", borderRadius: 8, color: copied ? COLORS.green : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
            {copied ? "✓ Copied!" : "Copy Template"}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <pre style={{ fontFamily: "inherit", fontSize: 13, color: COLORS.text, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{template.text}</pre>
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.purpleBg }}>
          <div style={{ fontSize: 11, color: COLORS.purple }}>💡 Replace [bracketed text] with your actual details before sending</div>
        </div>
      </div>
    </div>
  );
}

function AssetLink({ icon, label, sublabel, href, accent, actionLabel = "Open" }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = accent} onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: accent + "22", border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{label}</div>
          {sublabel && <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{sublabel}</div>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent, padding: "5px 12px", background: accent + "18", border: `1px solid ${accent}44`, borderRadius: 6, flexShrink: 0 }}>{actionLabel} →</div>
      </div>
    </a>
  );
}

function CopyBlock({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "'DM Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
      <button onClick={copy} style={{ padding: "5px 12px", background: copied ? COLORS.green + "22" : "transparent", border: `1px solid ${copied ? COLORS.green : COLORS.border}`, borderRadius: 6, color: copied ? COLORS.green : COLORS.textSecondary, fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}

function AssetsView({ supabase, userId, isMobile }) {
  const [assets, setAssets] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("epk");
  const [kitUsername, setKitUsername] = useState(null);
  const [kitCopied, setKitCopied] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("username").eq("id", userId).single()
      .then(({ data }) => { if (data?.username) setKitUsername(data.username); });
  }, [userId]);

  const SECTIONS = [
    { id: "epk",   label: "EPK",         icon: "📄" },
    { id: "mixes", label: "Mixes",       icon: "🎧" },
    { id: "bio",   label: "Bio & Press", icon: "✦"  },
    { id: "links", label: "Quick Links", icon: "🔗" },
  ];

  useEffect(() => {
    if (!userId) return;
    supabase.from("user_assets").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setAssets(data || {}));
  }, [userId]);

  const set = (field) => (e) => setAssets(a => ({ ...a, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const payload = { ...assets, user_id: userId };
    const { error } = assets?.id
      ? await supabase.from("user_assets").update(payload).eq("id", assets.id)
      : await supabase.from("user_assets").insert([payload]);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  const incomplete = !saved && (!assets?.artist_name || !assets?.epk_url || !assets?.soundcloud || !assets?.booking_email);

  const inputStyle = {
    width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`,
    borderRadius: 6, padding: "8px 10px", color: COLORS.text, fontSize: 12,
    fontFamily: "'DM Sans', sans-serif", outline: "none", marginTop: 4,
    colorScheme: "dark",
  };
  const labelStyle = { fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 12, display: "block" };

  if (assets === null) return <div style={{ padding: 40, color: COLORS.textMuted, fontSize: 13 }}>Loading assets...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {incomplete && (
        <div style={{ background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 20 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>Complete your asset kit</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>Venues will ask for your EPK, mix link, and booking email. Fill these in once and they're ready to paste into any outreach.</div>
          </div>
          <button onClick={() => setActiveSection("epk")} style={{ padding: "7px 14px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Fill in now →</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, padding: "0 4px" }}>Your Assets</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "12px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer", background: activeSection === s.id ? COLORS.purpleBg : COLORS.surface, border: `1px solid ${activeSection === s.id ? COLORS.purple : COLORS.border}`, color: activeSection === s.id ? COLORS.purpleLight : COLORS.textSecondary, fontSize: 13, fontWeight: activeSection === s.id ? 700 : 500, display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
          <button onClick={save} disabled={saving} style={{ marginTop: 12, padding: "10px", background: saved ? COLORS.green : COLORS.purple, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
          </button>
          {kitUsername && (
            <button onClick={() => {
              navigator.clipboard.writeText(`https://app.noxreach.com/kit/${kitUsername}`);
              setKitCopied(true); setTimeout(() => setKitCopied(false), 2000);
            }} style={{ marginTop: 8, padding: "10px", background: kitCopied ? COLORS.green + "22" : "transparent", border: `1px solid ${kitCopied ? COLORS.green : COLORS.border}`, borderRadius: 10, color: kitCopied ? COLORS.green : COLORS.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" }}>
              {kitCopied ? "✓ Link copied!" : "🔗 Share Kit"}
            </button>
          )}
        </div>

        <div>
          {activeSection === "epk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>EPK & Identity</div>
              <label style={labelStyle}>Artist Name</label>
              <input style={inputStyle} value={assets.artist_name || ""} onChange={set("artist_name")} placeholder="e.g. GEEZ" />
              <label style={labelStyle}>Location</label>
              <input style={inputStyle} value={assets.location || ""} onChange={set("location")} placeholder="e.g. Cologne, DE" />
              <label style={labelStyle}>Tagline</label>
              <input style={inputStyle} value={assets.tagline || ""} onChange={set("tagline")} placeholder="e.g. Peak-driven Tech House. Tribal energy." />
              <label style={labelStyle}>EPK PDF URL</label>
              <input style={inputStyle} value={assets.epk_url || ""} onChange={set("epk_url")} placeholder="https://yoursite.com/epk.pdf" />
              <label style={labelStyle}>Press Photos URL (ZIP or folder)</label>
              <input style={inputStyle} value={assets.press_photos_url || ""} onChange={set("press_photos_url")} placeholder="https://yoursite.com/press_photos.zip" />
              <label style={labelStyle}>Booking Email</label>
              <input style={inputStyle} value={assets.booking_email || ""} onChange={set("booking_email")} placeholder="booking@yoursite.com" />
              {assets.epk_url && <div style={{ marginTop: 12 }}><CopyBlock label="EPK PDF URL" value={assets.epk_url} /></div>}
            </div>
          )}
          {activeSection === "mixes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Mixes & Audio</div>
              <label style={labelStyle}>SoundCloud URL</label>
              <input style={inputStyle} value={assets.soundcloud || ""} onChange={set("soundcloud")} placeholder="https://soundcloud.com/yourname" />
              <label style={labelStyle}>Spotify URL</label>
              <input style={inputStyle} value={assets.spotify || ""} onChange={set("spotify")} placeholder="https://open.spotify.com/artist/..." />
              <label style={labelStyle}>Mix Link 1</label>
              <input style={inputStyle} value={assets.mix_link_1 || ""} onChange={set("mix_link_1")} placeholder="https://soundcloud.com/yourname/mix-1" />
              <label style={labelStyle}>Mix Link 2</label>
              <input style={inputStyle} value={assets.mix_link_2 || ""} onChange={set("mix_link_2")} placeholder="https://soundcloud.com/yourname/mix-2" />
              {assets.soundcloud && <div style={{ marginTop: 12 }}><CopyBlock label="SoundCloud" value={assets.soundcloud} /></div>}
              {assets.mix_link_1 && <CopyBlock label="Mix Link 1" value={assets.mix_link_1} />}
              <div style={{ background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 12, padding: "14px 18px", marginTop: 8 }}>
                <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 700, marginBottom: 6 }}>💡 Outreach tip</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>Don't lead with the mix link. Send the initial message first — build curiosity. Drop the SoundCloud link only when they ask or in follow-up 1.</div>
              </div>
            </div>
          )}
          {activeSection === "bio" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Bio & Press</div>
              <label style={labelStyle}>Official Bio</label>
              <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical", colorScheme: "dark" }} value={assets.bio || ""} onChange={set("bio")} placeholder="Your artist bio — use this in outreach, EPKs, and social bios." />
              {assets.bio && (
                <button onClick={() => navigator.clipboard.writeText(assets.bio)} style={{ alignSelf: "flex-start", marginTop: 4, padding: "5px 12px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textSecondary, fontSize: 11, cursor: "pointer" }}>Copy Bio</button>
              )}
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={assets.website || ""} onChange={set("website")} placeholder="https://yoursite.com" />
              <label style={labelStyle}>Genres (comma separated)</label>
              <input style={inputStyle} value={assets.genres || ""} onChange={set("genres")} placeholder="e.g. Tech House, Tribal, Circuit" />
            </div>
          )}
          {activeSection === "links" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Quick Links</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>Everything ready to paste into an outreach message.</div>
              {assets.website      && <CopyBlock label="Website"       value={assets.website} />}
              {assets.epk_url      && <CopyBlock label="EPK (PDF)"     value={assets.epk_url} />}
              {assets.soundcloud   && <CopyBlock label="SoundCloud"    value={assets.soundcloud} />}
              {assets.booking_email && <CopyBlock label="Booking Email" value={assets.booking_email} />}
              {assets.press_photos_url && <CopyBlock label="Press Photos" value={assets.press_photos_url} />}
              {assets.mix_link_1   && <CopyBlock label="Mix Link 1"    value={assets.mix_link_1} />}
              {assets.mix_link_2   && <CopyBlock label="Mix Link 2"    value={assets.mix_link_2} />}
              {!assets.website && !assets.epk_url && !assets.soundcloud && (
                <div style={{ padding: "24px", textAlign: "center", color: COLORS.textMuted, fontSize: 12, border: `1px dashed ${COLORS.border}`, borderRadius: 10 }}>
                  No links saved yet. Fill in your EPK and Mixes tabs first.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function UpgradeModal({ onClose, onUpgrade, reason }) {
  const reasons = {
    leads:        { title: "You're building momentum",      desc: "Your pipeline is growing. Upgrade to keep adding venues — no cap, no friction.", icon: "⬛" },
    gigs:         { title: "Your calendar is filling up",   desc: "More gigs means more to track. Upgrade to add every confirmed date.", icon: "📅" },
    templates:    { title: "More scenes, more bookings",    desc: "Unlock all 4 outreach templates — Disco, Leverage and more. The right message for every room.", icon: "✦" },
    autoschedule: { title: "Stop losing gigs to timing",    desc: "Pro schedules your follow-ups automatically — 5 days, 14 days, done. You focus on the music.", icon: "⏰" },
    settings:     { title: "Own your outreach cadence",     desc: "Set your own follow-up timing. Every scene moves differently — your workflow should too.", icon: "⚙" },
    funnel:       { title: "See exactly where to focus",    desc: "Know which stage is costing you bookings. Fix the leak before opportunities go cold.", icon: "▣" },
  };
  const r = reasons[reason] || reasons.leads;

  const PRO_FEATURES = [
    "Track every venue — no lead cap",
    "Follow-ups schedule themselves at 5 and 14 days",
    "All 4 outreach templates — right message, right room",
    "Next Actions queue — know who to message today",
    "Conversion Funnel — see where bookings drop off",
    "Set your own follow-up cadence",
    "Cloud sync — your pipeline everywhere",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 20, width: 440, maxWidth: "95vw", overflow: "hidden", boxShadow: `0 0 80px rgba(14,116,144,0.15), 0 32px 80px rgba(0,0,0,0.7)`, animation: "slideUp 0.2s ease" }}>
        {/* Top accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleLight})` }} />

        <div style={{ padding: "28px 28px 0" }}>
          {/* Trigger reason */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "14px 16px", background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: COLORS.purple + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{r.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{r.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>NoxReach Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Mono', monospace" }}>€19</span>
              <span style={{ fontSize: 14, color: COLORS.textSecondary }}>/month</span>
            </div>
            <div style={{ fontSize: 11, color: COLORS.green }}>€152/year (€15/mo) — save 20%</div>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {PRO_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: COLORS.green + "22", border: `1px solid ${COLORS.green}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: COLORS.green, fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => onUpgrade("monthly")} style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(14,116,144,0.40)", letterSpacing: "0.01em" }}>
            Upgrade to Pro →
          </button>
          <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 12, color: COLORS.textMuted, fontSize: 12, cursor: "pointer" }}>
            Stay on Free
          </button>
          <div style={{ textAlign: "center", fontSize: 10, color: COLORS.textMuted }}>Cancel anytime · No contracts</div>
        </div>
      </div>
    </div>
  );
}

// Inline gate — blurs content and shows a lock overlay
function ProGate({ children, isPro, reason, onUpgradeClick, label = "Pro feature" }) {
  if (isPro) return children;
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,10,10,0.6)", backdropFilter: "blur(2px)", cursor: "pointer" }}
        onClick={() => onUpgradeClick(reason)}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.purpleBg, border: `1px solid ${COLORS.purple}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, fontSize: 16 }}>🔒</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.purpleLight, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 600 }}>Upgrade to Pro →</div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

// ── ContactsView ──────────────────────────────────────────────────────────────
// Flat searchable address-book of all leads, independent of pipeline stage.
function ContactsView({ leads, onOpenLead, TAG_COLORS, isMobile, customTags = [], supabase, userId, onUpdateLead }) {
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("name");   // name | stage | updated | tier
  const [showArchived, setShowArchived] = useState(false);

  const STAGE_META = {
    target:    { label: "Target",    color: COLORS.text3 },
    contacted: { label: "Contacted", color: COLORS.purple },
    followup1: { label: "Follow-up", color: COLORS.purpleLight },
    followup2: { label: "Follow-up", color: COLORS.purpleLight },
    replied:   { label: "Replied",   color: COLORS.violetLight },
    booked:    { label: "Booked",    color: COLORS.green },
  };

  const TIER_ORDER = { A1: 0, A2: 1, A3: 2 };
  const STAGE_ORDER = { target: 0, contacted: 1, followup1: 2, followup2: 3, replied: 4, booked: 5 };

  const filtered = leads
    .filter(l => l.archived === showArchived)
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [l.name, l.contact, l.instagram, l.tag, l.notes].some(f => f && f.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === "name")    return a.name.localeCompare(b.name);
      if (sortBy === "tier")    return (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9);
      if (sortBy === "stage")   return (STAGE_ORDER[a.stage] ?? 9) - (STAGE_ORDER[b.stage] ?? 9);
      if (sortBy === "updated") return (b.updatedAt || "").localeCompare(a.updatedAt || "");
      return 0;
    });

  const total = leads.filter(l => !l.archived).length;

  // ── Inline editing ──────────────────────────────────────────────────────────
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);

  const openEdit = (lead) => {
    setEditId(lead.id);
    setEditForm({ name: lead.name || "", contact: lead.contact || "", instagram: lead.instagram || "", tag: lead.tag || "", tier: lead.tier || "A2", notes: lead.notes || "" });
  };
  const closeEdit = () => { setEditId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const updates = { name: editForm.name.trim(), contact: editForm.contact.trim(), instagram: editForm.instagram.trim(), tag: editForm.tag, tier: editForm.tier, notes: editForm.notes.trim() };
    const { error } = await supabase.from("leads").update(updates).eq("id", editId).eq("user_id", userId);
    if (!error) {
      const original = leads.find(l => l.id === editId);
      if (original) onUpdateLead?.({ ...original, ...updates });
      closeEdit();
    }
    setSaving(false);
  };

  const rowInput = (key, placeholder, type = "text") => (
    <input
      type={type} value={editForm[key] || ""} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
      placeholder={placeholder}
      style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
      onFocus={e => e.target.style.borderColor = COLORS.purple}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    />
  );

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, fontSize: 14, pointerEvents: "none" }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            style={{ width: "100%", padding: "9px 12px 9px 34px", background: COLORS.surface, border: `1px solid ${search ? COLORS.purple : COLORS.border}`, borderRadius: 9, color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = COLORS.purple}
            onBlur={e => { if (!search) e.target.style.borderColor = COLORS.border; }}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 16 }}>×</button>}
        </div>

        {/* Sort */}
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "9px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.text2, fontSize: 12, outline: "none", cursor: "pointer" }}
        >
          <option value="name">Sort: Name</option>
          <option value="stage">Sort: Stage</option>
          <option value="tier">Sort: Tier</option>
          <option value="updated">Sort: Recently updated</option>
        </select>

        {/* Archive toggle */}
        <div style={{ display: "flex", gap: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: 3 }}>
          {[{ val: false, label: `Active (${total})` }, { val: true, label: "Archived" }].map(({ val, label }) => (
            <button key={String(val)} onClick={() => setShowArchived(val)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: showArchived === val ? COLORS.purpleBg : "transparent", color: showArchived === val ? COLORS.purpleLight : COLORS.text2, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ fontSize: 22, marginBottom: 12, opacity: 0.35 }}>◎</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            {search ? "No contacts match" : showArchived ? "No archived contacts" : "No contacts yet"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.text2 }}>
            {search ? "Try a different search term." : "Add leads from the Pipeline tab to see them here."}
          </div>
        </div>
      )}

      {/* Contact list */}
      {filtered.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {/* Column headers — desktop only */}
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 90px 120px 32px", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
              {["Contact", "Tag", "Tier", "Stage", "Instagram / Email", ""].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
              ))}
            </div>
          )}

          {filtered.map((lead, i) => {
            const stage    = STAGE_META[lead.stage] || { label: lead.stage, color: COLORS.text2 };
            const tierColor = { A1: COLORS.purpleLight, A2: COLORS.purple, A3: COLORS.textSecondary }[lead.tier] || COLORS.textSecondary;
            const tagColor  = TAG_COLORS[lead.tag] || COLORS.purple;
            const isEditing = editId === lead.id;

            return (
              <div key={lead.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                {/* ── Summary row ── */}
                <div
                  style={{
                    display: isMobile ? "flex" : "grid",
                    gridTemplateColumns: isMobile ? undefined : "1fr 100px 80px 90px 120px 72px",
                    flexDirection: isMobile ? "column" : undefined,
                    gap: isMobile ? 6 : 0,
                    padding: isMobile ? "14px 16px" : "12px 16px",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    background: isEditing ? COLORS.surface2 : "transparent",
                  }}
                  onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = COLORS.surface2; }}
                  onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Name + contact person */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                    {lead.contact && <div style={{ fontSize: 11, color: COLORS.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.contact}</div>}
                  </div>

                  {isMobile ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tagColor, background: tagColor + "22", border: `1px solid ${tagColor}44`, borderRadius: 20, padding: "2px 7px" }}>{lead.tag}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tierColor, background: tierColor + "22", borderRadius: 20, padding: "2px 7px" }}>{lead.tier}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, background: stage.color + "22", border: `1px solid ${stage.color}44`, borderRadius: 20, padding: "2px 7px" }}>{stage.label}</span>
                      {lead.instagram && <span style={{ fontSize: 11, color: COLORS.text2 }}>{lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}</span>}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tagColor, background: tagColor + "22", border: `1px solid ${tagColor}44`, borderRadius: 20, padding: "3px 8px" }}>{lead.tag}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: tierColor }}>{lead.tier}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, background: stage.color + "18", border: `1px solid ${stage.color}33`, borderRadius: 20, padding: "3px 8px" }}>{stage.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                        {lead.instagram
                          ? <span style={{ fontSize: 11, color: COLORS.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}</span>
                          : lead.contact && lead.contact.includes("@")
                            ? <span style={{ fontSize: 11, color: COLORS.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.contact}</span>
                            : <span style={{ fontSize: 11, color: COLORS.textMuted }}>—</span>}
                      </div>
                      {/* Edit / Pipeline buttons */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <button onClick={e => { e.stopPropagation(); isEditing ? closeEdit() : openEdit(lead); }}
                          style={{ padding: "3px 8px", background: isEditing ? "transparent" : COLORS.purpleBg, border: `1px solid ${isEditing ? COLORS.border : COLORS.purpleDim}`, borderRadius: 6, color: isEditing ? COLORS.textMuted : COLORS.purpleLight, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                          {isEditing ? "Cancel" : "Edit"}
                        </button>
                        {!isEditing && (
                          <button onClick={e => { e.stopPropagation(); onOpenLead(lead); }}
                            style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, fontSize: 10, cursor: "pointer" }}>
                            ›
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Inline edit panel ── */}
                {isEditing && (
                  <div style={{ padding: "14px 16px 18px", background: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Venue / Name</div>
                        {rowInput("name", "Venue or event name")}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Contact / Email</div>
                        {rowInput("contact", "booking@venue.com")}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Instagram</div>
                        {rowInput("instagram", "@handle")}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Tag</div>
                          <select value={editForm.tag} onChange={e => setEditForm(f => ({ ...f, tag: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, outline: "none", cursor: "pointer" }}>
                            {customTags.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Tier</div>
                          <select value={editForm.tier} onChange={e => setEditForm(f => ({ ...f, tier: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, outline: "none", cursor: "pointer" }}>
                            {["A1","A2","A3"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ gridColumn: isMobile ? undefined : "1 / -1" }}>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Notes</div>
                        <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any notes…"
                          style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical" }}
                          onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={saveEdit} disabled={saving}
                        style={{ padding: "8px 20px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => onOpenLead(lead)}
                        style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, fontSize: 12, cursor: "pointer" }}>
                        Open in Pipeline →
                      </button>
                      <button onClick={closeEdit}
                        style={{ padding: "8px 14px", background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Count footer */}
      {filtered.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, textAlign: "right" }}>
          {filtered.length} {filtered.length === 1 ? "contact" : "contacts"}{search ? ` matching "${search}"` : ""}
        </div>
      )}
    </div>
  );
}

function InboundView({ leads, user, supabase }) {
  const inbound = leads.filter(l => !l.archived && l.stage === "replied" && l.contact && l.contact.includes("@"));
  const [username, setUsername] = useState(null);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("username").eq("id", user.id).single()
      .then(({ data }) => { if (data?.username) setUsername(data.username); });
  }, [user?.id]);

  const bookingLink = username ? `https://app.noxreach.com/book/${username}` : "Loading...";
  const copy = () => { if (!username) return; navigator.clipboard.writeText(bookingLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Inbound Requests</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Booking requests from your public form</div>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Your booking link</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: COLORS.textSecondary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bookingLink}</div>
          <button onClick={copy} style={{ background: copied ? "rgba(74,222,128,0.15)" : COLORS.purpleBg, border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : COLORS.purple}`, borderRadius: 8, padding: "10px 16px", color: copied ? "#4ade80" : COLORS.purpleLight, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>Share this link in your Instagram bio — promoters fill it out and requests land here automatically.</div>
      </div>

      {inbound.length === 0 ? (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⬇</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>No inbound requests yet</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Share your booking link to start receiving requests from promoters.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inbound.map(lead => (
            <div key={lead.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{lead.contact}</div>
                  {lead.instagram && <div style={{ fontSize: 12, color: COLORS.purple }}>{lead.instagram}</div>}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{lead.last_contact || "—"}</div>
              </div>
              {lead.notes && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8, padding: "8px 10px", background: COLORS.bg, borderRadius: 6 }}>{lead.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



// ─── Follow-up Popup Banner ───────────────────────────────────────────────────

function FollowUpPopup({ dueCount, onNavigate }) {
  const todayKey = new Date().toISOString().split("T")[0];
  const storageKey = "nr_followup_dismissed_" + todayKey;

  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(storageKey); } catch { return true; }
  });

  if (!visible || dueCount === 0) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setVisible(false);
  };

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 900, display: "flex", alignItems: "center", gap: 14,
      background: "#1a1230", border: "1px solid rgba(107,47,212,0.5)",
      borderRadius: 12, padding: "13px 18px", maxWidth: 440, width: "calc(100% - 32px)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: 20, flexShrink: 0 }}>⏰</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>
          {dueCount} follow-up{dueCount > 1 ? "s" : ""} due today
        </div>
        <div style={{ fontSize: 12, color: "#9090a8", marginTop: 2 }}>Don't let them go cold.</div>
      </div>
      <button
        onClick={() => { onNavigate("followups"); dismiss(); }}
        style={{ padding: "7px 14px", background: "#6B2FD4", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
      >
        View →
      </button>
      <button
        onClick={dismiss}
        style={{ background: "none", border: "none", color: "#50506a", fontSize: 16, cursor: "pointer", padding: 4, flexShrink: 0, lineHeight: 1 }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}

// ─── Cookie Banner ─────────────────────────────────────────────────────────────

function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem("nr_cookie_consent"); } catch { return true; }
  });

  if (!visible) return null;

  const accept = () => {
    try { localStorage.setItem("nr_cookie_consent", "accepted"); } catch {}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem("nr_cookie_consent", "declined"); } catch {}
    setVisible(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: "calc(100% - 48px)", maxWidth: 560,
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, backdropFilter: "blur(12px)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.3)"
    }}>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6, flex: 1 }}>
        We use essential cookies to keep you logged in and save your settings.
        No tracking, no ads. <a href="https://noxreach.com/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.purpleLight, textDecoration: "none" }}>Privacy Policy</a>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{
          padding: "7px 14px", background: "transparent", border: `1px solid ${COLORS.border}`,
          borderRadius: 8, color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontWeight: 600
        }}>Decline</button>
        <button onClick={accept} style={{
          padding: "7px 14px", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`,
          border: "none", borderRadius: 8, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700
        }}>Accept</button>
      </div>
    </div>
  );
}

// ─── GDPR Right to Deletion ────────────────────────────────────────────────
function DeleteAccountButton() {
  const [step, setStep] = useState("idle"); // idle | confirm | deleting | done | error
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setStep("deleting");
    try {
      // 1. Delete all user data from leads, gigs, settings tables
      const uid = supabase.auth.getUser ? (await supabase.auth.getUser()).data?.user?.id : null;
      if (!uid) throw new Error("Not authenticated");

      // Delete in order respecting FK constraints
      for (const table of ["gigs", "leads", "profiles"]) {
        const { error: e } = await supabase.from(table).delete().eq("user_id", uid);
        if (e) console.warn("Delete from", table, e.message);
      }

      // 2. Sign out — account deletion from auth requires server-side edge function
      // For now we clear data and sign out; full auth deletion queued server-side
      await supabase.auth.signOut();
      setStep("done");
    } catch (e) {
      setError(e.message || "Something went wrong. Email hello@noxreach.io to request deletion.");
      setStep("error");
    }
  };

  if (step === "done") return (
    <div style={{ padding: "14px 18px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, fontSize: 13, color: "#4ade80" }}>
      ✓ Your data has been deleted and you have been signed out. For full account removal from our auth system, email <a href="mailto:hello@noxreach.io" style={{ color: "#4ade80" }}>hello@noxreach.io</a>.
    </div>
  );

  if (step === "error") return (
    <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
      {error}
    </div>
  );

  if (step === "confirm") return (
    <div style={{ padding: "18px 20px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 8 }}>Are you absolutely sure?</div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
        This will permanently erase all your leads, gigs, settings, and profile data. You cannot undo this.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleDelete}
          style={{ padding: "10px 20px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Yes, delete everything
        </button>
        <button onClick={() => setStep("idle")}
          style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <button onClick={() => setStep("confirm")}
      style={{ padding: "10px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      Delete my account and all data
    </button>
  );
}


// ─── Welcome New User Modal ────────────────────────────────────────────────
function WelcomeNewUserModal({ onClose }) {
  const APP_URL = "https://app.noxreach.com";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 40, maxWidth: 480, width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎛️</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Welcome to NoxReach</div>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6 }}>The booking system for DJs who follow up. Here's how to get started in 5 minutes.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {[
            { num: "01", title: "Add your first leads", text: "Go to Pipeline → Add Lead. Add 3–5 venues or promoters you want to play. Tier them A1 to A3." },
            { num: "02", title: "Send outreach", text: "Use the Outreach tab for copy-paste templates. Move leads to Contacted after you send." },
            { num: "03", title: "Fill your Booking Kit", text: "Add your EPK, SoundCloud, and booking email. When a lead replies — you respond in seconds." },
          ].map(s => (
            <div key={s.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(14,116,144,0.10)", border: `1px solid rgba(14,116,144,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.purple, flexShrink: 0, fontFamily: "monospace" }}>{s.num}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          Let's go →
        </button>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: COLORS.textMuted }}>
          Check your email — we sent you a quick-start guide too.
        </div>
      </div>
    </div>
  );
}


// ─── Pro Welcome Modal ────────────────────────────────────────────────────
function ProWelcomeModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid rgba(212,175,55,0.4)`, borderRadius: 20, padding: 40, maxWidth: 480, width: "100%", position: "relative", boxShadow: "0 0 60px rgba(212,175,55,0.15)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.purple, marginBottom: 6 }}>You're now Pro</div>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6 }}>Here's what's just unlocked for you.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {[
            { icon: "∞", title: "Unlimited leads", text: "No cap on your pipeline. Track every venue, promoter, and festival you want to reach." },
            { icon: "✉", title: "Booking Desk", text: "Full conversation context per lead. Log replies, attach your EPK, see contact history at a glance." },
            { icon: "⏰", title: "Auto follow-up scheduling", text: "Follow-ups are scheduled automatically at 5 and 14 days. You just execute." },
            { icon: "📈", title: "Conversion insights", text: "See where leads drop off in your pipeline. Funnel data, reply rates, booking rate." },
            { icon: "◇", title: "Full Booking Kit", text: "Unlimited asset storage. EPK, mixes, press photos, bio — all ready to send instantly." },
          ].map(f => (
            <div key={f.icon} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 10 }}>
              <div style={{ fontSize: 18, width: 28, textAlign: "center", flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>{f.text}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "13px", background: COLORS.purple, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          Start using Pro →
        </button>
      </div>
    </div>
  );
}

function GenreRow({ tag, color, onRemove, onSetColor }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: color + "12", border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Clickable color dot */}
          <button
            onClick={() => setShowPicker(p => !p)}
            title="Change color"
            style={{ width: 16, height: 16, borderRadius: "50%", background: color, border: `2px solid ${color}99`, flexShrink: 0, cursor: "pointer", boxShadow: `0 0 6px ${color}88`, padding: 0 }}
          />
          <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{tag}</span>
        </div>
        <button onClick={onRemove} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 4px" }}
          onMouseEnter={e => e.target.style.color = COLORS.red}
          onMouseLeave={e => e.target.style.color = COLORS.textMuted}>✕</button>
      </div>
      {showPicker && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: COLORS.surface2, border: `1px solid ${COLORS.borderHover}`, borderRadius: 10, padding: 10, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {TAG_PALETTE.map(c => (
            <button key={c} onClick={() => { onSetColor(c); setShowPicker(false); }}
              style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: c === color ? `2px solid #fff` : "2px solid transparent", cursor: "pointer", padding: 0, boxShadow: c === color ? `0 0 8px ${c}` : "none", transition: "transform 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ settings, onSave, isPro, onUpgradeClick, customTags, defaultTags, onAddTag, onRemoveTag, TAG_COLORS, onSetTagColor, supabase, user, onDisplayNameChange }) {
  const [local, setLocal] = useState({ ...settings });
  const [saved,  setSaved]  = useState(false);
  const [username, setUsername] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");



  const [displayName, setDisplayName] = useState("");
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);

  // Email connections
  const [gmailConnection, setGmailConnection] = useState(null);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [outlookConnection, setOutlookConnection] = useState(null);
  const [outlookConnecting, setOutlookConnecting] = useState(false);
  const [resendConnection, setResendConnection] = useState(null);
  const [resendConnecting, setResendConnecting] = useState(false);
  const [resendForm, setResendForm] = useState({ email: "", from_name: "", api_key: "" });
  const [resendFormOpen, setResendFormOpen] = useState(false);
  const [resendError, setResendError] = useState("");
  const [smtpConnection, setSmtpConnection] = useState(null);
  const [smtpConnecting, setSmtpConnecting] = useState(false);
  const [smtpForm, setSmtpForm] = useState({ host: "", port: "465", email: "", password: "", from_name: "" });
  const [smtpFormOpen, setSmtpFormOpen] = useState(false);
  const [smtpError, setSmtpError] = useState("");

  useEffect(() => {
    if (!user?.id || !supabase) return;
    supabase.from("profiles").select("username, display_name, referral_code, referral_count").eq("id", user.id).single()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username);
        if (data?.display_name) setDisplayName(data.display_name);
        if (data?.referral_code) setReferralCode(data.referral_code);
        if (data?.referral_count) setReferralCount(data.referral_count);
      });
    // Load email connections
    supabase.from("email_connections").select("provider, email, updated_at").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const gmail = data.find(c => c.provider === "gmail");
          if (gmail) setGmailConnection(gmail);
          const outlook = data.find(c => c.provider === "outlook");
          if (outlook) setOutlookConnection(outlook);
          const resend = data.find(c => c.provider === "resend");
          if (resend) setResendConnection(resend);
          const smtp = data.find(c => c.provider === "smtp");
          if (smtp) setSmtpConnection(smtp);
        }
      });
  }, [user?.id]);

  const saveUsername = async () => {
    setUsernameError("");
    const clean = username.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!clean) { setUsernameError("Username can only contain letters and numbers"); return; }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, username: clean, display_name: displayName || user.email?.split("@")[0] });
    if (error) { setUsernameError(error.message.includes("unique") ? "That username is taken" : error.message); return; }
    setUsername(clean);
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  };

  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    await supabase.from("profiles").upsert({ id: user.id, display_name: displayName.trim(), username });
    setDisplayNameSaved(true);
    setTimeout(() => setDisplayNameSaved(false), 2000);
    if (onDisplayNameChange) onDisplayNameChange(displayName.trim());
  };

  const connectGmail = async () => {
    setGmailConnecting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/gmail-oauth?action=url&user_id=${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { url } = await res.json();
      if (url) window.open(url, "_blank", "width=500,height=650");
    } catch (e) {
      console.error("Gmail connect error:", e);
    }
    setGmailConnecting(false);
  };

  const disconnectGmail = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    await fetch(`${supabase.supabaseUrl}/functions/v1/gmail-oauth`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setGmailConnection(null);
  };

  const connectOutlook = async () => {
    setOutlookConnecting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/outlook-oauth?action=url&user_id=${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { url } = await res.json();
      if (url) window.open(url, "_blank", "width=500,height=650");
    } catch (e) {
      console.error("Outlook connect error:", e);
    }
    setOutlookConnecting(false);
  };

  const disconnectOutlook = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    await fetch(`${supabase.supabaseUrl}/functions/v1/outlook-oauth`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setOutlookConnection(null);
  };

  const connectResend = async () => {
    setResendError("");
    if (!resendForm.email || !resendForm.email.includes("@")) { setResendError("Enter a valid email address"); return; }
    setResendConnecting(true);
    try {
      // Delete existing first, then insert fresh
      await supabase.from("email_connections").delete().eq("user_id", user.id).eq("provider", "resend");
      const { error } = await supabase.from("email_connections").insert({
        user_id:      user.id,
        provider:     "resend",
        email:        resendForm.email,
        access_token: resendForm.api_key.trim() || "resend",
        metadata:     { from_name: resendForm.from_name || null },
      });
      if (error) { console.error("Resend save error:", error); setResendError(error.message || "Failed to save."); }
      else {
        setResendConnection({ email: resendForm.email, metadata: { from_name: resendForm.from_name } });
        setResendFormOpen(false);
      }
    } catch (e) { console.error("Resend save exception:", e); setResendError("Failed to save. Try again."); }
    setResendConnecting(false);
  };

  const disconnectResend = async () => {
    await supabase.from("email_connections").delete().eq("user_id", user.id).eq("provider", "resend");
    setResendConnection(null);
    setResendFormOpen(false);
  };

  const connectSmtp = async () => {
    setSmtpError("");
    if (!smtpForm.host.trim()) { setSmtpError("Enter SMTP host"); return; }
    if (!smtpForm.email || !smtpForm.email.includes("@")) { setSmtpError("Enter a valid from email"); return; }
    if (!smtpForm.password.trim()) { setSmtpError("Enter SMTP password"); return; }
    setSmtpConnecting(true);
    try {
      await supabase.from("email_connections").delete().eq("user_id", user.id).eq("provider", "smtp");
      const { error } = await supabase.from("email_connections").insert({
        user_id:      user.id,
        provider:     "smtp",
        email:        smtpForm.email.trim(),
        access_token: smtpForm.password.trim(),
        metadata:     { host: smtpForm.host.trim(), port: smtpForm.port || "465", from_name: smtpForm.from_name.trim() || null },
      });
      if (error) { setSmtpError(error.message || "Failed to save."); }
      else {
        setSmtpConnection({ email: smtpForm.email.trim(), metadata: { host: smtpForm.host.trim(), port: smtpForm.port, from_name: smtpForm.from_name.trim() || null } });
        setSmtpFormOpen(false);
        setSmtpForm(f => ({ ...f, password: "" }));
      }
    } catch (e) { setSmtpError("Failed to save. Try again."); }
    setSmtpConnecting(false);
  };

  const disconnectSmtp = async () => {
    await supabase.from("email_connections").delete().eq("user_id", user.id).eq("provider", "smtp");
    setSmtpConnection(null);
    setSmtpFormOpen(false);
  };

  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null); // "ok" | "error" | null

  const testSmtp = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${supabase.supabaseUrl}/functions/v1/smtp-send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          to:      user.email,
          subject: "NoxReach — SMTP test",
          message: `Your SMTP connection is working.\n\nHost: ${smtpConnection?.metadata?.host}:${smtpConnection?.metadata?.port}\nFrom: ${smtpConnection?.email}`,
        }),
      });
      setSmtpTestResult(res.ok ? "ok" : "error");
    } catch {
      setSmtpTestResult("error");
    }
    setSmtpTesting(false);
    setTimeout(() => setSmtpTestResult(null), 4000);
  };

  const set = key => val => setLocal(s => ({ ...s, [key]: val }));

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isDirty = local.followup1Days !== settings.followup1Days || local.followup2Days !== settings.followup2Days;
  const bookingLink = username ? `https://app.noxreach.com/book/${username}` : "";

  const SliderRow = ({ label, desc, stateKey, min, max, unit = "days" }) => {
    const val = local[stateKey];
    const pct = ((val - min) / (max - min)) * 100;
    return (
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{label}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 3 }}>{desc}</div>
          </div>
          <div style={{ padding: "4px 12px", background: COLORS.purpleBg, border: `1px solid ${COLORS.purple}`, borderRadius: 20, fontSize: 13, fontWeight: 800, color: COLORS.purpleLight, fontFamily: "'DM Mono', monospace", flexShrink: 0, marginLeft: 12 }}>
            {val} {unit}
          </div>
        </div>
        <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: COLORS.border, borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleLight})`, borderRadius: 4 }} />
          </div>
          <input type="range" min={min} max={max} value={val} onChange={e => set(stateKey)(Number(e.target.value))}
            style={{ position: "relative", width: "100%", appearance: "none", background: "transparent", cursor: "pointer", height: 20 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>{min}d</span>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>{max}d</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <style>{`input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${COLORS.purple}; border: 2px solid ${COLORS.purpleLight}; box-shadow: 0 0 8px rgba(14,116,144,0.40); cursor: pointer; }`}</style>

      {/* Booking Link */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Your booking link</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            <span style={{ padding: "10px 12px", fontSize: 12, color: COLORS.textMuted, borderRight: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>app.noxreach.com/book/</span>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setUsernameError(""); }}
              onKeyDown={e => e.key === "Enter" && saveUsername()}
              placeholder="yourname"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 12px", fontSize: 13, color: COLORS.text, colorScheme: "dark" }}
            />
          </div>
          <button onClick={saveUsername} style={{ background: usernameSaved ? "rgba(74,222,128,0.15)" : COLORS.purpleBg, border: `1px solid ${usernameSaved ? "rgba(74,222,128,0.3)" : COLORS.purple}`, borderRadius: 8, padding: "10px 16px", color: usernameSaved ? "#4ade80" : COLORS.purpleLight, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {usernameSaved ? "Saved ✓" : "Save"}
          </button>
        </div>
        {usernameError && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 6 }}>{usernameError}</div>}
        {bookingLink && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, flex: 1 }}>Share in your Instagram bio — promoters fill it out and land in your pipeline automatically.</div>
            <button
              onClick={() => { navigator.clipboard.writeText(bookingLink); setBookingLinkCopied(true); setTimeout(() => setBookingLinkCopied(false), 2000); }}
              style={{ flexShrink: 0, padding: "6px 12px", background: bookingLinkCopied ? "rgba(74,222,128,0.12)" : COLORS.purpleBg, border: `1px solid ${bookingLinkCopied ? "rgba(74,222,128,0.3)" : COLORS.purpleDim}`, borderRadius: 7, color: bookingLinkCopied ? "#4ade80" : COLORS.purpleLight, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {bookingLinkCopied ? "✓ Copied" : "🔗 Copy link"}
            </button>
          </div>
        )}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Artist / display name</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveDisplayName()}
              placeholder="e.g. DJ GEEZ"
              style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: COLORS.text, outline: "none", colorScheme: "dark" }}
            />
            <button onClick={saveDisplayName} style={{ background: displayNameSaved ? "rgba(74,222,128,0.15)" : COLORS.purpleBg, border: `1px solid ${displayNameSaved ? "rgba(74,222,128,0.3)" : COLORS.purple}`, borderRadius: 8, padding: "10px 16px", color: displayNameSaved ? "#4ade80" : COLORS.purpleLight, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              {displayNameSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>This is what promoters see on your booking form — "Book [name]"</div>
        </div>
      </div>

      {/* Email Integration */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Email Integration</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>Connect your inbox to send emails directly from NoxReach and auto-detect replies.</div>

        {/* Gmail */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M6 18V8.4L2 5.6V18c0 1.1.9 2 2 2h2z"/><path fill="#34A853" d="M18 18V8.4l4-2.8V18c0 1.1-.9 2-2 2h-2z"/><path fill="#4285F4" d="M18 4H6L2 6.8 12 14l10-7.2L18 4z"/><path fill="#FBBC04" d="M2 6.8V5.6C2 4.72 2.72 4 3.6 4h.4L2 6.8z"/><path fill="#EA4335" d="M22 5.6v1.2L18 4h.4c.88 0 1.6.72 1.6 1.6v0z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Gmail</div>
              {gmailConnection ? <div style={{ fontSize: 12, color: COLORS.green }}>✓ Connected — {gmailConnection.email}</div> : <div style={{ fontSize: 12, color: COLORS.textMuted }}>Not connected</div>}
            </div>
          </div>
          {gmailConnection ? (
            <button onClick={disconnectGmail} style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Disconnect</button>
          ) : (
            <button onClick={connectGmail} disabled={gmailConnecting} style={{ padding: "8px 18px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: gmailConnecting ? 0.6 : 1 }}>{gmailConnecting ? "Opening…" : "Connect Gmail"}</button>
          )}
        </div>

        {/* Outlook */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0078D4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="13" height="14" rx="1.5" fill="#fff" opacity="0.15"/>
                <path d="M2 8.5L8.5 13l5.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="5" width="13" height="14" rx="1.5" stroke="#fff" strokeWidth="1.4"/>
                <rect x="13" y="9" width="9" height="10" rx="1.5" fill="#0078D4" stroke="#fff" strokeWidth="1.2"/>
                <path d="M14 12.5h7M14 15h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Outlook / Microsoft 365</div>
              {outlookConnection ? <div style={{ fontSize: 12, color: COLORS.green }}>✓ Connected — {outlookConnection.email}</div> : <div style={{ fontSize: 12, color: COLORS.textMuted }}>Send from your Outlook or Microsoft 365 inbox</div>}
            </div>
          </div>
          {outlookConnection ? (
            <button onClick={disconnectOutlook} style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Disconnect</button>
          ) : (
            <button onClick={connectOutlook} disabled={outlookConnecting} style={{ padding: "8px 18px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: outlookConnecting ? 0.6 : 1 }}>{outlookConnecting ? "Opening…" : "Connect Outlook"}</button>
          )}
        </div>

        {/* Resend / Custom domain */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Custom Domain Email</div>
                {resendConnection ? <div style={{ fontSize: 12, color: COLORS.green }}>✓ Sending from {resendConnection.email}</div> : <div style={{ fontSize: 12, color: COLORS.textMuted }}>Requires a free <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.purpleLight }}>Resend account</a> + verified domain</div>}
              </div>
            </div>
            {resendConnection ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setResendFormOpen(o => !o); setResendError(""); setResendForm({ email: resendConnection.email, from_name: resendConnection.metadata?.from_name || "", api_key: "" }); }} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                <button onClick={disconnectResend} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Disconnect</button>
              </div>
            ) : (
              <button onClick={() => { setResendFormOpen(o => !o); setResendError(""); }} style={{ padding: "8px 18px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Connect</button>
            )}
          </div>
          {resendFormOpen && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {!resendConnection && (
                <div style={{ background: "rgba(14,116,144,0.08)", border: "1px solid rgba(14,116,144,0.2)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: COLORS.text2, lineHeight: 1.6 }}>
                  <strong style={{ color: COLORS.purpleLight }}>Setup required:</strong> Create a free account at <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.purpleLight }}>resend.com</a>, add and verify your domain, then create an API key with <em>Sending access</em> and paste it below.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>From email</div>
                  <input value={resendForm.email} onChange={e => setResendForm(f => ({ ...f, email: e.target.value }))} placeholder="info@soundofgeez.com" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>From name (optional)</div>
                  <input value={resendForm.from_name} onChange={e => setResendForm(f => ({ ...f, from_name: e.target.value }))} placeholder="GEEZ" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Resend API Key <span style={{ color: COLORS.text3 }}>(optional — leave blank to use NoxReach default)</span></div>
                  <input type="password" value={resendForm.api_key} onChange={e => setResendForm(f => ({ ...f, api_key: e.target.value }))} placeholder="re_xxxxxxxxxxxx" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Your domain must be verified in <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.purpleLight }}>Resend</a> for sending to work.</div>
              {resendError && <div style={{ fontSize: 12, color: "#ef4444" }}>{resendError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setResendFormOpen(false); setResendError(""); }} style={{ ...BTN.secondary, ...BTN.sm }}>Cancel</button>
                <button onClick={connectResend} disabled={resendConnecting || !resendForm.email} style={{ ...BTN.primary, ...BTN.sm, opacity: resendConnecting ? 0.6 : 1 }}>{resendConnecting ? "Saving…" : "Save"}</button>
              </div>
            </div>
          )}
        </div>

        {/* SMTP */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1a2e", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="m2 7 10 8 10-8"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>SMTP</div>
                {smtpConnection ? <div style={{ fontSize: 12, color: COLORS.green }}>✓ Sending from {smtpConnection.email} via {smtpConnection.metadata?.host}</div> : <div style={{ fontSize: 12, color: COLORS.textMuted }}>Send with any SMTP provider — IONOS, Fastmail, custom mail server</div>}
              </div>
            </div>
            {smtpConnection ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={testSmtp} disabled={smtpTesting} style={{ padding: "7px 14px", background: smtpTestResult === "ok" ? "rgba(34,197,94,0.12)" : smtpTestResult === "error" ? "rgba(239,68,68,0.1)" : "transparent", border: `1px solid ${smtpTestResult === "ok" ? "rgba(34,197,94,0.3)" : smtpTestResult === "error" ? "rgba(239,68,68,0.3)" : COLORS.border}`, borderRadius: 8, color: smtpTestResult === "ok" ? COLORS.green : smtpTestResult === "error" ? "#ef4444" : COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: smtpTesting ? 0.6 : 1 }}>{smtpTesting ? "Sending…" : smtpTestResult === "ok" ? "✓ Sent" : smtpTestResult === "error" ? "✗ Failed" : "Test"}</button>
                <button onClick={() => { setSmtpFormOpen(o => !o); setSmtpError(""); setSmtpForm({ host: smtpConnection.metadata?.host || "", port: smtpConnection.metadata?.port || "465", email: smtpConnection.email, password: "", from_name: smtpConnection.metadata?.from_name || "" }); }} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                <button onClick={disconnectSmtp} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Disconnect</button>
              </div>
            ) : (
              <button onClick={() => { setSmtpFormOpen(o => !o); setSmtpError(""); }} style={{ padding: "8px 18px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Connect</button>
            )}
          </div>
          {smtpFormOpen && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>SMTP Host</div>
                  <input value={smtpForm.host} onChange={e => setSmtpForm(f => ({ ...f, host: e.target.value }))} placeholder="smtp.ionos.de" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Port</div>
                  <input value={smtpForm.port} onChange={e => setSmtpForm(f => ({ ...f, port: e.target.value }))} placeholder="465" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>From email</div>
                  <input value={smtpForm.email} onChange={e => setSmtpForm(f => ({ ...f, email: e.target.value }))} placeholder="info@soundofgeez.com" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>From name (optional)</div>
                  <input value={smtpForm.from_name} onChange={e => setSmtpForm(f => ({ ...f, from_name: e.target.value }))} placeholder="GEEZ" style={{ ...INPUT.base, fontSize: 12 }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Password / App password</div>
                <input type="password" value={smtpForm.password} onChange={e => setSmtpForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" style={{ ...INPUT.base, fontSize: 12 }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Port 465 = SSL · Port 587 = STARTTLS. For IONOS use smtp.ionos.de : 465.</div>
              {smtpError && <div style={{ fontSize: 12, color: "#ef4444" }}>{smtpError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setSmtpFormOpen(false); setSmtpError(""); }} style={{ ...BTN.secondary, ...BTN.sm }}>Cancel</button>
                <button onClick={connectSmtp} disabled={smtpConnecting || !smtpForm.email || !smtpForm.host} style={{ ...BTN.primary, ...BTN.sm, opacity: smtpConnecting ? 0.6 : 1 }}>{smtpConnecting ? "Saving…" : "Save"}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Referral */}
      {referralCode && (
        <div style={{ background: COLORS.surface, border: `1px solid rgba(139,92,246,0.25)`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Refer a DJ — you both get free PRO</div>
            {referralCount > 0 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.violetLight, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "2px 10px" }}>
                {referralCount} {referralCount === 1 ? "referral" : "referrals"}
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            Share your link. They get 15 days free PRO — you get 30 days free PRO.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: COLORS.text2, fontFamily: "'DM Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              app.noxreach.com/?ref={referralCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://app.noxreach.com/?ref=${referralCode}`);
                setReferralCopied(true);
                setTimeout(() => setReferralCopied(false), 2000);
              }}
              style={{ background: referralCopied ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)", border: `1px solid ${referralCopied ? COLORS.green : "rgba(139,92,246,0.35)"}`, borderRadius: 8, padding: "10px 16px", color: referralCopied ? COLORS.green : COLORS.violetLight, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
            >
              {referralCopied ? "✓ Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Follow-up intervals */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Follow-up Intervals</div>
          <ProGate isPro={isPro} reason="settings" onUpgradeClick={onUpgradeClick} label="Custom intervals — Pro feature">
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  When you mark a lead as <strong style={{ color: COLORS.text }}>Contacted</strong> or advance through follow-up stages, reminders are automatically scheduled. Set how many days out each reminder fires.
                </div>
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <SliderRow label="Follow-up 1" desc="Days after initial contact before first nudge" stateKey="followup1Days" min={1} max={14} />
                <SliderRow label="Follow-up 2" desc="Days after Follow-up 1 before final attempt" stateKey="followup2Days" min={7} max={30} />
              </div>
            </div>
          </ProGate>
        </div>

        {/* Preview */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Schedule Preview</div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
              {[
                { label: "Outreach sent", day: "Day 0", color: COLORS.textSecondary },
                { label: `Follow-up 1`, day: `Day ${local.followup1Days}`, color: COLORS.purple },
                { label: `Follow-up 2`, day: `Day ${local.followup1Days + local.followup2Days}`, color: COLORS.purpleLight },
              ].map((item, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? 1 : 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, margin: "0 auto 6px", boxShadow: i > 0 ? `0 0 8px ${item.color}88` : "none" }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.color, whiteSpace: "nowrap" }}>{item.day}</div>
                    <div style={{ fontSize: 10, color: COLORS.textSecondary, whiteSpace: "nowrap", marginTop: 2 }}>{item.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: COLORS.border, margin: "0 8px", marginBottom: 28 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline stages (read-only info) */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Pipeline Stages</div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, overflow: "hidden" }}>
            {STAGES.map((s, i) => (
              <div key={s.id} style={{ padding: "12px 18px", borderBottom: i < STAGES.length - 1 ? `1px solid ${COLORS.border}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: COLORS.text, flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {s.id === "contacted"  && `Reminder in ${local.followup1Days} days`}
                  {s.id === "followup1"  && `2nd nudge in ${local.followup2Days} days`}
                  {s.id === "followup2"  && "Final attempt"}
                  {s.id === "target"     && "Not yet contacted"}
                  {s.id === "replied"    && "Close the booking"}
                  {s.id === "booked"     && "✓ Done"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Genre Management */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Genres & Scenes</div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                These genres appear in lead and gig forms, and as filter pills in your pipeline. Add any scene that fits your sound.
              </div>
            </div>
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {customTags.map(tag => {
                const color = TAG_COLORS[tag] || TAG_PALETTE[0];
                return (
                  <GenreRow key={tag} tag={tag} color={color} onRemove={() => onRemoveTag(tag)} onSetColor={c => onSetTagColor(tag, c)} />
                );
              })}

              {/* Add new genre inline */}
              <AddGenreRow onAdd={onAddTag} />
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={handleSave} style={{ padding: "11px 28px", background: isDirty ? COLORS.purple : COLORS.border, border: "none", borderRadius: 10, color: isDirty ? "#fff" : COLORS.textMuted, fontSize: 13, fontWeight: 700, cursor: isDirty ? "pointer" : "default", transition: "all 0.2s", boxShadow: isDirty ? "0 4px 20px rgba(14,116,144,0.28)" : "none" }}>
            {saved ? "✓ Saved" : "Save"}
          </button>
          {isDirty && (
            <button onClick={() => setLocal({ ...settings })} style={{ padding: "11px 18px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textSecondary, fontSize: 13, cursor: "pointer" }}>
              Discard
            </button>
          )}
          {!isDirty && !saved && <span style={{ fontSize: 11, color: COLORS.textMuted }}>No unsaved changes</span>}
          {saved && <span style={{ fontSize: 11, color: COLORS.green }}>Changes applied to all future reminders</span>}
        </div>

        {/* Danger Zone */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Danger Zone</div>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}

// ─── Gig Calendar ─────────────────────────────────────────────────────────────


// ── DB ↔ App data converters ──────────────────────────────────────────────────
function dbToLead(r) {
  return {
    id:            r.id,
    name:          r.name || "",
    contact:       r.contact || "",
    instagram:     r.instagram || "",
    tier:          r.tier || "A2",
    tag:           r.tag || "Tech-House",
    stage:         r.stage || "target",
    notes:         r.notes || "",
    followUpDate:   r.follow_up_date || null,
    lastContact:    r.last_contact || null,
    archived:       r.archived || false,
    bookingStatus:  r.booking_status || [],
    outreachMethod: r.outreach_method || null,
    contactLog:     r.contact_log || "",
    fee:            r.fee || null,
    depositPaid:    r.deposit_paid || false,
    isInbound:      r.is_inbound || false,
    updatedAt:      r.updated_at || null,
  };
}
function leadToDb(lead, userId) {
  return {
    id:             typeof lead.id === "number" ? undefined : lead.id, // let DB generate uuid for new
    user_id:        userId,
    name:           lead.name,
    contact:        lead.contact || "",
    instagram:      lead.instagram || "",
    tier:           lead.tier || "A2",
    tag:            lead.tag || "Tech-House",
    stage:          lead.stage || "target",
    notes:          lead.notes || "",
    follow_up_date: lead.followUpDate || null,
    last_contact:   lead.lastContact || null,
    archived:       lead.archived || false,
    booking_status: lead.bookingStatus || [],
  };
}
function dbToGig(r) {
  return {
    id:     r.id,
    venue:  r.venue || "",
    city:   r.city || "",
    date:   r.date || "",
    status: r.status || "pending",
    fee:    r.fee || "",
    tag:    r.tag || "",
    notes:  r.notes || "",
  };
}
function gigToDb(gig, userId) {
  const obj = {
    user_id: userId,
    venue:   gig.venue,
    city:    gig.city || "",
    date:    gig.date || null,
    status:  gig.status || "pending",
    fee:     gig.fee || "",
    tag:     gig.tag || "",
    notes:   gig.notes || "",
  };
  if (gig.id && typeof gig.id === "string") obj.id = gig.id;
  return obj;
   
}

function GigCalendarView({ leads, gigs, setGigs, showToast, isPro, onUpgradeClick, customTags, TAG_COLORS, supabase, onDateClick, userId, isMobile: isMobileProp }) {
  const isMobileCalendar = isMobileProp ?? (typeof window !== "undefined" && window.innerWidth < 768);
  const today    = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [addForm,   setAddForm]   = useState({ venue: "", city: "", date: "", status: "confirmed", fee: "", tag: "Tech-House", notes: "" });
  const [editMode,  setEditMode]  = useState(false);
  const [editForm,  setEditForm]  = useState(null);

  // Listen for "Add to Calendar" from Booked modal
  useEffect(() => {
    const handleAddFromBooked = (e) => {
      setShowAdd(true);
      setAddForm(f => ({ ...f, venue: e.detail.venue || "", tag: e.detail.tag || "Tech-House" }));
    };
    window.addEventListener('addGigFromBooked', handleAddFromBooked);
    return () => window.removeEventListener('addGigFromBooked', handleAddFromBooked);
  }, []);

  const [shareUsername, setShareUsername] = useState(null);
  const [shareCopied, setShareCopied]     = useState(false);
  const confirmedUpcoming = gigs.filter(g => g.status === "confirmed" && new Date(g.date) >= today).length;
  const copyGigListLink = () => {
    if (!shareUsername) return;
    navigator.clipboard.writeText(`https://app.noxreach.com/gigs/${shareUsername}`);
    setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
  };
  const [logbook, setLogbook]           = useState({ recap: "", setlist_url: "", recording_url: "", crowd_rating: null, promoter_rating: null });
  const [logbookSaving, setLogbookSaving] = useState(false);

  useEffect(() => {
    if (!userId || !supabase) return;
    supabase.from("profiles").select("username").eq("id", userId).single()
      .then(({ data }) => { if (data?.username) setShareUsername(data.username); });
  }, [userId]);

  useEffect(() => {
    if (!selected) return;
    setLogbook({
      recap: selected.logbook_recap || "",
      setlist_url: selected.logbook_setlist_url || "",
      recording_url: selected.logbook_recording_url || "",
      crowd_rating: selected.logbook_crowd_rating || null,
      promoter_rating: selected.logbook_promoter_rating || null,
    });
  }, [selected?.id]);

  const saveLogbook = async () => {
    if (!selected?.id) return;
    setLogbookSaving(true);
    try {
      await supabase.from("gigs").update({
        logbook_recap: logbook.recap,
        logbook_setlist_url: logbook.setlist_url,
        logbook_recording_url: logbook.recording_url,
        logbook_crowd_rating: logbook.crowd_rating,
        logbook_promoter_rating: logbook.promoter_rating,
      }).eq("id", selected.id);
      showToast("Logbook saved", "success");
    } catch {
      showToast("Failed to save logbook", "info");
    } finally {
      setLogbookSaving(false);
    }
  };

  const monthStart  = new Date(viewYear, viewMonth, 1);
  const monthEnd    = new Date(viewYear, viewMonth + 1, 0);
  const startPad    = monthStart.getDay();
  const totalCells  = Math.ceil((startPad + monthEnd.getDate()) / 7) * 7;
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const gigsThisMonth = gigs.filter(g => {
    const d = new Date(g.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const gigsByDate = {};
  gigs.forEach(g => { gigsByDate[g.date] = [...(gigsByDate[g.date] || []), g]; });

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const addGig = async () => {
    if (!addForm.venue || !addForm.date) return;
    if (!isPro && gigs.length >= FREE_LIMITS.gigs) { onUpgradeClick("gigs"); return; }
    try {
      const { data, error } = await supabase.from("gigs").insert([gigToDb({ ...addForm }, userId)]).select().single();
      if (error) throw error;
      setGigs(prev => [...prev, dbToGig(data)]);
      
      // Navigate calendar to the gig's month
      const gigDate = new Date(addForm.date);
      setViewMonth(gigDate.getMonth());
      setViewYear(gigDate.getFullYear());
      
      showToast(`Awesome! ${addForm.venue} locked in 🎉 Keep them coming!`, "success");
      setShowAdd(false);
      setAddForm({ venue: "", city: "", date: "", status: "confirmed", fee: "", tag: "Tech-House", notes: "" });
    } catch (err) {
      showToast("Failed to save gig. Try again.", "info");
      console.error(err);
    }
  };

  const deleteGig = async (id) => {
    setGigs(prev => prev.filter(g => g.id !== id));
    setSelected(null);
    setEditMode(false);
    showToast("Gig removed", "info");
    try {
      await supabase.from("gigs").delete().eq("id", id).eq("user_id", userId);
    } catch (err) { console.error("deleteGig sync failed:", err); }
  };

  const updateGig = async () => {
    if (!editForm?.venue || !editForm?.date) return;
    const updated = { ...selected, ...editForm };
    setGigs(prev => prev.map(g => g.id === updated.id ? updated : g));
    setSelected(updated);
    setEditMode(false);
    showToast("Gig updated", "success");
    try {
      await supabase.from("gigs").update({
        venue:  editForm.venue,
        city:   editForm.city || "",
        date:   editForm.date,
        status: editForm.status,
        fee:    editForm.fee || "",
        tag:    editForm.tag || "",
        notes:  editForm.notes || "",
      }).eq("id", updated.id).eq("user_id", userId);
    } catch (err) { console.error("updateGig sync failed:", err); }
  };

  const upcoming = gigs.filter(g => new Date(g.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past     = gigs.filter(g => new Date(g.date) < today).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Booked leads that aren't gigs yet
  const bookedLeads = leads.filter(l => l.stage === "booked" && !l.archived);

  return (
<div>
    {/* Share banner */}
    {shareUsername && confirmedUpcoming > 0 && (
      <div style={{ background: "linear-gradient(90deg, rgba(14,116,144,0.10), rgba(99,102,241,0.08))", border: `1px solid rgba(14,116,144,0.25)`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.purpleLight, marginBottom: 2 }}>📅 {confirmedUpcoming} confirmed gig{confirmedUpcoming > 1 ? "s" : ""} — share your schedule</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>app.noxreach.com/gigs/{shareUsername}</div>
        </div>
        <button onClick={copyGigListLink}
          style={{ padding: "9px 18px", background: shareCopied ? "rgba(74,222,128,0.15)" : "rgba(14,116,144,0.15)", border: `1px solid ${shareCopied ? "rgba(74,222,128,0.4)" : "rgba(14,116,144,0.35)"}`, borderRadius: 8, color: shareCopied ? "#4ade80" : COLORS.purpleLight, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          {shareCopied ? "✓ Copied!" : "🔗 Copy link"}
        </button>
        <a href={`/gigs/${shareUsername}`} target="_blank" rel="noopener noreferrer"
          style={{ padding: "9px 18px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>
          Preview →
        </a>
      </div>
    )}    <div style={{ display: "grid", gridTemplateColumns: isMobileCalendar ? "1fr" : "1fr 300px", gap: 20 }}>
      {/* Left: Calendar + upcoming list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Calendar */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
          {/* Month nav */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textSecondary, cursor: "pointer", padding: "5px 10px", fontSize: 14 }}>‹</button>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
            <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textSecondary, cursor: "pointer", padding: "5px 10px", fontSize: 14 }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${COLORS.border}` }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.08em" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum  = i - startPad + 1;
              const valid   = dayNum >= 1 && dayNum <= monthEnd.getDate();
              const dateStr = valid ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` : null;
              const dayGigs = dateStr ? (gigsByDate[dateStr] || []) : [];
              const isToday = dateStr === today.toISOString().split("T")[0];
              const hasGig  = dayGigs.length > 0;
              const confirmed = dayGigs.some(g => g.status === "confirmed");
              const pending   = dayGigs.some(g => g.status === "pending");

              return (
                <div key={i} onClick={() => { if (!valid) return; if (hasGig) setSelected(dayGigs[0]); else { setAddForm(f => ({ ...f, date: dateStr })); setShowAdd(true); } }}
  style={{ padding: "8px 4px", minHeight: 52, borderBottom: `1px solid ${COLORS.border}`, borderRight: `1px solid ${COLORS.border}`, cursor: valid && hasGig ? "pointer" : "default", background: hasGig && selected?.date === dateStr ? COLORS.purpleBg : "transparent", transition: "background 0.15s" }}>
                  {valid && (
                    <>
                      <div style={{ textAlign: "center", fontSize: 12, fontWeight: isToday ? 800 : 400, color: isToday ? COLORS.purple : COLORS.text, width: isToday ? 22 : "auto", height: isToday ? 22 : "auto", borderRadius: isToday ? "50%" : 0, background: isToday ? COLORS.purpleBg : "transparent", border: isToday ? `1px solid ${COLORS.purple}` : "none", margin: isToday ? "0 auto" : 0, display: isToday ? "flex" : "block", alignItems: "center", justifyContent: "center" }}>{dayNum}</div>
                      {hasGig && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4, flexWrap: "wrap" }}>
                          {dayGigs.map((g, gi) => (
                            <div key={gi} style={{ width: 6, height: 6, borderRadius: "50%", background: g.status === "confirmed" ? COLORS.green : COLORS.textSecondary, boxShadow: g.status === "confirmed" ? `0 0 4px ${COLORS.green}88` : "none" }} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: "12px 20px", display: "flex", gap: 20, borderTop: `1px solid ${COLORS.border}` }}>
            {[["confirmed", COLORS.green, "Confirmed"], ["pending", COLORS.textSecondary, "Pending"]].map(([s, c, l]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: s === "confirmed" ? `0 0 5px ${c}88` : "none" }} />
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{l}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 11, color: COLORS.textMuted }}>{gigsThisMonth.length} gig{gigsThisMonth.length !== 1 ? "s" : ""} this month</div>
          </div>
        </div>

        {/* Upcoming list */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Upcoming Gigs</div>
          {upcoming.length === 0 ? (
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "20px", textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>No upcoming gigs — start booking!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.map(gig => {
                const d        = new Date(gig.date);
                const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                return (
                  <div key={gig.id} onClick={() => setSelected(gig)} style={{ background: COLORS.surface, border: `1px solid ${selected?.id === gig.id ? COLORS.purple : COLORS.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.15s" }}>
                    <div style={{ textAlign: "center", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", minWidth: 48, flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{MONTH_NAMES[d.getMonth()].slice(0, 3)}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Mono', monospace", lineHeight: 1.2 }}>{d.getDate()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>{gig.venue}</div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{gig.city}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: gig.status === "confirmed" ? "rgba(34,197,94,0.12)" : COLORS.border, color: gig.status === "confirmed" ? COLORS.green : COLORS.textSecondary, border: `1px solid ${gig.status === "confirmed" ? "rgba(34,197,94,0.4)" : COLORS.border}`, textTransform: "uppercase", letterSpacing: "0.06em" }}>{gig.status}</span>
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{daysLeft === 0 ? "Today" : `in ${daysLeft}d`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past gigs (collapsed) */}
        {past.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Past Gigs <span style={{ fontFamily: "'DM Mono', monospace", marginLeft: 4 }}>{past.length}</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {past.slice(0, 3).map(gig => (
                <div key={gig.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.55 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{gig.venue}</span>
                    <span style={{ fontSize: 11, color: COLORS.textSecondary, marginLeft: 8 }}>{gig.city}</span>
{gig.recap && <span style={{ fontSize: 10, color: COLORS.purple, marginLeft: 8 }}>📓</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {gig.crowd_rating && <span style={{ fontSize: 10, color: COLORS.amber }}>{'★'.repeat(gig.crowd_rating)}</span>}
                    <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Mono', monospace" }}>{gig.date}</span>                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Mono', monospace" }}>{gig.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Detail panel / Add form */}
      <div>
        {/* Booked leads hint */}
        {bookedLeads.length > 0 && !selected && !showAdd && (
          <div style={{ background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 700, marginBottom: 8 }}>📌 {bookedLeads.length} booked lead{bookedLeads.length > 1 ? "s" : ""} not on calendar</div>
            {bookedLeads.map(l => (
              <button key={l.id} onClick={() => { setShowAdd(true); setAddForm(f => ({ ...f, venue: l.name, tag: l.tag })); }}
                style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${COLORS.purpleDim}`, borderRadius: 7, padding: "7px 10px", color: COLORS.purpleLight, fontSize: 12, cursor: "pointer", marginBottom: 4 }}>
                + Add {l.name} to calendar →
              </button>
            ))}
          </div>
        )}

        {/* Add gig form */}
        {showAdd ? (
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text, marginBottom: 16 }}>Add Gig</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Venue", "venue", "text", "e.g. Club Space Miami"], ["City", "city", "text", "e.g. Berlin, DE"], ["Date", "date", "date", ""], ["Fee", "fee", "text", "€500"]].map(([label, key, type, ph]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
                  <input type={type} value={addForm[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                    style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "8px 12px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
                    onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Genre</label>
                <GenreSelector tags={customTags} value={addForm.tag} onChange={v => setAddForm(f => ({ ...f, tag: v }))} TAG_COLORS={TAG_COLORS} onAddTag={() => {}} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Status</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["confirmed", "pending"].map(s => (
                    <button key={s} onClick={() => setAddForm(f => ({ ...f, status: s }))} style={{ flex: 1, padding: "7px", borderRadius: 8, cursor: "pointer", background: addForm.status === s ? (s === "confirmed" ? "rgba(34,197,94,0.12)" : COLORS.purpleBg) : "transparent", border: `1px solid ${addForm.status === s ? (s === "confirmed" ? "rgba(34,197,94,0.4)" : COLORS.purple) : COLORS.border}`, color: addForm.status === s ? (s === "confirmed" ? COLORS.green : COLORS.purpleLight) : COLORS.textSecondary, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Notes</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Set time, rider notes..."
                  style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "8px 12px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "9px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={addGig} style={{ flex: 2, padding: "9px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add to Calendar ✓</button>
            </div>
          </div>
        ) : selected ? (
          /* Gig detail */
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, position: "sticky", top: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>{selected.venue}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{selected.city}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[["Date", selected.date], ["Fee", selected.fee || "—"], ["Status", selected.status], ["Genre", selected.tag]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>{k}</span>
                  <span style={{ fontSize: 12, color: k === "Status" ? (v === "confirmed" ? COLORS.green : COLORS.textSecondary) : COLORS.text, fontWeight: k === "Status" ? 700 : 400, textTransform: k === "Status" ? "capitalize" : "none" }}>{v}</span>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>{selected.notes}</div>
            )}
{/* ── Gig Logbook (past gigs only) ── */}
            {new Date(selected.date) < today && (() => {
              const StarRow = ({ label, field }) => (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setLogbook(l => ({ ...l, [field]: l[field] === n ? null : n }))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 1, fontSize: 16, color: (logbook[field] || 0) >= n ? COLORS.amber : COLORS.border, transition: "color 0.1s" }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              );
              return (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>📓 Logbook</div>
                  <StarRow label="Crowd" field="crowd_rating" />
                  <StarRow label="Promoter" field="promoter_rating" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    <textarea
                      placeholder="How did the set go? Notes for next time..."
                      value={logbook.recap}
                      onChange={e => setLogbook(l => ({ ...l, recap: e.target.value }))}
                      rows={3}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "8px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical", width: "100%", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = COLORS.purple}
                      onBlur={e => e.target.style.borderColor = COLORS.border}
                    />
                    <input
                      placeholder="Setlist URL (1001Tracklists, etc.)"
                      value={logbook.setlist_url}
                      onChange={e => setLogbook(l => ({ ...l, setlist_url: e.target.value }))}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = COLORS.purple}
                      onBlur={e => e.target.style.borderColor = COLORS.border}
                    />
                    <input
                      placeholder="Recording URL (Mixcloud, SoundCloud, etc.)"
                      value={logbook.recording_url}
                      onChange={e => setLogbook(l => ({ ...l, recording_url: e.target.value }))}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = COLORS.purple}
                      onBlur={e => e.target.style.borderColor = COLORS.border}
                    />
                    <button onClick={saveLogbook} disabled={logbookSaving}
                      style={{ padding: "8px", background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 8, color: COLORS.purpleLight, fontSize: 12, fontWeight: 700, cursor: logbookSaving ? "wait" : "pointer" }}>
                      {logbookSaving ? "Saving..." : "Save Logbook"}
                    </button>
                  </div>
                </div>
              );
            })()}            {editMode && editForm ? (
              /* ── Edit form ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>Venue</div>
                  <input value={editForm.venue} onChange={e => setEditForm(f => ({ ...f, venue: e.target.value }))}
                    style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>City</div>
                    <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                      style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>Date</div>
                    <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                      style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>Fee</div>
                    <input value={editForm.fee} onChange={e => setEditForm(f => ({ ...f, fee: e.target.value }))} placeholder="€"
                      style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>Status</div>
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>Notes</div>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "8px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  <button onClick={updateGig} disabled={!editForm.venue || !editForm.date}
                    style={{ flex: 2, padding: "8px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: !editForm.venue || !editForm.date ? 0.5 : 1 }}>Save changes</button>
                </div>
              </div>
            ) : (
              /* ── Normal action buttons ── */
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => {
                  const newStatus = selected.status === "confirmed" ? "pending" : "confirmed";
                  setGigs(prev => prev.map(g => g.id === selected.id ? { ...g, status: newStatus } : g));
                  setSelected(prev => ({ ...prev, status: newStatus }));
                  try { await supabase.from("gigs").update({ status: newStatus }).eq("id", selected.id).eq("user_id", userId); } catch(e) { console.error(e); }
                }}
                  style={{ flex: 1, padding: "8px", background: selected.status === "confirmed" ? "rgba(34,197,94,0.12)" : COLORS.purpleBg, border: `1px solid ${selected.status === "confirmed" ? "rgba(34,197,94,0.4)" : COLORS.purpleDim}`, borderRadius: 8, color: selected.status === "confirmed" ? COLORS.green : COLORS.purpleLight, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {selected.status === "confirmed" ? "Mark Pending" : "Confirm ✓"}
                </button>
                <button onClick={() => { setEditForm({ venue: selected.venue, city: selected.city, date: selected.date, status: selected.status, fee: selected.fee, tag: selected.tag, notes: selected.notes }); setEditMode(true); }}
                  style={{ padding: "8px 12px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, fontSize: 11, cursor: "pointer" }} title="Edit">✎</button>
                <button onClick={() => deleteGig(selected.id)} style={{ padding: "8px 12px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.red + "AA", fontSize: 11, cursor: "pointer" }} title="Delete">✕</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: COLORS.surface, border: `1px dashed ${COLORS.border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📅</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 1.6 }}>Click a date on the calendar<br />or add a new gig</div>
            {!isPro && (
              <div style={{ fontSize: 11, color: gigs.length >= FREE_LIMITS.gigs ? COLORS.red : COLORS.textMuted, marginBottom: 12 }}>
                {gigs.length} / {FREE_LIMITS.gigs} gigs used on Free
              </div>
            )}
            <button onClick={() => !isPro && gigs.length >= FREE_LIMITS.gigs ? onUpgradeClick("gigs") : setShowAdd(true)}
              style={{ padding: "9px 20px", background: COLORS.purple, border: "none", borderRadius: 9, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {!isPro && gigs.length >= FREE_LIMITS.gigs ? "Upgrade to Add More" : "+ Add Gig"}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

// ─── Reply Hub ─────────────────────────────────────────────────────────────────

function ReplyHubView({ leads, onMove, showToast, TAG_COLORS, onNavigate, isMobile, supabase, userId, onUnreadChange }) {
  const [filter, setFilter]   = useState("all"); // all | unread | booked
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);

  // Format received_at timestamp
  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffH < 1) return "just now";
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Load email_replies from DB
  const fetchReplies = async (showLoader = true) => {
    if (!supabase || !userId) return;
    if (showLoader) setRepliesLoading(true);
    const { data, error } = await supabase
      .from("email_replies")
      .select("*")
      .eq("user_id", userId)
      .order("received_at", { ascending: false });
    if (!error && data) {
      setReplies(data);
      onUnreadChange?.(data.filter(r => !r.is_read).length);
    }
    if (showLoader) setRepliesLoading(false);
  };

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = (count) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("NoxReach — new repl" + (count === 1 ? "y" : "ies"), {
      body: `${count} new repl${count === 1 ? "y" : "ies"} in your inbox`,
      icon: "/nr-icon.svg",
    });
  };

  // Poll Gmail for new replies via edge function
  const pollGmailReplies = async () => {
    if (!supabase || !userId) return 0;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return 0;
      const res = await fetch(`${supabase.supabaseUrl}/functions/v1/gmail-poll-replies`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.new_replies ?? 0;
    } catch { return 0; }
  };

  // Poll Outlook for new replies via edge function
  const pollOutlookReplies = async () => {
    if (!supabase || !userId) return 0;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return 0;
      const res = await fetch(`${supabase.supabaseUrl}/functions/v1/outlook-poll-replies`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.new_replies ?? 0;
    } catch { return 0; }
  };

  useEffect(() => {
    if (!supabase || !userId) return;
    // Check which providers are connected, then auto-poll on mount
    supabase.from("email_connections").select("provider").eq("user_id", userId)
      .then(({ data }) => {
        const gmail = data?.some(c => c.provider === "gmail") ?? false;
        const outlook = data?.some(c => c.provider === "outlook") ?? false;
        setGmailConnected(gmail);
        setOutlookConnected(outlook);
        const polls = [];
        if (gmail) polls.push(pollGmailReplies());
        if (outlook) polls.push(pollOutlookReplies());
        Promise.all(polls).then(counts => {
          const total = counts.reduce((a, b) => a + b, 0);
          if (total > 0) sendBrowserNotification(total);
          fetchReplies();
        }).catch(() => fetchReplies());
        if (!gmail && !outlook) fetchReplies();
      });
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const polls = [];
    if (gmailConnected) polls.push(pollGmailReplies());
    if (outlookConnected) polls.push(pollOutlookReplies());
    const counts = await Promise.all(polls).catch(() => []);
    const newCount = counts.reduce((a, b) => a + b, 0);
    await fetchReplies(false);
    if (polls.length > 0) {
      if (newCount > 0) sendBrowserNotification(newCount);
      showToast(newCount > 0 ? `${newCount} new repl${newCount === 1 ? "y" : "ies"} found` : "Inbox up to date", newCount > 0 ? "success" : "info");
    } else {
      showToast("Inbox refreshed", "success");
    }
    setRefreshing(false);
  };

  // Get replies for a specific lead
  const getRepliesForLead = (leadId) => replies.filter(r => r.lead_id === leadId);
  const getLatestReply = (leadId) => replies.filter(r => r.lead_id === leadId)[0] || null;

  // Mark as read: update DB + local state + notify parent
  const markRead = async (leadId) => {
    const unread = replies.filter(r => r.lead_id === leadId && !r.is_read);
    if (unread.length === 0) return;
    // Optimistic update
    setReplies(prev => {
      const updated = prev.map(r => r.lead_id === leadId ? { ...r, is_read: true } : r);
      // Update parent sidebar count
      const newUnread = updated.filter(r => !r.is_read).length;
      onUnreadChange?.(newUnread);
      return updated;
    });
    if (supabase) {
      await supabase.from("email_replies").update({ is_read: true })
        .eq("user_id", userId).eq("lead_id", leadId).eq("is_read", false);
    }
  };

  // Replied leads are the "inbox" — they represent inbound promoter interest
  const repliedLeads = leads.filter(l => !l.archived && !l.is_inbound && (l.stage === "replied" || l.stage === "booked"));

  // Leads with real email replies
  const leadsWithReplies = new Set(replies.map(r => r.lead_id));

  // isUnread: has any unread email_reply OR no replies but in replied/booked stage and not in localStorage
  const isLeadUnread = (lead) => {
    const leadReplies = getRepliesForLead(lead.id);
    if (leadReplies.length > 0) return leadReplies.some(r => !r.is_read);
    // Fallback: use localStorage for stage-moved leads with no email replies
    try { const read = new Set(JSON.parse(localStorage.getItem("noxreach_read_replies") || "[]")); return !read.has(lead.id); } catch { return true; }
  };

  const markReadFallback = (id) => {
    try {
      const read = new Set(JSON.parse(localStorage.getItem("noxreach_read_replies") || "[]"));
      read.add(id);
      localStorage.setItem("noxreach_read_replies", JSON.stringify([...read]));
    } catch {}
  };

  const filtered = repliedLeads.filter(l => {
    if (filter === "unread") return isLeadUnread(l);
    if (filter === "booked") return l.stage === "booked";
    return true;
  });

  const unreadCount = repliedLeads.filter(l => isLeadUnread(l)).length;

  const copyReply = () => {
    if (!replyText.trim()) return;
    navigator.clipboard.writeText(replyText);
    showToast("Reply copied to clipboard", "success");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden", minHeight: 500 }}>

      {/* Left: message list */}
      <div style={{ borderRight: isMobile ? "none" : `1px solid ${COLORS.border}`, display: isMobile && mobileShowDetail ? "none" : "flex", flexDirection: "column" }}>
        {/* Filter tabs + refresh */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 6, alignItems: "center" }}>
          {[["all", "All"], ["unread", `Unread`], ["booked", "Booked"]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ flex: 1, padding: "6px 4px", borderRadius: 7, cursor: "pointer", background: filter === id ? COLORS.purpleBg : "transparent", border: `1px solid ${filter === id ? COLORS.purple : COLORS.border}`, color: filter === id ? COLORS.purpleLight : COLORS.textSecondary, fontSize: 11, fontWeight: filter === id ? 700 : 500, position: "relative" }}>
              {label}
              {id === "unread" && unreadCount > 0 && (
                <span style={{ marginLeft: 4, background: COLORS.purple, color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 9, fontWeight: 800 }}>{unreadCount}</span>
              )}
            </button>
          ))}
          <button onClick={handleRefresh} title="Refresh inbox" style={{ padding: "6px 10px", borderRadius: 7, cursor: "pointer", background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 13, flexShrink: 0 }}>
            {refreshing ? "…" : "↻"}
          </button>
        </div>

        {/* Message list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {repliesLoading ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>
              {filter === "unread" ? "All caught up ✓" : "No messages yet"}
            </div>
          ) : (
            filtered.map(lead => {
              const latest   = getLatestReply(lead.id);
              const isUnread = isLeadUnread(lead);
              const isActive = selected?.id === lead.id;
              const subject  = latest?.subject || "Re: Booking Inquiry";
              const preview  = latest?.body_text?.replace(/\s+/g, " ").trim() || "No preview available";
              const timeStr  = latest ? formatTime(latest.received_at) : "—";
              const hasReal  = leadsWithReplies.has(lead.id);
              return (
                <div key={lead.id} onClick={() => {
                    setSelected(lead); setReplyText("");
                    if (hasReal) markRead(lead.id); else markReadFallback(lead.id);
                    if (isMobile) setMobileShowDetail(true);
                  }}
                  style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", background: isActive ? COLORS.purpleBg : "transparent", borderLeft: `3px solid ${isActive ? COLORS.purple : isUnread ? COLORS.purple : "transparent"}`, transition: "background 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isUnread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.purple, flexShrink: 0 }} />}
                      <div style={{ fontSize: 13, fontWeight: isUnread ? 800 : 600, color: COLORS.text }}>{lead.name}</div>
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, flexShrink: 0, marginLeft: 6 }}>{timeStr}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: isUnread ? 700 : 400, color: isUnread ? COLORS.text : COLORS.textSecondary, marginBottom: 3 }}>{subject}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                    <Badge color={TIER_COLORS[lead.tier]}>{lead.tier}</Badge>
                    <Badge color={lead.stage === "booked" ? COLORS.green : COLORS.violetLight}>{lead.stage === "booked" ? "Booked" : "Replied"}</Badge>
                    {hasReal && <Badge color={COLORS.purple}>✉ Email</Badge>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {repliedLeads.length === 0 && (
          <div style={{ padding: "16px", borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6, textAlign: "center" }}>
              Leads that reply to your outreach will appear here. Move leads to <strong style={{ color: COLORS.textSecondary }}>Replied</strong> in the Pipeline.
            </div>
          </div>
        )}
      </div>

      {/* Right: message detail + reply composer */}
      {(!isMobile || mobileShowDetail) && selected ? (() => {
        const leadReplies = getRepliesForLead(selected.id);
        const latest = leadReplies[0] || null;
        const subject = latest?.subject || "Re: Booking Inquiry";
        const hint = selected.stage === "replied"
          ? { action: "Confirm booking", next: "booked", color: COLORS.green }
          : null;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {isMobile && (
              <button onClick={() => setMobileShowDetail(false)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                ‹ Back to inbox
              </button>
            )}
            {/* Message header */}
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>{subject}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>from <strong style={{ color: COLORS.text }}>{latest?.from_email || selected.name}</strong></span>
                    {latest && <span style={{ fontSize: 11, color: COLORS.textMuted }}>· {formatTime(latest.received_at)}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge color={TIER_COLORS[selected.tier]}>{selected.tier}</Badge>
                  <Badge color={TAG_COLORS[selected.tag] || COLORS.purple}>{selected.tag}</Badge>
                </div>
              </div>
            </div>

            {/* Message body — show all real replies, or fallback */}
            <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
              {leadReplies.length > 0 ? leadReplies.map((r, i) => (
                <div key={r.id} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", fontSize: 13, color: COLORS.text, lineHeight: 1.8, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 11, color: COLORS.textMuted }}>
                    <span><strong style={{ color: COLORS.textSecondary }}>{r.from_email}</strong></span>
                    <span>{formatTime(r.received_at)}</span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{r.body_text || "(No content)"}</div>
                </div>
              )) : (
                <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", fontSize: 13, color: COLORS.textMuted, lineHeight: 1.8, marginBottom: 20, fontStyle: "italic" }}>
                  No email replies captured yet. Replies are synced when you connect Gmail or Outlook in Settings and hit ↻ to refresh.
                </div>
              )}

              {/* Pipeline action */}
              {hint && (
                <button onClick={() => { onMove(selected.id, hint.next); setSelected(prev => ({ ...prev, stage: hint.next })); }}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, cursor: "pointer", marginBottom: 16, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.green }}>{hint.action}</div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>Move this lead to Booked in the pipeline</div>
                  </div>
                  <span style={{ fontSize: 18, color: COLORS.green }}>→</span>
                </button>
              )}
              {selected.stage === "booked" && (
                <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 16 }}>✓</div>
                    <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 700 }}>Booking confirmed — this gig is locked in</div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate?.("calendar");
                      // Small delay to let tab switch complete, then trigger add form
                      setTimeout(() => {
                        const calendarSection = document.querySelector('[data-calendar-view]');
                        if (calendarSection) {
                          window.dispatchEvent(new CustomEvent('addGigFromBooked', { 
                            detail: { venue: selected.name, tag: selected.tag } 
                          }));
                        }
                      }, 100);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: COLORS.green,
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span>📅</span>
                    <span>Add to Calendar</span>
                  </button>
                </div>
              )}

              {/* Reply composer */}
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.textSecondary, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Draft Reply to <strong style={{ color: COLORS.text }}>{selected.name}</strong></span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["Interested", "Need more info", "Confirm"].map(t => (
                      <button key={t} onClick={() => setReplyText(`Thanks for your message!\n\n${t === "Interested" ? "I'm very interested in this booking opportunity. Could we discuss the details further?" : t === "Need more info" ? "I'd need a bit more information before confirming — could you share the event details, capacity, and set time?" : "Happy to confirm! I'll send my tech rider and availability confirmation shortly."}`)}
                        style={{ padding: "3px 8px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 5, color: COLORS.textSecondary, fontSize: 10, cursor: "pointer" }}>{t}</button>
                    ))}
                  </div>
                </div>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." rows={4}
                  style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit", lineHeight: 1.7, resize: "none" }} />
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Copy to send via email or Instagram</div>
                  <button onClick={copyReply} style={{ padding: "7px 16px", background: COLORS.purple, border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copy Reply</button>
                </div>
              </div>
            </div>
          </div>
        );
      })() : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 10, padding: 40 }}>
          <div style={{ fontSize: 32 }}>✉</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 1.6 }}>Select a message to read and reply</div>
        </div>
      )}
    </div>
  );
}



// ─── Pricing View ─────────────────────────────────────────────────────────────

function PricingView({ isPro, onUpgrade }) {
  const free = [
    "Up to 15 leads",
    "Full pipeline (5 stages)",
    "Follow-up reminders",
    "2 outreach templates",
    "Booking Kit (EPK, mix, bio)",
    "Weekly digest email",
  ];
  const pro = [
    "Unlimited leads & gigs",
    "All outreach templates",
    "Auto follow-up scheduling (5 & 14 days)",
    "Custom follow-up intervals",
    "Conversion Funnel + drop-off insights",
    "Booking Desk — full conversation context",
    "Priority support",
  ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "8px 0 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Plans</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Simple pricing. No contracts. Cancel anytime.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Free */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: "inline-block", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.5)", color: COLORS.text, letterSpacing: "0.08em", marginBottom: 12 }}>FREE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Mono', monospace" }}>€0</span>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>/month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {free.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: COLORS.textSecondary, fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ width: "100%", padding: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 10, color: COLORS.text, fontSize: 12, fontWeight: 700, textAlign: "center" }}>
            {isPro ? "Previous plan" : "Current plan"}
          </div>
        </div>

        {/* Pro */}
        <div style={{ background: COLORS.purpleBg, border: `1px solid ${COLORS.purple}`, borderRadius: 16, padding: 24, position: "relative", boxShadow: "0 0 40px rgba(14,116,144,0.10)" }}>
          {!isPro && (
            <div style={{ position: "absolute", top: -10, right: 16, background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>RECOMMENDED</div>
          )}
          <div style={{ display: "inline-block", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: COLORS.purpleBg, border: `1px solid ${COLORS.purple}`, color: COLORS.purpleLight, letterSpacing: "0.08em", marginBottom: 12 }}>PRO</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Mono', monospace" }}>€19</span>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>/month</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.green, marginBottom: 20 }}>or €152/year — save 20%</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {pro.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: COLORS.green + "22", border: `1px solid ${COLORS.green}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: COLORS.green, fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{f}</span>
              </div>
            ))}
          </div>
          {isPro ? (
            <div style={{ width: "100%", padding: "11px", background: COLORS.green + "22", border: `1px solid ${COLORS.green}44`, borderRadius: 10, color: COLORS.green, fontSize: 12, fontWeight: 800, textAlign: "center" }}>
              ✓ Your current plan
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => onUpgrade("monthly")} style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(14,116,144,0.35)" }}>
                Upgrade to Pro — €19/mo →
              </button>
              <button onClick={() => onUpgrade("yearly")} style={{ width: "100%", padding: "10px", background: "transparent", border: `1px solid ${COLORS.purpleDim}`, borderRadius: 10, color: COLORS.purpleLight, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Annual — €152/year (save 20%)
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: COLORS.textMuted }}>
        Cancel anytime · Stripe-secured · EU VAT handled automatically
      </div>
    </div>
  );
}

// ─── Onboarding Banner ────────────────────────────────────────────────────────

function OnboardingBanner({ leads, assets, onNavigate, onDismiss }) {
  const hasLeads    = leads.filter(l => !l.archived).length >= 1;
  const hasSentMsg  = leads.filter(l => !l.archived && l.stage !== "target").length >= 1;
  const hasAssets   = assets && (assets.epk_url || assets.soundcloud || assets.booking_email);

  const steps = [
    {
      num: "01",
      title: "Add your first lead",
      desc: "Venues, promoters, festivals — tier them A1 to A3.",
      done: hasLeads,
      action: () => onNavigate("pipeline"),
      cta: "Add Lead →",
    },
    {
      num: "02",
      title: "Send your first outreach",
      desc: "Use a template to start the conversation.",
      done: hasSentMsg,
      action: () => onNavigate("outreach"),
      cta: "Open Templates →",
      locked: !hasLeads,
    },
    {
      num: "03",
      title: "Fill in your asset kit",
      desc: "EPK, mix link, booking email — ready to paste.",
      done: hasAssets,
      action: () => onNavigate("bookingkit"),
      cta: "Fill in now →",
      locked: !hasSentMsg,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone   = doneCount === 3;

  return (
    <div style={{
      background: allDone ? "rgba(34,197,94,0.10)" : "rgba(107,47,212,0.08)",
      border: `1px solid ${allDone ? COLORS.green + "44" : COLORS.purple + "55"}`,
      borderRadius: 16, padding: "24px 28px", marginBottom: 28, position: "relative",
      boxShadow: allDone ? "none" : "0 0 40px rgba(107,47,212,0.08)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: allDone ? 8 : 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: allDone ? COLORS.green : COLORS.text, marginBottom: 3 }}>
            {allDone ? "✓ You're all set — now keep the momentum" : "Get started with NoxReach"}
          </div>
          {!allDone && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{doneCount} of 3 done</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Progress bar */}
          {!allDone && (
            <div style={{ width: 80, height: 4, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneCount / 3) * 100}%`, background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleLight})`, borderRadius: 4, transition: "width 0.4s ease" }} />
            </div>
          )}
          <button onClick={onDismiss} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}>×</button>
        </div>
      </div>

      {/* Steps */}
      {!allDone && (
        <div style={{ display: "flex", gap: 10 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              flex: 1, background: step.done ? COLORS.green + "11" : step.locked ? "transparent" : COLORS.surface,
              border: `1px solid ${step.done ? COLORS.green + "44" : step.locked ? COLORS.border : COLORS.borderHover}`,
              borderRadius: 10, padding: "14px 16px", opacity: step.locked ? 0.4 : 1,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: step.done ? COLORS.green : COLORS.purpleBg,
                  border: `1.5px solid ${step.done ? COLORS.green : COLORS.purpleDim}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800,
                  color: step.done ? "#000" : COLORS.purple,
                }}>
                  {step.done ? "✓" : step.num}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: step.done ? COLORS.green : COLORS.text, textDecoration: step.done ? "line-through" : "none", opacity: step.done ? 0.7 : 1 }}>
                  {step.title}
                </div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>{step.desc}</div>
              {!step.done && !step.locked && (
                <button onClick={step.action} style={{
                  fontSize: 11, fontWeight: 700, color: COLORS.purpleLight,
                  background: "none", border: `1px solid ${COLORS.purpleDim}`,
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                }}>
                  {step.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// RFC 4180-compliant CSV row parser — handles quoted fields with commas/newlines inside
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } // escaped quote
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// CSV Import Modal Component
function CSVImportModal({ onClose, onImport, userId, supabase, COLORS }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({
    name: null,
    contact: null,
    tier: null,
    tag: null,
    instagram: null,
    notes: null,
  });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length === 0) {
        alert('CSV file is empty');
        setParsing(false);
        return;
      }

      // Parse header
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);

      // Parse first 5 rows for preview
      const rows = lines.slice(1, 6).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      // Auto-detect column mapping
      const autoMapping = { ...mapping };
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('name') || lower.includes('venue')) autoMapping.name = h;
        if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) autoMapping.contact = h;
        if (lower.includes('tier') || lower.includes('level')) autoMapping.tier = h;
        if (lower.includes('tag') || lower.includes('genre') || lower.includes('category') || lower.includes('type')) autoMapping.tag = h;
        if (lower.includes('instagram') || lower.includes('ig') || lower.includes('social')) autoMapping.instagram = h;
        if (lower.includes('note')) autoMapping.notes = h;
      });

      setMapping(autoMapping);
      setPreview({ headers, rows, totalRows: lines.length - 1 });
    } catch (error) {
      alert('Failed to parse CSV: ' + error.message);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    if (!mapping.name || !mapping.contact) {
      alert('Please map at least Name and Contact columns');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      // Parse full CSV
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim()).slice(1); // Skip header

      const leads = [];
      const errors = [];
      const duplicates = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row = {};
          preview.headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });

          const name = row[mapping.name];
          const contact = row[mapping.contact];

          if (!name || !contact) {
            errors.push({ row: i + 2, reason: 'Missing name or contact' });
            continue;
          }

          // Check for duplicates
          const { data: exists } = await supabase
            .rpc('lead_exists', { 
              p_user_id: userId, 
              p_name: name, 
              p_contact: contact 
            });

          if (exists) {
            duplicates.push({ row: i + 2, name, contact });
            continue;
          }

          leads.push({
            user_id: userId,
            name,
            contact,
            tier: mapping.tier ? row[mapping.tier] : 'A2',
            tag: mapping.tag ? row[mapping.tag] : '',
            instagram: mapping.instagram ? row[mapping.instagram] : '',
            notes: mapping.notes ? row[mapping.notes] : '',
            stage: 'target',
            archived: false,
          });
        } catch (err) {
          errors.push({ row: i + 2, reason: err.message });
        }
      }

      // Bulk insert leads
      let imported = 0;
      if (leads.length > 0) {
        const { data, error } = await supabase
          .from('leads')
          .insert(leads)
          .select();

        if (error) throw error;
        imported = data.length;
      }

      // Log import
      await supabase.from('lead_imports').insert({
        user_id: userId,
        filename: file.name,
        total_rows: lines.length,
        imported_rows: imported,
        duplicate_rows: duplicates.length,
        error_rows: errors.length,
        status: 'completed',
      });

      setResult({
        success: true,
        imported,
        duplicates: duplicates.length,
        errors: errors.length,
        errorDetails: errors,
        duplicateDetails: duplicates,
      });

      if (imported > 0) {
        setTimeout(() => {
          onImport();
          onClose();
        }, 3000);
      }

    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
      
      // Log failed import
      await supabase.from('lead_imports').insert({
        user_id: userId,
        filename: file.name,
        total_rows: preview.totalRows,
        imported_rows: 0,
        duplicate_rows: 0,
        error_rows: preview.totalRows,
        status: 'failed',
        error_message: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Import Leads from CSV</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Upload a CSV file with venue data</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.textSecondary, fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* File Upload */}
          {!preview && (
            <div>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Select CSV File</label>
              <input type="file" accept=".csv" onChange={handleFileSelect} disabled={parsing} style={{ width: '100%', padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 14 }} />
              
              {parsing && (
                <div style={{ marginTop: 16, textAlign: 'center', color: COLORS.textSecondary }}>
                  Parsing CSV...
                </div>
              )}

              <div style={{ marginTop: 20, padding: 16, background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>CSV Format Requirements:</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  <li>First row must contain column headers</li>
                  <li>Required columns: Name, Contact (email or phone)</li>
                  <li>Optional columns: Tier, Tag, Instagram, Notes</li>
                  <li>Duplicate leads (by name or contact) will be skipped</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview & Mapping */}
          {preview && !result && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Preview: {preview.totalRows} rows found</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>Map your CSV columns to NoxReach fields:</div>

                {/* Column Mapping */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {Object.keys(mapping).map(field => (
                    <div key={field}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: 'capitalize' }}>
                        {field} {(field === 'name' || field === 'contact') && <span style={{ color: COLORS.red }}>*</span>}
                      </label>
                      <select value={mapping[field] || ''} onChange={e => setMapping({ ...mapping, [field]: e.target.value || null })} style={{ width: '100%', padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 13 }}>
                        <option value="">-- Skip --</option>
                        {preview.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Preview Table */}
                <div style={{ overflowX: 'auto', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        {preview.headers.slice(0, 5).map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          {preview.headers.slice(0, 5).map(h => (
                            <td key={h} style={{ padding: '8px 12px', color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setFile(null); setPreview(null); setMapping({ name: null, contact: null, tier: null, tag: null, instagram: null, notes: null }); }} style={{ flex: 1, padding: '12px 20px', background: 'transparent', border: `2px solid ${COLORS.purple}44`, borderRadius: 8, color: COLORS.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = COLORS.purple + '11';
                    e.currentTarget.style.borderColor = COLORS.purple + '66';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = COLORS.purple + '44';
                  }}
                >
                  Cancel
                </button>
                <button onClick={handleImport} disabled={!mapping.name || !mapping.contact || importing} style={{ flex: 1, padding: '12px 20px', background: COLORS.purple, border: 'none', borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!mapping.name || !mapping.contact || importing) ? 0.5 : 1 }}>
                  {importing ? 'Importing...' : `Import ${preview.totalRows} Leads`}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div>
              {result.success ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: COLORS.green }}>Import Successful!</div>
                  <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 }}>
                    Imported {result.imported} leads
                    {result.duplicates > 0 && ` · Skipped ${result.duplicates} duplicates`}
                    {result.errors > 0 && ` · ${result.errors} errors`}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.text3 }}>Closing in 3 seconds...</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✕</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: COLORS.red }}>Import Failed</div>
                  <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 }}>{result.error}</div>
                  <button onClick={onClose} style={{ padding: '12px 24px', background: COLORS.purple, border: 'none', borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Templates Components (Bundle 5.2)
// TemplatesView Component - Message Templates Management
// Reusable outreach templates with placeholders


// Template Create/Edit Modal


// TemplatePicker Component - Quick insert templates into outreach
// Used in LeadDetail panel for fast template insertion




// Message Templates Components (Bundle 5.2)
// TemplatesView Component - Message Templates Management
// Reusable outreach templates with placeholders

function TemplatesView({ supabase, user }) {
  const [templates, setTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  }

  function getCategoryColor(category) {
    const colors = {
      'Initial Outreach': COLORS.purple,
      'Follow-up': COLORS.purpleLight,
      'Booking Request': COLORS.purple,
      'Thank You': COLORS.green,
      'Other': COLORS.text3
    };
    return colors[category] || colors['Other'];
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: COLORS.text2 }}>
        Loading templates...
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 32 
      }}>
        <div>
          <h2 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: COLORS.text,
            marginBottom: 4
          }}>
            Message Templates
          </h2>
          <p style={{ color: COLORS.text2, fontSize: 14 }}>
            Reusable outreach templates with smart placeholders
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: COLORS.purple,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + New Template
        </button>
      </div>

      {/* Placeholder Guide */}
      <div style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
          Available Placeholders:
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          flexWrap: 'wrap',
          fontSize: 12,
          color: COLORS.text2
        }}>
          <code style={{ 
            background: COLORS.bg, 
            padding: '4px 8px', 
            borderRadius: 4,
            color: COLORS.purpleLight
          }}>
            {'{venue_name}'}
          </code>
          <code style={{
            background: COLORS.bg,
            padding: '4px 8px',
            borderRadius: 4,
            color: COLORS.purpleLight
          }}>
            {'{contact_name}'}
          </code>
          <code style={{
            background: COLORS.bg,
            padding: '4px 8px',
            borderRadius: 4,
            color: COLORS.purpleLight
          }}>
            {'{artist_name}'}
          </code>
          <code style={{
            background: COLORS.bg,
            padding: '4px 8px',
            borderRadius: 4,
            color: COLORS.purpleLight
          }}>
            {'{genre}'}
          </code>
          <code style={{
            background: COLORS.bg,
            padding: '4px 8px',
            borderRadius: 4,
            color: COLORS.purpleLight
          }}>
            {'{instagram}'}
          </code>
        </div>
      </div>

      {/* Empty State */}
      {templates.length === 0 ? (
        <div style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 48,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
            No templates yet
          </div>
          <div style={{ fontSize: 14, color: COLORS.text2, marginBottom: 24 }}>
            Create reusable templates to speed up your outreach
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: COLORS.purple,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create First Template
          </button>
        </div>
      ) : (
        /* Templates Grid */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20
        }}>
          {templates.map(template => (
            <div
              key={template.id}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: 20,
                position: 'relative'
              }}
            >
              {/* Category Badge */}
              <div style={{
                display: 'inline-block',
                background: getCategoryColor(template.category) + '20',
                color: getCategoryColor(template.category),
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {template.category}
              </div>

              {/* Template Name */}
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: COLORS.text,
                marginBottom: 8
              }}>
                {template.name}
              </div>

              {/* Subject (if exists) */}
              {template.subject && (
                <div style={{ 
                  fontSize: 13, 
                  color: COLORS.text2,
                  marginBottom: 8,
                  fontStyle: 'italic'
                }}>
                  Subject: {template.subject}
                </div>
              )}

              {/* Body Preview */}
              <div style={{
                fontSize: 13,
                color: COLORS.text2,
                lineHeight: 1.6,
                marginBottom: 16,
                maxHeight: 80,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {template.body.substring(0, 150)}
                {template.body.length > 150 && '...'}
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: 16,
                fontSize: 12,
                color: COLORS.text3,
                marginBottom: 16,
                paddingTop: 12,
                borderTop: `1px solid ${COLORS.border}`
              }}>
                <div>Used {template.use_count || 0} times</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditingTemplate(template)}
                  style={{
                    flex: 1,
                    background: COLORS.purple + '15',
                    color: COLORS.purple,
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  style={{
                    background: '#EF444415',
                    color: '#EF4444',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          supabase={supabase}
          user={user}
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            loadTemplates();
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}

// Template Create/Edit Modal
function TemplateModal({ supabase, user, template, onClose, onSave }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [category, setCategory] = useState(template?.category || 'Initial Outreach');
  const [saving, setSaving] = useState(false);

  const categories = [
    'Initial Outreach',
    'Follow-up',
    'Booking Request',
    'Thank You',
    'Other'
  ];

  async function handleSave() {
    if (!name.trim() || !body.trim()) {
      alert('Please fill in template name and body');
      return;
    }

    setSaving(true);

    const templateData = {
      user_id: user.id,
      name: name.trim(),
      subject: subject.trim() || null,
      body: body.trim(),
      category
    };

    let error;
    if (template) {
      // Update existing
      ({ error } = await supabase
        .from('message_templates')
        .update(templateData)
        .eq('id', template.id)
        .eq('user_id', user.id));
    } else {
      // Create new
      ({ error } = await supabase
        .from('message_templates')
        .insert([templateData]));
    }

    setSaving(false);

    if (!error) {
      onSave();
    } else {
      alert('Failed to save template');
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 32
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            {template ? 'Edit Template' : 'New Template'}
          </h3>
          <p style={{ fontSize: 14, color: COLORS.text2 }}>
            Use placeholders like {'{venue_name}'} to personalize messages
          </p>
        </div>

        {/* Template Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Initial Club Outreach"
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: COLORS.text
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Category
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: COLORS.text
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Subject (Optional) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Subject Line (Optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g., Booking Inquiry - {artist_name}"
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: COLORS.text
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Message Body *
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Hey {contact_name},

I'm reaching out about potential booking opportunities at {venue_name}...

Best,
{artist_name}"
            rows={12}
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 14,
              color: COLORS.text,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              background: 'transparent',
              color: COLORS.text,
              border: `2px solid ${COLORS.purple}44`,
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (!saving) {
                e.currentTarget.style.background = COLORS.purple + '11';
                e.currentTarget.style.borderColor = COLORS.purple + '66';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = COLORS.purple + '44';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              background: COLORS.purple,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Saving...' : (template ? 'Save Changes' : 'Create Template')}
          </button>
        </div>
      </div>
    </div>
  );
}


// TemplatePicker Component - Quick insert templates into outreach
// Used in LeadDetail panel for fast template insertion

function TemplatePicker({ supabase, user, lead, onInsert }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (showPicker) {
      loadTemplates();
    }
  }, [showPicker]);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false });
    
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  async function handleSelectTemplate(template) {
    // Increment use count
    await supabase.rpc('increment_template_usage', { 
      template_id: template.id 
    });

    // Replace placeholders
    const artistName = user.user_metadata?.full_name || 'GEEZ'; // Get from user_assets later
    const venueName = lead.name || '{venue_name}';
    const contactName = lead.contact?.split('@')[0] || '{contact_name}';
    const genre = lead.tag || '{genre}';
    const instagram = lead.instagram || '{instagram}';

    let message = template.body
      .replace(/{venue_name}/g, venueName)
      .replace(/{contact_name}/g, contactName)
      .replace(/{artist_name}/g, artistName)
      .replace(/{genre}/g, genre)
      .replace(/{instagram}/g, instagram);

    onInsert(message);
    setShowPicker(false);
  }

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        style={{
          background: COLORS.purple + '15',
          color: COLORS.purple,
          border: 'none',
          padding: '8px 16px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        📝 Use Template
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto',
        padding: 24
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>
            Select Template
          </h3>
          <button
            onClick={() => setShowPicker(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.text2,
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              width: 32,
              height: 32
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: COLORS.text2 }}>
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 14, color: COLORS.text2, marginBottom: 16 }}>
              No templates yet
            </div>
            <div style={{ fontSize: 13, color: COLORS.text3 }}>
              Create templates in the Templates tab
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = COLORS.purple;
                  e.currentTarget.style.background = COLORS.purple + '08';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.background = COLORS.surface;
                }}
              >
                {/* Category Badge */}
                <div style={{
                  display: 'inline-block',
                  background: COLORS.purple + '20',
                  color: COLORS.purple,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {template.category}
                </div>

                {/* Template Name */}
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: 6
                }}>
                  {template.name}
                </div>

                {/* Preview */}
                <div style={{
                  fontSize: 12,
                  color: COLORS.text2,
                  lineHeight: 1.5,
                  maxHeight: 40,
                  overflow: 'hidden'
                }}>
                  {template.body.substring(0, 100)}...
                </div>

                {/* Use Count */}
                {template.use_count > 0 && (
                  <div style={{
                    fontSize: 11,
                    color: COLORS.text3,
                    marginTop: 8
                  }}>
                    Used {template.use_count} times
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// Smart Suggestions Components (Bundle 5.3)

// TemplatePickerModal Component - Bundle 5.2-5.4
function TemplatePickerModal({ supabase, user, lead, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false });
    
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  async function handleSelectTemplate(template) {
    // Increment use count
    await supabase.rpc('increment_template_usage', { 
      template_id: template.id 
    });

    // Replace placeholders
    const artistName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Artist";
    const venueName = lead.name || '{venue_name}';
    const contactName = lead.contact?.split('@')[0] || '{contact_name}';
    const genre = lead.tag || '{genre}';
    const instagram = lead.instagram || '{instagram}';

    let message = template.body
      .replace(/{venue_name}/g, venueName)
      .replace(/{contact_name}/g, contactName)
      .replace(/{artist_name}/g, artistName)
      .replace(/{genre}/g, genre)
      .replace(/{instagram}/g, instagram);

    // Also handle subject line if present
    let subject = template.subject || '';
    if (subject) {
      subject = subject
        .replace(/{venue_name}/g, venueName)
        .replace(/{contact_name}/g, contactName)
        .replace(/{artist_name}/g, artistName)
        .replace(/{genre}/g, genre);
    }

    onSelectTemplate({ body: message, subject });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: COLORS.surface,
          borderRadius: 12,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${COLORS.border}`
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>
              Choose a Template
            </h2>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: '4px 0 0 0' }}>
              For {lead.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 24,
              lineHeight: 1,
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 16 }}>
                No templates yet
              </div>
              <button
                onClick={() => {
                  onClose();
                  // Switch to Templates tab
                  window.dispatchEvent(new CustomEvent('switchToTemplates'));
                }}
                style={{
                  padding: '10px 20px',
                  background: COLORS.purple,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Create Your First Template
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = COLORS.purpleBg;
                    e.currentTarget.style.borderColor = COLORS.purple + '44';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = COLORS.bg;
                    e.currentTarget.style.borderColor = COLORS.border;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                      {template.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: COLORS.textMuted,
                      background: COLORS.surface,
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {template.category}
                    </div>
                  </div>
                  {template.subject && (
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, fontStyle: 'italic' }}>
                      Subject: {template.subject}
                    </div>
                  )}
                  <div style={{
                    fontSize: 12,
                    color: COLORS.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}>
                    {template.body}
                  </div>
                  {template.use_count > 0 && (
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                      Used {template.use_count} time{template.use_count !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// SmartSuggestions Component - AI-powered lead suggestions via Claude
function SmartSuggestionsModal({ supabase, user, currentLead, artistGenre, onClose, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [added, setAdded]             = useState(new Set());

  useEffect(() => { loadSuggestions(); }, []);

  async function loadSuggestions() {
    setLoading(true); setError("");
    try {
      const { data: existingLeads } = await supabase
        .from("leads").select("name, city, country, tag, tier").eq("user_id", user.id);

      const res = await supabase.functions.invoke("ai-lead-suggestions", {
        body: { currentLead, existingLeads: existingLeads || [], artistGenre },
      });
      if (res.error) throw new Error(res.error.message);
      setSuggestions(res.data?.suggestions || []);
    } catch {
      setError("Couldn't load suggestions — try again.");
    }
    setLoading(false);
  }

  async function handleAdd(s, idx) {
    const { error } = await supabase.from("leads").insert([{
      user_id: user.id,
      name: s.name,
      instagram: s.instagram || null,
      tier: s.tier || currentLead.tier,
      tag: s.tag || currentLead.tag,
      city: s.city || null,
      country: s.country || null,
      stage: "target",
      notes: s.notes || null,
      archived: false,
    }]);
    if (!error) {
      setAdded(prev => new Set([...prev, idx]));
      showDomToast(`✓ ${s.name} added to pipeline`);
      if (onAdd) onAdd();
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto", padding: 28 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>✦ AI Venue Suggestions</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
              Similar to <span style={{ color: COLORS.text2 }}>{currentLead.name}</span> · {currentLead.tag} · {currentLead.tier}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: COLORS.text2, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ height: 1, background: COLORS.border, margin: "14px 0" }} />

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textMuted }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.violetLight, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Claude is scanning the scene…</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 13, color: COLORS.red, marginBottom: 14 }}>{error}</div>
            <button onClick={loadSuggestions} style={{ background: COLORS.purpleBg, border: `1px solid ${COLORS.purple}`, borderRadius: 8, padding: "8px 20px", color: COLORS.purpleLight, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && suggestions.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.textMuted, fontSize: 13 }}>
            No suggestions returned — try a lead with more detail (city, tag, tier).
          </div>
        )}

        {/* Suggestions */}
        {!loading && !error && suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ background: COLORS.surface, border: `1px solid ${added.has(i) ? COLORS.green : COLORS.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12, transition: "border-color 0.2s" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{s.name}</span>
                    {s.tier && <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.text2, background: COLORS.surface2, borderRadius: 4, padding: "1px 6px" }}>{s.tier}</span>}
                    {s.tag && <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.purpleLight, background: COLORS.purpleBg, borderRadius: 4, padding: "1px 6px" }}>{s.tag}</span>}
                  </div>
                  {(s.city || s.country) && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>
                      📍 {[s.city, s.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {s.instagram && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{s.instagram}</div>
                  )}
                  {s.notes && (
                    <div style={{ fontSize: 11, color: COLORS.text2, fontStyle: "italic", lineHeight: 1.5 }}>{s.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(s, i)}
                  disabled={added.has(i)}
                  style={{ flexShrink: 0, background: added.has(i) ? "rgba(34,197,94,0.15)" : COLORS.purpleBg, border: `1px solid ${added.has(i) ? COLORS.green : COLORS.purple}`, borderRadius: 7, padding: "6px 14px", color: added.has(i) ? COLORS.green : COLORS.purpleLight, fontSize: 12, fontWeight: 700, cursor: added.has(i) ? "default" : "pointer", whiteSpace: "nowrap" }}
                >
                  {added.has(i) ? "✓ Added" : "+ Add"}
                </button>
              </div>
            ))}
            <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: "center", marginTop: 4 }}>
              ✦ AI-generated — verify venue details before reaching out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Smart Suggestions Button Component
// Used in LeadDetail panel to trigger suggestions
function SmartSuggestionsButton({ supabase, user, lead, onLeadAdded, artistGenre, totalLeads = 0, isAdmin = false }) {
  const [showModal, setShowModal] = useState(false);
  const locked = !isAdmin && totalLeads < 50;

  if (lead.archived || lead.stage === "booked") return null;

  return (
    <>
      <button
        onClick={() => !locked && setShowModal(true)}
        style={{ background: COLORS.purpleBg, color: locked ? COLORS.textMuted : COLORS.purpleLight, border: `1px solid ${COLORS.purpleDim}`, padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: locked ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, width: "100%" }}
      >
        <span>✦</span>
        <span>AI Venue Suggestions</span>
        {locked && <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: "rgba(14,116,144,0.15)", border: `1px solid rgba(14,116,144,0.35)`, color: COLORS.purpleLight }}>PRO+</span>}
      </button>

      {showModal && (
        <SmartSuggestionsModal
          supabase={supabase}
          user={user}
          currentLead={lead}
          artistGenre={artistGenre}
          onClose={() => setShowModal(false)}
          onAdd={onLeadAdded}
        />
      )}
    </>
  );
}


// Quick Actions & Keyboard Shortcuts (Bundle 5.4)
// Quick Actions & Keyboard Shortcuts (Bundle 5.4)
// Global keyboard shortcuts for power users

// Keyboard Shortcuts Hook
function useKeyboardShortcuts({ 
  onNewLead, 
  onImportCSV, 
  onSearch,
  onCloseModal,
  searchInputRef 
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);

      // Esc - Close modals, but NOT when user is actively typing (e.g. compose panel)
      if (e.key === 'Escape') {
        if (!isTyping) onCloseModal?.();
        return;
      }

      // Don't trigger other shortcuts while typing
      if (isTyping) return;

      // Cmd/Ctrl + K - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
        searchInputRef?.current?.focus();
        return;
      }

      // N - New lead
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewLead?.();
        return;
      }

      // I - Import CSV
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onImportCSV?.();
        return;
      }

      // ? - Show help
      if (e.key === '?') {
        e.preventDefault();
        // Will be handled by parent component
        const helpEvent = new CustomEvent('showShortcutsHelp');
        window.dispatchEvent(helpEvent);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewLead, onImportCSV, onSearch, onCloseModal, searchInputRef]);
}

// Shortcuts Help Modal
function ShortcutsHelpModal({ onClose }) {
  const shortcuts = [
    { key: 'N', action: 'New Lead', description: 'Open add lead form' },
    { key: 'I', action: 'Import CSV', description: 'Open CSV import modal' },
    { key: 'Cmd + K', action: 'Search', description: 'Focus search bar' },
    { key: 'Esc', action: 'Close', description: 'Close any open modal' },
    { key: '?', action: 'Help', description: 'Show this shortcuts guide' },
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          width: '100%',
          maxWidth: 500,
          padding: 32
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <h3 style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: COLORS.text 
            }}>
              Keyboard Shortcuts
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.text2,
                fontSize: 28,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: 14, color: COLORS.text2 }}>
            Speed up your workflow with keyboard shortcuts
          </p>
        </div>

        {/* Shortcuts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 12,
                background: COLORS.surface,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`
              }}
            >
              {/* Key Badge */}
              <div style={{
                minWidth: 80,
                padding: '6px 12px',
                background: COLORS.bg,
                border: `2px solid ${COLORS.border}`,
                borderRadius: 6,
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.text
              }}>
                {shortcut.key}
              </div>

              {/* Action & Description */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: COLORS.text,
                  marginBottom: 2
                }}>
                  {shortcut.action}
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: COLORS.text2 
                }}>
                  {shortcut.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: COLORS.purple + '10',
          borderRadius: 10,
          fontSize: 13,
          color: COLORS.text2,
          textAlign: 'center'
        }}>
          💡 Press <kbd style={{ 
            background: COLORS.bg, 
            padding: '2px 6px', 
            borderRadius: 4,
            border: `1px solid ${COLORS.border}`,
            fontFamily: 'monospace'
          }}>?</kbd> anytime to see this guide
        </div>
      </div>
    </div>
  );
}

// Quick Actions Floating Button (Mobile/Desktop)
// Shows ? button in bottom-right corner
function QuickActionsButton({ onShowHelp, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onShowHelp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: isMobile ? 72 : 24,
        right: 24,
        width: 48,
        height: 48,
        background: isHovered ? COLORS.purpleLight : COLORS.purple,
        border: 'none',
        borderRadius: '50%',
        color: 'white',
        fontSize: 20,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(107, 47, 212, 0.3)',
        transition: 'all 0.2s',
        zIndex: 999,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)'
      }}
      title="Keyboard shortcuts (press ?)"
    >
      ?
    </button>
  );
}

// Tooltip Component for Quick Actions
function QuickActionTooltip({ children, text, shortcut }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          padding: '6px 12px',
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          fontSize: 12,
          color: COLORS.text,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {text}
          {shortcut && (
            <kbd style={{
              marginLeft: 8,
              padding: '2px 6px',
              background: COLORS.surface,
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
              fontFamily: 'monospace',
              fontSize: 11
            }}>
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}


// AnalyticsView Component - Insert this into App.jsx

function AnalyticsView({ userId, supabase, COLORS, TAG_COLORS = {}, isMobile }) {
  const [stats, setStats] = useState(null);
  const [tierStats, setTierStats] = useState([]);
  const [tagStats, setTagStats] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const normalizeStage = (stage) => String(stage || "").toLowerCase();

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: allLeads, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const leads = allLeads || [];
      const activeLeads = leads.filter(l => !l.archived);

      const total = activeLeads.length;
      const target = activeLeads.filter(l => normalizeStage(l.stage) === "target").length;
      const contacted = activeLeads.filter(l => normalizeStage(l.stage) !== "target").length;
      const replied = activeLeads.filter(l => ["replied", "booked"].includes(normalizeStage(l.stage))).length;
      const booked = activeLeads.filter(l => normalizeStage(l.stage) === "booked").length;

      setStats({
        total_leads: total,
        target_count: target,
        contacted_count: contacted,
        replied_count: replied,
        booked_count: booked,
        conversion_rate: total > 0 ? Math.round((booked / total) * 100) : 0,
        response_rate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
      });

      const tiers = ["A1", "A2", "A3"].map(tier => {
        const tierLeads = activeLeads.filter(l => l.tier === tier);
        const tierContacted = tierLeads.filter(l => normalizeStage(l.stage) !== "target").length;
        const tierReplied = tierLeads.filter(l => ["replied", "booked"].includes(normalizeStage(l.stage))).length;

        return {
          tier,
          total_leads: tierLeads.length,
          response_rate: tierContacted > 0 ? Math.round((tierReplied / tierContacted) * 100) : 0,
        };
      }).filter(t => t.total_leads > 0);

      setTierStats(tiers);

      const tagMap = {};
      activeLeads.forEach(lead => {
        const tag = lead.tag || "Untagged";
        if (!tagMap[tag]) tagMap[tag] = { tag, total_leads: 0, contacted: 0, replied: 0 };
        tagMap[tag].total_leads += 1;
        if (normalizeStage(lead.stage) !== "target") tagMap[tag].contacted += 1;
        if (["replied", "booked"].includes(normalizeStage(lead.stage))) tagMap[tag].replied += 1;
      });

      const tags = Object.values(tagMap)
        .map(tag => ({
          tag: tag.tag,
          total_leads: tag.total_leads,
          response_rate: tag.contacted > 0 ? Math.round((tag.replied / tag.contacted) * 100) : 0,
        }))
        .sort((a, b) => b.response_rate - a.response_rate);

      setTagStats(tags);

      const { data: activity } = await supabase
        .rpc("get_user_weekly_activity", { p_user_id: userId, p_weeks: 8 });

      setWeeklyActivity(activity || []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: COLORS.textSecondary }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div>Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: COLORS.textSecondary }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div>No analytics data available yet.</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Add some leads to see your stats!</div>
      </div>
    );
  }

  const maxWeeklyLeads = Math.max(...weeklyActivity.map(w => parseInt(w.leads_added) || 0), 1);
  const maxWeeklyGigs = Math.max(...weeklyActivity.map(w => parseInt(w.gigs_booked) || 0), 1);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Key Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Leads",     value: stats.total_leads,           color: COLORS.purpleLight },
          { label: "Total Gigs",      value: stats.booked_count,          color: COLORS.green       },
          { label: "Conversion Rate", value: `${stats.conversion_rate}%`, color: COLORS.purpleLight },
          { label: "Response Rate",   value: `${stats.response_rate}%`,   color: COLORS.purpleLight },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.borderHover}`,
            borderTop: `3px solid ${card.color}`,
            borderRadius: 12,
            padding: "20px 24px",
          }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {card.label}
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: card.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel — same 4-col grid as stat cards */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Pipeline Conversion Funnel</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16, alignItems: "end" }}>
          {[
            { label: "Target",    count: stats.target_count,    color: COLORS.text3,       width: 100 },
            { label: "Contacted", count: stats.contacted_count, color: COLORS.purple,      width: stats.total_leads > 0     ? (stats.contacted_count / stats.total_leads) * 100  : 0 },
            { label: "Replied",   count: stats.replied_count,   color: COLORS.violetLight, width: stats.contacted_count > 0 ? (stats.replied_count / stats.contacted_count) * 100 : 0 },
            { label: "Booked",    count: stats.booked_count,    color: COLORS.green,       width: stats.replied_count > 0   ? (stats.booked_count / stats.replied_count) * 100   : 0 },
          ].map((stage, i) => {
            const isBooked = i === 3;
            return (
              <div key={stage.label} style={{ background: COLORS.surface, border: `1px solid ${isBooked ? stage.color + "60" : COLORS.borderHover}`, borderTop: `3px solid ${stage.color}`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: stage.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{stage.label}</div>
                <div style={{ fontSize: isBooked ? 36 : 28, fontWeight: 800, color: stage.color, fontFamily: "'DM Mono', monospace", lineHeight: 1, marginBottom: 12 }}>{stage.count}</div>
                <div style={{ height: 8, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(stage.width, 4)}%`, background: stage.color, borderRadius: 4, opacity: isBooked ? 1 : 0.8 }} />
                </div>
                <div style={{ fontSize: 11, color: stage.color, fontWeight: 700, marginTop: 6 }}>{Math.round(stage.width)}%{i > 0 ? " conversion" : " of pipeline"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Activity Chart */}
      {weeklyActivity.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Activity Timeline (Last 8 Weeks)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200 }}>
            {weeklyActivity.map(week => {
              const leadsHeight = (parseInt(week.leads_added) / maxWeeklyLeads) * 180;
              const gigsHeight = (parseInt(week.gigs_booked) / maxWeeklyGigs) * 180;
              const weekLabel = new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              return (
                <div key={week.week_start} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", gap: 2, height: 180, alignItems: "flex-end" }}>
                    <div style={{
                      width: 16,
                      height: leadsHeight || 4,
                      background: COLORS.purple,
                      borderRadius: 4,
                      position: "relative",
                    }} title={`${week.leads_added} leads`} />
                    <div style={{
                      width: 16,
                      height: gigsHeight || 4,
                      background: COLORS.green,
                      borderRadius: 4,
                      position: "relative",
                    }} title={`${week.gigs_booked} gigs`} />
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.text3, transform: "rotate(-45deg)", transformOrigin: "center", marginTop: 8 }}>
                    {weekLabel}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 20, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, background: COLORS.purple, borderRadius: 2 }} />
              <span style={{ color: COLORS.textSecondary }}>Leads Added</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, background: COLORS.green, borderRadius: 2 }} />
              <span style={{ color: COLORS.textSecondary }}>Gigs Booked</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Tier Performance */}
        {tierStats.length > 0 && (
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Performance by Tier</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "8px 0", textAlign: "left", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>Tier</th>
                  <th style={{ padding: "8px 0", textAlign: "right", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>Leads</th>
                  <th style={{ padding: "8px 0", textAlign: "right", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>Response%</th>
                </tr>
              </thead>
              <tbody>
                {tierStats.map(tier => {
                  const tierColor = { A1: COLORS.purpleLight, A2: COLORS.purple, A3: COLORS.textSecondary }[tier.tier] || COLORS.textSecondary;
                  return (
                    <tr key={tier.tier} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "10px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: tierColor, flexShrink: 0, boxShadow: `0 0 6px ${tierColor}88` }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: tierColor }}>{tier.tier}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontSize: 14, color: COLORS.textSecondary }}>{tier.total_leads}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontSize: 14, fontWeight: 600, color: tier.response_rate > 0 ? COLORS.green : COLORS.text3 }}>
                        {tier.response_rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tag Performance */}
        {tagStats.length > 0 && (
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Performance by Tag</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "8px 0", textAlign: "left", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>Tag</th>
                  <th style={{ padding: "8px 0", textAlign: "right", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>Leads</th>
                  <th style={{ padding: "8px 0", textAlign: "right", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>Response%</th>
                </tr>
              </thead>
              <tbody>
                {tagStats.slice(0, 10).map(tag => {
                  const tagColor = TAG_COLORS[tag.tag] || COLORS.textSecondary;
                  return (
                    <tr key={tag.tag} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "10px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: tagColor, flexShrink: 0, boxShadow: `0 0 5px ${tagColor}77` }} />
                          <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{tag.tag}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontSize: 14, color: COLORS.textSecondary }}>{tag.total_leads}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontSize: 14, fontWeight: 600, color: tag.response_rate > 0 ? COLORS.green : COLORS.text3 }}>
                        {tag.response_rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


function MobileBottomNav({ activeTab, setActiveTab, dueCount, unreadCount, inboundCount }) {
  const [showMore, setShowMore] = useState(false);

  // Primary tabs always visible in the bar
  const PRIMARY = [
    { id: 'dashboard',   Icon: IconDashboard,  label: 'Home' },
    { id: 'pipeline',    Icon: IconPipeline,   label: 'Pipeline' },
    { id: 'followups',   Icon: IconFollowUps,  label: 'Follow-ups', badge: dueCount },
    { id: 'bookingdesk', Icon: IconReplyHub,   label: 'Reply', badge: unreadCount },
  ];

  // Secondary tabs shown in the "More" sheet
  const MORE_ITEMS = [
    { id: 'inbound',    Icon: IconInbound,    label: 'Inbound',     badge: inboundCount },
    { id: 'calendar',   Icon: IconCalendar,   label: 'Calendar' },
    { id: 'contacts',   Icon: IconContacts,   label: 'Contacts' },
    { id: 'analytics',  Icon: IconAnalytics,  label: 'Analytics' },
    { id: 'bookingkit', Icon: IconBookingKit, label: 'Booking Kit' },
    { id: 'outreach',   Icon: IconOutreach,   label: 'Templates' },
    { id: 'settings',   Icon: IconSettings,   label: 'Settings' },
  ];

  const moreActive = MORE_ITEMS.some(i => i.id === activeTab);

  const navigate = (id) => {
    setActiveTab(id);
    setShowMore(false);
  };

  return (
    <>
      {/* Bottom nav bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
        background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`,
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {PRIMARY.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{
              flex: 1, padding: '10px 4px 8px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              position: 'relative',
            }}>
              {item.badge > 0 && (
                <div style={{
                  position: 'absolute', top: 6, right: '50%', marginRight: -18,
                  background: COLORS.purple, color: '#fff',
                  borderRadius: 8, padding: '0 4px',
                  fontSize: 9, fontWeight: 800, lineHeight: '14px',
                  minWidth: 14, textAlign: 'center',
                }}>{item.badge}</div>
              )}
              <item.Icon size={20} color={active ? COLORS.purple : COLORS.textMuted} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? COLORS.purple : COLORS.text3 }}>{item.label}</span>
              {active && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: COLORS.purple, borderRadius: 2 }} />}
            </button>
          );
        })}

        {/* Hamburger / More button */}
        <button onClick={() => setShowMore(v => !v)} style={{
          flex: 1, padding: '10px 4px 8px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          position: 'relative',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5"  width="18" height="2" rx="1" fill={moreActive || showMore ? COLORS.purple : COLORS.textMuted} />
            <rect x="3" y="11" width="18" height="2" rx="1" fill={moreActive || showMore ? COLORS.purple : COLORS.textMuted} />
            <rect x="3" y="17" width="18" height="2" rx="1" fill={moreActive || showMore ? COLORS.purple : COLORS.textMuted} />
          </svg>
          <span style={{ fontSize: 9, fontWeight: (moreActive || showMore) ? 700 : 500, color: (moreActive || showMore) ? COLORS.purple : COLORS.text3 }}>Menu</span>
          {(moreActive || showMore) && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: COLORS.purple, borderRadius: 2 }} />}
        </button>
      </div>

      {/* More sheet — slides up from bottom */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div onClick={() => setShowMore(false)} style={{
            position: 'fixed', inset: 0, zIndex: 290,
            background: 'rgba(0,0,0,0.5)',
          }} />
          {/* Sheet */}
          <div style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 295,
            background: COLORS.surface,
            borderTop: `1px solid ${COLORS.border}`,
            borderRadius: '16px 16px 0 0',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)',
            padding: '12px 0 calc(env(safe-area-inset-bottom, 0px) + 64px)',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: COLORS.border, borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {MORE_ITEMS.map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => navigate(item.id)} style={{
                    padding: '14px 4px 10px',
                    background: active ? COLORS.purpleBg : 'transparent',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    position: 'relative',
                  }}>
                    {item.badge > 0 && (
                      <div style={{
                        position: 'absolute', top: 10, right: '50%', marginRight: -18,
                        background: COLORS.purple, color: '#fff',
                        borderRadius: 8, padding: '0 4px',
                        fontSize: 9, fontWeight: 800, lineHeight: '14px',
                        minWidth: 14, textAlign: 'center',
                      }}>{item.badge}</div>
                    )}
                    <item.Icon size={22} color={active ? COLORS.purple : COLORS.textMuted} />
                    <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? COLORS.purple : COLORS.text }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}


function ReviewNudgeModal({ lead, onClose, reviewEmail }) {
  const subject = encodeURIComponent(`NoxReach feedback — ${lead.name} booked!`);
  const body = encodeURIComponent(
`Hey,

I just booked ${lead.name} using NoxReach and wanted to share my experience.

[Write one or two sentences about how NoxReach helped you get this booking]

Feel free to use this as a testimonial on the site.

— [Your name / DJ handle]`
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }`}</style>
      <div style={{
        background: "#111111",
        border: `1px solid ${COLORS.purpleDim}`,
        borderRadius: 20, width: 420, maxWidth: "95vw",
        overflow: "hidden",
        boxShadow: `0 0 80px rgba(212,175,55,0.15), 0 32px 80px rgba(0,0,0,0.7)`,
        animation: "slideUp 0.2s ease",
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleLight})` }} />
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>
            {lead.name} is booked!
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
            Congrats on the booking. Would you take 30 seconds to share what helped?
            Your feedback helps NoxReach grow — and gets you featured on the site.
          </div>
          <div style={{
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: "14px 16px", marginBottom: 24, textAlign: "left",
          }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>What happens</div>
            {[
              "Opens your email with the message pre-filled",
              "You edit and hit send — takes 30 seconds",
              "Best quotes get featured on NoxReach.io",
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: COLORS.purpleBg, border: `1px solid ${COLORS.purpleDim}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: COLORS.purpleLight, fontWeight: 800 }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href={`mailto:${reviewEmail}?subject=${subject}&body=${body}`}
              onClick={onClose}
              style={{
                display: "block", padding: "13px",
                background: COLORS.purple,
                borderRadius: 12, color: "#fff",
                fontSize: 14, fontWeight: 800,
                textDecoration: "none", textAlign: "center",
                boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
              }}>
              Share my experience
            </a>
            <button onClick={onClose} style={{
              padding: "10px", background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12, color: COLORS.textMuted,
              fontSize: 12, cursor: "pointer",
            }}>
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function OutreachMethodModal({ lead, onClose, onSelect, templates }) {
  const METHODS = [
    { id: "email",    Icon: IconMail,      label: "Email",        hasTemplate: true  },
    { id: "instagram",Icon: IconInstagram, label: "Instagram DM", hasTemplate: false },
    { id: "whatsapp", Icon: IconWhatsApp,  label: "WhatsApp",     hasTemplate: false },
    { id: "phone",    Icon: IconPhone,     label: "Phone",        hasTemplate: false },
    { id: "other",    Icon: IconOutreach,  label: "Other",        hasTemplate: false },
  ];

  const buildMailto = () => {
    const template = templates.find(t => t.id === "berlin");
    const body = template ? template.text : "Hey,\n\nI wanted to reach out about a potential booking.";
    const subject = encodeURIComponent("Booking Inquiry");
    const encodedBody = encodeURIComponent(body.replace("[Name]", lead.name));
    const email = lead.contact || "";
    return "mailto:" + email + "?subject=" + subject + "&body=" + encodedBody;
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }`}</style>
      <div style={{
        background: COLORS.surface, border: "1px solid " + COLORS.purpleDim,
        borderRadius: 20, width: 400, maxWidth: "95vw",
        overflow: "hidden", animation: "slideUp 0.2s ease",
        boxShadow: "0 0 60px rgba(14,116,144,0.10), 0 32px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, " + COLORS.purple + ", " + COLORS.purpleLight + ")" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>
            How did you reach out?
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 20 }}>
            {lead.name} · log your outreach method
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {METHODS.map(method => (
              <button key={method.id}
                onClick={() => {
                  if (method.id === "email") {
                    window.open(buildMailto(), "_blank");
                  }
                  onSelect(method.id);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 16px", borderRadius: 10, cursor: "pointer",
                  background: COLORS.bg, border: "1px solid " + COLORS.border,
                  transition: "all 0.15s", textAlign: "left",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = COLORS.purple;
                  e.currentTarget.style.background = COLORS.purpleBg;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.background = COLORS.bg;
                }}
              >
                <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><method.Icon size={18} color={COLORS.purpleLight} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{method.label}</div>
                  {method.hasTemplate && (
                    <div style={{ fontSize: 11, color: COLORS.purple, marginTop: 2 }}>Opens email with template pre-filled →</div>
                  )}
                </div>
                <span style={{ fontSize: 14, color: COLORS.textMuted }}>›</span>
              </button>
            ))}
          </div>

          <button onClick={onClose} style={{
            width: "100%", marginTop: 12, padding: "10px",
            background: "transparent", border: "1px solid " + COLORS.border,
            borderRadius: 10, color: COLORS.textMuted, fontSize: 12, cursor: "pointer",
          }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function NoxReachApp({ user, session, supabase }) {
  const userEmail = user?.email || "";
  const isMobile  = useIsMobile();
  // display_name from profiles takes priority over auth full_name
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const userName = profileDisplayName || user?.user_metadata?.full_name || userEmail.split("@")[0] || "DJ";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Theme toggle ────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') !== 'light'
  );
  const toggleTheme = () => {
    const nowLight = isDark; // about to switch to light
    if (nowLight) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('nox-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('nox-theme', 'dark');
    }
    setIsDark(!isDark);
  };
  // ────────────────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab]       = useState("pipeline");

  // Listen for "Add to Calendar" from booked cards
  useEffect(() => {
    const handleSwitch = (e) => {
      setActiveTab("calendar");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('addGigFromBooked', { 
          detail: e.detail 
        }));
      }, 100);
    };
    window.addEventListener('switchToCalendar', handleSwitch);
    return () => window.removeEventListener('switchToCalendar', handleSwitch);
  }, []);
  const [leads, setLeads]               = useState([]);
  const [gigs,  setGigs]                = useState([]);
  const [dataLoading, setDataLoading]   = useState(true);
  const [settings, setSettings]         = useState(() => loadSettings());
  const [isPro, setIsPro]               = useState(() => loadIsPro(user.id));
  const [isAdmin, setIsAdmin]           = useState(false);
  const [adminUsers, setAdminUsers]     = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserLeads, setSelectedUserLeads] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [adminEmailSends, setAdminEmailSends]   = useState([]);
  const emailTotal = adminEmailSends.reduce((s, x) => s + (x.count || 0), 0);
  const [adminRefCodes, setAdminRefCodes]       = useState({ permanent: "", trial: "" });
  const [adminRefCopied, setAdminRefCopied]     = useState(null); // "permanent" | "trial" | null
  const [emailUnreadCount, setEmailUnreadCount] = useState(0);

  const [showWelcomeNew, setShowWelcomeNew] = useState(() => {
    try { return !localStorage.getItem("nr_welcomed_" + user.id); } catch { return true; }
  });

  const dismissWelcomeNew = () => {
    try { localStorage.setItem("nr_welcomed_" + user.id, "1"); } catch {}
    setShowWelcomeNew(false);
  };


  useEffect(function() {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);

    // Returning from Gmail OAuth
    if (params.get("gmail_connected") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      setActiveTab("settings");
      showToast("Gmail connected successfully!", "success");
      // SettingsView reloads email_connections on mount — no action needed here
    }
    if (params.get("gmail_error")) {
      window.history.replaceState({}, "", window.location.pathname);
      setActiveTab("settings");
      showToast(`Gmail connection failed: ${params.get("gmail_error")}`, "error");
    }

    // Returning from Outlook OAuth
    if (params.get("outlook_connected") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      setActiveTab("settings");
      showToast("Outlook connected successfully!", "success");
    }
    if (params.get("outlook_error")) {
      window.history.replaceState({}, "", window.location.pathname);
      setActiveTab("settings");
      showToast(`Outlook connection failed: ${params.get("outlook_error")}`, "error");
    }

    // Check if returning from Stripe checkout
    const fromStripe = params.get("upgraded") === "true";
    if (fromStripe) {
      window.history.replaceState({}, "", window.location.pathname);
      // Poll for pro status — webhook may take a few seconds
      let attempts = 0;
      const pollPro = async () => {
        attempts++;
        const { data } = await supabase.from("profiles").select("is_pro, pro_expires_at").eq("id", user.id).single();
        const trialActive = data?.pro_expires_at && new Date(data.pro_expires_at) > new Date();
        if (data?.is_pro || trialActive) {
          setIsPro(true);
          saveIsPro(true, user.id);
          localStorage.setItem("nr_pro_welcomed_" + user.id, "1");
          setShowWelcomePro(true);
        } else if (attempts < 6) {
          setTimeout(pollPro, 2000);
        }
      };
      setTimeout(pollPro, 2000);
      return;
    }
    // Try to apply a referral-based PRO upgrade first (no-op if not eligible)
    supabase.rpc("apply_referral_pro_upgrade", { p_user_id: user.id }).then(() => {
      // Then read the (possibly just-updated) pro status
      supabase.from("profiles").select("is_pro, pro_expires_at, is_admin, display_name").eq("id", user.id).single()
        .then(function(r) {
          const data = r["data"];
          if (!data) return;
          if (data.is_admin) setIsAdmin(true);
          if (data.display_name) setProfileDisplayName(data.display_name);
          const trialActive = data.pro_expires_at && new Date(data.pro_expires_at) > new Date();
          const isPaid = data.is_pro;
          const returningFromStripe = new URLSearchParams(window.location.search).get("upgraded") === "true";
          if (isPaid || trialActive) {
            setIsPro(true);
            saveIsPro(true, user.id);
            const proKey = "nr_pro_welcomed_" + user.id;
            try {
              if (!localStorage.getItem(proKey) || returningFromStripe) {
                localStorage.setItem(proKey, "1");
                setShowWelcomePro(true);
              }
            } catch {}
          }
        });
    });
  }, [user]);
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [customTags, setCustomTags]     = useState(() => loadCustomTags());
  const [onboardingAssets, setOnboardingAssets] = useState(null);

  // Load assets for onboarding check
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("user_assets").select("epk_url,soundcloud,booking_email").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }) => setOnboardingAssets(error ? {} : (data || {})));
  }, [user?.id]);

  // ── Load user's leads + gigs from Supabase ───────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setDataLoading(true);
    try {
      const [leadsRes, gigsRes] = await Promise.all([
        supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("gigs").select("*").eq("user_id", user.id).order("date", { ascending: true }),
      ]);
      if (leadsRes.data) setLeads(leadsRes.data.map(dbToLead));
      if (gigsRes.data)  setGigs(gigsRes.data.map(dbToGig));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Fetch unread email_replies count for sidebar badge
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("email_replies").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("is_read", false)
      .then(({ count }) => { if (count !== null) setEmailUnreadCount(count); });
  }, [user?.id]);

const loadAdminUsers = async () => {
    if (!isAdmin) return;
    setLoadingAdminData(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, is_pro, health_status, last_health_check, created_at, email");


      const enriched = await Promise.all(
        (profiles || []).map(async (p) => {
          const [leadsRes, gigsRes] = await Promise.all([
            supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", p.id).eq("archived", false),
            supabase.from("gigs").select("*",  { count: "exact", head: true }).eq("user_id", p.id),
          ]);
          
          
          return { ...p, leadCount: leadsRes.count || 0, gigCount: gigsRes.count || 0 };
        })
      );

      setAdminUsers(enriched);
    } catch (err) {
      console.error("Failed to load admin users:", err);
    }
    setLoadingAdminData(false);
  };


  useEffect(() => {
    if (activeTab === "admin" && isAdmin) {
      loadAdminUsers();
      // Fetch admin's referral codes once
      supabase.from("profiles")
        .select("referral_code, referral_code_trial")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setAdminRefCodes({ permanent: data.referral_code || "", trial: data.referral_code_trial || "" });
        });
    }
  }, [activeTab]);

  const loadUserLeads = async (userId) => {
  try {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setSelectedUserLeads(data || []);
  } catch (err) {
    console.error("Failed to load user leads:", err);
    setSelectedUserLeads([]);
  }
};
  
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);

  useEffect(() => {
    window.__selectedLeads = selectedLeads;
    setShowBulkBar(selectedLeads.size > 0);
  }, [selectedLeads]);

  const toggleLeadSelection = (leadId) => {
    const id = String(leadId);
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInStage = (stage) => {
    const stageIds = leads
      .filter(l => l.stage === stage && !l.archived)
      .map(l => String(l.id));

    setSelectedLeads(prev => {
      const next = new Set(prev);
      const allSelected = stageIds.length > 0 && stageIds.every(id => next.has(id));

      if (allSelected) {
        stageIds.forEach(id => next.delete(id));
      } else {
        stageIds.forEach(id => next.add(id));
      }

      return next;
    });
  };

  if (typeof window !== 'undefined') {
    window.toggleLeadSelection = toggleLeadSelection;
    window.selectAllInStage = selectAllInStage;
  }

  const bulkMoveTo = async (stage) => {
    const ids = Array.from(selectedLeads);
    await supabase.from('leads').update({ stage }).in('id', ids);
    await loadData();
    setSelectedLeads(new Set());
    setShowBulkBar(false);
  };
  
  const bulkArchive = async () => {
    const ids = Array.from(selectedLeads);
    if (ids.length > 2 && !confirm(`Archive ${ids.length} leads?`)) return;
    await supabase.from('leads').update({ archived: true }).in('id', ids);
    await loadData();
    setSelectedLeads(new Set());
    setShowBulkBar(false);
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedLeads);
    await supabase.from('leads').delete().in('id', ids);
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    if (selectedLead && ids.includes(selectedLead.id)) setSelectedLead(null);
    setSelectedLeads(new Set());
    setShowBulkBar(false);
  };
  
  // Per-tag color overrides (user-picked or auto-assigned)
  const [tagColorMap, setTagColorMap] = useState(() => {
    const stored = loadTagColors();
    // Seed any missing tags with unique colors on first load
    const tags = loadCustomTags();
    const used = Object.values(stored);
    tags.forEach(t => { if (!stored[t]) { stored[t] = pickNextColor([...used]); used.push(stored[t]); } });
    return stored;
  });

  // Derived TAG_COLORS: override map first, fallback to auto-pick
  const TAG_COLORS = Object.fromEntries(customTags.map(t => [t, tagColorMap[t] || TAG_PALETTE[0]]));

  const addCustomTag = (tag) => {
    const clean = tag.trim();
    if (!clean || customTags.includes(clean)) return false;
    const next = [...customTags, clean];
    setCustomTags(next);
    saveCustomTags(next);
    // Assign a unique color for the new tag
    const usedColors = Object.values(tagColorMap);
    const newColor = pickNextColor(usedColors);
    const nextMap = { ...tagColorMap, [clean]: newColor };
    setTagColorMap(nextMap);
    saveTagColors(nextMap);
    return true;
  };

  const removeCustomTag = (tag) => {
    const next = customTags.filter(t => t !== tag);
    setCustomTags(next);
    saveCustomTags(next);
  };

  const setTagColor = (tag, color) => {
    const nextMap = { ...tagColorMap, [tag]: color };
    setTagColorMap(nextMap);
    saveTagColors(nextMap);
  }; // null or reason string
  const [selectedLead, setSelectedLead] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef(null);

  // Keyboard shortcuts hook (Bundle 5.4)
  useKeyboardShortcuts({
    onNewLead: () => {
      if (activeTab === "pipeline") setShowAddLead(true);
    },
    onImportCSV: () => {
      if (activeTab === "pipeline") setShowCSVImport(true);
    },
    onSearch: () => {
      if (activeTab === "pipeline" && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    onCloseModal: () => {
      setShowAddLead(false);
      setShowCSVImport(false);
      setShowShortcutsHelp(false);
      setSelectedLead(null);
    },
    searchInputRef
  });

  // Listen for help shortcut
  useEffect(() => {
    function handleShowHelp() {
      setShowShortcutsHelp(true);
    }
    window.addEventListener('showShortcutsHelp', handleShowHelp);
    return () => window.removeEventListener('showShortcutsHelp', handleShowHelp);
  }, []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [reviewNudge, setReviewNudge] = useState(null);
  const [toast, setToast]               = useState(null);

  // Search + filter state lives here so header can own the bar
  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState({ tier: null, tag: null, stage: null });

  // Leads + gigs are saved to Supabase on each mutation (see addLead, moveLead, etc.)

  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const [showWelcomePro, setShowWelcomePro] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_WHATS_NEW + APP_VERSION) !== "1"; } catch { return false; }
  });
  const dismissWhatsNew = () => {
    try { localStorage.setItem(STORAGE_KEY_WHATS_NEW + APP_VERSION, "1"); } catch {}
    setShowWhatsNew(false);
  };
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try { return localStorage.getItem("noxreach_onboarding_done_" + user.id) === "true"; } catch { return false; }
  });
  const requestUpgrade = (reason) => setUpgradeModal(reason);

  const handleUpgrade = async (plan = "monthly") => {
    try {
      showToast("Opening checkout...", "info");
      const stripeTab = window.open("", "_blank");
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { showToast("Please sign in first", "error"); if (stripeTab) stripeTab.close(); return; }
      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ plan }),
        }
      );
      const data = await res.json();
      if (data.url) { if (stripeTab) { stripeTab.location.href = data.url; } else { window.location.href = data.url; } }
      else { showToast(data.error || "Checkout failed", "error"); }
    } catch (e) { showToast("Checkout error: " + e.message, "error"); }
  };


  const addLead = async (lead) => {
    const activeCount = leads.filter(l => !l.archived).length;
    if (!isPro && activeCount >= FREE_LIMITS.leads) { requestUpgrade("leads"); return; }
    try {
      const { data, error } = await supabase.from("leads").insert([leadToDb(lead, user.id)]).select().single();
      if (error) throw error;
      setLeads(prev => [dbToLead(data), ...prev]);
      setActiveTab("pipeline");
      showToast(`${lead.name} added to pipeline`, "success");
    } catch (err) {
      showToast("Failed to save lead. Try again.", "info");
      console.error(err);
    }
  };

  const getAutoFollowUpDate = (newStage) => {
    const today = new Date();
    const add = d => { const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString().split("T")[0]; };
    if (newStage === "contacted") return add(settings.followup1Days);
    if (newStage === "followup1") return add(settings.followup2Days);
    if (newStage === "followup2") return add(settings.followup2Days);
    return null;
  };

  const FOLLOWUP_MESSAGES = {
    contacted: `Follow-up 1 scheduled in ${settings.followup1Days} days`,
    followup1: `Follow-up 2 scheduled in ${settings.followup2Days} days`,
    followup2: "Final follow-up scheduled", replied: "Nice — they replied! Move them to Replied.", booked: "🎉 Booked! You're on the lineup."
  };

  const saveSettingsHandler = (newSettings) => {
    if (!isPro) { requestUpgrade("settings"); return; }
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast("Settings saved", "success");
  };

  const moveLead = async (leadId, newStage) => {
    const today    = new Date().toISOString().split("T")[0];
    const autoDate = (!isPro && ["contacted","followup1","followup2"].includes(newStage)) ? null : getAutoFollowUpDate(newStage);
    const update   = l => ({ ...l, stage: newStage, lastContact: ["contacted","followup1","followup2"].includes(newStage) ? today : l.lastContact, followUpDate: autoDate !== undefined ? autoDate : l.followUpDate });
    // Optimistic UI update
    setLeads(prev => prev.map(l => l.id === leadId ? update(l) : l));
    if (selectedLead?.id === leadId) setSelectedLead(prev => update(prev));
    if (!isPro && ["contacted","followup1","followup2"].includes(newStage)) {
      showToast("Stage updated · Auto-scheduling is a Pro feature", "info");
    } else if (FOLLOWUP_MESSAGES[newStage]) {
      showToast(FOLLOWUP_MESSAGES[newStage], ["booked","replied"].includes(newStage) ? "success" : "schedule");
    }
    if (newStage === "booked") {
      const bookedLead = leads.find(l => l.id === leadId) || { id: leadId, name: "this venue" };
      setReviewNudge(bookedLead);
    }
    // Persist to Supabase
    try {
      const updated = update(leads.find(l => l.id === leadId) || {});
      await supabase.from("leads").update({
        stage: newStage,
        last_contact: updated.lastContact,
        follow_up_date: updated.followUpDate,
      }).eq("id", leadId).eq("user_id", user.id);
    } catch (err) { console.error("moveLead sync failed:", err); }
  };

  const updateLeadField = async (leadId, fields) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...fields } : l));
    if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, ...fields }));
    try {
      const dbFields = {};
      if (fields.outreachMethod !== undefined) dbFields.outreach_method = fields.outreachMethod;
      if (fields.contactLog !== undefined) dbFields.contact_log = fields.contactLog;
      if (fields.fee !== undefined) dbFields.fee = fields.fee;
      if (fields.deposit_paid !== undefined) dbFields.deposit_paid = fields.deposit_paid;
      if (Object.keys(dbFields).length > 0) {
        await supabase.from("leads").update(dbFields).eq("id", leadId).eq("user_id", user.id);
      }
    } catch (err) { console.error("updateLeadField failed:", err); }
  };

  const archiveLead = async (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    const nowArchived = !lead?.archived;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, archived: nowArchived } : l));
    showToast(nowArchived ? "Lead archived" : "Lead restored to pipeline", nowArchived ? "info" : "success");
    try {
      await supabase.from("leads").update({ archived: nowArchived }).eq("id", leadId).eq("user_id", user.id);
    } catch (err) { console.error("archiveLead sync failed:", err); }
  };

  const deleteLead = async (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.filter(l => l.id !== leadId));
    showToast(`${lead?.name || "Lead"} deleted`, "info");
    try {
      await supabase.from("leads").delete().eq("id", leadId).eq("user_id", user.id);
    } catch (err) { console.error("deleteLead sync failed:", err); }
  };

  const resetData = async () => {
    setLeads([]); setGigs([]); setSelectedLead(null);
    setShowResetConfirm(false); setSearch(""); setFilters({ tier: null, tag: null, stage: null });
    showToast("Pipeline cleared", "info");
    try {
      await Promise.all([
        supabase.from("leads").delete().eq("user_id", user.id),
        supabase.from("gigs").delete().eq("user_id", user.id),
      ]);
    } catch (err) { console.error("resetData sync failed:", err); }
  };
const _today = new Date();
const dueCount = leads.filter(l => {
    if (l.archived) return false;
    // Explicit follow-up date that's past
    if (l.followUpDate && new Date(l.followUpDate) <= _today) return true;
    // Stale: in contacted/followup stage with no date set and untouched for 3+ days
    if (!l.followUpDate && ["contacted","followup1","followup2"].includes(l.stage) && l.updatedAt) {
      const daysStale = (_today - new Date(l.updatedAt)) / (1000 * 60 * 60 * 24);
      if (daysStale >= 3) return true;
    }
    return false;
  }).length;
  const repliedCount = leads.filter(l => !l.archived && !l.is_inbound && (l.stage === "replied" || l.stage === "booked")).length;
  const inboundCount = leads.filter(l => !l.archived && l.is_inbound && l.stage === "replied").length;
  // Use real email_replies unread count when available, fallback to stage-based count
  const unreadCount  = useMemo(() => {
    if (emailUnreadCount > 0) return emailUnreadCount;
    try {
      const read = new Set(JSON.parse(localStorage.getItem("noxreach_read_replies") || "[]"));
      return leads.filter(l => !l.archived && !l.is_inbound && (l.stage === "replied" || l.stage === "booked") && !read.has(l.id)).length;
    } catch { return 0; }
  }, [leads, emailUnreadCount]);
const activeLeads = leads.filter(l => !l.archived);
  const hasFilter   = search || filters.tier || filters.tag || filters.stage;

  const exportCSV = () => {
    const cols = ["Venue", "Contact Email", "Instagram", "Stage", "Tier", "Tag", "Fee", "Follow-up Date", "Notes", "Contact Log"];
    const rows = activeLeads.map(l => [
      l.name, l.contact, l.instagram, l.stage, l.tier, l.tag,
      l.fee || "", l.followUpDate || "", l.notes, l.contactLog,
    ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));
    const csv = [cols.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `noxreach-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };
  // ── Loading screen while fetching user data ────────────────────────────────
  if (dataLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bgDeep, flexDirection: "column", gap: 16 }}>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        <div style={{ width: 36, height: 36, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.purple, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <div style={{ fontSize: 11, color: COLORS.text3, letterSpacing: "0.12em" }}>LOADING YOUR PIPELINE</div>
      </div>
    );
  }

  
  const TABS = [
    { id: "dashboard", label: "Dashboard",  icon: "▣",  group: "main" },
    { id: "analytics", label: "Analytics", icon: "📊", group: "main" },
    { id: "pipeline",  label: "Pipeline",   icon: "⬛", group: "main" },
    { id: "contacts",  label: "Contacts",   group: "main" },
    { id: "followups", label: "Follow-ups", icon: "⏰", badge: dueCount, group: "main" },
    { id: "bookingdesk",  label: "Reply Hub",  icon: "✉",  badge: unreadCount, group: "main" },
    { id: "calendar",  label: "Calendar",   icon: "📅", group: "main" },
    { id: "templates", label: "Templates",  icon: "📝", group: "main" },
    { id: "outreach",  label: "Outreach",   icon: "✦",  group: "ref" },
    { id: "bookingkit", label: "Booking Kit", icon: "◇",  group: "ref" },
    { id: "settings",  label: "Settings",   icon: "⚙",  group: "ref" },
    { id: "inbound",   label: "Inbound",    icon: "⬇",  badge: inboundCount, group: "ref" },
    { id: "pricing",   label: "Pricing",    icon: "◈",  group: "ref" },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "👤", group: "ref" }] : []),
  ];

  

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active, textarea:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #0A0A0A inset !important; -webkit-text-fill-color: #F0F0F0 !important; caret-color: #F0F0F0 !important; transition: background-color 9999s ease-in-out 0s; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 4px; }
        button:hover { opacity: 0.85; }
        input::placeholder, textarea::placeholder { color: #444; }
      `}</style>

      {showAddModal     && <AddLeadModal onClose={() => setShowAddModal(false)} onAdd={addLead} customTags={customTags} TAG_COLORS={TAG_COLORS} onAddTag={addCustomTag} />}
      {showWelcomeNew && !isPro && <WelcomeNewUserModal onClose={dismissWelcomeNew} />}
      {showWelcomePro && <ProWelcomeModal onClose={() => setShowWelcomePro(false)} />}
      {showCSVImport && <CSVImportModal onClose={() => setShowCSVImport(false)} onImport={() => { loadData(); setShowCSVImport(false); }} userId={user.id} supabase={supabase} COLORS={COLORS} />}
      {showWhatsNew && <WhatsNewModal onClose={dismissWhatsNew} />}
      <FollowUpPopup dueCount={dueCount} onNavigate={setActiveTab} />
      {upgradeModal     && <UpgradeModal reason={upgradeModal} onClose={() => setUpgradeModal(null)} onUpgrade={handleUpgrade} />}
      {reviewNudge && <ReviewNudgeModal lead={reviewNudge} onClose={() => setReviewNudge(null)} reviewEmail={user?.email || "hello@noxreach.io"} />
}
        {showResetConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && setShowResetConfirm(false)}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`, borderRadius: 16, padding: 28, width: 360, maxWidth: "90vw", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Reset pipeline?</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>This will permanently delete all your leads. This cannot be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.textSecondary, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={resetData} style={{ flex: 1, padding: "10px", background: COLORS.red + "22", border: `1px solid ${COLORS.red}55`, borderRadius: 9, color: COLORS.red, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reset</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />

      {/* Sidebar */}
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: isMobile ? "none" : "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <a href="https://noxreach.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img src="/nr-icon.svg" alt="NoxReach" style={{ width: 54, height: 54, borderRadius: 13, flexShrink: 0 }} />
            <img src="/nr-wordmark.svg" alt="NoxReach" style={{ height: 17, objectFit: "contain", opacity: 0.8 }} />
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          {TABS.filter(t => t.group === "main").map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon  = TAB_ICONS[tab.id];
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, marginBottom: 4, background: isActive ? COLORS.purpleBg : "transparent", border: `1px solid ${isActive ? COLORS.purple : "transparent"}`, color: isActive ? COLORS.purpleLight : COLORS.textSecondary, fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
                {TabIcon && <TabIcon size={15} color={isActive ? COLORS.purpleLight : COLORS.textSecondary} />}
                {tab.label}
                {tab.badge > 0 && <span style={{ marginLeft: "auto", background: COLORS.purple, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{tab.badge}</span>}
              </button>
            );
          })}
          <div style={{ height: 1, background: COLORS.border, margin: "10px 4px 12px" }} />
          <div style={{ fontSize: 9, color: COLORS.text3, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6, opacity: 0.6 }}>Resources</div>
          {TABS.filter(t => t.group === "ref").map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon  = TAB_ICONS[tab.id];
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, marginBottom: 4, background: isActive ? COLORS.purpleBg : "transparent", border: `1px solid ${isActive ? COLORS.purple : "transparent"}`, color: isActive ? COLORS.purpleLight : COLORS.textSecondary, fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
                {TabIcon && <TabIcon size={15} color={isActive ? COLORS.purpleLight : COLORS.textSecondary} />}
                {tab.label}
                {tab.badge > 0 && <span style={{ marginLeft: "auto", background: COLORS.purple, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{tab.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "16px 20px 12px", borderTop: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
          {/* Plan chip */}
          {!isPro ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.5)", color: COLORS.text, letterSpacing: "0.08em" }}>FREE</div>
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>{leads.filter(l => !l.archived).length} / {FREE_LIMITS.leads} leads</span>
                </div>
                <button onClick={() => requestUpgrade("leads")} style={{ fontSize: 10, fontWeight: 700, color: COLORS.purple, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Upgrade</button>
              </div>
              <div style={{ height: 3, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (leads.filter(l => !l.archived).length / FREE_LIMITS.leads) * 100)}%`, background: leads.filter(l => !l.archived).length >= FREE_LIMITS.leads ? COLORS.red : COLORS.purple, borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: COLORS.purpleBg, color: COLORS.purpleLight, border: `1px solid ${COLORS.purple}`, letterSpacing: "0.08em" }}>PRO</div>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>All features unlocked</span>
              {user?.email === "info@soundofgeez.com" && <button onClick={() => { setIsPro(false); saveIsPro(false, user.id); showToast("Switched to Free (demo)", "info"); }} style={{ marginLeft: "auto", fontSize: 9, color: COLORS.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>demo</button>}
              <a href="https://instagram.com/noxreach.os" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: COLORS.textMuted, textDecoration: "none", marginTop: 4, display: "block" }}>@noxreach.os</a>
            </div>
          )}

          {/* Weekly goal */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>WEEKLY GOAL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.green }} />
              <span style={{ fontSize: 9, color: COLORS.green, letterSpacing: "0.06em" }}>SAVED</span>
            </div>
          </div>
          <div style={{ height: 4, background: COLORS.bg, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${Math.min(100, Math.round((activeLeads.filter(l => l.stage !== "target").length / Math.max(activeLeads.length, 1)) * 100))}%`, background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleLight})`, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{activeLeads.filter(l => l.stage !== "target").length} / {activeLeads.length} contacted</div>
            <button onClick={() => setShowResetConfirm(true)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 10, cursor: "pointer", padding: 0 }}>reset</button>
          </div>
        </div>
        {/* What's New link */}
        <div style={{ padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setShowWhatsNew(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <IconStar size={11} color={COLORS.violetLight} />
            <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.violetLight, letterSpacing: "0.04em" }}>What's New</span>
          </button>
          <span style={{ fontSize: 9, color: COLORS.text3, fontFamily: "'DM Mono', monospace" }}>v{APP_VERSION}</span>
        </div>
        {/* User info + sign out — own flex child so it's always visible */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.purpleBg, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.purpleLight, flexShrink: 0 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
            <div style={{ fontSize: 9, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
          </div>
          <button onClick={toggleTheme} title={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 4, borderRadius: 6, transition: "color 0.15s", display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.color = COLORS.purpleLight}
            onMouseLeave={e => e.currentTarget.style.color = COLORS.textMuted}
          >
            {isDark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button onClick={handleSignOut} title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 4, borderRadius: 6, transition: "color 0.15s", display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.color = COLORS.red}
            onMouseLeave={e => e.currentTarget.style.color = COLORS.textMuted}
          ><IconPowerOff size={15} color="currentColor" /></button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: isMobile ? 0 : 220, display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: isMobile ? 72 : 0 }}>
        {/* Header */}
        <div style={{ padding: isMobile ? "14px 16px" : "20px 28px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeTab === "pipeline" ? 14 : 0 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>{TABS.find(t => t.id === activeTab)?.label}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? "60vw" : undefined }}>
                {activeTab === "pipeline"  && `${activeLeads.length} leads${hasFilter ? ` · filtered` : ""}`}
                {activeTab === "contacts"  && `${leads.filter(l => !l.archived).length} contacts`}
                {activeTab === "followups" && `${dueCount} due today`}
                {activeTab === "outreach"  && (isPro ? "4 templates ready" : "2 / 4 templates · Upgrade for all")}
                {activeTab === "dashboard" && "Your booking overview"}
                {activeTab === "analytics" && "Your performance metrics"}
                {activeTab === "bookingkit"    && "Your Assets"}
                {activeTab === "bookingdesk"  && `${repliedCount} message${repliedCount !== 1 ? "s" : ""}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
                {activeTab === "calendar"  && `${gigs.filter(g => new Date(g.date) >= new Date()).length} upcoming gigs`}
                {activeTab === "settings"  && `Follow-up 1: ${settings.followup1Days}d · Follow-up 2: ${settings.followup2Days}d`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              {dueCount > 0 && (
                <div style={{ padding: "6px 12px", background: COLORS.amber + "22", border: `1px solid ${COLORS.amber}44`, borderRadius: 8, fontSize: 11, color: COLORS.amber, fontWeight: 700, display: isMobile ? "none" : "block" }}>
                  ⏰ {dueCount} follow-up{dueCount > 1 ? "s" : ""} due
                </div>
              )}
              <button onClick={() => setShowAddModal(true)} style={{ padding: isMobile ? "8px 10px" : "9px 18px", background: COLORS.purple, border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <IconPlus size={14} color="#fff" />{isMobile ? null : " Add Lead"}
              </button>
              <button onClick={() => setShowCSVImport(true)} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${COLORS.purple}`, borderRadius: 9, color: COLORS.text, fontSize: 13, fontWeight: 600, cursor: "pointer", display: isMobile ? "none" : "flex", alignItems: "center", gap: 8 }}>
                <IconUpload size={14} color={COLORS.purpleLight} /> Import CSV
              </button>
              {activeLeads.length > 0 && (
                <button onClick={exportCSV} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", display: isMobile ? "none" : "flex", alignItems: "center", gap: 8 }}>
                  ⬇ Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Search + filter bar — only on Pipeline */}
          {activeTab === "pipeline" && (
            <SearchFilterBar
              search={search} setSearch={setSearch}
              filters={filters} setFilters={setFilters}
              isMobile={isMobile}
              customTags={customTags} TAG_COLORS={TAG_COLORS}
              resultCount={leads.filter(l => {
                if (l.archived) return false;
                if (search) { const q = search.toLowerCase(); if (![l.name,l.contact,l.instagram,l.notes,l.tag,l.tier].some(f => f && f.toLowerCase().includes(q))) return false; }
                if (filters.tier  && l.tier  !== filters.tier)  return false;
                if (filters.tag   && l.tag   !== filters.tag)   return false;
                if (filters.stage) {
          const stageMap = { followup: ["followup1","followup2"] };
          const allowed = stageMap[filters.stage] || [filters.stage];
          if (!allowed.includes(l.stage)) return false;
        }
                return true;
              }).length}
              totalCount={activeLeads.length}
            />
          )}
        </div>

        {isMobile && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} dueCount={dueCount} unreadCount={unreadCount} inboundCount={inboundCount} />}

        {/* Content */}
        <div style={{ padding: isMobile ? 16 : 28, flex: 1 }}>
          {activeTab === "dashboard" && (
            <>
              {!onboardingDismissed && (
                <OnboardingBanner
                  leads={leads}
                  assets={onboardingAssets}
                  onNavigate={tab => { setActiveTab(tab); }}
                  onDismiss={() => {
                    setOnboardingDismissed(true);
                    try { localStorage.setItem("noxreach_onboarding_done_" + user.id, "true"); } catch {}
                  }}
                />
              )}
              <DashboardView leads={leads} gigs={gigs} onNavigate={setActiveTab} isPro={isPro} onUpgradeClick={requestUpgrade} TAG_COLORS={TAG_COLORS} />
            </>
          )}
          {activeTab === "analytics" && <AnalyticsView userId={user.id} supabase={supabase} COLORS={COLORS} TAG_COLORS={TAG_COLORS} isMobile={isMobile} />}
          {activeTab === "templates" && <TemplatesView supabase={supabase} user={user} />}
          {activeTab === "pipeline"  && (
            <>
              {!isPro && activeLeads.length >= FREE_LIMITS.leads && (
                <div style={{ background: "rgba(14,116,144,0.08)", border: `1px solid ${COLORS.purpleDim}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 20 }}>⚡</div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.purpleLight, marginBottom: 2 }}>You've hit the free tier limit ({FREE_LIMITS.leads} leads)</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>Upgrade to Pro to keep adding venues — no cap, no friction.</div>
                  </div>
                  <button onClick={() => requestUpgrade("leads")} style={{ padding: "9px 18px", background: COLORS.purple, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Upgrade to Pro →</button>
                </div>
              )}
              {/* Pipeline — compresses left when desktop panel is open.
                  IMPORTANT: no transform on mobile — any CSS transform creates a new
                  stacking context that traps position:fixed children inside the element,
                  breaking the full-screen mobile overlay. */}
              <div style={!isMobile ? {
                transition: "opacity 0.28s ease, transform 0.28s ease",
                opacity: selectedLead ? 0.45 : 1,
                transform: selectedLead ? "scale(0.98) translateX(-8px)" : "none",
                transformOrigin: "top left",
                pointerEvents: selectedLead ? "none" : "auto",
              } : {
                display: selectedLead ? "none" : "block",
              }}>
                <PipelineView leads={leads} onMove={moveLead} onSelect={setSelectedLead} selectedLead={selectedLead} onArchive={archiveLead} search={search} filters={filters} TAG_COLORS={TAG_COLORS} customTags={customTags} onUpdateLead={updateLeadField} isMobile={isMobile} onOpenNewLead={() => setShowAddModal(true)} onClearFilters={() => { setSearch(""); setFilters({ tier: null, tag: null, stage: null }); }} selectedLeads={selectedLeads} onSelectAll={selectAllInStage} onToggleLeadSelection={toggleLeadSelection} />
              </div>

              {/* Sliding wall panel — mobile: full-screen takeover (sits outside the
                  pipeline wrapper so it's not trapped by any transform stacking context) */}
              {selectedLead && isMobile && (
                <div style={{ position: "fixed", inset: 0, zIndex: 500, background: COLORS.bg, overflowY: "auto", padding: 16 }}>
                  <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", color: COLORS.purpleLight, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "4px 0 12px", display: "flex", alignItems: "center", gap: 4 }}>← Back</button>
                  <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onMove={moveLead} onArchive={archiveLead} onDelete={deleteLead} onUpdate={u => { setLeads(p => p.map(l => l.id === u.id ? u : l)); setSelectedLead(u); }} supabase={supabase} userId={user.id} assets={onboardingAssets} setShowTemplatePicker={setShowTemplatePicker} isPro={isPro} onUpgradeClick={requestUpgrade} totalLeads={leads.filter(l => !l.archived).length} isAdmin={isAdmin} customTags={customTags} />
                </div>
              )}

              {/* Sliding wall panel — desktop: fixed panel from right, 65% content width */}
              {!isMobile && (
                <div style={{
                  position: "fixed",
                  top: 0, right: 0, bottom: 0,
                  width: "calc((100vw - 220px) * 0.65)",
                  zIndex: 200,
                  background: COLORS.bg,
                  borderLeft: `1px solid ${COLORS.border}`,
                  boxShadow: selectedLead ? "-12px 0 48px rgba(0,0,0,0.55), -1px 0 0 rgba(255,255,255,0.04)" : "none",
                  transform: selectedLead ? "translateX(0)" : "translateX(100%)",
                  transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}>
                  {selectedLead && (
                    <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onMove={moveLead} onArchive={archiveLead} onDelete={deleteLead} onUpdate={u => { setLeads(p => p.map(l => l.id === u.id ? u : l)); setSelectedLead(u); }} supabase={supabase} userId={user.id} assets={onboardingAssets} setShowTemplatePicker={setShowTemplatePicker} isPro={isPro} onUpgradeClick={requestUpgrade} totalLeads={leads.filter(l => !l.archived).length} isAdmin={isAdmin} customTags={customTags} />
                  )}
                </div>
              )}
            </>
          )}
          {activeTab === "contacts"  && <ContactsView leads={leads} TAG_COLORS={TAG_COLORS} isMobile={isMobile} customTags={customTags} supabase={supabase} userId={user.id} onUpdateLead={lead => setLeads(p => p.map(l => l.id === lead.id ? lead : l))} onOpenLead={(lead) => { setSelectedLead(lead); setActiveTab("pipeline"); }} />}
          {activeTab === "followups" && <FollowUpsView leads={leads} onNavigate={setActiveTab} onOpenLead={(lead) => { setSelectedLead(lead); setActiveTab("pipeline"); }} />}
          {activeTab === "outreach"  && <OutreachView isPro={isPro} onUpgradeClick={requestUpgrade} supabase={supabase} userId={user.id} isMobile={isMobile} />}
          {activeTab === "pricing"     && <PricingView isPro={isPro} onUpgrade={handleUpgrade} />}
          {activeTab === "bookingkit"    && <AssetsView supabase={supabase} userId={user.id} isMobile={isMobile} />}
          {activeTab === "calendar"  && <GigCalendarView leads={leads} gigs={gigs} setGigs={setGigs} showToast={showToast} isPro={isPro} onUpgradeClick={requestUpgrade} customTags={customTags} TAG_COLORS={TAG_COLORS} supabase={supabase} userId={user.id} isMobile={isMobile} />}
          {activeTab === "bookingdesk" && <ReplyHubView leads={leads} onMove={moveLead} showToast={showToast} TAG_COLORS={TAG_COLORS} onNavigate={setActiveTab} isMobile={isMobile} supabase={supabase} userId={user?.id} onUnreadChange={setEmailUnreadCount} />}
          {activeTab === "settings"  && <SettingsView settings={settings} onSave={saveSettingsHandler} isPro={isPro} onUpgradeClick={requestUpgrade} customTags={customTags} defaultTags={DEFAULT_TAGS} onAddTag={addCustomTag} onRemoveTag={removeCustomTag} TAG_COLORS={TAG_COLORS} onSetTagColor={setTagColor} supabase={supabase} user={user} onDisplayNameChange={name => setProfileDisplayName(name)} />}
              {activeTab === "inbound"   && <InboundView leads={leads} user={user} supabase={supabase} />}
          {activeTab === "admin" && isAdmin && (
            <div>
              {loadingAdminData && (
                <div style={{ padding: 40, textAlign: "center", color: COLORS.textSecondary }}>Loading users…</div>
              )}

              {!loadingAdminData && !selectedUser && (
                <>
                  {/* ── Referral links ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    {[
                      {
                        key: "permanent",
                        label: "Permanent PRO link",
                        badge: "PRO forever",
                        badgeColor: COLORS.green,
                        badgeBg: "rgba(34,197,94,0.12)",
                        desc: "User gets PRO permanently after 3-day free period.",
                        code: adminRefCodes.permanent,
                        borderColor: "rgba(34,197,94,0.25)",
                      },
                      {
                        key: "trial",
                        label: "30-day PRO trial link",
                        badge: "PRO 30 days",
                        badgeColor: COLORS.purpleLight,
                        badgeBg: COLORS.purpleBg,
                        desc: "User gets 30-day PRO access after 3-day free period.",
                        code: adminRefCodes.trial,
                        borderColor: COLORS.purpleDim,
                      },
                    ].map(({ key, label, badge, badgeColor, badgeBg, desc, code, borderColor }) => (
                      <div key={key} style={{ background: COLORS.surface, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, border: `1px solid ${badgeColor}33`, borderRadius: 20, padding: "2px 8px" }}>{badge}</div>
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>{desc}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: COLORS.text2, fontFamily: "'DM Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {code ? `app.noxreach.com/?ref=${code}` : "—"}
                          </div>
                          <button
                            disabled={!code}
                            onClick={() => {
                              if (!code) return;
                              navigator.clipboard.writeText(`https://app.noxreach.com/?ref=${code}`);
                              setAdminRefCopied(key);
                              setTimeout(() => setAdminRefCopied(null), 2000);
                            }}
                            style={{ background: adminRefCopied === key ? "rgba(34,197,94,0.15)" : badgeBg, border: `1px solid ${adminRefCopied === key ? COLORS.green : borderColor}`, borderRadius: 8, padding: "8px 14px", color: adminRefCopied === key ? COLORS.green : badgeColor, fontSize: 11, fontWeight: 600, cursor: code ? "pointer" : "default", whiteSpace: "nowrap", transition: "all 0.2s" }}
                          >
                            {adminRefCopied === key ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                    {[
                      { label: "Total Users",     value: adminUsers.length },
                      { label: "Pro Subscribers", value: adminUsers.filter(u => u.is_pro).length },
                      { label: "Active",          value: adminUsers.filter(u => u.health_status === "active").length },
                      { label: "Avg Leads/User",  value: adminUsers.length > 0 ? (adminUsers.reduce((s, u) => s + u.leadCount, 0) / adminUsers.length).toFixed(1) : 0 },
                    ].map(card => (
                      <div key={card.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>{card.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 500 }}>{card.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Email sends */}
                  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: COLORS.text }}>Behavioral Emails Sent</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 16 }}>{emailTotal} total</div>
                        {adminEmailSends.length === 0 ? (
                          <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 24 }}>No emails sent yet</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {adminEmailSends.map(({ type, count }) => {
                              const label = {
                                day2_no_leads:      "Day 2 — No Leads Added",
                                day5_not_contacted: "Day 5 — Not Contacted",
                                day7_inactive:      "Day 7 — Inactive",
                                day10_no_bookings:  "Day 10 — No Bookings",
                                first_booking:      "First Booking 🎉",
                              }[type] || type;
                              return (
                                <div key={type}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                    <span style={{ color: COLORS.textSecondary }}>{label}</span>
                                    <span style={{ fontWeight: 600, color: COLORS.text }}>{count}</span>
                                  </div>
                                  <div style={{ height: 4, background: COLORS.border, borderRadius: 2 }}>
                                    <div style={{ height: "100%", width: `${(count / emailTotal) * 100}%`, background: COLORS.purple, borderRadius: 2 }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    {/* ── User table ── */}
                    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>All Users <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>({adminUsers.length})</span></div>
                        <button onClick={loadAdminUsers} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, color: COLORS.textSecondary, cursor: "pointer" }}>↻ Refresh</button>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            {["User", "Joined", "Plan", "Health", "Leads", "Gigs", ""].map(h => (
                              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map(u => {
                            const healthColor = {
                              active:              { bg: "rgba(0,212,170,0.15)",  fg: "#00D4AA" },
                              no_leads_added:      { bg: "rgba(255,165,0,0.15)",  fg: "#FFA500" },
                              leads_not_contacted: { bg: "rgba(255,215,0,0.15)",  fg: "#FFD700" },
                              replies_no_bookings: { bg: COLORS.purpleBg,         fg: COLORS.purpleLight },
                            }[u.health_status] || { bg: "rgba(113,113,122,0.15)", fg: "#71717a" };
                            const joined = u.created_at ? new Date(u.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—";
                            return (
                              <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                                onClick={() => { setSelectedUser(u); loadUserLeads(u.id); }}>
                                <td style={{ padding: "12px 16px" }}>
                                  <div style={{ fontWeight: 500, fontSize: 13 }}>{u.display_name || u.username || "—"}</div>
                                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{u.email || u.username}</div>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textSecondary }}>{joined}</td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                    background: u.is_pro ? COLORS.purpleBg : "rgba(255,255,255,0.06)",
                                    color: u.is_pro ? COLORS.purpleLight : COLORS.text,
                                    border: u.is_pro ? `1px solid ${COLORS.purple}` : "1px solid rgba(255,255,255,0.5)",
                                    letterSpacing: "0.06em",
                                  }}>
                                    {u.is_pro ? "Pro" : "Free"}
                                  </span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: healthColor.bg, color: healthColor.fg }}>
                                    {u.health_status || "active"}
                                  </span>
                                </td>
                                <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{u.leadCount}</td>
                                <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{u.gigCount}</td>
                                <td style={{ padding: "12px 16px" }}>
                                  <button style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.purple, fontSize: 12, cursor: "pointer" }}>View →</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
              )}

              {!loadingAdminData && selectedUser && (() => {
                const [adminDetailTab, setAdminDetailTab] = [
                  selectedUser._tab || "pipeline",
                  (tab) => setSelectedUser(u => ({ ...u, _tab: tab }))
                ];
                // Stats computed from selectedUserLeads
                const ul = selectedUserLeads;
                const uActive   = ul.filter(l => !l.archived);
                const uContacted = uActive.filter(l => l.stage !== "target").length;
                const uReplied   = uActive.filter(l => ["replied","booked"].includes(l.stage)).length;
                const uBooked    = uActive.filter(l => l.stage === "booked").length;
                const uReplyRate = uContacted > 0 ? Math.round(uReplied / uContacted * 100) : 0;
                const uBookRate  = uReplied  > 0 ? Math.round(uBooked  / uReplied  * 100) : 0;
                const stageBreakdown = ["target","contacted","followup1","followup2","replied","booked"]
                  .map(id => ({ id, label: { target:"Target", contacted:"Contacted", followup1:"Follow-up 1", followup2:"Follow-up 2", replied:"Replied", booked:"Booked" }[id], count: uActive.filter(l => l.stage === id).length }))
                  .filter(s => s.count > 0);

                return (
                  <div>
                    <button onClick={() => setSelectedUser(null)} style={{ padding: "8px 0", background: "none", border: "none", color: COLORS.purple, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
                      ← Back to dashboard
                    </button>

                    {/* User header */}
                    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0" }}>{selectedUser.display_name || selectedUser.username}</h2>
                      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>{selectedUser.email || selectedUser.username}</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {[
                          { label: "Leads",  value: selectedUser.leadCount },
                          { label: "Gigs",   value: selectedUser.gigCount  },
                          { label: "Plan",   value: selectedUser.is_pro ? "Pro" : "Free" },
                          { label: "Health", value: selectedUser.health_status || "active" },
                          { label: "Joined", value: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                        ].map(s => (
                          <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12 }}>
                            <span style={{ color: COLORS.textMuted }}>{s.label}: </span>
                            <span style={{ fontWeight: 600 }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                      {["pipeline","stats"].map(tab => (
                        <button key={tab} onClick={() => setAdminDetailTab(tab)}
                          style={{ padding: "7px 16px", background: adminDetailTab === tab ? COLORS.purple : "transparent", border: `1px solid ${adminDetailTab === tab ? COLORS.purple : COLORS.border}`, borderRadius: 8, color: adminDetailTab === tab ? "#fff" : COLORS.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Pipeline tab */}
                    {adminDetailTab === "pipeline" && (
                      <div style={{ opacity: 0.7, pointerEvents: "none" }}>
                        <PipelineView
                          leads={selectedUserLeads}
                          onMove={() => {}} onSelect={() => {}} selectedLead={null} onArchive={() => {}}
                          search="" filters={{}} TAG_COLORS={TAG_COLORS} customTags={customTags}
                          onUpdateLead={() => {}} isMobile={isMobile} onOpenNewLead={() => {}} onClearFilters={() => {}}
                        />
                      </div>
                    )}

                    {/* Stats tab */}
                    {adminDetailTab === "stats" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* KPI row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {[
                            { label: "Total Leads",    value: uActive.length, color: COLORS.text },
                            { label: "Reply Rate",     value: `${uReplyRate}%`, color: COLORS.purpleLight },
                            { label: "Booking Rate",   value: uReplied > 0 ? `${uBookRate}%` : "—", color: COLORS.green },
                            { label: "Booked",         value: uBooked, color: COLORS.green },
                          ].map(c => (
                            <div key={c.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
                              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{c.label}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Stage breakdown */}
                        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Stage Breakdown</div>
                          {stageBreakdown.length === 0 ? (
                            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No active leads</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {stageBreakdown.map(s => {
                                const stageColor = { target: COLORS.textSecondary, contacted: COLORS.purple, followup1: COLORS.purpleLight, followup2: COLORS.purpleLight, replied: COLORS.violetLight, booked: COLORS.green }[s.id] || COLORS.textSecondary;
                                return (
                                  <div key={s.id}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                      <span style={{ color: COLORS.textSecondary }}>{s.label}</span>
                                      <span style={{ fontWeight: 700, color: stageColor }}>{s.count}</span>
                                    </div>
                                    <div style={{ height: 5, background: COLORS.border, borderRadius: 3 }}>
                                      <div style={{ height: "100%", width: `${uActive.length > 0 ? (s.count / uActive.length) * 100 : 0}%`, background: stageColor, borderRadius: 3 }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      {showBulkBar && selectedLeads.size > 0 && (
        <BulkActionsBar
          count={selectedLeads.size}
          onMoveTo={bulkMoveTo}
          onArchive={bulkArchive}
          onDelete={bulkDelete}
          isMobile={isMobile}
          onClear={() => {
            setSelectedLeads(new Set());
            setShowBulkBar(false);
          }}
        />
      )}

      {/* Template Picker Modal - Bundle 5.2-5.4 */}
      {showTemplatePicker && selectedLead && (
        <TemplatePickerModal
          supabase={supabase}
          user={user}
          lead={selectedLead}
          onClose={() => setShowTemplatePicker(false)}
          onSelectTemplate={(template) => {
            // Copy to clipboard
            const textToCopy = template.subject 
              ? `Subject: ${template.subject}\n\n${template.body}`
              : template.body;
            
            navigator.clipboard.writeText(textToCopy);
            
            showDomToast('✓ Template copied to clipboard');
            
            setShowTemplatePicker(false);
          }}
        />
      )}


    </div>
  );
}

// ── Export default: wraps everything in AuthGate ──────────────────────────────
function PublicAssetKit({ supabase }) {
  const username = window.location.pathname.split('/kit/')[1]?.toLowerCase().trim();
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    supabase.rpc('get_public_kit', { p_username: username }).then(({ data, error }) => {
      if (error || !data || data.length === 0) { setNotFound(true); setLoading(false); return; }
      setKit(data[0]); setLoading(false);
    });
  }, [username]);

  const share = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const s = { minHeight: '100vh', background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };

  if (loading) return <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading...</div></div>;
  if (notFound) return <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, color: '#fff', marginBottom: 16 }}>404</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Artist kit not found</div></div></div>;

  const link = (label, href) => href ? (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: '#22D3EE', fontSize: 12 }}>→</span>
    </a>
  ) : null;

  return (
    <div style={s}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/nr-icon.svg" width="40" height="40" style={{ borderRadius: 10, marginBottom: 20, opacity: 0.7 }} alt="NR" />
          <h1 style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{kit.artist_name || username}</h1>
          {kit.tagline && <p style={{ margin: '0 0 6px', fontSize: 15, color: '#22D3EE', fontWeight: 600 }}>{kit.tagline}</p>}
          {kit.location && <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>📍 {kit.location}</p>}
          {kit.genres && <p style={{ margin: '0 0 20px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{kit.genres}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={share} style={{ padding: '10px 20px', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(14,116,144,0.15)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(14,116,144,0.4)'}`, borderRadius: 8, color: copied ? '#4ade80' : '#22D3EE', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {copied ? '✓ Link copied' : '🔗 Share Kit'}
            </button>
            <a href={`/book/${username}`} style={{ padding: '10px 20px', background: '#D4AF37', border: 'none', borderRadius: 8, color: '#0a0a0a', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>📩 Book this artist</a>
          </div>
        </div>

        {kit.bio && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>About</div>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{kit.bio}</p>
          </div>
        )}

        {(kit.epk_url || kit.soundcloud || kit.spotify || kit.mix_link_1 || kit.mix_link_2 || kit.website || kit.press_photos_url) && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {link('📄 EPK / Press Kit', kit.epk_url)}
              {link('☁ SoundCloud', kit.soundcloud)}
              {link('🎵 Spotify', kit.spotify)}
              {link('🎧 Mix 1', kit.mix_link_1)}
              {link('🎧 Mix 2', kit.mix_link_2)}
              {link('🌐 Website', kit.website)}
              {link('📸 Press Photos', kit.press_photos_url)}
            </div>
          </div>
        )}

        <div style={{ background: 'rgba(14,116,144,0.08)', border: '1px solid rgba(14,116,144,0.25)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22D3EE', marginBottom: 3 }}>Upcoming shows</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Check confirmed gig dates</div>
          </div>
          <a href={`/gigs/${username}`} style={{ padding: '9px 16px', background: 'rgba(14,116,144,0.2)', border: '1px solid rgba(14,116,144,0.35)', borderRadius: 8, color: '#22D3EE', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>View schedule →</a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 48, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Powered by <span style={{ color: '#22D3EE', fontWeight: 700 }}>NoxReach</span></div>
      </div>
    </div>
  );
}

function PublicBookingForm({ supabase }) {
  const username = window.location.pathname.split('/book/')[1]?.toLowerCase().trim();
  const [step, setStep] = useState('form');
  const [djProfile, setDjProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ venue: '', event_type: '', date: '', fee_offer: '', contact_email: '', instagram: '', message: '' });

  useEffect(() => {
    if (!username) { setStep('notfound'); return; }
    supabase.from('profiles').select('id, display_name, username').eq('username', username).single()
      .then(({ data, error }) => { if (error || !data) setStep('notfound'); else setDjProfile(data); });
  }, [username]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.venue || !form.contact_email) return;
    setSubmitting(true);
    await supabase.from('leads').insert({
      user_id: djProfile.id, name: form.venue, contact: form.contact_email,
      instagram: form.instagram, stage: 'replied', tag: form.event_type || null, is_inbound: true,
      notes: [form.message, form.date ? 'Date: ' + form.date : '', form.fee_offer ? 'Fee offer: EUR' + form.fee_offer : ''].filter(Boolean).join(' | '),
      last_contact: new Date().toISOString().split('T')[0],
    });
    // Fire notification emails (non-blocking)
    try {
      await supabase.functions.invoke('booking-notify', {
        body: {
          venue: form.venue,
          contact_email: form.contact_email,
          instagram: form.instagram,
          event_type: form.event_type,
          date: form.date,
          fee_offer: form.fee_offer,
          message: form.message,
          dj_user_id: djProfile.id,
        },
      });
    } catch (e) { console.warn('Notify failed', e); }
    setSubmitting(false);
    setStep('success');
  };

  const inp = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

  if (!djProfile && step !== 'notfound') return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (step === 'notfound') return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, color: '#fff', marginBottom: 16 }}>404</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Booking page not found</div></div>
    </div>
  );

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <img src="/nr-icon.svg" width="48" height="48" style={{ borderRadius: 12, marginBottom: 24 }} alt="NR" />
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Booking request sent</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 32 }}>{djProfile.display_name} will review your request and get back to you soon.</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Powered by NoxReach</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: '-apple-system, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/nr-icon.svg" width="44" height="44" style={{ borderRadius: 11, marginBottom: 16 }} alt="NR" />
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Book {djProfile.display_name}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Fill out the form and we will get back to you</div>
        </div>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div><label style={lbl}>Venue / Event name *</label><input style={inp} value={form.venue} onChange={set('venue')} placeholder="e.g. Berghain, Pride Amsterdam" /></div>
          <div><label style={lbl}>Event type</label>
            <select style={{ ...inp, colorScheme: 'dark' }} value={form.event_type} onChange={set('event_type')}>
              <option value="">Select type...</option>
              <option>Club Night</option><option>Festival</option><option>Pride / CSD</option><option>Circuit Festival</option><option>Private Event</option><option>Other</option>
            </select>
          </div>
          <div><label style={lbl}>Event date</label><input style={{ ...inp, colorScheme: 'dark' }} type="date" value={form.date} onChange={set('date')} /></div>
          <div><label style={lbl}>Fee offer (€)</label><input style={inp} type="number" value={form.fee_offer} onChange={set('fee_offer')} placeholder="e.g. 800" /></div>
          <div><label style={lbl}>Your email *</label><input style={inp} type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="booker@venue.com" /></div>
          <div><label style={lbl}>Instagram</label><input style={inp} value={form.instagram} onChange={set('instagram')} placeholder="@venuename" /></div>
          <div><label style={lbl}>Message</label><textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={form.message} onChange={set('message')} placeholder="Tell us about the event, expected crowd, set time..." /></div>
          <button onClick={handleSubmit} disabled={submitting || !form.venue || !form.contact_email}
            style={{ background: '#D4AF37', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: (!form.venue || !form.contact_email) ? 0.5 : 1 }}>
            {submitting ? 'Sending...' : 'Send booking request'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Powered by NoxReach</div>
      </div>

    </div>
  );
}

function PublicGigList({ supabase }) {
  const username = window.location.pathname.split('/gigs/')[1]?.toLowerCase().trim();
  const [djProfile, setDjProfile] = useState(null);
  const [gigs, setGigs]           = useState([]);
  const [status, setStatus]       = useState('loading');

  useEffect(() => {
    if (!username) { setStatus('notfound'); return; }
    supabase.from('profiles').select('id, display_name, username').eq('username', username).single()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('notfound'); return; }
        setDjProfile(data);
        return supabase.from('gigs')
          .select('venue, city, date, status, tag')
          .eq('user_id', data.id)
          .eq('status', 'confirmed')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true });
      })
      .then(res => {
        if (!res) return;
        if (res.error) { setStatus('ready'); return; }
        setGigs(res.data || []);
        setStatus('ready');
      })
      .catch(() => setStatus('notfound'));
  }, [username]);

  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Tag color palette — maps genre → subtle tint
  const TAG_COLORS_PUBLIC = {
    'Tech-House': { bg:'rgba(14,116,144,0.18)', border:'rgba(34,211,238,0.30)', color:'#22D3EE' },
    'Festival':   { bg:'rgba(234,179,8,0.14)',  border:'rgba(234,179,8,0.35)',  color:'#EAB308' },
    'Disco':      { bg:'rgba(236,72,153,0.14)', border:'rgba(236,72,153,0.35)', color:'#EC4899' },
    'House':      { bg:'rgba(99,102,241,0.15)', border:'rgba(99,102,241,0.35)', color:'#818CF8' },
    'Techno':     { bg:'rgba(239,68,68,0.14)',  border:'rgba(239,68,68,0.35)',  color:'#F87171' },
    'Afro House': { bg:'rgba(249,115,22,0.14)', border:'rgba(249,115,22,0.35)', color:'#FB923C' },
    'Melodic':    { bg:'rgba(20,184,166,0.14)', border:'rgba(20,184,166,0.35)', color:'#2DD4BF' },
  };
  const fallbackTag = { bg:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.55)' };
  const getTagStyle = tag => TAG_COLORS_PUBLIC[tag] || fallbackTag;

  const spinnerStyle = `
    @keyframes pgSpin { to { transform: rotate(360deg); } }
    @keyframes pgFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pgPulse { 0%,100% { opacity:.4; } 50% { opacity:.9; } }
  `;

  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#060608', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{spinnerStyle}</style>
      <div style={{ width:28, height:28, border:'2.5px solid rgba(34,211,238,0.15)', borderTopColor:'#22D3EE', borderRadius:'50%', animation:'pgSpin 0.8s linear infinite' }} />
    </div>
  );

  if (status === 'notfound') return (
    <div style={{ minHeight:'100vh', background:'#060608', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:56, fontWeight:900, color:'rgba(255,255,255,0.08)', letterSpacing:'-0.04em', marginBottom:12 }}>404</div>
        <div style={{ color:'rgba(255,255,255,0.35)', fontSize:15 }}>Schedule not found</div>
      </div>
    </div>
  );

  const nextGig = gigs[0];

  return (
    <div style={{ minHeight:'100vh', background:'#060608', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', overflowX:'hidden' }}>
      <style>{`
        ${spinnerStyle}
        .pg-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .pg-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.10) !important; }
        .pg-cta { transition: opacity 0.18s ease, transform 0.18s ease; }
        .pg-cta:hover { opacity: 0.88; transform: translateY(-1px); }
        * { box-sizing: border-box; }
      `}</style>

      {/* Atmospheric background glow */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)', width:700, height:500, background:'radial-gradient(ellipse, rgba(14,116,144,0.13) 0%, transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'-15%', width:500, height:400, background:'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 65%)', borderRadius:'50%' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:580, margin:'0 auto', padding:'56px 20px 80px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:52, animation:'pgFadeUp 0.5s ease both' }}>
          <img src="/nr-icon.svg" width="40" height="40"
            style={{ borderRadius:10, marginBottom:20, opacity:0.7 }} alt="NR" />
          <div style={{ fontSize:42, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1, marginBottom:10 }}>
            {djProfile?.display_name}
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', animation:'pgPulse 2.2s ease infinite' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.14em', textTransform:'uppercase' }}>
              {gigs.length} Upcoming Show{gigs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Next show highlight */}
        {nextGig && (() => {
          const d = new Date(nextGig.date + 'T00:00:00');
          const ts = getTagStyle(nextGig.tag);
          const daysUntil = Math.round((d - new Date()) / 86400000);
          return (
            <div style={{ marginBottom:16, animation:'pgFadeUp 0.5s 0.08s ease both', opacity:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>Next show</div>
              <div className="pg-card" style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'20px 22px', display:'flex', alignItems:'center', gap:20, boxShadow:'0 4px 24px rgba(0,0,0,0.5)' }}>
                {/* Big date */}
                <div style={{ flexShrink:0, textAlign:'center', minWidth:52 }}>
                  <div style={{ fontSize:36, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-0.03em' }}>{String(d.getDate()).padStart(2,'0')}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:3 }}>{MONTH_SHORT[d.getMonth()]} '{String(d.getFullYear()).slice(2)}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{DAY_SHORT[d.getDay()]}</div>
                </div>
                <div style={{ width:1, height:52, background:'rgba(255,255,255,0.08)', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{nextGig.venue}</div>
                  {nextGig.city && <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>{nextGig.city}</div>}
                  {nextGig.tag && (
                    <span style={{ fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5, background:ts.bg, border:`1px solid ${ts.border}`, color:ts.color, letterSpacing:'0.12em', textTransform:'uppercase' }}>{nextGig.tag}</span>
                  )}
                </div>
                <div style={{ flexShrink:0, textAlign:'right' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(34,197,94,0.8)', letterSpacing:'0.04em' }}>
                    {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `IN ${daysUntil}D`}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rest of gig list */}
        {gigs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'70px 0', color:'rgba(255,255,255,0.2)', fontSize:14 }}>No upcoming shows scheduled</div>
        ) : gigs.length > 1 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:40, animation:'pgFadeUp 0.5s 0.16s ease both', opacity:0 }}>
            {gigs.slice(1).map((g, i) => {
              const d = new Date(g.date + 'T00:00:00');
              const ts = getTagStyle(g.tag);
              return (
                <div key={i} className="pg-card" style={{ display:'flex', alignItems:'center', gap:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'13px 18px', boxShadow:'0 2px 12px rgba(0,0,0,0.35)' }}>
                  <div style={{ flexShrink:0, textAlign:'center', minWidth:40 }}>
                    <div style={{ fontSize:17, fontWeight:800, color:'rgba(255,255,255,0.85)', lineHeight:1, letterSpacing:'-0.02em' }}>{String(d.getDate()).padStart(2,'0')}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>{MONTH_SHORT[d.getMonth()]} '{String(d.getFullYear()).slice(2)}</div>
                  </div>
                  <div style={{ width:1, height:32, background:'rgba(255,255,255,0.06)', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom: g.city ? 1 : 0 }}>{g.venue}</div>
                    {g.city && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{g.city}</div>}
                  </div>
                  {g.tag && (
                    <span style={{ flexShrink:0, fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:4, background:ts.bg, border:`1px solid ${ts.border}`, color:ts.color, letterSpacing:'0.12em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{g.tag}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : <div style={{ marginBottom:40 }} />}

        {/* CTA */}
        <div style={{ textAlign:'center', animation:'pgFadeUp 0.5s 0.24s ease both', opacity:0 }}>
          <a href={`/book/${username}`} className="pg-cta"
            style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'15px 36px', background:'#D4AF37', color:'#0a0a0a', borderRadius:12, fontSize:15, fontWeight:800, textDecoration:'none', letterSpacing:'0.01em', boxShadow:'0 4px 24px rgba(212,175,55,0.30)' }}>
            Book {djProfile?.display_name}
            <span style={{ fontSize:16 }}>→</span>
          </a>
          <div style={{ marginTop:20, fontSize:11, color:'rgba(255,255,255,0.15)', letterSpacing:'0.04em' }}>Powered by NoxReach</div>
        </div>

      </div>
    </div>
  );
}

// ── Feedback Button ───────────────────────────────────────────────────────────
function FeedbackButton({ supabase, userId }) {
  const [open,      setOpen]      = useState(false);
  const [type,      setType]      = useState('idea');
  const [message,   setMessage]   = useState('');
  const [status,    setStatus]    = useState('idle'); // idle | saving | done
  const isMobile = window.innerWidth < 640;

  const close = () => { setOpen(false); setTimeout(() => { setType('idea'); setMessage(''); setStatus('idle'); }, 300); };

  const submit = async () => {
    if (!message.trim()) return;
    setStatus('saving');
    await supabase.from('feedback').insert({
      user_id: userId,
      type,
      message: message.trim(),
      context: window.location.pathname,
    });
    setStatus('done');
    setTimeout(close, 1800);
  };

  const TYPES = [
    { id: 'idea',  label: '💡 Idea'  },
    { id: 'bug',   label: '🐛 Bug'   },
    { id: 'other', label: '💬 Other' },
  ];

  // Bottom-right, above mobile nav
  const btnBottom = isMobile ? 70 : 24;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Send feedback"
        style={{
          position: 'fixed', bottom: btnBottom, right: 20, zIndex: 1000,
          width: 40, height: 40, borderRadius: '50%',
          background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`,
          color: COLORS.textMuted, fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.purple; e.currentTarget.style.color = COLORS.purpleLight; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.color = COLORS.textMuted; }}
      >
        ✦
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
            animation: 'fbFadeIn 0.2s ease',
          }}
        >
          <style>{`@keyframes fbFadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400,
              background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`,
              borderRadius: isMobile ? '20px 20px 0 0' : 14,
              padding: isMobile ? '24px 20px 32px' : '22px 22px 20px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            {status === 'done' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🙏</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Thanks for the feedback</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>It goes straight to the founder.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Send feedback</div>
                  <button onClick={close} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>

                {/* Type selector */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {TYPES.map(t => (
                    <button key={t.id} onClick={() => setType(t.id)} style={{
                      flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                      background: type === t.id ? COLORS.purpleBg : COLORS.bg,
                      border: `1px solid ${type === t.id ? COLORS.purple : COLORS.border}`,
                      color: type === t.id ? COLORS.purpleLight : COLORS.textMuted,
                      transition: 'all 0.1s',
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  autoFocus
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={type === 'bug' ? 'What broke? What did you expect to happen?' : type === 'idea' ? 'What would make NoxReach better?' : 'What\'s on your mind?'}
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, padding: '10px 12px', color: COLORS.text,
                    fontSize: 13, outline: 'none', colorScheme: 'dark',
                    fontFamily: 'inherit', lineHeight: 1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor = COLORS.purple; }}
                  onBlur={e => { e.target.style.borderColor = COLORS.border; }}
                />

                <button
                  onClick={submit}
                  disabled={!message.trim() || status === 'saving'}
                  style={{
                    marginTop: 10, width: '100%', padding: '11px',
                    background: message.trim() ? COLORS.purple : COLORS.border,
                    border: 'none', borderRadius: 8, color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: message.trim() ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                >
                  {status === 'saving' ? 'Sending…' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── PWA Install Prompt ────────────────────────────────────────────────────────
function InstallPrompt() {
  const [visible,        setVisible]        = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSGuide,   setShowIOSGuide]   = useState(false);
  const [fadeOut,        setFadeOut]        = useState(false);

  const isIOS       = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window).MSStream;
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (navigator).standalone === true;
  const isMobile    = window.innerWidth < 640;

  useEffect(() => {
    if (isInstalled) return;
    if (localStorage.getItem('noxreach_prompt_dismissed')) return;
    const count = parseInt(localStorage.getItem('noxreach_login_count') || '0', 10);
    if (count < 3) return;

    // Capture Android install event
    const onBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Show after a short delay so it doesn't clash with app load
    const t = setTimeout(() => setVisible(true), 2500);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); clearTimeout(t); };
  }, []);

  const dismiss = () => {
    setFadeOut(true);
    localStorage.setItem('noxreach_prompt_dismissed', 'true');
    setTimeout(() => setVisible(false), 300);
  };

  const handleInstall = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    localStorage.setItem('noxreach_prompt_dismissed', 'true');
    setFadeOut(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    animation: fadeOut ? 'ipFadeOut 0.3s ease forwards' : 'ipFadeIn 0.3s ease forwards',
  };
  const sheet = {
    width: '100%', maxWidth: isMobile ? '100%' : 420,
    background: COLORS.surface, border: `1px solid ${COLORS.borderHover}`,
    borderRadius: isMobile ? '20px 20px 0 0' : 16,
    padding: isMobile ? '28px 24px 36px' : '28px 28px 24px',
    boxShadow: '0 -4px 40px rgba(0,0,0,0.6)',
    animation: fadeOut
      ? (isMobile ? 'ipSlideDown 0.3s ease forwards' : 'ipFadeOut 0.3s ease forwards')
      : (isMobile ? 'ipSlideUp 0.35s ease forwards'  : 'ipFadeIn 0.3s ease forwards'),
  };

  return (
    <>
      <style>{`
        @keyframes ipFadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes ipFadeOut   { from { opacity:1 } to { opacity:0 } }
        @keyframes ipSlideUp   { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes ipSlideDown { from { transform:translateY(0) } to { transform:translateY(100%) } }
      `}</style>
      <div style={overlay} onClick={dismiss}>
        <div style={sheet} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <img src="/nr-icon.svg" width={40} height={40}
              style={{ borderRadius: 10, flexShrink: 0 }} alt="NoxReach" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, lineHeight: 1.2 }}>Add NoxReach to your home screen</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>One tap to open. Works offline.</div>
            </div>
          </div>

          {/* iOS guide */}
          {showIOSGuide ? (
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>⎙</div>
              <div style={{ fontSize: 13, color: COLORS.text2, lineHeight: 1.6 }}>
                Tap the <strong style={{ color: COLORS.text }}>Share</strong> button at the bottom of Safari, then choose <strong style={{ color: COLORS.text }}>Add to Home Screen</strong>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.text2, lineHeight: 1.6, marginBottom: 18 }}>
              Install NoxReach for faster access — no app store needed.
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={dismiss}
              style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 9, color: COLORS.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Maybe later
            </button>
            {showIOSGuide ? (
              <button onClick={dismiss}
                style={{ flex: 1, padding: '11px', background: COLORS.green, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Got it ✓
              </button>
            ) : (isIOS || deferredPrompt) ? (
              <button onClick={handleInstall}
                style={{ flex: 1, padding: '11px', background: COLORS.purple, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {isIOS ? 'How to install' : 'Install'}
              </button>
            ) : null}
          </div>

        </div>
      </div>
    </>
  );
}

export default function NoxReach() {
  if (window.location.pathname.startsWith('/kit/'))  return <PublicAssetKit  supabase={supabase} />;
  if (window.location.pathname.startsWith('/gigs/')) return <PublicGigList   supabase={supabase} />;
  if (window.location.pathname.startsWith('/book/')) return <PublicBookingForm supabase={supabase} />;
  if (window.location.pathname === '/privacy' || window.location.pathname === '/privacy.html') {
    window.location.href = 'https://noxreach.com/privacy.html';
    return null;
  }
  if (window.location.pathname === '/impressum' || window.location.pathname === '/impressum.html') {
    window.location.href = 'https://noxreach.com/impressum.html';
    return null;
  }
  if (window.location.pathname === '/terms' || window.location.pathname === '/terms.html') {
    window.location.href = 'https://noxreach.com/terms.html';
    return null;
  }
  if (window.location.pathname === '/agb' || window.location.pathname === '/agb.html') {
    window.location.href = 'https://noxreach.com/agb.html';
    return null;
  }
  if (window.location.pathname === '/dpa' || window.location.pathname === '/dpa.html') {
    window.location.href = 'https://noxreach.com/dpa.html';
    return null;
  }
  if (window.location.pathname === '/privacy' || window.location.pathname === '/privacy.html') {
    window.location.href = 'https://noxreach.com/privacy.html';
    return null;
  }
  if (window.location.pathname === '/impressum' || window.location.pathname === '/impressum.html') {
    window.location.href = 'https://noxreach.com/impressum.html';
    return null;
  }
  if (window.location.pathname === '/terms' || window.location.pathname === '/terms.html') {
    window.location.href = 'https://noxreach.com/terms.html';
    return null;
  }
  return (
    <>
      <AuthGate>
        {({ user, session, supabase }) => (
          <>
            <NoxReachApp user={user} session={session} supabase={supabase} />
            <FeedbackButton supabase={supabase} userId={user?.id} />
          </>
        )}
      </AuthGate>
      <CookieBanner />
      <InstallPrompt />
    </>
  );
}
