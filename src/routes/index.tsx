import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getActivity, getEcosystemMetrics } from "@/lib/portal-queries";
import { Eyebrow, PanelBracket } from "@/components/portal-ui";
import { sounds } from "@/lib/sound-engine";

export const Route = createFileRoute("/")({
  component: CommandCenterOverview,
});

function CommandCenterOverview() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["ecosystem-metrics"],
    queryFn: getEcosystemMetrics,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: getActivity,
  });

  return (
    <div className="space-y-6">
      {/* Header Telemetry */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Eyebrow className="text-gold">SYSTEM OVERVIEW</Eyebrow>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Command Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-teal live-pulse" />
          <span>Telemetry Live</span>
        </div>
      </div>

      {/* Primary Metric Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PanelBracket className="p-4">
          <Eyebrow className="text-[10px]">TOTAL VAULT ASSETS</Eyebrow>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {metricsLoading ? "..." : metrics?.totalVaultAssets ?? "$12.4M"}
          </div>
          <span className="font-mono text-[9px] text-teal">+4.2% from last epoch</span>
        </PanelBracket>

        <PanelBracket className="p-4">
          <Eyebrow className="text-[10px]">ACTIVE GOVERNANCE PROPOSALS</Eyebrow>
          <div className="mt-2 font-display text-2xl font-bold text-gold">
            {metricsLoading ? "..." : metrics?.activeProposals ?? "03"}
          </div>
          <span className="font-mono text-[9px] text-muted-foreground">2 pending quorum</span>
        </PanelBracket>

        <PanelBracket className="p-4">
          <Eyebrow className="text-[10px]">SYSTEM UPTIME</Eyebrow>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            99.98%
          </div>
          <span className="font-mono text-[9px] text-teal">0 unhandled faults</span>
        </PanelBracket>

        <PanelBracket className="p-4">
          <Eyebrow className="text-[10px]">NODE CONNECTIONS</Eyebrow>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            128/128
          </div>
          <span className="font-mono text-[9px] text-teal">All gateways nominal</span>
        </PanelBracket>
      </div>

      {/* Quick Module Navigation & Audit Log */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelBracket className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <Eyebrow>REAL-TIME AUDIT LOG</Eyebrow>
              <span className="font-mono text-xs text-gold">LIVE</span>
            </div>
            <div className="mt-4 space-y-3 font-mono text-xs">
              {activityLoading ? (
                <div className="text-muted-foreground">Fetching telemetry stream...</div>
              ) : (
                activity?.slice(0, 5).map((log, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded border border-border/50 bg-background/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gold">◆</span>
                      <span className="font-bold text-foreground">{log.actor ?? "SYSTEM"}</span>
                      <span className="text-muted-foreground">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "RECENT"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </PanelBracket>
        </div>

        <div>
          <PanelBracket className="p-6">
            <Eyebrow>FAST ACCESS MODULES</Eyebrow>
            <div className="mt-4 space-y-2">
              <Link
                to="/governance"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => sounds.playClick()}
                className="block rounded border border-border bg-background/40 p-3 font-mono text-xs hover:border-gold/50 hover:text-gold transition-colors"
              >
                [07] GOVERNANCE CONSOLE →
              </Link>
              <Link
                to="/igx-ai"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => sounds.playClick()}
                className="block rounded border border-border bg-background/40 p-3 font-mono text-xs hover:border-teal/50 hover:text-teal transition-colors"
              >
                [08] IGX INTELLIGENCE ENGINE →
              </Link>
            </div>
          </PanelBracket>
        </div>
      </div>
    </div>
  );
}
