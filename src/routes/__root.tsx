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
import { supabase } from "@/lib/supabase";
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
      <ChromeGate>
        <Outlet />
      </ChromeGate>
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

function AccessCheckScreen({ status }: { status: "checking" | "anon" }) {
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
          {status === "checking" ? "Verifying session…" : "Redirecting to secure access…"}
        </p>
      </div>
    </div>
  );
}

// The login screen is a full-bleed standalone experience — it must not be
// wrapped in the sidebar/ticker/header chrome. Every other route requires a
// signed-in session and otherwise redirects to /login.
function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const auth = useAuthState();
  const isLogin = pathname === "/login";

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
  return <PortalShell session={auth.session}>{children}</PortalShell>;
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
    <div className="sticky top-0 z-50 h-8 overflow-hidden border-b border-gold/40 bg-panel/90 backdrop-blur-sm">
      <div className="ticker-track flex h-8 items-center hover:[animation-play-state:paused]">
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

function PortalShell({ children, session }: { children: ReactNode; session: Session }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const signedInEmail = session.user.email ?? "Signed in";

  usePortalRealtime();

  useEffect(() => {
    const savedTheme = (localStorage.getItem("ijidi_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(savedTheme);
  }, []);

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
      <div className="portal-hud-grid" aria-hidden="true" />
      <div className="portal-hud-scanlines" aria-hidden="true" />
      <div className="portal-hud-vignette" aria-hidden="true" />
      <div className="portal-hud-frame" aria-hidden="true">
        <span className="c tl" /><span className="c tr" />
        <span className="c bl" /><span className="c br" />
      </div>

      <RadarBackground />

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
                    aria-current={currentPath === item.to ? "page" : undefined}
                    onMouseEnter={() => sounds.playHover()}
                    onClick={() => {
                      sounds.playClick();
                      setRailOpen(false);
                    }}
                    className={cn(
                      "group mb-1 flex items-center gap-3 rounded-md border border-transparent px-3 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
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
                  className="flex w-full items-center gap-2 rounded-md text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
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
          </aside>
          <div className="min-w-0 flex-1">
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
            <header className="flex h-[76px] items-center justify-between gap-3 border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={() => {
                    sounds.playClick();
                    setRailOpen(!railOpen);
                  }}
                  aria-label={railOpen ? "Close navigation" : "Open navigation"}
                  aria-expanded={railOpen}
                >
                  ☰
                </Button>
                <div className="min-w-0">
                  <Eyebrow className="text-gold">IJIDI OPERATING SYSTEM</Eyebrow>
                  <div className="mt-1 truncate text-sm font-medium text-foreground">
                    Operational clarity over theatre
                  </div>
                </div>
              </div>

              {/* Session identity, theme switcher and sign-out */}
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span
                  className="hidden max-w-[200px] items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[10px] tracking-wider text-muted-foreground md:flex"
                  title={signedInEmail}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal live-pulse" />
                  <span className="truncate">{signedInEmail}</span>
                </span>
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
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>

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
