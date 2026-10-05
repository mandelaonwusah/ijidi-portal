import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { CircuitBackground } from "@/components/CircuitBackground";
import { EcosystemColumn, EcosystemGrid, LoginTopBar, SIGN_UP_HREF } from "@/components/LoginChrome";

export const Route = createFileRoute("/login")({
  // The portal loads Plex Mono 400–500 only (DESIGN.md §3). The sign-in card is
  // kept exactly as it was, and it uses Plex Mono 600, so that weight is loaded
  // here for this page alone.
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&display=swap",
      },
    ],
  }),
  component: LoginPage,
});

type Provider = "google" | "github";

// Google / GitHub buttons appear only when Supabase itself confirms, on page
// load, that the provider is on AND new sign-ups are disabled. Otherwise any
// Google or GitHub account could create a session, so the button stays hidden.
async function readEnabledProviders(): Promise<Record<Provider, boolean>> {
  const none = { google: false, github: false };
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;
  if (!url || !key) return none;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return none;
    const settings = (await res.json()) as { disable_signup?: boolean; external?: Partial<Record<Provider, boolean>> };
    const closed = settings.disable_signup === true;
    return { google: closed && settings.external?.google === true, github: closed && settings.external?.github === true };
  } catch {
    return none;
  }
}

const REMEMBER_KEY = "ijidi_remember_email";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Record<Provider, boolean>>({ google: false, github: false });
  const [linkBusy, setLinkBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emblemOk, setEmblemOk] = useState(true);

  // Top bar "Sign in": bring the card into view and put the cursor in Access ID.
  const goToSignIn = () => {
    const field = document.getElementById("ijidi-access-id");
    if (!field) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    field.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    field.focus({ preventScroll: true });
  };

  // Already signed in? Skip the login screen.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    let alive = true;
    void readEnabledProviders().then((found) => alive && setProviders(found));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      // storage unavailable: ignore
    }
  }, []);

  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      // storage unavailable: ignore
    }
    navigate({ to: "/", replace: true });
  }

  // One-time sign-in link by email. shouldCreateUser: false, so it only ever
  // works for an existing account and never creates one.
  async function handleEmailLink() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your Access ID first, then ask for a link.");
      document.getElementById("ijidi-access-id")?.focus();
      return;
    }
    setLinkBusy(true);
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/` },
    });
    setLinkBusy(false);
    // Same message whether or not the account exists, so the page does not
    // reveal which Access IDs are real. Real failures (e.g. rate limits) show.
    if (linkError && !/signups? not allowed|user not found/i.test(linkError.message)) {
      setError(linkError.message);
      return;
    }
    setNotice("If that Access ID has an account, a sign-in link is on its way. Check your email.");
  }

  async function handleSocialAuth(provider: Provider) {
    setError(null);
    setOauthBusy(provider);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    // On success the browser leaves for the provider; only failures land here.
    if (authError) {
      setOauthBusy(null);
      setError(authError.message);
    }
  }

  const anyBusy = busy || linkBusy || oauthBusy !== null;

  return (
    <div className="ijidi-login">
      {/* The same living circuit board as the rest of the portal */}
      <CircuitBackground />

      <div className="login-stage">
        <div className="brand">
          {emblemOk && (
            <img className="emblem" src="/ijidi-fan-emblem.png" alt="IJIDI Portal emblem" onError={() => setEmblemOk(false)} />
          )}
          <div className="portal-name">
            IJIDI <span>PORTAL</span>
          </div>
        </div>

        <LoginTopBar onSignIn={goToSignIn} />

        <div className="login-layout">
        <EcosystemColumn side="left" className="eco-side" />
        <main className="login-main">
          <h1 className="form-title">Sign in</h1>
          <p className="form-sub">Enter your Access ID and Passkey to continue.</p>

          <form className="fields" onSubmit={handleAuth}>
            <div className="field">
              <label htmlFor="ijidi-access-id">Access ID</label>
              <input id="ijidi-access-id" type="email" name="email" placeholder="you@example.com" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label htmlFor="ijidi-passkey">Passkey</label>
              <div className="password-wrap">
                <input id="ijidi-passkey" type={showPassword ? "text" : "password"} name="password" placeholder="••••••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="toggle-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="remember-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember Access ID</span>
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button className="btn" type="submit" disabled={anyBusy}>
              {busy ? "Verifying…" : "Authenticate"}
            </button>

            {notice && (
              <div className="auth-note" role="status">
                {notice}
              </div>
            )}

            <div className="oauth-divider">
              <span>OR</span>
            </div>
            <div className="oauth-buttons">
              <button type="button" className="btn-oauth" disabled={anyBusy} onClick={handleEmailLink}>
                {linkBusy ? "Sending…" : "Email link"}
              </button>
              {providers.google && (
                <button type="button" className="btn-oauth" disabled={anyBusy} onClick={() => handleSocialAuth("google")}>
                  {oauthBusy === "google" ? "Opening…" : "Google"}
                </button>
              )}
              {providers.github && (
                <button type="button" className="btn-oauth" disabled={anyBusy} onClick={() => handleSocialAuth("github")}>
                  {oauthBusy === "github" ? "Opening…" : "GitHub"}
                </button>
              )}
            </div>
          </form>

          <div className="card-foot">
            <span>Authorised access only</span>
            <span>
              No account? <a href={SIGN_UP_HREF}>Sign up</a> by email
            </span>
            <span>
              Trouble signing in? <a href={SIGN_UP_HREF}>Contact the Governor</a>
            </span>
          </div>
        </main>
        <EcosystemColumn side="right" className="eco-side" />

        <EcosystemGrid className="eco-below" />
        </div>
      </div>

      <style>{`
        .ijidi-login{--gold:#C6A15B;--gold-hi:#E2C688;--gold-lo:#A98443;--gold-rgb:198,161,91;
          --blue-rgb:79,134,247;
          --ivory:#F5F1E8;--line:rgba(198,161,91,.3);
          --mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
          --display:"Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          --ease:cubic-bezier(.2,.8,.2,1);
          position:fixed;inset:0;z-index:100;overflow-x:hidden;overflow-y:auto;color:var(--ivory);
          font-family:"Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          background:#03050a;}
        .ijidi-login *{box-sizing:border-box}

        /* A dark veil over the circuit board (same on every screen size), with soft
           gold and blue light so the form sits in its own glow */
        .ijidi-login::after{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;
          background:
            radial-gradient(ellipse 60% 48% at 50% 28%,rgba(var(--gold-rgb),.10),transparent 70%),
            radial-gradient(ellipse 90% 60% at 50% 108%,rgba(var(--blue-rgb),.10),transparent 70%),
            rgba(3,5,10,.62)}

        .login-stage{position:relative;z-index:2;min-height:100vh;min-height:100dvh;display:flex;align-items:center;
          justify-content:center;padding:132px 40px 48px}

        /* No card: the form sits straight on the board; the shadow keeps the text lifted */
        .login-main{width:100%;max-width:420px;
          text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 10px rgba(0,0,0,.55);
          animation:ijidiRise .7s var(--ease) both}
        /* Card and "The IJIDI Ecosystem" grid: side by side on wide screens, the
           grid below the card on narrower ones. The card itself is unchanged. */
        /* The card in the middle. Wide screens: three Ecosystem tiles on each side.
           Narrower screens: the card first, the six tiles in a grid below it. */
        .login-layout{width:100%;display:flex;flex-direction:column;align-items:center;gap:48px}
        .login-layout>.login-main{flex:0 1 420px}
        .login-layout>.eco-side{display:none}
        @media (min-width:1200px){
          .login-layout{flex-direction:row;justify-content:center;align-items:center;gap:56px}
          .login-layout>.eco-side{display:flex;flex:0 1 280px;max-width:280px}
          .login-layout>.eco-below{display:none}
        }
        @keyframes ijidiRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

        /* Logo and portal name pinned to the top-left corner of the page */
        .brand{position:absolute;top:32px;left:40px;display:flex;align-items:center;gap:14px;
          text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 10px rgba(0,0,0,.55);animation:ijidiRise .7s var(--ease) both}
        .emblem{display:block;width:68px;height:68px;margin:0;object-fit:contain;
          filter:drop-shadow(0 6px 20px rgba(var(--gold-rgb),.4))}
        .portal-name{font:600 12px/1 var(--mono);letter-spacing:.38em;color:var(--ivory)}
        .portal-name span{color:var(--gold)}
        .form-title{margin:0;text-align:center;font:600 32px/1.25 var(--display);letter-spacing:-.01em;color:var(--ivory)}
        .form-sub{margin:10px 0 0;text-align:center;font:400 14px/1.6 "Inter","Segoe UI",sans-serif;color:rgba(245,241,232,.75)}

        .fields{margin-top:28px;display:flex;flex-direction:column;gap:16px;text-align:left}
        .field label{display:block;margin-bottom:8px;font:600 9.5px/1 var(--mono);letter-spacing:.22em;
          text-transform:uppercase;color:var(--gold)}
        .field input{width:100%;padding:14px 15px;border-radius:10px;border:1px solid var(--line);
          background:rgba(0,0,0,.32);color:var(--ivory);font:500 14px/1.2 "Inter","Segoe UI",sans-serif;
          letter-spacing:.02em;outline:none;text-shadow:none;
          transition:border-color .25s,box-shadow .25s,background .25s}
        .field input::placeholder{color:rgba(245,241,232,.36)}
        .field input:focus{border-color:rgba(var(--gold-rgb),.8);background:rgba(0,0,0,.42);
          box-shadow:0 0 0 3px rgba(var(--gold-rgb),.16)}
        .field input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #10141d inset;
          -webkit-text-fill-color:#F5F1E8;caret-color:#F5F1E8}
        .password-wrap{position:relative}
        .password-wrap input{padding-right:68px}
        .toggle-eye{position:absolute;top:50%;right:6px;transform:translateY(-50%);background:transparent;border:none;
          cursor:pointer;padding:10px;border-radius:6px;font:700 9px/1 var(--mono);letter-spacing:.16em;
          text-transform:uppercase;color:var(--gold);text-shadow:none;transition:color .2s}
        .toggle-eye:hover{color:var(--gold-hi)}

        .remember-row{display:flex;align-items:center;gap:9px;cursor:pointer;margin-top:-2px;
          font:500 11px/1 var(--mono);letter-spacing:.06em;color:rgba(245,241,232,.78)}
        .remember-row input{width:16px;height:16px;accent-color:var(--gold);cursor:pointer}

        .auth-error{padding:10px 13px;border-radius:8px;border:1px solid rgba(217,123,63,.5);
          background:rgba(217,123,63,.12);font:600 11px/1.5 var(--mono);letter-spacing:.03em;color:#f0aa78}

        .btn{width:100%;margin-top:6px;min-height:52px;padding:14px 22px;border-radius:10px;cursor:pointer;
          border:1px solid rgba(255,255,255,.14);
          background:linear-gradient(180deg,var(--gold-hi),var(--gold) 55%,var(--gold-lo));
          color:#15120a;font:700 12px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;text-shadow:none;
          box-shadow:0 10px 28px rgba(var(--gold-rgb),.26),inset 0 1px 0 rgba(255,255,255,.35);
          transition:transform .25s var(--ease),box-shadow .25s var(--ease),filter .25s}
        .btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.06);
          box-shadow:0 14px 36px rgba(var(--gold-rgb),.36),inset 0 1px 0 rgba(255,255,255,.4)}
        .btn:active:not(:disabled){transform:translateY(0)}
        .btn:disabled{opacity:.6;cursor:default}

        .oauth-divider{display:flex;align-items:center;margin:20px 0 14px;color:rgba(245,241,232,.5);
          font:600 9px/1 var(--mono);letter-spacing:.18em}
        .oauth-divider::before,.oauth-divider::after{content:"";flex:1;height:1px;background:var(--line)}
        .oauth-divider span{padding:0 10px}
        .oauth-buttons{display:flex;gap:10px}
        .btn-oauth{flex:1;min-height:46px;padding:10px;border-radius:10px;border:1px solid var(--line);
          background:rgba(0,0,0,.28);color:var(--ivory);font:600 11.5px/1 var(--mono);letter-spacing:.08em;
          cursor:pointer;text-shadow:none;transition:all .25s var(--ease)}
        .btn-oauth:hover:not(:disabled){background:rgba(var(--gold-rgb),.12);border-color:rgba(var(--gold-rgb),.55)}
        .btn-oauth:disabled{opacity:.55;cursor:default}

        .btn:focus-visible,.btn-oauth:focus-visible,.toggle-eye:focus-visible,.remember-row input:focus-visible{
          outline:2px solid var(--gold-hi);outline-offset:2px}

        .card-foot{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-direction:column;
          gap:8px;align-items:center;text-align:center;font:500 10px/1.5 var(--mono);letter-spacing:.1em;
          color:rgba(245,241,232,.6)}
        .card-foot b,.card-foot a{color:var(--gold);font-weight:600;text-decoration:none}
        .card-foot a:hover{text-decoration:underline;text-underline-offset:3px}
        .auth-note{padding:10px 13px;border-radius:8px;border:1px solid rgba(94,155,255,.4);
          background:rgba(79,134,247,.1);font:500 13px/1.5 var(--mono);color:#cfe0ff}

        /* Phones: same layout as desktop — logo in the top-left corner, form centred */
        @media (max-width:520px){
          .login-stage{padding:112px 20px 28px}
          .brand{top:20px;left:20px;gap:12px}
          .emblem{width:52px;height:52px}
          .portal-name{letter-spacing:.32em}
          .form-title{font-size:30px}
          /* 16px inputs stop iPhones zooming in when a field is tapped */
          .field input{font-size:16px;min-height:52px}
          .btn{min-height:54px}
        }

        @media (prefers-reduced-motion:reduce){
          .ijidi-login *{animation-duration:.001ms!important;animation-iteration-count:1!important;
            transition-duration:.001ms!important}
        }
      `}</style>
    </div>
  );
}
