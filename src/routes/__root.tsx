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

function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts, 
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { navItems, entitySwitcherItems } from "@/lib/portal-data";
import { getActivity } from "@/lib/portal-queries";
import { cn } from "@/lib/utils";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { HexBadge, Eyebrow } from "@/components/portal-ui";
import { RadarBackground } from "@/components/RadarBackground";
import { usePortalRealtime } from "@/lib/use-portal-realtime";
import { sounds } from "@/lib/sound-engine";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div>
        <Eyebrow>ROUTE NOT FOUND</Eyebrow>
        <h1 className="mt-3 font-display text-5xl text-gold">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This command path does not exist.</p>
        <Link
          to="/"
          onMouseEnter={() => sounds.playHover()}
          onClick={() => sounds.playClick()}
          className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-teal transition-colors hover:text-gold"
        >
          Return to command center
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
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
    reportLovableError(error, { boundary: "root" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div>
        <Eyebrow>SYSTEM FAULT</Eyebrow>
        <h1 className="mt-3 font-display text-3xl text-foreground">Unable to load module</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The portal encountered an unexpected state.
        </p>
        <Button
          className="mt-6"
          onMouseEnter={() => sounds.playHover()}
          onClick={() => {
            sounds.playClick();
            router.invalidate();
            reset();
          }}
        >
          Retry connection
        </Button>
      </div>
    </div>
  );
}

    function drawBG(t: number) {
      ctx.clearRect(0, 0, W, H);
      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, "#03060d");
      base.addColorStop(0.5, "#050b16");
      base.addColorStop(1, "#02040a");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "IJIDI Portal · Command Center" },
      {
        name: "description",
        content:
          "IJIDI Portal command center for ecosystem, governance, capital, foundation, vault, and intelligence operations.",
      },
      { name: "author", content: "IJIDI" },
      { property: "og:title", content: "IJIDI Portal · Command Center" },
      { property: "og:description", content: "A grounded command center for the IJIDI ecosystem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Karla:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('ijidi_theme');
                  var theme = saved || 'dark';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

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
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ChromeGate>
        <Outlet />
      </ChromeGate>
    </QueryClientProvider>
  );
}

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
// The login screen is a full-bleed standalone experience — it must not be
// wrapped in the sidebar/ticker/header chrome. Every other route keeps
// PortalShell exactly as before.
function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === "/login") {
    return <>{children}</>;
  }
  return <PortalShell>{children}</PortalShell>;
}

    function loop(t: number) {
      drawBG(t);
      raf = requestAnimationFrame(loop);
    }
function TickerBar() {
  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

    function onMove(e: MouseEvent) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }
    function onResize() {
      sizeCanvas();
      seedStars();
    }
  const items = isLoading
    ? ["LOADING ACTIVITY LOG…"]
    : isError || !activity
    ? ["ACTIVITY LOG UNAVAILABLE"]
    : activity.length > 0
    ? activity.map((a) => `${a.actor?.toUpperCase() ?? "SYSTEM"} · ${a.action}`)
    : ["NO VERIFIED ENTRIES"];

    sizeCanvas();
    seedStars();
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
  const loop = [...items, ...items];

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return (
    <div className="sticky top-0 z-50 h-8 overflow-hidden border-b border-gold/40 bg-panel/90 backdrop-blur-sm">
      <div className="ticker-track flex h-8 items-center">
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            <span className="text-gold live-pulse">◆</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}

  return <canvas ref={canvasRef} className="ijidi-login-fx" />;
