import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// Keep false until Google/GitHub are enabled in Supabase AND new sign-ups are
// restricted there. Otherwise any Google/GitHub account could create a session.
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

  async function handleSocialAuth(provider: "google" | "github") {
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

  const anyBusy = busy || oauthBusy !== null;

  return (
    <div className="ijidi-login">
      <div className="login-stage">
        <main className="login-card">
          {emblemOk && (
            <img className="emblem" src="/ijidi-fan-emblem.png" alt="IJIDI Portal emblem" onError={() => setEmblemOk(false)} />
          )}
          <div className="portal-name">
            IJIDI <span>PORTAL</span>
          </div>
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

            {OAUTH_ENABLED && (
              <>
                <div className="oauth-divider">
                  <span>OR CONTINUE WITH</span>
                </div>
                <div className="oauth-buttons">
                  <button type="button" className="btn-oauth" disabled={anyBusy} onClick={() => handleSocialAuth("google")}>
                    {oauthBusy === "google" ? "Opening…" : "Google"}
                  </button>
                  <button type="button" className="btn-oauth" disabled={anyBusy} onClick={() => handleSocialAuth("github")}>
                    {oauthBusy === "github" ? "Opening…" : "GitHub"}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="card-foot">
            <span>Authorised access only</span>
            <span>
              Trouble signing in? <b>Contact the Governor</b>
            </span>
          </div>
        </main>
      </div>

      <style>{`
        .ijidi-login{--gold:#C6A15B;--gold-hi:#E2C688;--gold-lo:#A98443;--gold-rgb:198,161,91;
          --ivory:#F5F1E8;--line:rgba(198,161,91,.24);
          --mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
          --display:"Fraunces",Georgia,"Times New Roman",serif;
          --ease:cubic-bezier(.2,.8,.2,1);
          position:fixed;inset:0;z-index:100;overflow-x:hidden;overflow-y:auto;color:var(--ivory);
          font-family:"Karla","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          background:
            radial-gradient(ellipse 60% 48% at 50% 26%,rgba(var(--gold-rgb),.17),transparent 70%),
            radial-gradient(ellipse 90% 60% at 50% 105%,rgba(var(--gold-rgb),.07),transparent 70%),
            #0d0d0e;}
        .ijidi-login *{box-sizing:border-box}

        .login-stage{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;
          padding:32px 20px}

        .login-card{position:relative;width:100%;max-width:420px;padding:40px 36px 28px;
          border:1px solid var(--line);border-radius:20px;
          background:linear-gradient(180deg,rgba(26,25,22,.88),rgba(14,14,14,.94));
          backdrop-filter:blur(16px) saturate(130%);-webkit-backdrop-filter:blur(16px) saturate(130%);
          box-shadow:0 34px 90px rgba(0,0,0,.6),0 0 60px rgba(var(--gold-rgb),.06),inset 0 1px 0 rgba(255,255,255,.05);
          animation:ijidiRise .7s var(--ease) both}
        .login-card::before{content:"";position:absolute;top:-1px;left:14%;right:14%;height:1px;
          background:linear-gradient(90deg,transparent,var(--gold-hi),transparent)}
        @keyframes ijidiRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

        .emblem{display:block;width:140px;height:140px;margin:-6px auto 14px;object-fit:contain;
          filter:drop-shadow(0 8px 28px rgba(var(--gold-rgb),.4))}
        .portal-name{text-align:center;font:600 12px/1 var(--mono);letter-spacing:.44em;color:var(--ivory)}
        .portal-name span{color:var(--gold)}
        .form-title{margin:22px 0 0;text-align:center;font:500 32px/1.1 var(--display);letter-spacing:.01em;color:var(--ivory)}
        .form-sub{margin:10px 0 0;text-align:center;font:400 14px/1.6 "Karla","Segoe UI",sans-serif;color:rgba(245,241,232,.55)}

        .fields{margin-top:28px;display:flex;flex-direction:column;gap:16px;text-align:left}
        .field label{display:block;margin-bottom:8px;font:600 9.5px/1 var(--mono);letter-spacing:.22em;
          text-transform:uppercase;color:var(--gold)}
        .field input{width:100%;padding:14px 15px;border-radius:10px;border:1px solid var(--line);
          background:rgba(255,255,255,.035);color:var(--ivory);font:500 14.5px/1.2 "Karla","Segoe UI",sans-serif;
          letter-spacing:.02em;outline:none;transition:border-color .25s,box-shadow .25s,background .25s}
        .field input::placeholder{color:rgba(245,241,232,.28)}
        .field input:focus{border-color:rgba(var(--gold-rgb),.75);background:rgba(255,255,255,.05);
          box-shadow:0 0 0 3px rgba(var(--gold-rgb),.16)}
        .field input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #1b1a17 inset;
          -webkit-text-fill-color:#F5F1E8;caret-color:#F5F1E8}
        .password-wrap{position:relative}
        .password-wrap input{padding-right:68px}
        .toggle-eye{position:absolute;top:50%;right:6px;transform:translateY(-50%);background:transparent;border:none;
          cursor:pointer;padding:10px;border-radius:6px;font:700 9px/1 var(--mono);letter-spacing:.16em;
          text-transform:uppercase;color:var(--gold);transition:color .2s}
        .toggle-eye:hover{color:var(--gold-hi)}

        .remember-row{display:flex;align-items:center;gap:9px;cursor:pointer;margin-top:-2px;
          font:500 11px/1 var(--mono);letter-spacing:.06em;color:rgba(245,241,232,.6)}
        .remember-row input{width:16px;height:16px;accent-color:var(--gold);cursor:pointer}

        .auth-error{padding:10px 13px;border-radius:8px;border:1px solid rgba(217,123,63,.45);
          background:rgba(217,123,63,.09);font:600 11px/1.5 var(--mono);letter-spacing:.03em;color:#e9a06f}

        .btn{width:100%;margin-top:6px;min-height:52px;padding:14px 22px;border-radius:10px;cursor:pointer;
          border:1px solid rgba(255,255,255,.14);
          background:linear-gradient(180deg,var(--gold-hi),var(--gold) 55%,var(--gold-lo));
          color:#15120a;font:700 12px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;
          box-shadow:0 10px 28px rgba(var(--gold-rgb),.24),inset 0 1px 0 rgba(255,255,255,.35);
          transition:transform .25s var(--ease),box-shadow .25s var(--ease),filter .25s}
        .btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.06);
          box-shadow:0 14px 36px rgba(var(--gold-rgb),.34),inset 0 1px 0 rgba(255,255,255,.4)}
        .btn:active:not(:disabled){transform:translateY(0)}
        .btn:disabled{opacity:.6;cursor:default}

        .oauth-divider{display:flex;align-items:center;margin:20px 0 14px;color:rgba(245,241,232,.35);
          font:600 9px/1 var(--mono);letter-spacing:.18em}
        .oauth-divider::before,.oauth-divider::after{content:"";flex:1;height:1px;background:var(--line)}
        .oauth-divider span{padding:0 10px}
        .oauth-buttons{display:flex;gap:10px}
        .btn-oauth{flex:1;min-height:46px;padding:10px;border-radius:10px;border:1px solid var(--line);
          background:rgba(255,255,255,.03);color:var(--ivory);font:600 11.5px/1 var(--mono);letter-spacing:.08em;
          cursor:pointer;transition:all .25s var(--ease)}
        .btn-oauth:hover:not(:disabled){background:rgba(var(--gold-rgb),.1);border-color:rgba(var(--gold-rgb),.5)}
        .btn-oauth:disabled{opacity:.55;cursor:default}

        .btn:focus-visible,.btn-oauth:focus-visible,.toggle-eye:focus-visible,.remember-row input:focus-visible{
          outline:2px solid var(--gold-hi);outline-offset:2px}

        .card-foot{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-direction:column;
          gap:8px;align-items:center;text-align:center;font:500 10px/1.5 var(--mono);letter-spacing:.1em;
          color:rgba(245,241,232,.38)}
        .card-foot b{color:var(--gold);font-weight:600}

        @media (max-width:520px){
          .login-stage{align-items:flex-start;padding:28px 16px 24px}
          .login-card{padding:32px 22px 24px;border-radius:18px}
          .emblem{width:120px;height:120px}
          .form-title{font-size:28px}
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
