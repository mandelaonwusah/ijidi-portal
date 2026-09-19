import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// Google/GitHub buttons stay hidden until those providers are enabled in
// Supabase AND new sign-ups are deliberately allowed. Flip to true only then.
const OAUTH_ENABLED = false;

const REMEMBER_KEY = "ijidi_remember_email";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emblemOk, setEmblemOk] = useState(true);

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
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    navigate({ to: "/", replace: true });
  }

  async function handleSocialAuth(provider: "google" | "github") {
    setError(null);
    setOauthBusy(provider);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    // On success the browser leaves for the provider; only failures land here.
    if (authError) {
      setOauthBusy(null);
      setError(authError.message);
    }
  }

  const anyBusy = busy || oauthBusy !== null;

  return (
    <div className="ijl">
      <main className="ijl-stage">
        <div className="ijl-inner">
          {emblemOk && (
            <img
              className="ijl-emblem"
              src="/ijidi-fan-emblem.png"
              alt="IJIDI"
              onError={() => setEmblemOk(false)}
            />
          )}
          <h1 className="ijl-wordmark">IJIDI Portal</h1>
          <p className="ijl-note">Authorised access only.</p>

          <form className="ijl-form" onSubmit={handleAuth}>
            <div className="ijl-field">
              <label htmlFor="ijidi-access-id">Access ID</label>
              <input
                id="ijidi-access-id"
                type="email"
                name="email"
                placeholder="Your email address"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="ijl-field">
              <label htmlFor="ijidi-passkey">Passkey</label>
              <div className="ijl-password">
                <input
                  id="ijidi-passkey"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Your passkey"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="ijl-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide passkey" : "Show passkey"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="ijl-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember my Access ID</span>
            </label>

            {error && (
              <div className="ijl-error" role="alert">
                {error}
              </div>
            )}

            <button className="ijl-submit" type="submit" disabled={anyBusy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>

            {OAUTH_ENABLED && (
              <>
                <div className="ijl-divider">
                  <span>or continue with</span>
                </div>
                <div className="ijl-oauth">
                  <button
                    type="button"
                    className="ijl-oauth-btn"
                    disabled={anyBusy}
                    onClick={() => handleSocialAuth("google")}
                  >
                    {oauthBusy === "google" ? "Opening…" : "Google"}
                  </button>
                  <button
                    type="button"
                    className="ijl-oauth-btn"
                    disabled={anyBusy}
                    onClick={() => handleSocialAuth("github")}
                  >
                    {oauthBusy === "github" ? "Opening…" : "GitHub"}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="ijl-help">
            Trouble signing in? <b>Contact the Governor.</b>
          </p>
        </div>
      </main>

      <style>{`
        .ijl{
          --gold:#C6A15B;--gold-hi:#E0C58A;--gold-rgb:198,161,91;
          --ivory:#F5F1E8;--ivory-rgb:245,241,232;--obsidian:#111111;
          --line:rgba(var(--gold-rgb),.3);
          --sans:"Karla","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          --serif:"Fraunces",Georgia,"Times New Roman",serif;
          position:fixed;inset:0;z-index:100;overflow-x:hidden;overflow-y:auto;
          color:var(--ivory);font-family:var(--sans);
          background:
            radial-gradient(ellipse 62% 46% at 50% 26%,rgba(var(--gold-rgb),.16),transparent 70%),
            var(--obsidian);
        }
        .ijl *{box-sizing:border-box}

        .ijl-stage{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;
          padding:40px 22px}
        .ijl-inner{width:100%;max-width:380px;display:flex;flex-direction:column;align-items:center;
          text-align:center;animation:ijlIn .9s cubic-bezier(.2,.8,.2,1) both}
        @keyframes ijlIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

        /* The emblem is the one bold element on the page */
        .ijl-emblem{display:block;width:clamp(150px,38vw,196px);height:auto;
          filter:drop-shadow(0 0 26px rgba(var(--gold-rgb),.38)) drop-shadow(0 2px 6px rgba(0,0,0,.6))}
        .ijl-wordmark{margin:14px 0 0;font:500 clamp(1.7rem,6vw,2.1rem)/1.1 var(--serif);
          letter-spacing:.14em;text-transform:uppercase;color:var(--ivory)}
        .ijl-note{margin:10px 0 0;font:400 14px/1.4 var(--sans);letter-spacing:.02em;
          color:rgba(var(--ivory-rgb),.62)}

        .ijl-form{width:100%;margin-top:34px;padding-top:30px;border-top:1px solid var(--line);
          display:flex;flex-direction:column;gap:18px;text-align:left}
        .ijl-field label{display:block;margin-bottom:8px;font:600 13px/1 var(--sans);letter-spacing:.02em;
          color:var(--gold-hi)}
        .ijl-field input[type="email"],
        .ijl-field input[type="password"],
        .ijl-field input[type="text"]{
          width:100%;min-height:52px;padding:14px 16px;border-radius:10px;
          border:1px solid var(--line);background:rgba(var(--ivory-rgb),.05);
          color:var(--ivory);font:400 16px/1.2 var(--sans);outline:none;
          transition:border-color .2s,box-shadow .2s,background .2s}
        .ijl-field input::placeholder{color:rgba(var(--ivory-rgb),.36)}
        .ijl-field input:focus{border-color:var(--gold);background:rgba(var(--ivory-rgb),.07);
          box-shadow:0 0 0 3px rgba(var(--gold-rgb),.2)}
        .ijl-password{position:relative}
        .ijl-password input{padding-right:72px}
        .ijl-toggle{position:absolute;top:50%;right:6px;transform:translateY(-50%);
          min-width:56px;min-height:40px;padding:0 10px;border:0;border-radius:8px;background:transparent;
          color:var(--gold);font:600 13px/1 var(--sans);cursor:pointer;transition:color .2s}
        .ijl-toggle:hover{color:var(--gold-hi)}

        .ijl-remember{display:flex;align-items:center;gap:10px;cursor:pointer;
          font:400 14px/1 var(--sans);color:rgba(var(--ivory-rgb),.72)}
        .ijl-remember input{width:18px;height:18px;accent-color:var(--gold);cursor:pointer}

        .ijl-error{padding:12px 14px;border-radius:10px;border:1px solid rgba(224,122,107,.45);
          background:rgba(224,122,107,.1);color:#F0A79C;font:500 14px/1.45 var(--sans)}

        .ijl-submit{width:100%;min-height:54px;margin-top:4px;padding:14px 22px;border:0;border-radius:10px;
          background:linear-gradient(180deg,var(--gold-hi),var(--gold));color:var(--obsidian);
          font:700 16px/1 var(--sans);letter-spacing:.04em;cursor:pointer;
          box-shadow:0 8px 28px rgba(var(--gold-rgb),.22);
          transition:transform .15s,box-shadow .2s,filter .2s}
        .ijl-submit:hover:not(:disabled){filter:brightness(1.07);box-shadow:0 10px 34px rgba(var(--gold-rgb),.34)}
        .ijl-submit:active:not(:disabled){transform:translateY(1px)}
        .ijl-submit:disabled{opacity:.6;cursor:default}

        .ijl-divider{display:flex;align-items:center;gap:12px;margin-top:6px;
          font:400 13px/1 var(--sans);color:rgba(var(--ivory-rgb),.5)}
        .ijl-divider::before,.ijl-divider::after{content:"";flex:1;height:1px;background:var(--line)}
        .ijl-oauth{display:flex;gap:10px}
        .ijl-oauth-btn{flex:1;min-height:50px;border-radius:10px;border:1px solid var(--line);
          background:rgba(var(--ivory-rgb),.04);color:var(--ivory);font:600 15px/1 var(--sans);cursor:pointer;
          transition:border-color .2s,background .2s}
        .ijl-oauth-btn:hover:not(:disabled){border-color:var(--gold);background:rgba(var(--gold-rgb),.1)}
        .ijl-oauth-btn:disabled{opacity:.55;cursor:default}

        .ijl-help{margin:26px 0 0;font:400 14px/1.4 var(--sans);color:rgba(var(--ivory-rgb),.55)}
        .ijl-help b{font-weight:600;color:var(--gold)}

        /* Keyboard focus */
        .ijl-submit:focus-visible,.ijl-oauth-btn:focus-visible,.ijl-toggle:focus-visible,
        .ijl-remember input:focus-visible{outline:2px solid var(--gold-hi);outline-offset:2px}

        @media (max-width:480px){
          .ijl-stage{align-items:flex-start;padding:48px 22px 32px}
          .ijl-form{margin-top:28px;padding-top:26px}
        }
        @media (prefers-reduced-motion:reduce){
          .ijl-inner{animation:none}
          .ijl *{transition-duration:.001ms!important}
        }
      `}</style>
    </div>
  );
}
