import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const TICKS = [
  "SECURE CHANNEL · ROOT ACCESS ONLY",
  "IGX AI REASONING LAYER · STANDING BY",
  "ENTITY MESH · GROUP · FOUNDATION · ATELIER · MEDIA",
  "SESSION ENCRYPTION · ACTIVE",
];

const BOOT_LINES = [
  ["INITIALISING IJIDI PORTAL KERNEL", "OK"],
  ["VERIFYING GOVERNANCE LAYER", "OK"],
  ["MOUNTING ENTITY MESH", "OK"],
  ["WAKING IGX AI", "OK"],
  ["HANDING OFF TO ACCESS SHELL", "READY"],
] as const;

const REMEMBER_KEY = "ijidi_remember_email";

function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, raf = 0;
    const HUD = { r: 0, g: 240, b: 255 };
    const ACC = { r: 138, g: 107, b: 255 };
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let stars: { x: number; y: number; z: number; s: number; vx: number; vy: number; tw: number }[] = [];

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seedStars() {
      const count = Math.min(170, Math.round((W * H) / 11000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: 0.2 + Math.random() * 0.8,
        s: 0.3 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.00013,
        vy: (Math.random() - 0.5) * 0.00013,
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function drawBG(t: number) {
      ctx.clearRect(0, 0, W, H);
      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, "#03060d");
      base.addColorStop(0.5, "#050b16");
      base.addColorStop(1, "#02040a");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;

      ctx.globalCompositeOperation = "lighter";
      const blobs = [
        { x: 0.25 + Math.sin(t / 9000) * 0.06, y: 0.3 + Math.cos(t / 11000) * 0.05, r: 0.5, c: HUD, a: 0.11 },
        { x: 0.75 + Math.cos(t / 10000) * 0.05, y: 0.68 + Math.sin(t / 8000) * 0.06, r: 0.46, c: ACC, a: 0.11 },
      ];
      for (const bl of blobs) {
        const cx = (bl.x + (mouse.x - 0.5) * 0.03) * W;
        const cy = (bl.y + (mouse.y - 0.5) * 0.03) * H;
        const r = bl.r * Math.max(W, H);
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, `rgba(${bl.c.r},${bl.c.g},${bl.c.b},${bl.a})`);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x += 1; else if (s.x > 1) s.x -= 1;
        if (s.y < 0) s.y += 1; else if (s.y > 1) s.y -= 1;
        const px = (s.x + (mouse.x - 0.5) * 0.022 * s.z) * W;
        const py = (s.y + (mouse.y - 0.5) * 0.022 * s.z) * H;
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(t / 1400 + s.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${HUD.r},${HUD.g},${HUD.b},${((0.14 + 0.62 * s.z) * tw).toFixed(3)})`;
        ctx.arc(px, py, s.s * s.z, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(t: number) {
      drawBG(t);
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }
    function onResize() {
      sizeCanvas();
      seedStars();
    }

    sizeCanvas();
    seedStars();
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="ijidi-login-fx" />;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [tickIndex, setTickIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    let i = 0;
    const step = () => {
      i += 1;
      setVisibleLines(i);
      if (i < BOOT_LINES.length) {
        setTimeout(step, 300);
      } else {
        setTimeout(() => setBooted(true), 420);
      }
    };
    const start = setTimeout(step, 200);
    const failsafe = setTimeout(() => setBooted(true), 3600);
    return () => {
      clearTimeout(start);
      clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTickIndex((n) => (n + 1) % TICKS.length), 3200);
    return () => clearInterval(id);
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
    navigate({ to: "/" });
  }

  async function handleSocialAuth(provider: 'google' | 'github') {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) {
      setError(authError.message);
    }
  }

  return (
    <div className="ijidi-login">
      <StarfieldCanvas />
      <div className="ijidi-login-grid" aria-hidden="true" />
      <div className="ijidi-login-vignette" aria-hidden="true" />

      <svg className="ijidi-login-ring ring-1" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="14 10" opacity=".55" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="44 18" opacity=".35" />
      </svg>
      <svg className="ijidi-login-ring ring-2" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="88" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="6 12" opacity=".5" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="30 22" opacity=".3" />
      </svg>

      <div className="ijidi-login-frame" aria-hidden="true">
        <span className="c tl" /><span className="c tr" />
        <span className="c bl" /><span className="c br" />
      </div>
      <div className="ijidi-login-scanlines" aria-hidden="true" />

      <div className="ijidi-login-stage">
        <div className="ijidi-login-card">
          <div className="medallion-wrap">
            <div className="medallion-ring" />
            <img className="medallion" src="/ijidi-group-medallion.png" alt="IJIDI Group" />
          </div>

          <div className="brand-line">IJIDI Portal</div>
          <div className="brand-sub">Governance &amp; Execution Layer</div>

          <span className="status-chip"><i />IGX AI Standing By</span>

          <form className="fields" onSubmit={handleAuth}>
            <div className="field">
              <label>Access ID</label>
              <input
                type="email"
                placeholder="mandela.onwusah@ijidi.com"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Passkey</label>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember Access ID</span>
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Authenticate"}
            </button>

            <div className="oauth-divider">
              <span>OR ACCESS VIA</span>
            </div>

            <div className="oauth-buttons">
              <button
                type="button"
                className="btn-oauth"
                onClick={() => handleSocialAuth("google")}
              >
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-1.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                className="btn-oauth"
                onClick={() => handleSocialAuth("github")}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </form>

          <div className="altlink">Trouble signing in? <b>Contact Governance</b></div>
          <div className="foot-tick">{TICKS[tickIndex]}</div>
        </div>
      </div>

      <div className={`ijidi-login-boot${booted ? " done" : ""}`}>
        <div className="boot-inner">
          <div className="boot-logo">IJIDI</div>
          <div className="boot-sub">PORTAL ACCESS SHELL</div>
          <div className="boot-lines">
            {BOOT_LINES.slice(0, visibleLines).map(([line, status], i) => (
              <div key={i}>
                &gt; {line} <b>{"." .repeat(3)} {status}</b>
              </div>
            ))}
          </div>
          <div className="boot-bar"><i /></div>
        </div>
      </div>

      <style>{`
        .ijidi-login{--hud:#00f0ff;--hud-rgb:0,240,255;--hud-2:#8a6bff;--ink:#eaf6ff;
          --stroke:rgba(var(--hud-rgb),.22);--stroke-strong:rgba(var(--hud-rgb),.6);
          --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
          --ease:cubic-bezier(.2,.8,.2,1);
          position:fixed;inset:0;z-index:100;background:#02040a;color:var(--ink);
          font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;}
        .ijidi-login *{box-sizing:border-box}
        .ijidi-login-fx{position:fixed;inset:0;z-index:0;display:block}
        .ijidi-login-grid{position:fixed;inset:0;z-index:1;pointer-events:none;
          background-image:linear-gradient(rgba(var(--hud-rgb),.06) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--hud-rgb),.06) 1px,transparent 1px);
          background-size:64px 64px,64px 64px;
          mask-image:radial-gradient(ellipse at 50% 50%,#000 20%,transparent 78%);
          -webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000 20%,transparent 78%);
          opacity:.75;animation:ijidiGridDrift 24s linear infinite;}
        @keyframes ijidiGridDrift{to{background-position:64px 64px,64px 64px}}
        .ijidi-login-scanlines{position:fixed;inset:0;z-index:40;pointer-events:none;
          background:repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);
          mix-blend-mode:overlay;opacity:.55;animation:ijidiScanMove 8s linear infinite;}
        @keyframes ijidiScanMove{to{background-position:0 300px}}
        .ijidi-login-vignette{position:fixed;inset:0;z-index:2;pointer-events:none;
          background:radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(0,0,0,.55) 100%)}
        .ijidi-login-frame{position:fixed;inset:12px;z-index:3;pointer-events:none}
        .ijidi-login-frame .c{position:absolute;width:52px;height:52px;border:1px solid var(--stroke-strong);
          filter:drop-shadow(0 0 7px rgba(var(--hud-rgb),.55));animation:ijidiCornerPulse 4s ease-in-out infinite}
        @keyframes ijidiCornerPulse{0%,100%{opacity:.45}50%{opacity:1}}
        .ijidi-login-frame .tl{top:0;left:0;border-right:0;border-bottom:0;border-top-left-radius:14px}
        .ijidi-login-frame .tr{top:0;right:0;border-left:0;border-bottom:0;border-top-right-radius:14px;animation-delay:.6s}
        .ijidi-login-frame .bl{bottom:0;left:0;border-right:0;border-top:0;border-bottom-left-radius:14px;animation-delay:1.2s}
        .ijidi-login-frame .br{bottom:0;right:0;border-left:0;border-top:0;border-bottom-right-radius:14px;animation-delay:1.8s}
        .ijidi-login-ring{position:fixed;z-index:2;pointer-events:none;opacity:.5;
          filter:drop-shadow(0 0 10px rgba(var(--hud-rgb),.45))}
        .ijidi-login-ring.ring-1{top:6%;left:4%;width:170px;height:170px;animation:ijidiSpin 42s linear infinite}
        .ijidi-login-ring.ring-2{bottom:6%;right:4%;width:140px;height:140px;animation:ijidiSpin 30s linear infinite reverse}
        @keyframes ijidiSpin{to{transform:rotate(360deg)}}
        .ijidi-login-stage{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:24px}
        .ijidi-login-card{width:min(420px,92vw);padding:38px 34px 30px;border-radius:22px;
          border:1px solid var(--stroke);
          background:linear-gradient(160deg,rgba(255,255,255,.075),rgba(255,255,255,.02) 45%,rgba(var(--hud-rgb),.035));
          backdrop-filter:blur(20px) saturate(150%);-webkit-backdrop-filter:blur(20px) saturate(150%);
          box-shadow:0 24px 60px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.09),inset 0 0 50px rgba(var(--hud-rgb),.06);
          text-align:center}
        .medallion-wrap{position:relative;width:150px;height:150px;margin:0 auto 18px}
        .medallion-ring{position:absolute;inset:-10px;border-radius:50%;border:1px solid var(--stroke-strong);
          filter:drop-shadow(0 0 14px rgba(var(--hud-rgb),.5));animation:ijidiSpin 16s linear infinite}
        .medallion{width:150px;height:150px;border-radius:50%;object-fit:cover;background:#0b0d14;
          filter:drop-shadow(0 0 22px rgba(var(--hud-rgb),.35));animation:ijidiFloat 5s ease-in-out infinite}
        @keyframes ijidiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .brand-line{font:600 20px/1 var(--mono);letter-spacing:.3em;text-transform:uppercase;margin-top:6px;
          background:linear-gradient(90deg,#fff,var(--hud));-webkit-background-clip:text;background-clip:text;
          -webkit-text-fill-color:transparent;color:transparent}
        .brand-sub{margin-top:8px;font:600 9.5px/1 var(--mono);letter-spacing:.24em;color:rgba(255,255,255,.42);text-transform:uppercase}
        .status-chip{margin:18px auto 0;display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;
          border:1px solid var(--stroke);background:rgba(var(--hud-rgb),.06);
          font:600 9px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.75)}
        .status-chip i{width:6px;height:6px;border-radius:50%;background:var(--hud);box-shadow:0 0 8px var(--hud);
          animation:ijidiBlink 1.8s ease-in-out infinite;display:inline-block}
        @keyframes ijidiBlink{0%,100%{opacity:1}50%{opacity:.25}}
        .fields{margin-top:26px;display:flex;flex-direction:column;gap:14px;text-align:left}
        .field label{display:block;font:600 9.5px/1 var(--mono);letter-spacing:.2em;text-transform:uppercase;
          color:var(--hud);margin-bottom:7px}
        .field input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--stroke);
          background:rgba(255,255,255,.04);color:var(--ink);font:500 13px/1 var(--mono);letter-spacing:.05em;
          outline:none;transition:border-color .25s,box-shadow .25s}
        .field input::placeholder{color:rgba(255,255,255,.28)}
        .field input:focus{border-color:rgba(var(--hud-rgb),.6);box-shadow:0 0 0 3px rgba(var(--hud-rgb),.12)}
        .password-wrap{position:relative}
        .password-wrap input{padding-right:58px}
        .toggle-eye{position:absolute;top:50%;right:8px;transform:translateY(-50%);
          background:transparent;border:none;cursor:pointer;
          font:700 9px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--hud);
          padding:6px 8px}
        .remember-row{display:flex;align-items:center;gap:8px;cursor:pointer;
          font:500 10.5px/1 var(--mono);letter-spacing:.06em;color:rgba(255,255,255,.6);margin-top:-2px}
        .remember-row input{width:14px;height:14px;accent-color:var(--hud);cursor:pointer}
        .auth-error{font:600 10.5px/1.5 var(--mono);color:#ff6b8a;letter-spacing:.04em}
        .btn{position:relative;overflow:hidden;cursor:pointer;width:100%;margin-top:8px;
          padding:13px 22px;border-radius:10px;border:1px solid rgba(var(--hud-rgb),.45);
          background:linear-gradient(180deg,rgba(var(--hud-rgb),.18),rgba(var(--hud-rgb),.05));
          color:var(--hud);font:700 11px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;
          transition:all .3s var(--ease)}
        .btn:disabled{opacity:.6;cursor:default}
        .btn:hover{color:#fff;text-shadow:0 0 10px var(--hud);
          background:linear-gradient(180deg,rgba(var(--hud-rgb),.36),rgba(var(--hud-rgb),.12));
          box-shadow:0 0 26px rgba(var(--hud-rgb),.4),inset 0 0 20px rgba(var(--hud-rgb),.18)}
        
        /* OAuth UI Additions */
        .oauth-divider{display:flex;align-items:center;margin:18px 0 14px;color:rgba(255,255,255,.3);font:600 9px/1 var(--mono);letter-spacing:.18em}
        .oauth-divider::before,.oauth-divider::after{content:"";flex:1;height:1px;background:var(--stroke)}
        .oauth-divider span{padding:0 10px}
        .oauth-buttons{display:flex;gap:10px}
        .btn-oauth{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;border:1px solid var(--stroke);background:rgba(255,255,255,.03);color:var(--ink);font:600 11px/1 var(--mono);letter-spacing:.08em;cursor:pointer;transition:all .25s var(--ease)}
        .btn-oauth:hover{background:rgba(var(--hud-rgb),.1);border-color:rgba(var(--hud-rgb),.4);color:#fff}

        .altlink{margin-top:16px;font:500 10.5px/1 var(--mono);letter-spacing:.1em;color:rgba(255,255,255,.4)}
        .altlink b{color:var(--hud);font-weight:600;cursor:pointer}
        .foot-tick{margin-top:22px;font:500 9.5px/1.6 var(--mono);letter-spacing:.08em;color:rgba(255,255,255,.32)}
        .ijidi-login-boot{position:fixed;inset:0;z-index:60;display:grid;place-items:center;
          background:radial-gradient(ellipse at 50% 50%,#060c16,#010206 70%);
          transition:opacity .9s ease,visibility .9s ease}
        .ijidi-login-boot.done{opacity:0;visibility:hidden;pointer-events:none}
        .boot-inner{width:min(480px,86vw)}
        .boot-logo{font:200 1.9rem/1 var(--mono);letter-spacing:.4em;color:#fff;text-align:center;margin-bottom:6px;
          text-shadow:0 0 30px rgba(var(--hud-rgb),.9)}
        .boot-sub{text-align:center;font:600 9px/1 var(--mono);letter-spacing:.36em;color:var(--hud);margin-bottom:26px}
        .boot-lines{min-height:120px;font:500 11px/1.9 var(--mono);color:rgba(255,255,255,.7);letter-spacing:.06em}
        .boot-lines b{color:var(--hud);font-weight:600}
        .boot-bar{height:3px;margin-top:22px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
        .boot-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--hud),#fff);
          box-shadow:0 0 16px var(--hud);animation:ijidiBootLoad 2.6s var(--ease) forwards}
        @keyframes ijidiBootLoad{to{width:100%}}
        @media (prefers-reduced-motion:reduce){.ijidi-login *{animation-duration:.001ms!important;
          animation-iteration-count:1!important;transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}
