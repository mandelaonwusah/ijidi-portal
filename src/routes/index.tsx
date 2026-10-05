// src/routes/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getEcosystemMetrics, getActivity } from "@/lib/portal-queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";
import { buttonKind, errorMessage } from "@/components/portal-ui";
import {
  Shield,
  Globe,
  Users,
  Building2,
  ArrowRight,
  Loader2,
  Activity,
  Clock,
  ChevronDown,
  Building,
  Briefcase,
  Film,
  Palette,
  Crown,
  Database,
  Target,
  Server,
  Layers,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: CommandCenterOverview,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Database timestamps are "timestamp without time zone" (stored as UTC).
// Without a zone marker, the browser would read them as local time, so
// we mark them as UTC before parsing.
function parseTimestamp(value?: string | null): Date | null {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  const normalised = hasZone ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTacticalTime(value?: string | null): string {
  const date = parseTimestamp(value);
  if (!date) return "--:--:--";
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(value?: string | null): string {
  const date = parseTimestamp(value);
  if (!date) return "unknown";
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-xs font-medium uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Honest-state maps                                                   */
/* ------------------------------------------------------------------ */

type LinkState = "connecting" | "connected" | "unreachable";

const LINK_META: Record<
  LinkState,
  { label: string; text: string; dot: string; border: string }
> = {
  connecting: {
    label: "CONNECTING",
    text: "text-attention",
    dot: "bg-attention",
    border: "border-l-attention",
  },
  connected: {
    label: "CONNECTED",
    text: "text-teal-400",
    dot: "bg-teal-400",
    border: "border-l-teal-400",
  },
  unreachable: {
    label: "UNREACHABLE",
    text: "text-destructive",
    dot: "bg-destructive",
    border: "border-l-destructive",
  },
};

type EntityRow = {
  entity_name: string;
  current_state: string | null;
  last_updated: string | null;
};

// Only routes that already exist are linked. Other entities show as plain rows.
const ENTITY_ROUTES: Record<string, string> = {
  Foundation: "/foundation",
  Atelier: "/atelier",
  Media: "/media",
};

const ENTITY_ICONS: Record<string, typeof Building> = {
  Group: Briefcase,
  Foundation: Building,
  Atelier: Palette,
  Media: Film,
  Personal: Crown,
};

// Entity states are typed into entity_status by hand and never checked, so any
// recorded state (including "live") is declared: attention orange, not verified blue.
function stateTone(state?: string | null): { dot: string; text: string } {
  const s = (state ?? "").trim();
  if (!s) return { dot: "bg-muted-foreground/40", text: "text-muted-foreground" };
  return { dot: "bg-attention", text: "text-attention" };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function CommandCenterOverview() {
  const [isEntitiesOpen, setIsEntitiesOpen] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSessionEmail(data.session?.user?.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    dataUpdatedAt: metricsUpdatedAt,
  } = useQuery({
    queryKey: ["ecosystem-metrics"],
    queryFn: getEcosystemMetrics,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const {
    data: entities,
    isLoading: entitiesLoading,
    isError: entitiesError,
  } = useQuery({
    queryKey: ["entity-status"],
    queryFn: async (): Promise<EntityRow[]> => {
      const { data, error } = await supabase
        .from("entity_status")
        .select("entity_name,current_state,last_updated")
        .order("id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EntityRow[];
    },
    staleTime: 30000,
  });

  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErr,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["activity-log-command-center"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

  const totalActivities = activity?.length ?? 0;
  const recentActivities = activity?.slice(0, 10) ?? [];
  const hasRealData = totalActivities > 0;

  const linkState: LinkState = metricsLoading
    ? "connecting"
    : metricsError
    ? "unreachable"
    : "connected";
  const link = LINK_META[linkState];

  const lastSyncIso = metricsUpdatedAt ? new Date(metricsUpdatedAt).toISOString() : undefined;
  const lastSync = metricsUpdatedAt ? formatTacticalTime(lastSyncIso) : "--:--:--";

  const entityList = entities ?? [];
  const latestEntityUpdate = entityList
    .map((e) => parseTimestamp(e.last_updated)?.getTime() ?? 0)
    .reduce((max, t) => Math.max(max, t), 0);

  const metricCards = [
    { label: "TOTAL VAULT ASSETS", raw: metrics?.totalVaultAssets, icon: Database },
    { label: "PENDING REVIEW", raw: metrics?.activeProposals, icon: Target },
    { label: "GOVERNANCE STATUS", raw: metrics?.governanceStatus, icon: Shield },
    { label: "SYSTEM UPTIME", raw: metrics?.uptime, icon: Server },
  ];

  const pendingReviewCount =
    metricsLoading || metricsError || !metrics ? null : Number(metrics.activeProposals) || 0;
  const latestActivityAt = activity && activity.length > 0 ? activity[0].timestamp : null;

  return (
    <div className="space-y-8">
      {/* Home brief strip — real, honest-state summary, sits above the header banner
          (which carries the Governor identity block up in the shared shell). */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-black/20 px-5 py-3 backdrop-blur-[3px]">
        <div className="font-mono text-sm">
          <span className="font-semibold text-foreground">{greeting}</span>
          {sessionEmail && <span className="text-muted-foreground">, {sessionEmail}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
          {pendingReviewCount === null ? (
            <span className="text-muted-foreground">Pending review: …</span>
          ) : pendingReviewCount > 0 ? (
            <Link
              to="/governance"
              className="flex items-center gap-1.5 text-attention transition-colors hover:text-attention/80"
            >
              <Target className="h-3 w-3" /> {pendingReviewCount} pending review
              {pendingReviewCount === 1 ? "" : "s"}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-teal-400">
              <Target className="h-3 w-3" /> Nothing pending
            </span>
          )}
          <span className="text-muted-foreground">
            {entitiesLoading
              ? "Entities: …"
              : entitiesError
              ? "Entities: unavailable"
              : `${entityList.length} entities tracked`}
          </span>
          <span className={activityError ? "text-destructive" : "text-muted-foreground"}>
            {activityLoading
              ? "Last activity: …"
              : activityError
              ? "Activity: could not load"
              : latestActivityAt
              ? `Last activity ${formatRelativeTime(latestActivityAt)}`
              : "No activity on record"}
          </span>
        </div>
      </div>

      {/* Header banner */}
      <GlassCard
        index={0}
        variant="elevated"
        className="relative overflow-hidden"
      >

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-border">
              <Crown className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <Eyebrow className="text-muted-foreground">COMMAND MODULE / 01</Eyebrow>
              <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Ecosystem Command
              </h1>
              <p className="mt-1 max-w-xl font-mono text-sm text-muted-foreground">
                Governance metrics, audit trail and entity status. Every state on this page comes
                from a query; nothing is assumed.
              </p>
            </div>
          </div>

          <div className="flex items-stretch gap-3">
            <div
              className={cn(
                "rounded-lg border border-l-4 bg-card px-5 py-3 shadow-sm",
                link.border
              )}
            >
              <Eyebrow className="text-xs text-muted-foreground">DATA LINK</Eyebrow>
              <div className={cn("mt-0.5 flex items-center gap-2 font-mono text-sm font-medium", link.text)}>
                <span className="relative flex h-2 w-2">
                  {linkState === "connected" && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60 motion-safe:animate-ping" />
                  )}
                  <span className={cn("relative inline-flex h-2 w-2 rounded-full", link.dot)} />
                </span>
                {link.label}
              </div>
            </div>
            <div className="hidden rounded-lg border bg-card px-5 py-3 shadow-sm md:block">
              <Eyebrow className="text-xs text-muted-foreground">LAST SYNC</Eyebrow>
              <div className="mt-0.5 font-mono text-sm font-medium tabular-nums text-foreground">
                {lastSync}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((item, idx) => {
          const Icon = item.icon;
          const notTracked = item.raw === "NOT TRACKED";
          const missing = item.raw === null || item.raw === undefined || item.raw === "";
          const cardState = metricsLoading
            ? "SYNCING"
            : metricsError
            ? "QUERY FAILED"
            : notTracked
            ? "NO SOURCE YET"
            : missing
            ? "NO DATA"
            : "RECEIVED";
          const cardTone = metricsLoading
            ? "text-attention"
            : metricsError
            ? "text-destructive"
            : notTracked || missing
            ? "text-muted-foreground/60"
            : "text-teal-400";

          return (
            <GlassCard
              key={item.label}
              index={idx + 1}
              className="group relative overflow-hidden"
            >
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Eyebrow className="text-xs text-muted-foreground">{item.label}</Eyebrow>
                  <div className="rounded-lg bg-white/[0.04] p-1.5 ring-1 ring-border">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div
                  className={cn(
                    "mt-4 truncate font-sans font-semibold tabular-nums",
                    notTracked && !metricsLoading && !metricsError
                      ? "text-xl text-muted-foreground/60"
                      : "text-3xl text-foreground"
                  )}
                >
                  {metricsLoading
                    ? "---"
                    : metricsError
                    ? "ERR"
                    : notTracked
                    ? "Not tracked"
                    : displayValue(item.raw)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 font-mono text-xs">
                  <span className={cardTone}>{cardState}</span>
                  <span className="tabular-nums text-muted-foreground/50">
                    {notTracked ? "" : lastSync}
                  </span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Audit stream */}
        <section className="lg:col-span-2">
          <GlassCard index={5} className="h-full">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <Eyebrow className="text-muted-foreground">AUDIT TRAIL</Eyebrow>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-sans text-base font-semibold text-foreground">
                    Activity log
                  </span>
                  {hasRealData && (
                    <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {totalActivities} LOADED
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Newest first</span>
              </div>
            </div>

            <div className="custom-scrollbar mt-4 max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {activityLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 text-muted-foreground motion-safe:animate-spin" />
                  <p className="font-mono text-sm text-muted-foreground">Loading audit entries…</p>
                </div>
              ) : activityError ? (
                // A failed query is an error, never "no activity" (DESIGN.md page states).
                <GlassCard variant="danger" className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs text-destructive">
                    Could not load activity:{" "}
                    {errorMessage(activityErr)}.
                  </p>
                  <button type="button" onClick={() => refetchActivity()} className={buttonKind.secondary}>
                    Retry
                  </button>
                </GlassCard>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="group flex items-center justify-between gap-4 rounded-lg border border-l-2 border-border/60 border-l-border-strong bg-background/40 p-3 transition-colors hover:border-border-strong hover:bg-background/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs font-medium text-foreground">
                          {log.actor ?? "unknown actor"}
                        </div>
                        <div className="truncate font-mono text-xs text-muted-foreground">
                          {log.action}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-xs tabular-nums">
                      <div className="text-muted-foreground">{formatRelativeTime(log.timestamp)}</div>
                      <div className="text-muted-foreground/50">{formatTacticalTime(log.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/10 ring-1 ring-border">
                    <Activity className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground">No audit entries yet</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground/50">
                      Entries appear here when an action is logged.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {hasRealData && (
              <div className="mt-4 flex items-center justify-between border-t pt-4 font-mono text-xs tabular-nums text-muted-foreground/60">
                <span>LATEST EVENT {formatTacticalTime(recentActivities[0]?.timestamp)}</span>
                <span>
                  SHOWING {recentActivities.length} OF {totalActivities}
                </span>
              </div>
            )}
          </GlassCard>
        </section>

        {/* Navigation + entities */}
        <section>
          <GlassCard index={6} className="h-full">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="rounded-lg bg-white/[0.04] p-2 ring-1 ring-border">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Eyebrow className="text-muted-foreground">NAVIGATION</Eyebrow>
                <div className="mt-0.5 font-sans text-sm font-semibold text-foreground">
                  Primary modules
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Link
                to="/vault"
                className="group block rounded-lg border bg-background/40 p-4 transition-colors hover:border-border-strong hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/[0.04] p-2 group-hover:bg-white/[0.08]">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-foreground group-hover:text-foreground">
                          [07] GOVERNANCE
                        </span>
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          VAULT
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        Proposals, votes, recovery
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-transform duration-150 motion-safe:group-hover:translate-x-[3px] group-hover:text-foreground" />
                </div>
              </Link>

              <Link
                to="/ecosystem"
                className="group block rounded-lg border bg-background/40 p-4 transition-colors hover:border-border-strong hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/[0.04] p-2 group-hover:bg-white/[0.08]">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-foreground group-hover:text-foreground">
                          [02] ECOSYSTEM
                        </span>
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          MAP
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        Entities, relations, status
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-transform duration-150 motion-safe:group-hover:translate-x-[3px] group-hover:text-foreground" />
                </div>
              </Link>

              {/* Entities (real status from entity_status) */}
              <div className="rounded-lg border bg-background/40 transition-colors hover:border-accent/40">
                <button
                  type="button"
                  onClick={() => setIsEntitiesOpen((v) => !v)}
                  aria-expanded={isEntitiesOpen}
                  className="group flex w-full items-center justify-between rounded-lg p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2 group-hover:bg-accent/20">
                      <Building2 className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-foreground group-hover:text-accent">
                          [ENTITIES]
                        </span>
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
                          {entitiesLoading
                            ? "LOADING"
                            : entitiesError
                            ? "UNAVAILABLE"
                            : `${entityList.length} ON RECORD`}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        State as recorded per entity
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground/30 transition-transform duration-200 group-hover:text-accent",
                      isEntitiesOpen && "rotate-180"
                    )}
                  />
                </button>

                {isEntitiesOpen && (
                  <div className="border-t border-border/50">
                    {entitiesLoading ? (
                      <div className="flex items-center gap-2 px-4 py-3 font-mono text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 motion-safe:animate-spin" />
                        Loading entity status…
                      </div>
                    ) : entitiesError ? (
                      <div className="px-4 py-3 font-mono text-xs text-destructive">
                        Entity status could not be loaded.
                      </div>
                    ) : entityList.length === 0 ? (
                      <div className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        No entities on record.
                      </div>
                    ) : (
                      entityList.map((item) => {
                        const Icon = ENTITY_ICONS[item.entity_name] ?? Building2;
                        const tone = stateTone(item.current_state);
                        const route = ENTITY_ROUTES[item.entity_name];
                        const rowInner = (
                          <>
                            <div className="rounded-lg bg-accent/10 p-2">
                              <Icon className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <div className="flex-1">
                              <span className="font-mono text-xs font-medium text-foreground">
                                {item.entity_name}
                              </span>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                                <span
                                  className={cn("font-mono text-xs uppercase", tone.text)}
                                >
                                  {item.current_state ?? "no state"}
                                </span>
                              </div>
                            </div>
                            {route && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30" />}
                          </>
                        );
                        const rowClass =
                          "flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0";

                        return route ? (
                          <Link
                            key={item.entity_name}
                            to={route}
                            className={cn(
                              rowClass,
                              "transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                            )}
                          >
                            {rowInner}
                          </Link>
                        ) : (
                          <div key={item.entity_name} className={rowClass}>
                            {rowInner}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-4 font-mono text-xs text-muted-foreground/60">
              {latestEntityUpdate > 0
                ? `Entity records last changed ${formatRelativeTime(
                    new Date(latestEntityUpdate).toISOString()
                  )}`
                : "No entity update on record"}
            </div>
          </GlassCard>
        </section>
      </div>

      {/* Verified session facts */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Signed in as", value: sessionEmail ?? "—", icon: Users },
          {
            label: "Audit entries loaded",
            value: activityLoading ? "…" : activityError ? "ERR" : String(totalActivities),
            icon: Activity,
          },
          {
            label: "Entities on record",
            value: entitiesLoading ? "…" : entitiesError ? "ERR" : String(entityList.length),
            icon: Building2,
          },
          { label: "Metrics last synced", value: lastSync, icon: Clock },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <GlassCard
              key={stat.label}
              index={idx + 7}
              className="flex items-center gap-3 p-3"
            >
              <div className="rounded-lg bg-white/[0.04] p-2 ring-1 ring-border">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60">
                  {stat.label}
                </div>
                <div className="truncate font-mono text-sm font-medium tabular-nums text-foreground">
                  {stat.value}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
