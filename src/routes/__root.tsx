import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
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
import { navItems } from "@/lib/portal-data";
import { cn } from "@/lib/utils";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { HexBadge, Eyebrow } from "@/components/portal-ui";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div>
        <Eyebrow>ROUTE NOT FOUND</Eyebrow>
        <h1 className="mt-3 font-display text-5xl text-gold">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This command path does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-teal"
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
          onClick={() => {
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
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
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
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
    <html lang="en">
      <head>
        <HeadContent />
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
      <PortalShell>
        <Outlet />
      </PortalShell>
    </QueryClientProvider>
  );
}

function PortalShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[244px] border-r border-border bg-panel transition-transform duration-200 lg:translate-x-0",
          railOpen ? "translate-x-0" : "-translate-x-full",
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
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <Eyebrow>ACCESS TIER</Eyebrow>
              <span className="font-mono text-[9px] font-bold text-gold">ROOT</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-teal">
                Governor online
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <Eyebrow className="px-3 pb-3">Modules / 08</Eyebrow>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setRailOpen(false)}
                className={cn(
                  "group mb-1 flex items-center gap-3 border border-transparent px-3 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground",
                  currentPath === item.to && "border-gold/30 bg-gold/10 text-gold",
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
              className="flex w-full items-center gap-2 text-left"
              onClick={() => setPaletteOpen(true)}
            >
              <div className="flex h-8 w-8 items-center justify-center border border-border font-mono text-xs text-teal">
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
      <div className="lg:pl-[244px]">
        <div className="flex h-8 items-center justify-between border-b border-border bg-panel px-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:px-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              System nominal
            </span>
            <span className="hidden sm:inline">Build / 01</span>
            <span className="hidden md:inline">Data / honest-state protocol</span>
          </div>
          <span>UTC 15:03 · 08 AUG 2026</span>
        </div>
        <header className="flex h-[76px] items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setRailOpen(!railOpen)}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold sm:flex"
            >
              <span>Search modules</span>
              <kbd className="border border-border px-1.5 py-0.5 text-[9px]">⌘ K</kbd>
            </button>
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <HexBadge small />
              <div className="hidden sm:block">
                <div className="font-mono text-[10px] font-semibold text-foreground">Mandela Onwusah</div>
                <Eyebrow className="text-[8px] text-teal">@mandelaonwusah1 · Governor / root</Eyebrow>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-108px)] p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Navigate the portal..." />
        <CommandList>
          <CommandEmpty>No module found.</CommandEmpty>
          <CommandGroup heading="Modules">
            {navItems.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => {
                  setPaletteOpen(false);
                  window.location.href = item.to;
                }}
              >
                <span className="text-gold">{item.icon}</span>
                {item.label}
                <CommandShortcut>{item.key}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