// Generalized top entity switcher — Group/Foundation/Atelier/Media.
// Lives once here in the root shell so it renders on every route without
// per-page duplication. Highlights the entity matching the current path.
function EntitySwitcherBar() {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="entity-switcher-bar mx-4 my-2 sm:mx-6">
      {entitySwitcherItems.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          onMouseEnter={() => sounds.playHover()}
          onClick={() => sounds.playClick()}
          className={cn("entity-chip", currentPath === item.to && "active")}
        >
          <span className={cn("entity-status-dot", item.status)} />
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function LoginPage() {
function PortalShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [tickIndex, setTickIndex] = useState(0);

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
  usePortalRealtime();

useEffect(() => {
    const id = setInterval(() => setTickIndex((n) => (n + 1) % TICKS.length), 3200);
    return () => clearInterval(id);
    const savedTheme = (localStorage.getItem("ijidi_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(savedTheme);
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
    navigate({ to: "/" });
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
  const toggleTheme = () => {
    sounds.playClick();
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("ijidi_theme", nextTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(nextTheme);
  };

          <span className="status-chip"><i />IGX AI Standing By</span>
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        navigate({ to: "/igx-ai" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

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
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-gold/20 selection:text-gold">
      <RadarBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <TickerBar />
        <EntitySwitcherBar />
        <div className="lg:flex">
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-[244px] border-r border-border bg-panel/95 backdrop-blur-md transition-transform duration-200",
              "lg:sticky lg:top-8 lg:h-[calc(100vh-2rem)] lg:shrink-0 lg:translate-x-0",
              railOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-[76px] items-center gap-3 border-b border-border px-5">
                <HexBadge small />
                <div>
                  <div className="font-display text-sm font-semibold tracking-wide text-foreground">
                    IJIDI <span className="text-gold">PORTAL</span>
                  </div>
                  <Eyebrow className="mt-1 text-[8px]">Command Center</Eyebrow>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-5">
                <Eyebrow className="px-3 pb-3">NAVIGATION</Eyebrow>
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onMouseEnter={() => sounds.playHover()}
                    onClick={() => {
                      sounds.playClick();
                      setRailOpen(false);
                    }}
                    className={cn(
                      "group mb-1 flex items-center gap-3 rounded-md border border-transparent px-3 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground",
                      currentPath === item.to && "border-gold/30 bg-gold/10 text-gold font-bold"
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-xs text-gold/80">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[9px] text-muted-foreground/60">{item.key}</span>
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border p-4">
                <button
                  className="flex w-full items-center gap-2 text-left transition-opacity hover:opacity-80"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={() => {
                    sounds.playClick();
                    setPaletteOpen(true);
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border font-mono text-xs text-teal">
                    ⌘K
                  </div>
                  <div>
                    <Eyebrow className="text-[8px]">Quick navigation</Eyebrow>
                    <span className="text-xs text-muted-foreground">Open command palette</span>
                  </div>
                </button>
              </div>
</div>
            <div className="field">
              <label>Passkey</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
          </aside>
          <div className="flex-1">
            <div className="flex h-8 items-center justify-between border-b border-border bg-panel/90 backdrop-blur-sm px-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:px-6">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-teal">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal live-pulse" />
                  System nominal
                </span>
                <span className="hidden sm:inline">Build / 01</span>
                <span className="hidden md:inline">Data / honest-state protocol</span>
              </div>
              <span>UTC 15:03 · 08 AUG 2026</span>
</div>
            <header className="flex h-[76px] items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={() => {
                    sounds.playClick();
                    setRailOpen(!railOpen);
                  }}
                  aria-label="Open navigation"
                >
                  ☰
                </Button>
                <div>
                  <Eyebrow className="text-gold">IJIDI OPERATING SYSTEM</Eyebrow>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    Operational clarity over theatre
                  </div>
                </div>
              </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Authenticate"}
            </button>
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
              {/* Theme Switcher Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  onMouseEnter={() => sounds.playHover()}
                  className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:border-gold hover:text-gold"
                  title="Toggle Light/Dark Theme"
                >
                  <span>{theme === "dark" ? "🌙 DARK" : "☀️ LIGHT"}</span>
                </button>
</div>
            ))}
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
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
        .medallion{width:150px;height:150px;border-radius:50%;
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
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Type a command or search modules..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => {
                  sounds.playClick();
                  navigate({ to: item.to });
                  setPaletteOpen(false);
                }}
              >
                <span>{item.label}</span>
                <CommandShortcut>{item.key}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
</div>
);
}
