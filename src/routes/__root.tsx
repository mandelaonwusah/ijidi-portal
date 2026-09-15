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

function PortalShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

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
