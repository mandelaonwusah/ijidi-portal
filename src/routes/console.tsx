import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getEcosystemMetrics } from "@/lib/portal-queries";
import { useLiveActivityLog } from "@/hooks/useLiveActivityLog";

export const Route = createFileRoute("/console")({
  component: ConsolePage,
});

function formatTacticalTime(isoString?: string): string {
  if (!isoString) return "00:00:00";
  try {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "00:00:00";
  }
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "just now";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return "recently";
  }
}

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

  return <canvas ref={canvasRef} className="ijidi-console-fx" />;
}

function ConsolePage() {
  const [entitiesOpen, setEntitiesOpen] = useState(false);

  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useQuery({
    queryKey: ["ecosystem-metrics"],
    queryFn: getEcosystemMetrics,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const { logs: activity, isLoading: activityLoading } = useLiveActivityLog();
  const totalActivities = activity?.length ?? 0;
  const recentActivities = activity?.slice(0, 8) ?? [];
  const hasRealData = totalActivities > 0;

  const entitySubItems = [
    { label: "IJIDI Foundation", to: "/foundation", status: "standby" },
    { label: "IJIDI Atelier", to: "/atelier", status: "forming" },
    { label: "IJIDI Media", to: "/media", status: "forming" },
  ];

  const metricTiles = [
    { label: "VAULT ASSETS", value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.totalVaultAssets ?? "—" },
    { label: "ACTIVE PROPOSALS", value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.activeProposals ?? "—" },
    { label: "GOVERNANCE STATUS", value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.governanceStatus ?? "—" },
    { label: "SYSTEM UPTIME", value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.uptime ?? "—" },
  ];

  return (
    <div className="ijidi-console">
      <StarfieldCanvas />
      <div className="ijidi-console-grid" aria-hidden="true" />
      <div className="ijidi-console-vignette" aria-hidden="true" />

      <svg className="ijidi-console-ring ring-1" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="14 10" opacity=".55" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="44 18" opacity=".35" />
      </svg>
      <svg className="ijidi-console-ring ring-2" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="88" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="6 12" opacity=".5" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--hud)" strokeWidth="1" strokeDasharray="30 22" opacity=".3" />
      </svg>

      <div className="ijidi-console-frame" aria-hidden="true">
        <span className="c tl" /><span className="c tr" />
        <span className="c bl" /><span className="c br" />
      </div>
      <div className="ijidi-console-scanlines" aria-hidden="true" />

      <div className="ijidi-console-stage">
        {/* Header */}
        <header className="c-header">
          <div className="c-header-left">
            <span className="root-badge">ROOT</span>
            <div>
              <div className="c-title">Mandela Onwusah</div>
              <div className="c-sub">@mandelaonwusah1 · Governor</div>
            </div>
          </div>
          <div className="c-header-right">
            <span className="status-chip">
              <i style={{ background: metricsError ? "#ff6b8a" : "var(--hud)" }} />
              {metricsLoading ? "INITIALIZING" : metricsError ? "OFFLINE" : "ONLINE"}
            </span>
          </div>
        </header>

        {/* Metrics */}
        <section className="c-metrics">
          {metricTiles.map((m, i) => (
            <div className="metric-tile" key={i}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
              <div className="metric-foot">NOT TRACKED · AWAITING RECORDS</div>
            </div>
          ))}
        </section>

        <div className="c-grid">
          {/* Telemetry feed */}
          <section className="c-panel c-panel-wide">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">SYSTEM TELEMETRY</div>
                <div className="panel-title">
                  Real-Time Audit Stream
                  {hasRealData && <span className="badge-count">{totalActivities} EVENTS</span>}
                </div>
              </div>
              <div className="panel-head-right">
                <span className="status-chip small"><i />WEBSOCKET</span>
              </div>
            </div>

            <div className="feed">
              {activityLoading ? (
                <div className="feed-empty">Initializing telemetry socket…</div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log, idx) => (
                  <div className="feed-row" key={log.id || idx}>
                    <div className="feed-actor">{log.actor?.toUpperCase() ?? "SYSTEM"}</div>
                    <div className="feed-action">{log.action}</div>
                    <div className="feed-time">
                      {formatRelativeTime(log.timestamp)} · {formatTacticalTime(log.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="feed-empty">No verified entries logged — awaiting operations.</div>
              )}
            </div>
          </section>

          {/* Navigation matrix */}
          <section className="c-panel">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">NAVIGATION MATRIX</div>
                <div className="panel-title">Primary Modules</div>
              </div>
            </div>

            <div className="nav-list">
              <Link to="/vault" className="nav-row">
                <div>
                  <div className="nav-row-title">[07] GOVERNANCE</div>
                  <div className="nav-row-sub">Proposals · Votes · Recovery</div>
                </div>
                <span className="nav-arrow">→</span>
              </Link>

              <Link to="/ecosystem" className="nav-row">
                <div>
                  <div className="nav-row-title">[02] ECOSYSTEM</div>
                  <div className="nav-row-sub">Entities · Relations · Status</div>
                </div>
                <span className="nav-arrow">→</span>
              </Link>

              <div className="nav-row nav-row-expand" onClick={() => setEntitiesOpen(!entitiesOpen)}>
                <div>
                  <div className="nav-row-title">[ENTITIES] <span className="badge-count small">3 ACTIVE</span></div>
                  <div className="nav-row-sub">Foundation · Atelier · Media</div>
                </div>
                <span className={`nav-chevron ${entitiesOpen ? "open" : ""}`}>⌄</span>
              </div>

              {entitiesOpen && (
                <div className="nav-sublist">
                  {entitySubItems.map((item, idx) => (
                    <Link to={item.to} className="nav-subrow" key={idx}>
                      <span>{item.label}</span>
                      <span className={`dot ${item.status}`} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .ijidi-console{--hud:#00f0ff;--hud-rgb:0,240,255;--hud-2:#8a6bff;--ink:#eaf6ff;
          --stroke:rgba(var(--hud-rgb),.22);--stroke-strong:rgba(var(--hud-rgb),.6);
          --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
          position:fixed;inset:0;z-index:50;background:#02040a;color:var(--ink);
          overflow-y:auto;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
        .ijidi-console *{box-sizing:border-box}
        .ijidi-console-fx{position:fixed;inset:0;z-index:0;display:block}
        .ijidi-console-grid{position:fixed;inset:0;z-index:1;pointer-events:none;
          background-image:linear-gradient(rgba(var(--hud-rgb),.06) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--hud-rgb),.06) 1px,transparent 1px);
          background-size:64px 64px;mask-image:radial-gradient(ellipse at 50% 50%,#000 20%,transparent 78%);
          -webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000 20%,transparent 78%);
          opacity:.75;animation:ijidiConsoleGridDrift 24s linear infinite}
        @keyframes ijidiConsoleGridDrift{to{background-position:64px 64px,64px 64px}}
        .ijidi-console-scanlines{position:fixed;inset:0;z-index:30;pointer-events:none;
          background:repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);
          mix-blend-mode:overlay;opacity:.55;animation:ijidiConsoleScanMove 8s linear infinite}
        @keyframes ijidiConsoleScanMove{to{background-position:0 300px}}
        .ijidi-console-vignette{position:fixed;inset:0;z-index:2;pointer-events:none;
          background:radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(0,0,0,.55) 100%)}
        .ijidi-console-ring{position:fixed;z-index:2;pointer-events:none;opacity:.5;
          filter:drop-shadow(0 0 10px rgba(var(--hud-rgb),.45))}
        .ijidi-console-ring.ring-1{top:6%;left:4%;width:170px;height:170px;animation:ijidiConsoleSpin 42s linear infinite}
        .ijidi-console-ring.ring-2{bottom:6%;right:4%;width:140px;height:140px;animation:ijidiConsoleSpin 30s linear infinite reverse}
        @keyframes ijidiConsoleSpin{to{transform:rotate(360deg)}}
        .ijidi-console-frame{position:fixed;inset:12px;z-index:3;pointer-events:none}
        .ijidi-console-frame .c{position:absolute;width:52px;height:52px;border:1px solid var(--stroke-strong);
          filter:drop-shadow(0 0 7px rgba(var(--hud-rgb),.55));animation:ijidiConsoleCornerPulse 4s ease-in-out infinite}
        @keyframes ijidiConsoleCornerPulse{0%,100%{opacity:.45}50%{opacity:1}}
        .ijidi-console-frame .tl{top:0;left:0;border-right:0;border-bottom:0;border-top-left-radius:14px}
        .ijidi-console-frame .tr{top:0;right:0;border-left:0;border-bottom:0;border-top-right-radius:14px;animation-delay:.6s}
        .ijidi-console-frame .bl{bottom:0;left:0;border-right:0;border-top:0;border-bottom-left-radius:14px;animation-delay:1.2s}
        .ijidi-console-frame .br{bottom:0;right:0;border-left:0;border-top:0;border-bottom-right-radius:14px;animation-delay:1.8s}
        .ijidi-console-stage{position:relative;z-index:10;max-width:1100px;margin:0 auto;padding:28px 24px 60px}
        .c-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;
          border-bottom:1px solid var(--stroke)}
        .c-header-left{display:flex;align-items:center;gap:12px}
        .root-badge{font:700 9px/1 var(--mono);letter-spacing:.2em;padding:6px 10px;border-radius:6px;
          border:1px solid var(--stroke-strong);color:var(--hud)}
        .c-title{font:600 15px/1 var(--mono);letter-spacing:.04em;color:#fff}
        .c-sub{margin-top:4px;font:500 10px/1 var(--mono);color:rgba(255,255,255,.4);letter-spacing:.06em}
        .status-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;
          border:1px solid var(--stroke);font:600 9px/1 var(--mono);letter-spacing:.14em;color:rgba(255,255,255,.75)}
        .status-chip.small{padding:4px 9px}
        .status-chip i{width:6px;height:6px;border-radius:50%;background:var(--hud);box-shadow:0 0 8px var(--hud);
          animation:ijidiConsoleBlink 1.8s ease-in-out infinite;display:inline-block}
        @keyframes ijidiConsoleBlink{0%,100%{opacity:1}50%{opacity:.25}}
        .c-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px}
        @media (max-width:760px){.c-metrics{grid-template-columns:repeat(2,1fr)}}
        .metric-tile{border:1px solid var(--stroke);border-radius:12px;padding:16px;
          background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.015) 45%,rgba(var(--hud-rgb),.03))}
        .metric-label{font:600 9px/1 var(--mono);letter-spacing:.14em;color:rgba(255,255,255,.4)}
        .metric-value{margin-top:10px;font:700 24px/1 var(--mono);color:#fff;
          text-shadow:0 0 14px rgba(var(--hud-rgb),.25)}
        .metric-foot{margin-top:10px;font:500 8px/1 var(--mono);letter-spacing:.06em;color:rgba(255,255,255,.25)}
        .c-grid{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-top:16px}
        @media (max-width:900px){.c-grid{grid-template-columns:1fr}}
        .c-panel{border:1px solid var(--stroke);border-radius:14px;padding:20px;
          background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.015) 45%,rgba(var(--hud-rgb),.03));
          backdrop-filter:blur(20px) saturate(150%);-webkit-backdrop-filter:blur(20px) saturate(150%);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 40px rgba(var(--hud-rgb),.05)}
        .panel-head{display:flex;align-items:center;justify-content:space-between;
          padding-bottom:14px;border-bottom:1px solid var(--stroke)}
        .panel-eyebrow{font:700 9px/1 var(--mono);letter-spacing:.16em;color:var(--hud)}
        .panel-title{margin-top:6px;font:600 14px/1 var(--mono);color:#fff;display:flex;align-items:center;gap:10px}
        .badge-count{font:600 8px/1 var(--mono);letter-spacing:.08em;color:var(--hud);
          border:1px solid var(--stroke-strong);border-radius:999px;padding:3px 8px}
        .badge-count.small{margin-left:6px}
        .feed{margin-top:14px;display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto}
        .feed-empty{padding:32px 0;text-align:center;font:500 11px/1.6 var(--mono);color:rgba(255,255,255,.35)}
        .feed-row{border:1px solid var(--stroke);border-radius:10px;padding:12px 14px;
          display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.025);
          transition:border-color .25s}
        .feed-row:hover{border-color:var(--stroke-strong)}
        .feed-actor{font:700 10px/1 var(--mono);letter-spacing:.06em;color:#fff}
        .feed-action{font:500 11px/1.4 var(--mono);color:rgba(255,255,255,.6)}
        .feed-time{font:500 9px/1 var(--mono);color:rgba(255,255,255,.3)}
        .nav-list{margin-top:14px;display:flex;flex-direction:column;gap:10px}
        .nav-row{display:flex;align-items:center;justify-content:space-between;
          border:1px solid var(--stroke);border-radius:10px;padding:13px 14px;cursor:pointer;
          text-decoration:none;color:inherit;transition:border-color .25s,box-shadow .25s}
        .nav-row:hover{border-color:var(--stroke-strong);box-shadow:0 0 20px rgba(var(--hud-rgb),.12)}
        .nav-row-title{font:700 11px/1 var(--mono);letter-spacing:.04em;color:#fff}
        .nav-row-sub{margin-top:5px;font:500 9.5px/1 var(--mono);color:rgba(255,255,255,.4)}
        .nav-arrow{color:var(--hud);font-family:var(--mono)}
        .nav-chevron{color:rgba(255,255,255,.4);transition:transform .2s}
        .nav-chevron.open{transform:rotate(180deg)}
        .nav-sublist{display:flex;flex-direction:column;gap:6px;padding-left:8px}
        .nav-subrow{display:flex;align-items:center;justify-content:space-between;
          padding:10px 12px;border:1px solid var(--stroke);border-radius:8px;text-decoration:none;
          color:rgba(255,255,255,.75);font:600 10px/1 var(--mono);transition:border-color .25s}
        .nav-subrow:hover{border-color:var(--stroke-strong)}
        .dot{width:6px;height:6px;border-radius:50%}
        .dot.standby{background:#2dd4bf;box-shadow:0 0 6px #2dd4bf}
        .dot.forming{background:#fbbf24;box-shadow:0 0 6px #fbbf24}
        @media (prefers-reduced-motion:reduce){.ijidi-console *{animation-duration:.001ms!important;
          animation-iteration-count:1!important;transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}
