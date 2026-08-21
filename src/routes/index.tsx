// src/routes/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEcosystemMetrics } from "@/lib/portal-queries";
import { useLiveActivityLog } from "@/hooks/useLiveActivityLog";

export const Route = createFileRoute("/")({
  component: CommandCenterOverview,
});

// Build-safe timestamp formatter
function formatTacticalTime(isoString?: string): string {
  if (!isoString) return "00:00:00";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "00:00:00";
  }
}

// Inline build-safe HexBadge component
function HexBadge({ label }: { label: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded border border-primary/40 bg-primary/10 font-mono text-xs font-bold text-primary">
      {label}
    </div>
  );
}

// Inline build-safe Eyebrow component
function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

function CommandCenterOverview() {
  // 1. Ecosystem Top-Level Metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
  } = useQuery({
    queryKey: ["ecosystem-metrics"],
    queryFn: getEcosystemMetrics,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // 2. Real-Time Telemetry Audit Stream
  const { logs: activity, isLoading: activityLoading } = useLiveActivityLog();

  return (
    <div className="space-y-8">
      {/* Tactical Header Banner */}
      <section aria-label="Command Overview Header" className="relative p-6 border border-border bg-card/40 rounded-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <HexBadge label="01" />
            <div>
              <div className="flex items-center gap-2">
                <Eyebrow className="text-primary">COMMAND MODULE / 01</Eyebrow>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ecosystem Overview & Telemetry
              </h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Honest-state operational governance and vault telemetry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded border border-border bg-background/80 px-3 py-2 text-right shadow-inner">
              <Eyebrow className="text-[8px]">PRIMARY GATEWAY</Eyebrow>
              <div
                className={`font-semibold ${
                  metricsLoading
                    ? "text-muted-foreground"
                    : metricsError
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {metricsLoading
                  ? "NODE_01 :: CHECKING"
                  : metricsError
                  ? "NODE_01 :: OFFLINE"
                  : "NODE_01 :: ONLINE"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Metrics Grid */}
      <section aria-label="Ecosystem Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 border border-border bg-card/30 rounded-lg">
          <Eyebrow className="text-[9px]">TOTAL VAULT ASSETS</Eyebrow>
          <div className="mt-3 font-sans text-2xl font-bold text-foreground">
            {metricsLoading ? "---" : metricsError ? "ERR" : metrics?.totalVaultAssets ?? "NOT TRACKED"}
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
            <span className="text-muted-foreground/60">NOT TRACKED</span>
            <span className="text-muted-foreground/60">AWAITING RECORDS</span>
          </div>
        </div>

        <div className="p-5 border border-border bg-card/30 rounded-lg">
          <Eyebrow className="text-[9px]">ACTIVE PROPOSALS</Eyebrow>
          <div className="mt-3 font-sans text-2xl font-bold text-primary">
            {metricsLoading ? "---" : metricsError ? "ERR" : metrics?.activeProposals ?? "—"}
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
            <span className="text-muted-foreground/60">NOT TRACKED</span>
            <span className="text-muted-foreground/60">AWAITING RECORDS</span>
          </div>
        </div>

        <div className="p-5 border border-border bg-card/30 rounded-lg">
          <Eyebrow className="text-[9px]">GOVERNANCE STATUS</Eyebrow>
          <div className="mt-3 font-sans text-2xl font-bold text-foreground">
            {metricsLoading ? "---" : metricsError ? "ERR" : metrics?.governanceStatus ?? "NOT TRACKED"}
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
            <span className="text-muted-foreground/60">NOT TRACKED</span>
            <span className="text-muted-foreground/60">AWAITING RECORDS</span>
          </div>
        </div>

        <div className="p-5 border border-border bg-card/30 rounded-lg">
          <Eyebrow className="text-[9px]">SYSTEM UPTIME</Eyebrow>
          <div className="mt-3 font-sans text-2xl font-bold text-foreground">
            {metricsLoading ? "---" : metricsError ? "ERR" : metrics?.uptime ?? "—"}
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
            <span className="text-muted-foreground/60">NOT TRACKED</span>
            <span className="text-muted-foreground/60">AWAITING RECORDS</span>
          </div>
        </div>
      </section>

      {/* Main Telemetry & Quick Access Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-Time Audit Telemetry Feed */}
        <section aria-label="Telemetry Stream" className="lg:col-span-2">
          <div className="h-full p-6 border border-border bg-card/30 rounded-lg">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <Eyebrow className="text-primary">SYSTEM TELEMETRY</Eyebrow>
                <div className="mt-1 font-sans text-base font-semibold">Real-Time Audit Stream</div>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">LIVE WEBSOCKET</span>
              </div>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              {activityLoading ? (
                <div className="py-8 text-center text-muted-foreground animate-pulse">
                  Initializing secure telemetry socket...
                </div>
              ) : activity && activity.length > 0 ? (
                activity.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-2 rounded border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary">◆</span>
                      <span className="font-semibold text-foreground">
                        {log.actor?.toUpperCase() ?? "SYSTEM"}
                      </span>
                      <span className="text-muted-foreground">{log.action}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      {formatTacticalTime(log.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No verified entries logged in current epoch.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tactical Fast Access Console */}
        <section aria-label="Navigation Matrix">
          <div className="h-full p-6 border border-border bg-card/30 rounded-lg">
            <Eyebrow className="text-primary">NAVIGATION MATRIX</Eyebrow>
            <div className="mt-1 font-sans text-base font-semibold">Primary Modules</div>

            <div className="mt-5 space-y-3">
              <Link
                to="/vault"
                className="group block rounded border border-border bg-background/50 p-4 transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground group-hover:text-primary">
                  <span>[07] GOVERNANCE CONSOLE</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  Review proposals, vote thresholds, and disaster recovery states.
                </p>
              </Link>

              <Link
                to="/igx-ai"
                className="group block rounded border border-border bg-background/50 p-4 transition-all hover:border-emerald-400/50 hover:bg-emerald-400/5"
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground group-hover:text-emerald-400">
                  <span>[08] IGX INTELLIGENCE</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  Deploy AI query engine for ecosystem state verification.
                </p>
              </Link>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>PROTOCOL BUILD</span>
                <span className="text-primary">v2026.08.11</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
