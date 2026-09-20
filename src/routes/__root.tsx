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
import type { Session } from "@supabase/supabase-js";
import { Brain } from "lucide-react";
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
import { navItems, navGroupOrder, floatingSwitcherItems } from "@/lib/portal-data";
import { getActivity } from "@/lib/portal-queries";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/logger";
import { cn } from "@/lib/utils";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { HexBadge, Eyebrow } from "@/components/portal-ui";
import { CircuitBackground } from "@/components/CircuitBackground";
import { VisualStateProvider } from "@/lib/visual-state";
import { usePortalRealtime } from "@/lib/use-portal-realtime";
import { sounds } from "@/lib/sound-engine";

// Sidebar sections, built once from the flat navItems list in portal-data.ts.
const navSections = navGroupOrder.map((label) => ({
  label,
  items: navItems.filter((item) => item.group === label),
}));

// A nav item is active on its own path and on any nested path under it.
function isNavActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div>
        <Eyebrow>ROUTE NOT FOUND</Eyebrow>
        <h1 className="mt-3 font-display text-5xl text-gold">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This command path does not exist.</p>
        <Link to="/"
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <VisualStateProvider>
        <ChromeGate>
          <Outlet />
        </ChromeGate>
      </VisualStateProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// AUTH GATE
// The Supabase session lives in the browser (localStorage), so the server can
// never see it. The gate therefore runs on the client: the server and the very
// first client render both show the "checking" screen, so protected content is
// never present in the server HTML and there is no hydration mismatch.
// ---------------------------------------------------------------------------
type AuthState =
  | { status: "checking" }
  | { status: "anon" }
  | { status: "authed"; session: Session };

function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    let active = true;

    // getSession() waits for Supabase to finish initialising, which includes
    // processing an OAuth redirect in the URL — so a fresh OAuth sign-in is not
    // bounced back to /login before its session has been read.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setState(data.session ? { status: "authed", session: data.session } : { status: "anon" });
      })
      .catch(() => {
        if (active) setState({ status: "anon" });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState(session ? { status: "authed", session } : { status: "anon" });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

function AccessCheckScreen({ status }: { status: "checking" | "anon" | "tier" }) {
  const label =
    status === "checking"
      ? "Verifying session…"
      : status === "tier"
      ? "Verifying access level…"
      : "Redirecting to secure access…";
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#111111] p-6 text-[#F5F1E8]"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border border-[#C6A15B]/25 border-t-[#C6A15B]" />
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C6A15B]">
          IJIDI Portal
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#F5F1E8]/60">
          {label}
        </p>
      </div>
    </div>
  );
}

// The login screen is a full-bleed standalone experience — it must not be
// wrapped in any chrome. Every other route requires a signed-in session and
// otherwise redirects to /login.
//
// Signed-in users are split by tier: the governor (is_sovereign() — the same
// function the database RLS policies use) gets the full PortalShell; everyone
// else gets the slim MemberShell. This is presentation only — RLS remains the
// real enforcement. Any failure while checking falls back to the member shell.
function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const auth = useAuthState();
  const isLogin = pathname === "/login";
  const uid = auth.status === "authed" ? auth.session.user.id : null;

  const {
    data: isSovereign,
    isError: roleError,
  } = useQuery({
    queryKey: ["role-is-sovereign", uid],
    enabled: !!uid,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_sovereign");
      if (error) {
        console.error("Role check failed:", error);
        return false;
      }
      return data === true;
    },
  });

  useEffect(() => {
    if (auth.status === "anon" && !isLogin) {
      navigate({ to: "/login", replace: true });
    }
  }, [auth.status, isLogin, navigate]);

  if (isLogin) {
    return <>{children}</>;
  }
  if (auth.status !== "authed") {
    return <AccessCheckScreen status={auth.status} />;
  }
  if (isSovereign === undefined && !roleError) {
    return <AccessCheckScreen status="tier" />;
  }
  if (isSovereign === true) {
    return <PortalShell session={auth.session}>{children}</PortalShell>;
  }
  return <MemberShell session={auth.session} />;
}

