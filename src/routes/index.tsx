// src/routes/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEcosystemMetrics } from "@/lib/portal-queries";
import { useLiveActivityLog } from "@/hooks/useLiveActivityLog";
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
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Sparkles,
  Brain,
  Database,
  Server,
  Cpu,
  Network,
  Layers,
  Target,
  Crown,
  Gem,
  Star,
  BarChart3,
  PieChart,
  TrendingUp,
  Briefcase,
  Award
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

function HexBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#B85C3A]/40 bg-[#B85C3A]/10 font-mono text-xs font-bold text-[#B85C3A] ${className}`}>
      {label}
    </div>
  );
}

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

function CommandCenterOverview() {
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

  return (
    <div className="space-y-8">
      {/* Premium Header Banner - Warm Theme */}
      <section className="relative overflow-hidden rounded-xl border border-[#E8DDD2] bg-gradient-to-br from-[#B85C3A]/5 via-[#FAF6F1] to-[#C6A15B]/5 p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#B85C3A]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#C6A15B]/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#B85C3A]/10 shadow-lg shadow-[#B85C3A]/10">
              <Crown className="h-7 w-7 text-[#B85C3A]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Eyebrow className="text-[#B85C3A]">COMMAND MODULE / 01</Eyebrow>
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#7A9B76] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A9B76]" />
                </span>
                <span className="font-mono text-[10px] text-[#7A9B76]">LIVE</span>
              </div>
              <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-[#1A1614] md:text-4xl">
                Ecosystem Command
              </h1>
              <p className="mt-1 font-mono text-sm text-[#6B5F55]">
                Real-time governance telemetry · Operational intelligence · Honest-state protocol
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] px-5 py-3 shadow-sm">
              <Eyebrow className="text-[8px] text-[#6B5F55]">GATEWAY STATUS</Eyebrow>
              <div
                className={`font-mono text-sm font-bold ${
                  metricsLoading
                    ? "text-[#6B5F55]"
                    : metricsError
                    ? "text-[#C45A3C]"
                    : "text-[#7A9B76]"
                }`}
              >
                {metricsLoading
                  ? "◆ INITIALIZING"
                  : metricsError
                  ? "◆ OFFLINE"
                  : "◆ ONLINE"}
              </div>
            </div>
            <div className="hidden rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] px-5 py-3 shadow-sm md:block">
              <Eyebrow className="text-[8px] text-[#6B5F55]">PROTOCOL</Eyebrow>
              <div className="font-mono text-sm font-bold text-[#B85C3A]">v2026.08.27</div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Metrics Grid - Warm Theme */}
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
              className="group relative overflow-hidden rounded-xl border border-[#E8DDD2] bg-[#FAF6F1] p-6 transition-all hover:border-[#B85C3A]/30 hover:shadow-lg hover:shadow-[#B85C3A]/5"
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#B85C3A]/5 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Eyebrow className="text-[9px] text-[#6B5F55]">{item.label}</Eyebrow>
                  <div className="rounded-lg bg-[#B85C3A]/10 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#B85C3A]" />
                  </div>
                </div>
                <div className="mt-4 font-sans text-3xl font-bold text-[#1A1614]">
                  {item.value}
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#6B5F55]/50">{item.status}</span>
                  <span className="text-[#A6978A]">AWAITING RECORDS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Telemetry Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-Time Telemetry Feed - THICKER */}
        <section className="lg:col-span-2">
          <div className="h-full rounded-xl border border-[#E8DDD2] bg-[#FAF6F1] p-6">
            <div className="flex items-center justify-between border-b border-[#E8DDD2] pb-4">
              <div>
                <Eyebrow className="text-[#B85C3A]">SYSTEM TELEMETRY</Eyebrow>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-sans text-base font-semibold text-[#1A1614]">Real-Time Audit Stream</span>
                  {hasRealData && (
                    <span className="rounded-full bg-[#7A9B76]/20 px-2.5 py-0.5 font-mono text-[9px] text-[#7A9B76]">
                      {totalActivities} EVENTS
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#7A9B76] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A9B76]" />
                  </span>
                  <span className="text-[#7A9B76]">WEBSOCKET</span>
                </div>
                <div className="h-6 w-px bg-[#E8DDD2]" />
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#6B5F55]">
                  <Clock className="h-3 w-3" />
                  <span>REAL-TIME</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#E8DDD2]">
              {activityLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#B85C3A]/40" />
                  <div className="text-center">
                    <p className="font-mono text-sm text-[#6B5F55]">Initializing telemetry socket...</p>
                    <p className="font-mono text-xs text-[#A6978A]">Secure connection establishing</p>
                  </div>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="group rounded-lg border border-[#E8DDD2]/60 bg-[#FFFCF8] p-4 transition-all hover:border-[#B85C3A]/30 hover:bg-[#FFFCF8]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B85C3A]/10">
                          <Activity className="h-3.5 w-3.5 text-[#B85C3A]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1A1614]">
                              {log.actor?.toUpperCase() ?? "SYSTEM"}
                            </span>
                            <span className="hidden h-1 w-1 rounded-full bg-[#A6978A] sm:block" />
                            <span className="truncate font-mono text-xs text-[#6B5F55]">
                              {log.action}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3">
                            <span className="font-mono text-[10px] text-[#A6978A]">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            <span className="font-mono text-[10px] text-[#A6978A]/50">
                              {formatTacticalTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#B85C3A]/10 px-2.5 py-0.5 font-mono text-[9px] text-[#B85C3A]">
                          EVENT
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#A6978A]/30 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8DDD2]/30">
                    <Activity className="h-8 w-8 text-[#A6978A]/20" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-[#6B5F55]/60">
                      No verified entries logged
                    </p>
                    <p className="font-mono text-xs text-[#A6978A]">
                      Activity feed will populate as operations commence
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Stats Footer */}
            {hasRealData && (
              <div className="mt-4 flex items-center justify-between border-t border-[#E8DDD2] pt-4">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] text-[#A6978A]">
                    LAST UPDATE: {formatTacticalTime(recentActivities[0]?.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#A6978A]">
                    {totalActivities} TOTAL
                  </span>
                  <span className="h-3 w-px bg-[#E8DDD2]" />
                  <span className="font-mono text-[10px] text-[#7A9B76]/60">
                    {totalActivities > 0 ? `${Math.min(totalActivities, 10)} DISPLAYED` : "AWAITING"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Navigation Matrix - Premium Warm */}
        <section>
          <div className="h-full rounded-xl border border-[#E8DDD2] bg-[#FAF6F1] p-6">
            <div className="flex items-center gap-3 border-b border-[#E8DDD2] pb-4">
              <div className="rounded-lg bg-[#B85C3A]/10 p-2">
                <Layers className="h-4 w-4 text-[#B85C3A]" />
              </div>
              <div>
                <Eyebrow className="text-[#B85C3A]">NAVIGATION MATRIX</Eyebrow>
                <div className="mt-0.5 font-sans text-sm font-semibold text-[#1A1614]">Primary Modules</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Link
                to="/vault"
                className="group block rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] p-4 transition-all hover:border-[#B85C3A]/40 hover:bg-[#B85C3A]/5 hover:shadow-lg hover:shadow-[#B85C3A]/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#B85C3A]/10 p-2 group-hover:bg-[#B85C3A]/20">
                      <Shield className="h-4 w-4 text-[#B85C3A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1A1614] group-hover:text-[#B85C3A]">
                          [07] GOVERNANCE
                        </span>
                        <span className="rounded-full bg-[#B85C3A]/10 px-2 py-0.5 font-mono text-[8px] text-[#B85C3A]">
                          VAULT
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-[#6B5F55]">
                        Proposals · Votes · Recovery
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#A6978A]/30 transition-transform group-hover:translate-x-1 group-hover:text-[#B85C3A]" />
                </div>
              </Link>

              <Link
                to="/igx-ai"
                className="group block rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] p-4 transition-all hover:border-[#C6A15B]/40 hover:bg-[#C6A15B]/5 hover:shadow-lg hover:shadow-[#C6A15B]/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#C6A15B]/10 p-2 group-hover:bg-[#C6A15B]/20">
                      <Bot className="h-4 w-4 text-[#C6A15B]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1A1614] group-hover:text-[#C6A15B]">
                          [08] IGX INTELLIGENCE
                        </span>
                        <span className="rounded-full bg-[#C6A15B]/10 px-2 py-0.5 font-mono text-[8px] text-[#C6A15B]">
                          AI
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-[#6B5F55]">
                        Query · Reason · Verify
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#A6978A]/30 transition-transform group-hover:translate-x-1 group-hover:text-[#C6A15B]" />
                </div>
              </Link>

              <Link
                to="/ecosystem"
                className="group block rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] p-4 transition-all hover:border-[#B85C3A]/40 hover:bg-[#B85C3A]/5 hover:shadow-lg hover:shadow-[#B85C3A]/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#B85C3A]/10 p-2 group-hover:bg-[#B85C3A]/20">
                      <Globe className="h-4 w-4 text-[#B85C3A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1A1614] group-hover:text-[#B85C3A]">
                          [02] ECOSYSTEM
                        </span>
                        <span className="rounded-full bg-[#B85C3A]/10 px-2 py-0.5 font-mono text-[8px] text-[#B85C3A]">
                          MAP
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-[#6B5F55]">
                        Entities · Relations · Status
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#A6978A]/30 transition-transform group-hover:translate-x-1 group-hover:text-[#B85C3A]" />
                </div>
              </Link>
            </div>

            <div className="mt-6 border-t border-[#E8DDD2] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8DDD2] bg-[#FFFCF8] text-[8px] font-mono text-[#6B5F55]">
                      G
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8DDD2] bg-[#FFFCF8] text-[8px] font-mono text-[#6B5F55]">
                      F
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8DDD2] bg-[#FFFCF8] text-[8px] font-mono text-[#6B5F55]">
                      A
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-[#A6978A]">
                    ACTIVE ENTITIES
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#B85C3A]">v2026.08.27</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Stats Footer - Warm Theme */}
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
              className="flex items-center gap-3 rounded-lg border border-[#E8DDD2] bg-[#FAF6F1] p-3"
            >
              <div className="rounded-lg bg-[#B85C3A]/10 p-2">
                <Icon className="h-3.5 w-3.5 text-[#B85C3A]" />
              </div>
              <div>
                <div className="font-mono text-[8px] uppercase text-[#A6978A]">
                  {stat.label}
                </div>
                <div className="font-mono text-sm font-bold text-[#1A1614]">
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
