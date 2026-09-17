// src/routes/index.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getEcosystemMetrics } from "@/lib/portal-queries";
import { useLiveActivityLog } from "@/hooks/useLiveActivityLog";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { 
  Bot, 
  Zap,  
  Shield, 
  Globe, 
  Users,  
  Building2, 
  ArrowRight, 
  Loader2, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Database,
  Server,
  Cpu,
  Network,
  Layers,
  Target,
  Crown,
  X,
  ChevronDown,
  Building,
  Briefcase,
  Film,
  Palette,
  MessageSquare,
  ExternalLink
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: CommandCenterOverview,
});

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

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "just now";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

function CommandCenterOverview() {
  const navigate = useNavigate();
  const [isEntitiesOpen, setIsEntitiesOpen] = useState(false);

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

  const { logs: activity, isLoading: activityLoading } = useLiveActivityLog();

  const totalActivities = activity?.length ?? 0;
  const recentActivities = activity?.slice(0, 10) ?? [];
  const hasRealData = totalActivities > 0;

  const entitySubItems = [
    { label: "IJIDI Foundation", to: "/foundation", icon: Building, status: "standby" },
    { label: "IJIDI Atelier", to: "/atelier", icon: Palette, status: "forming" },
    { label: "IJIDI Media", to: "/media", icon: Film, status: "forming" },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Header Banner */}
      <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shadow-lg shadow-primary/10">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Eyebrow className="text-primary">COMMAND MODULE / 01</Eyebrow>
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                </span>
                <span className="font-mono text-[10px] text-teal-400">LIVE</span>
              </div>
              <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Ecosystem Command
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                Real-time governance telemetry · Operational intelligence · Honest-state protocol
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border bg-card px-5 py-3 shadow-sm">
              <Eyebrow className="text-[8px] text-muted-foreground">GATEWAY STATUS</Eyebrow>
              <div
                className={`font-mono text-sm font-bold ${
                  metricsLoading
                    ? "text-muted-foreground"
                    : metricsError
                    ? "text-destructive"
                    : "text-teal-400"
                }`}
              >
                {metricsLoading
                  ? "◆ INITIALIZING"
                  : metricsError
                  ? "◆ OFFLINE"
                  : "◆ ONLINE"}
              </div>
            </div>
            <div className="hidden rounded-lg border bg-card px-5 py-3 shadow-sm md:block">
              <Eyebrow className="text-[8px] text-muted-foreground">PROTOCOL</Eyebrow>
              <div className="font-mono text-sm font-bold text-primary">v2026.08.27</div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "TOTAL VAULT ASSETS",
            value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.totalVaultAssets ?? "—",
            icon: Database,
            status: "NOT TRACKED",
          },
          {
            label: "ACTIVE PROPOSALS",
            value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.activeProposals ?? "—",
            icon: Target,
            status: "NOT TRACKED",
          },
          {
            label: "GOVERNANCE STATUS",
            value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.governanceStatus ?? "—",
            icon: Shield,
            status: "NOT TRACKED",
          },
          {
            label: "SYSTEM UPTIME",
            value: metricsLoading ? "---" : metricsError ? "ERR" : metrics?.uptime ?? "—",
            icon: Server,
            status: "NOT TRACKED",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Eyebrow className="text-[9px] text-muted-foreground">{item.label}</Eyebrow>
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 font-sans text-3xl font-bold text-foreground">
                  {item.value}
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground/50">{item.status}</span>
                  <span className="text-muted-foreground/40">AWAITING RECORDS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Telemetry Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-Time Telemetry Feed */}
        <section className="lg:col-span-2">
          <div className="h-full rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <Eyebrow className="text-primary">SYSTEM TELEMETRY</Eyebrow>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-sans text-base font-semibold text-foreground">Real-Time Audit Stream</span>
                  {hasRealData && (
                    <span className="rounded-full bg-teal-400/20 px-2.5 py-0.5 font-mono text-[9px] text-teal-400">
                      {totalActivities} EVENTS
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                  </span>
                  <span className="text-teal-400">WEBSOCKET</span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>REAL-TIME</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar">
              {activityLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground">Initializing telemetry socket...</p>
                    <p className="font-mono text-xs text-muted-foreground/40">Secure connection establishing</p>
                  </div>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="group rounded-lg border border-border/60 bg-background/40 p-4 transition-all hover:border-primary/30 hover:bg-background/60"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {log.actor?.toUpperCase() ?? "SYSTEM"}
                            </span>
                            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/30 sm:block" />
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {log.action}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3">
                            <span className="font-mono text-[10px] text-muted-foreground/40">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground/30">
                              {formatTacticalTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[9px] text-primary">
                          EVENT
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/10">
                    <Activity className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground/60">
                      No verified entries logged
                    </p>
                    <p className="font-mono text-xs text-muted-foreground/40">
                      Activity feed will populate as operations commence
                    </p>
                  </div>
                </div>
              )}
            </div>

            {hasRealData && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    LAST UPDATE: {formatTacticalTime(recentActivities[0]?.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground/40">
                    {totalActivities} TOTAL
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="font-mono text-[10px] text-teal-400/60">
                    {totalActivities > 0 ? `${Math.min(totalActivities, 10)} DISPLAYED` : "AWAITING"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Navigation Matrix - Updated */}
        <section>
          <div className="h-full rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Eyebrow className="text-primary">NAVIGATION MATRIX</Eyebrow>
                <div className="mt-0.5 font-sans text-sm font-semibold text-foreground">Primary Modules</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {/* Governance */}
              <Link
                to="/vault"
                className="group block rounded-lg border bg-background/40 p-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary">
                          [07] GOVERNANCE
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[8px] text-primary">
                          VAULT
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        Proposals · Votes · Recovery
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>

              {/* Ecosystem */}
              <Link
                to="/ecosystem"
                className="group block rounded-lg border bg-background/40 p-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary">
                          [02] ECOSYSTEM
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[8px] text-primary">
                          MAP
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        Entities · Relations · Status
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>

              {/* Entities Tile - Collapsed */}
              <div className="relative">
                <button
                  onClick={() => setIsEntitiesOpen(!isEntitiesOpen)}
                  className="w-full group block rounded-lg border bg-background/40 p-4 transition-all hover:border-accent/40 hover:bg-accent/5 hover:shadow-lg hover:shadow-accent/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent/10 p-2 group-hover:bg-accent/20">
                        <Building2 className="h-4 w-4 text-accent" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground group-hover:text-accent">
                            [ENTITIES]
                          </span>
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[8px] text-accent">
                            3 ACTIVE
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          Foundation · Atelier · Media
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground/30 transition-transform duration-200 group-hover:text-accent",
                        isEntitiesOpen && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* Dropdown - Entities List */}
                {isEntitiesOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border bg-card shadow-xl overflow-hidden">
                    {entitySubItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={idx}
                          to={item.to}
                          className="flex items-center gap-3 border-b border-border/50 px-4 py-3 transition-all hover:bg-primary/5 last:border-0"
                        >
                          <div className="rounded-lg bg-accent/10 p-2">
                            <Icon className="h-3.5 w-3.5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-medium text-foreground">
                                {item.label}
                              </span>
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                item.status === "standby" && "bg-teal-400",
                                item.status === "forming" && "bg-gold-500"
                              )} />
                            </div>
                            <p className="font-mono text-[9px] text-muted-foreground/60">
                              {item.status.toUpperCase()}
                            </p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[8px] font-mono text-muted-foreground">
                      G
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[8px] font-mono text-muted-foreground">
                      F
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[8px] font-mono text-muted-foreground">
                      A
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground/40">
                    ACTIVE ENTITIES
                  </span>
                </div>
                <span className="font-mono text-[10px] text-primary">v2026.08.27</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Active Sessions", value: "1", icon: Users },
          { label: "System Load", value: "12%", icon: Cpu },
          { label: "Network", value: "LIVE", icon: Network },
          { label: "Data Integrity", value: "✓", icon: CheckCircle2 },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="font-mono text-[8px] uppercase text-muted-foreground/50">
                  {stat.label}
                </div>
                <div className="font-mono text-sm font-bold text-foreground">
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