// ---------------------------------------------------------------------------
// LIVE CLOCK — real UTC time, rendered on the client only.
// ---------------------------------------------------------------------------
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatUtc(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `UTC ${hh}:${mm} · ${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {now ? formatUtc(now) : "UTC --:-- · -- --- ----"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SESSION TIMER — real time elapsed since the account's last sign-in
// (Supabase `last_sign_in_at`). Shows dashes if that timestamp is missing.
// ---------------------------------------------------------------------------
function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function SessionTimer({ since }: { since: string | null | undefined }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const start = since ? Date.parse(since) : Number.NaN;
  const valid = now !== null && !Number.isNaN(start);
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {valid ? formatElapsed(now - start) : "--:--:--"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HUD OVERLAYS — shared by the governor shell and the member shell.
// ---------------------------------------------------------------------------
function HudOverlays() {
  return (
    <>
      <div className="portal-hud-grid" aria-hidden="true" />
      <div className="portal-hud-scanlines" aria-hidden="true" />
      <div className="portal-hud-vignette" aria-hidden="true" />
      <div className="portal-hud-frame" aria-hidden="true">
        <span className="c tl" /><span className="c tr" />
        <span className="c bl" /><span className="c br" />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// MEMBER SHELL — slim view for every non-governor tier.
// No module sidebar, no activity ticker, no entity switcher. Shows the
// member's own name, tier and the (publicly readable) entity_status rows.
// ---------------------------------------------------------------------------
function humanize(key: string) {
  return key.replace(/_/g, " ").toUpperCase();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const HIDDEN_ENTITY_KEYS = new Set(["id", "created_at", "updated_at"]);
const ENTITY_TITLE_KEYS = ["name", "entity", "entity_name", "entity_id", "label", "title"];

function MemberShell({ session }: { session: Session }) {
  const [signingOut, setSigningOut] = useState(false);
  const email = session.user.email ?? "Signed in";
  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    email.split("@")[0];

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["own-profile", session.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("access_tier")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as { access_tier?: string } | null;
    },
  });

  const {
    data: entities,
    isLoading: entitiesLoading,
    isError: entitiesError,
  } = useQuery({
    queryKey: ["member-entity-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_status").select("*");
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },
  });

  const tier = profile?.access_tier ?? null;

  const handleSignOut = async () => {
    sounds.playClick();
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      console.error("Sign-out failed:", error);
      alert(`Sign-out failed: ${error.message}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-gold/20 selection:text-gold">
      <HudOverlays />
      <CircuitBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex h-[76px] items-center justify-between gap-3 border-b border-border/60 bg-background/10 px-4 backdrop-blur-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <HexBadge small />
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold tracking-wide text-foreground">
                IJIDI <span className="text-gold">PORTAL</span>
              </div>
              <Eyebrow className="mt-1 text-[8px]">Member Access</Eyebrow>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span
              className="hidden max-w-[220px] items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[10px] tracking-wider text-muted-foreground md:flex"
              title={email}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal live-pulse" />
              <span className="truncate">{email}</span>
            </span>
            <button
              onClick={handleSignOut}
              onMouseEnter={() => sounds.playHover()}
              disabled={signingOut}
              className="rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 disabled:cursor-default disabled:opacity-50"
              title="Sign out of the portal"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6 lg:p-8">
          {/* Member Home — identity card */}
          <section className="relative overflow-hidden rounded-lg border border-gold/30 bg-panel/90 p-6 backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
            <Eyebrow className="text-gold">MEMBER HOME</Eyebrow>
            <h1 className="mt-3 break-words font-display text-3xl text-foreground sm:text-4xl">
              Welcome, <span className="text-gold">{displayName}</span>
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Access tier
              </span>
              <span className="rounded-md border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                {profileLoading ? "…" : tier ?? "Unavailable"}
              </span>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Your account has a limited view of the portal. Operational modules are reserved for the
              governor.
            </p>
          </section>

          {/* Entity status */}
          <section className="mt-8">
            <Eyebrow className="pb-3">ENTITY STATUS</Eyebrow>
            {entitiesLoading ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Loading entity status…
              </p>
            ) : entitiesError ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Entity status unavailable
              </p>
            ) : !entities || entities.length === 0 ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                No entities reported
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {entities.map((row, i) => {
                  const titleKey = ENTITY_TITLE_KEYS.find(
                    (k) => typeof row[k] === "string" && row[k],
                  );
                  const title = titleKey ? String(row[titleKey]) : `Entity ${i + 1}`;
                  const fields = Object.entries(row).filter(
                    ([k, v]) =>
                      !HIDDEN_ENTITY_KEYS.has(k) && k !== titleKey && v !== null && v !== undefined,
                  );
                  return (
                    <div
                      key={String(row.id ?? i)}
                      className="rounded-lg border border-border bg-panel/90 p-4 backdrop-blur-md transition-colors hover:border-gold/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal live-pulse" />
                        <div className="font-display text-base text-foreground">{title}</div>
                      </div>
                      <dl className="mt-3 space-y-1.5">
                        {fields.map(([k, v]) => (
                          <div key={k} className="flex items-baseline justify-between gap-3">
                            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                              {humanize(k)}
                            </dt>
                            <dd className="break-words text-right text-xs text-foreground">
                              {formatValue(v)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <footer className="border-t border-border bg-panel/70 px-4 py-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm sm:px-6">
          <LiveClock />
        </footer>
      </div>
    </div>
  );
}

function TickerBar() {
  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

  const items = isLoading
    ? ["LOADING ACTIVITY LOG…"]
    : isError || !activity
    ? ["ACTIVITY LOG UNAVAILABLE"]
    : activity.length > 0
    ? activity.map((a) => `${a.actor?.toUpperCase() ?? "SYSTEM"} · ${a.action}`)
    : ["NO VERIFIED ENTRIES"];

  const loop = [...items, ...items];

  return (
    <div className="sticky top-0 z-50 h-8 overflow-hidden border-b border-gold/30 bg-panel/15 backdrop-blur-xl">
      <div className="ticker-track flex h-8 items-center hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-5 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-foreground"
          >
            <span className="text-gold live-pulse">◆</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Floating entity dock — a translucent pill at the bottom centre of every
// governor page except the IGX AI console (which has its own rail).
// Mandela / Ifeoma open the IGX AI console on that person; Group / Foundation
// go to their pages. On small screens only the active chip shows its label.
function EntityDock({ hidden }: { hidden: boolean }) {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  if (hidden) return null;
  return (
    <nav
      aria-label="Entity switcher"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
        zIndex: 50,
      }}
      className="flex items-center gap-1 rounded-full border border-border bg-panel/70 p-1.5 shadow-lg backdrop-blur-xl"
    >
      {floatingSwitcherItems.map((item) => {
        const active = item.kind === "route" && isNavActive(currentPath, item.to);
        const chipClass = cn(
          "flex items-center gap-2 rounded-full border border-transparent px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all sm:px-3.5",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
          active
            ? "border-gold/40 bg-gold/15 text-gold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        );
        const inner = (
          <>
            <span
              aria-hidden="true"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-[9px] font-semibold text-gold"
            >
              {item.label.charAt(0)}
            </span>
            <span className={cn(active ? "inline" : "hidden sm:inline")}>{item.label}</span>
          </>
        );
        return item.kind === "person" ? (
          <Link key={item.key}
            to="/igx-ai"
            search={{ entity: item.entity }}
            title={`Open IGX AI — ${item.label}`}
            onMouseEnter={() => sounds.playHover()}
            onClick={() => sounds.playClick()}
            className={chipClass}
          >
            {inner}
          </Link>
        ) : (
          <Link key={item.key}
            to={item.to}
            title={item.label}
            aria-current={active ? "page" : undefined}
            onMouseEnter={() => sounds.playHover()}
            onClick={() => sounds.playClick()}
            className={chipClass}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

// Floating IGX AI shortcut (bottom right). The badge is the real number of
// proposals waiting in review; it is hidden if the count can't be loaded.
function IgxFloatingButton({ hidden }: { hidden: boolean }) {
  const { data: pending } = useQuery({
    queryKey: ["igx-pending-count"],
    refetchInterval: 15_000,
    retry: 1,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review");
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (hidden) return null;
  const label = pending ? `Open IGX AI — ${pending} pending review` : "Open IGX AI";

  return (
    <Link to="/igx-ai"
      title={label}
      aria-label={label}
      onMouseEnter={() => sounds.playHover()}
      onClick={() => sounds.playClick()}
      style={{
        position: "fixed",
        right: "1.5rem",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
        zIndex: 60,
        background: "linear-gradient(135deg, #C6A15B 0%, #D4AF37 100%)",
        color: "#111111",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)",
      }}
      className="group flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
    >
      <Brain className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
      {pending !== undefined && pending > 0 && (
        <span
          style={{ backgroundColor: "#D97B3F", color: "#FFFFFF" }}
          className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold ring-2 ring-background"
        >
          {pending > 99 ? "99+" : pending}
        </span>
      )}
    </Link>
  );
}

function PortalShell({ children, session }: { children: ReactNode; session: Session }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [signingOut, setSigningOut] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const signedInEmail = session.user.email ?? "Signed in";

  usePortalRealtime();

  // Real governor identity from the profiles row (falls back to the email).
  const { data: governor } = useQuery({
    queryKey: ["own-profile-identity", session.user.id],
    retry: 1,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, handle")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as { display_name?: string | null; handle?: string | null } | null;
    },
  });
  const governorName = governor?.display_name || signedInEmail;
  const governorHandle = governor?.handle
    ? governor.handle.startsWith("@")
      ? governor.handle
      : `@${governor.handle}`
    : null;

  // Honest data-link status: reflects the real activity_log query the ticker runs
  // (same query key, so this adds no extra request).
  const { isSuccess: linkOk, isError: linkError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });
  const linkLabel = linkOk ? "Data link verified" : linkError ? "Data link unavailable" : "Checking data link…";
  const linkText = linkOk ? "text-teal" : linkError ? "text-destructive" : "text-muted-foreground";
  const linkDot = linkOk ? "bg-teal" : linkError ? "bg-destructive" : "bg-muted-foreground";

  // Header label: which page and sidebar group the governor is on.
  const activeItem = navItems.find((item) => isNavActive(currentPath, item.to));
  const pageLabel = activeItem?.label ?? "Portal";

  // Log one "session started" entry per browser tab (only the governor shell
  // mounts this). The flag is set only after a successful insert.
  useEffect(() => {
    const key = "ijidi_session_logged";
    try {
      if (sessionStorage.getItem(key) === session.user.id) return;
    } catch {
      /* sessionStorage unavailable — log anyway */
    }
    void logActivity("Governor session started", "Portal").then((ok) => {
      if (!ok) return;
      try {
        sessionStorage.setItem(key, session.user.id);
      } catch {
        /* ignore */
      }
    });
  }, [session.user.id]);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("ijidi_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(savedTheme);
  }, []);

  // Remember whether the desktop sidebar was collapsed.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("ijidi_rail_collapsed") === "1");
    } catch {
      /* localStorage unavailable — stay expanded */
    }
  }, []);

  const toggleCollapsed = () => {
    sounds.playClick();
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("ijidi_rail_collapsed", next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  // Sidebar parents (COMMAND / ECOSYSTEM / KNOWLEDGE / IDENTITY) fold and unfold.
  // Restore what was open last time, then always keep the current page's group open.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ijidi_nav_open");
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setOpenGroups(parsed.filter((g): g is string => typeof g === "string"));
      }
    } catch {
      /* ignore — start with only the active group open */
    }
  }, []);

  const activeGroup = activeItem?.group;
  useEffect(() => {
    if (!activeGroup) return;
    setOpenGroups((prev) => (prev.includes(activeGroup) ? prev : [...prev, activeGroup]));
  }, [activeGroup]);

  const toggleGroup = (label: string) => {
    sounds.playClick();
    const next = openGroups.includes(label)
      ? openGroups.filter((g) => g !== label)
      : [...openGroups, label];
    setOpenGroups(next);
    try {
      localStorage.setItem("ijidi_nav_open", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toggleTheme = () => {
    sounds.playClick();
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("ijidi_theme", nextTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(nextTheme);
  };

  // Signing out clears the session; the gate in ChromeGate then redirects to
  // /login on its own. If sign-out fails, stay put and say so.
  const handleSignOut = async () => {
    sounds.playClick();
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      console.error("Sign-out failed:", error);
      alert(`Sign-out failed: ${error.message}`);
    }
  };

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
      if (event.key === "Escape") {
        setRailOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-gold/20 selection:text-gold">
      {/* HUD overlays — carry the login skin across the whole portal */}
      <HudOverlays />

      <CircuitBackground />

      {/* Mobile: dim the page behind the open sidebar; tap to close */}
      {railOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={() => setRailOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        <TickerBar />
        <div className="lg:flex">
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-[244px] border-r border-border/60 bg-panel/15 backdrop-blur-xl backdrop-saturate-150 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] transition-[transform,width] duration-200 ease-out",
              "lg:sticky lg:top-8 lg:h-[calc(100vh-2rem)] lg:shrink-0 lg:translate-x-0",
              collapsed ? "lg:w-[76px]" : "lg:w-[244px]",
              railOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-full flex-col">
              <div
                className={cn(
                  "flex h-[76px] items-center gap-3 border-b border-border px-5",
                  collapsed && "lg:justify-center lg:px-0"
                )}
              >
                <HexBadge small />
                <div className={cn(collapsed && "lg:hidden")}>
                  <div className="font-display text-sm font-semibold tracking-wide text-foreground">
                    IJIDI <span className="text-gold">PORTAL</span>
                  </div>
                  <Eyebrow className="mt-1 text-[8px]">Command Center</Eyebrow>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" aria-label="Primary">
                {navSections.map((section, sectionIndex) => {
                  const isOpen = openGroups.includes(section.label);
                  const hasActive = section.items.some((item) => isNavActive(currentPath, item.to));
                  const groupId = `nav-group-${section.label.toLowerCase()}`;
                  return (
                    <div key={section.label} className={cn(sectionIndex > 0 && "mt-2")}>
                      {/* Icon rail: plain divider between groups */}
                      {sectionIndex > 0 && (
                        <div
                          className={cn("mx-3 mb-3 mt-1 hidden h-px bg-border", collapsed && "lg:block")}
                          aria-hidden="true"
                        />
                      )}

                      {/* Parent row — click to fold or unfold its pages */}
                      <button type="button"
                        onClick={() => toggleGroup(section.label)}
                        onMouseEnter={() => sounds.playHover()}
                        aria-expanded={isOpen}
                        aria-controls={groupId}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                          hasActive ? "text-gold" : "text-foreground/80 hover:text-foreground",
                          collapsed && "lg:hidden"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "inline-block text-[8px] text-gold/70 transition-transform duration-150",
                            isOpen && "rotate-90"
                          )}
                        >
                          ▶
                        </span>
                        <span className="flex-1">{section.label}</span>
                        {hasActive && !isOpen && (
                          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                        )}
                        <span className="text-[9px] font-normal tracking-normal text-muted-foreground/60">
                          {section.items.length}
                        </span>
                      </button>

                      {/* Child pages — hidden while the parent is folded (the icon rail always shows them) */}
                      <div
                        id={groupId}
                        className={cn(
                          "mt-1",
                          isOpen ? "block" : collapsed ? "hidden lg:block" : "hidden",
                          !collapsed && "ml-4 border-l border-gold/15 pl-1"
                        )}
                      >
                        {section.items.map((item) => {
                          const active = isNavActive(currentPath, item.to);
                          return (
                            <Link key={item.to}
                              to={item.to}
                              title={item.label}
                              aria-current={active ? "page" : undefined}
                              onMouseEnter={() => sounds.playHover()}
                              onClick={() => {
                                sounds.playClick();
                                setRailOpen(false);
                              }}
                              className={cn(
                                "group relative mb-1 flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground",
                                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                                collapsed && "lg:justify-center lg:gap-0 lg:px-0",
                                active && "border-gold/30 bg-gold/10 font-bold text-gold"
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold opacity-0 transition-opacity",
                                  active && "opacity-100"
                                )}
                              />
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs text-gold/80">
                                {item.icon}
                              </span>
                              <span className={cn("flex-1 truncate", collapsed && "lg:hidden")}>
                                {item.label}
                              </span>
                              <span
                                className={cn("text-[9px] text-muted-foreground/60", collapsed && "lg:hidden")}
                              >
                                {item.key}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* Settings replaces the old visible ⌘K button; Ctrl/⌘ + K still opens the palette */}
              <div className="border-t border-border p-4">
                <Link to="/settings"
                  title="Settings"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={() => {
                    sounds.playClick();
                    setRailOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                    collapsed && "lg:justify-center lg:gap-0"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-sm text-gold">
                    ⚙
                  </div>
                  <div className={cn(collapsed && "lg:hidden")}>
                    <Eyebrow className="text-[8px]">Account</Eyebrow>
                    <span className="text-xs text-muted-foreground">Settings</span>
                  </div>
                </Link>
              </div>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <div className="flex h-8 items-center justify-between border-b border-border/60 bg-panel/15 backdrop-blur-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] px-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:px-6">
              <div className="flex items-center gap-4">
                <span className={cn("flex items-center gap-1.5", linkText)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", linkDot, linkOk && "live-pulse")} />
                  {linkLabel}
                </span>
                <span className="hidden sm:inline">
                  Session <SessionTimer since={session.user.last_sign_in_at} />
                </span>
                <span className="hidden md:inline">Build / 01</span>
                <span className="hidden xl:inline">Data / honest-state protocol</span>
              </div>
              <LiveClock />
            </div>
            <header className="flex h-[76px] items-center justify-between gap-3 border-b border-border/60 bg-background/10 backdrop-blur-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button"
                  className="flex shrink-0 items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gold transition-all hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 lg:hidden"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={() => {
                    sounds.playClick();
                    setRailOpen(!railOpen);
                  }}
                  aria-label={railOpen ? "Close navigation" : "Open navigation"}
                  aria-expanded={railOpen}
                >
                  <span aria-hidden="true" className="text-sm leading-none">☰</span>
                  Menu
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={toggleCollapsed}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-pressed={collapsed}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? "»" : "«"}
                </Button>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-semibold tracking-wide text-foreground">
                    IJIDI <span className="text-gold">PORTAL</span>
                    <span className="mx-2 text-muted-foreground/50">·</span>
                    <span className="font-medium text-muted-foreground">{pageLabel}</span>
                  </div>
                  {activeItem && <Eyebrow className="mt-1 text-[8px]">{activeItem.group}</Eyebrow>}
                </div>
              </div>

              {/* Governor identity, theme switcher and sign-out */}
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div
                  className="hidden items-center gap-3 rounded-md border border-gold/30 bg-panel px-3 py-1.5 md:flex"
                  title={signedInEmail}
                >
                  <span className="rounded border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Governor
                  </span>
                  <div className="min-w-0 leading-tight">
                    <div className="max-w-[170px] truncate text-xs font-medium text-foreground">
                      {governorName}
                    </div>
                    <div className="max-w-[170px] truncate font-mono text-[9px] tracking-wider text-muted-foreground">
                      {governorHandle ?? signedInEmail}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  onMouseEnter={() => sounds.playHover()}
                  className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
                  title="Toggle Light/Dark Theme"
                >
                  <span>{theme === "dark" ? "🌙 DARK" : "☀️ LIGHT"}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  onMouseEnter={() => sounds.playHover()}
                  disabled={signingOut}
                  className="rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 disabled:cursor-default disabled:opacity-50"
                  title="Sign out of the portal"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </header>
            {/* Tab navigation above the command area (same pages as the sidebar) */}
            <div className="px-4 pt-4 sm:px-6 lg:px-8">
              <nav
                aria-label="Sections"
                className="flex gap-1 overflow-x-auto rounded-2xl border border-gold/20 bg-black/15 p-1 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {navItems.map((item) => {
                  const active = isNavActive(currentPath, item.to);
                  return (
                    <Link key={item.to}
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      onMouseEnter={() => sounds.playHover()}
                      onClick={() => sounds.playClick()}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                        active
                          ? "bg-gold font-semibold text-primary-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <main className="p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-28">{children}</main>
          </div>
        </div>
      </div>

      <IgxFloatingButton hidden={currentPath === "/igx-ai" || currentPath.startsWith("/igx-ai/")} />
      <EntityDock
        hidden={currentPath === "/igx-ai" || currentPath.startsWith("/igx-ai/") || railOpen}
      />

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Type a command or search modules..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {navSections.map((section) => (
            <CommandGroup key={section.label} heading={section.label}>
              {section.items.map((item) => (
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
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
