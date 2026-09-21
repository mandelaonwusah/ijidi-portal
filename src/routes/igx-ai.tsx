import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Copy as CopyIcon,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Shield,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import {
  AgentsPanel,
  ArchitecturePanel,
  DecisionsPanel,
  EcosystemPanel,
  IgxHero,
  IgxTabBar,
  ModelsPanel,
  type IgxTabKey,
  type LiveStage,
} from "@/components/IgxShowcase";
import { supabase } from "@/lib/supabase";
import { igxPeople, igxOrgEntities, igxAllEntities } from "@/lib/portal-data";
import { cn } from "@/lib/utils";
import { useLiveActivityLog } from "@/hooks/useLiveActivityLog";

export const Route = createFileRoute("/igx-ai")({
  head: () => ({
    meta: [
      { title: "IGX AI · Intelligence Console" },
      {
        name: "description",
        content: "IGX AI intelligence console for grounded IJIDI Portal operations.",
      },
      { property: "og:title", content: "IGX AI · Intelligence Console" },
      { property: "og:description", content: "Grounded IGX AI intelligence console." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap",
      },
    ],
  }),
  // ?entity=mandela | ifeoma | group | foundation | atelier | media — opens the
  // console on that person/entity's modules.
  validateSearch: (search: Record<string, unknown>): { entity?: string } => ({
    entity: typeof search.entity === "string" ? search.entity : undefined,
  }),
  component: IgxAi,
});

type EntityKey = keyof typeof igxAllEntities;
type SubItem = { id: string; label: string; pillar?: string };
type EntityGroup = Record<string, { label: string; state?: string; subs: SubItem[] }>;
type ProposalStatus = "pending_review" | "approved" | "rejected" | "error";

type ThreadMessage = {
  proposalId: string | null;
  intent: string;
  status: ProposalStatus;
  errorMessage?: string;
  detailsOpen: boolean;
  moreOpen: boolean;
};

type PendingProposal = { id: string; intent: string; created_at: string };

function threadKey(entity: EntityKey, sub: string) {
  return `${entity}:${sub}`;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDateTime(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// One clickable glass tile: a person, an entity, or a module.
// `badge` is a monogram for now; a photo or logo can replace it later.
function Tile({
  index,
  badge,
  title,
  caption,
  dot,
  onOpen,
}: {
  index: number;
  badge: string;
  title: string;
  caption: string;
  dot?: "forming" | "standby";
  onOpen: () => void;
}) {
  return (
    <GlassCard
      index={index}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group cursor-pointer p-5 transition-[translate,border-color] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 font-display text-lg font-semibold text-gold">
          {badge}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {dot && <span className={cn("entity-status-dot", dot)} />}
            <span className="truncate font-display text-base font-semibold text-foreground">
              {title}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {caption}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gold/70 transition-transform group-hover:translate-x-0.5" />
      </div>
    </GlassCard>
  );
}

// A row of tiles for one group (people or entities).
function TileGroup({
  title,
  group,
  startIndex,
  onOpen,
}: {
  title: string;
  group: EntityGroup;
  startIndex: number;
  onOpen: (key: EntityKey) => void;
}) {
  const entries = Object.entries(group);
  return (
    <section>
      <Eyebrow className="mb-3 text-gold">
        {title} · {entries.length}
      </Eyebrow>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, item], i) => (
          <Tile
            key={key}
            index={startIndex + i}
            badge={item.label.charAt(0)}
            title={item.label}
            caption={`${item.subs.length} modules`}
            dot={item.state === "forming" ? "forming" : "standby"}
            onOpen={() => onOpen(key as EntityKey)}
          />
        ))}
      </div>
    </section>
  );
}

function IgxAi() {
  const { entity: entityParam } = Route.useSearch();
  const initialEntity: EntityKey | null =
    entityParam && entityParam in igxAllEntities ? (entityParam as EntityKey) : null;

  // Which section of the page is open. A ?entity= link goes straight to the console.
  const [tab, setTab] = useState<IgxTabKey>(initialEntity ? "console" : "ecosystem");
  const [submitError, setSubmitError] = useState(false);

  // Console navigation: dashboard (no entity) → an entity's module tiles → a module thread.
  const [activeEntity, setActiveEntity] = useState<EntityKey | null>(initialEntity);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolving, setResolving] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [pendingList, setPendingList] = useState<PendingProposal[]>([]);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [pendingActionError, setPendingActionError] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingCountError, setPendingCountError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { logs: activityLogs, isLoading: activityLoading } = useLiveActivityLog();

  const entity = activeEntity ? igxAllEntities[activeEntity] : null;
  const key = activeEntity && activeSub ? threadKey(activeEntity, activeSub) : null;
  const messages = key ? threads[key] ?? [] : [];
  const busy = resolving !== null || resolvingId !== null;
  const view: "dashboard" | "entity" | "thread" = !activeEntity
    ? "dashboard"
    : !activeSub
    ? "entity"
    : "thread";

  // Loads the real pending queue from the database (count + the rows), so
  // proposals survive a page refresh and can always be reviewed.
  const fetchPendingCount = async () => {
    const { data, count, error } = await supabase
      .from("proposals")
      .select("id, intent, created_at", { count: "exact" })
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setPendingCountError(error.message);
      return;
    }
    setPendingCountError(null);
    setPendingList((data ?? []) as PendingProposal[]);
    setPendingCount(count ?? data?.length ?? 0);
  };

  useEffect(() => {
    Promise.all([fetchPendingCount()]).finally(() => setIsLoading(false));
  }, []);

  // Keep the newest message in view by scrolling the chat stream only. Scrolling the
  // whole window (scrollIntoView) is what made the page jump when the console opened.
  useEffect(() => {
    const el = streamRef.current;
    if (!el || messages.length === 0) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeSub && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [activeSub]);

  // Follow the ?entity= link if it changes while the console is open.
  useEffect(() => {
    if (entityParam && entityParam in igxAllEntities) {
      setActiveEntity(entityParam as EntityKey);
      setActiveSub(null);
      setTab("console");
    }
  }, [entityParam]);

  const openEntity = (next: EntityKey) => {
    setActiveEntity(next);
    setActiveSub(null);
  };
  const goDashboard = () => {
    setActiveEntity(null);
    setActiveSub(null);
  };
  const goEntity = () => setActiveSub(null);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeEntity || !activeSub || !entity || isSubmitting) return;

    const sub = entity.subs.find((s: SubItem) => s.id === activeSub)!;
    const scopedIntent = `[${entity.label} → ${sub.label}] ${trimmed}`;
    const k = threadKey(activeEntity, activeSub);

    setInput("");
    setIsSubmitting(true);

    setThreads((prev) => ({
      ...prev,
      [k]: [
        ...(prev[k] ?? []),
        {
          proposalId: null,
          intent: scopedIntent,
          status: "pending_review",
          detailsOpen: false,
          moreOpen: false,
        },
      ],
    }));

    const { data, error } = await supabase
      .from("proposals")
      .insert([
        {
          actor_type: "IGX_AI",
          source: "igx-ai-console",
          intent: scopedIntent,
          suggested_action: `Evaluate and process request: "${trimmed}"`,
          reasoning: "Pending intelligence routing.",
          status: "pending_review",
        },
      ])
      .select()
      .single();

    setSubmitError(!!error || !data);

    setThreads((prev) => {
      const current = prev[k] ?? [];
      const updated = [...current];
      const lastIndex = updated.length - 1;
      updated[lastIndex] =
        error || !data
          ? {
              ...updated[lastIndex],
              status: "error",
              errorMessage: error?.message ?? "The proposal was not saved.",
            }
          : { ...updated[lastIndex], proposalId: data.id };
      return { ...prev, [k]: updated };
    });

    setIsSubmitting(false);
    if (!error) fetchPendingCount();
  };

  // Approve / reject. The reviewer is the signed-in user (from the live session),
  // never a hardcoded id. Returns an error message, or undefined on success.
  // A zero-row update is reported instead of being ignored.
  const reviewProposal = async (
    id: string,
    nextStatus: "approved" | "rejected"
  ): Promise<string | undefined> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return userError?.message ?? "No signed-in user — the reviewer cannot be recorded.";
    }
    const { data, error } = await supabase
      .from("proposals")
      .update({
        status: nextStatus,
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending_review")
      .select("id");
    if (error) return error.message;
    if (!data || data.length === 0) {
      return "Not updated — the proposal was already decided or the change was blocked.";
    }
    return undefined;
  };

  // From a chat thread. A failure leaves the proposal pending so it can be retried.
  const resolveProposal = async (msgIndex: number, nextStatus: "approved" | "rejected") => {
    if (!key || busy) return;
    const message = threads[key]?.[msgIndex];
    if (!message?.proposalId) return;

    setResolving(msgIndex);
    const failure = await reviewProposal(message.proposalId, nextStatus);

    setThreads((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated[msgIndex] = failure
        ? { ...updated[msgIndex], errorMessage: failure }
        : { ...updated[msgIndex], status: nextStatus, errorMessage: undefined };
      return { ...prev, [key]: updated };
    });

    setResolving(null);
    fetchPendingCount();
  };

  // From the pending list (works after a refresh, for any saved proposal).
  const resolvePending = async (id: string, nextStatus: "approved" | "rejected") => {
    if (busy) return;
    setResolvingId(id);
    setPendingActionError(null);
    const failure = await reviewProposal(id, nextStatus);
    if (failure) {
      setPendingActionError(failure);
    } else {
      // Keep any open chat card for the same proposal in sync.
      setThreads((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([k, list]) => [
            k,
            list.map((m) =>
              m.proposalId === id ? { ...m, status: nextStatus, errorMessage: undefined } : m
            ),
          ])
        )
      );
    }
    setResolvingId(null);
    fetchPendingCount();
  };

  const toggleDetails = (msgIndex: number) => {
    if (!key) return;
    setThreads((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated[msgIndex] = { ...updated[msgIndex], detailsOpen: !updated[msgIndex].detailsOpen };
      return { ...prev, [key]: updated };
    });
  };

  const readAloud = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utter);
  };

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  // Console state for the orb, from what is really happening: a request in flight, a
  // failed request, proposals waiting for review, or nothing.
  const liveStage: LiveStage = isSubmitting
    ? { key: "submitting", name: "Submitting", detail: "Writing the proposal to the database" }
    : submitError
    ? { key: "error", name: "Error", detail: "The last request failed" }
    : pendingCountError
    ? { key: "error", name: "Unavailable", detail: "Could not read the pending queue" }
    : (pendingCount ?? 0) > 0
    ? {
        key: "awaiting",
        name: "Awaiting review",
        detail: `${pendingCount} ${pendingCount === 1 ? "proposal is" : "proposals are"} waiting for your decision`,
      }
    : { key: "idle", name: "Idle", detail: "No request in flight" };

  const recentActivities = activityLogs?.slice(0, 5) ?? [];
  const peopleGroup: EntityGroup = igxPeople;
  const entityGroup: EntityGroup = igxOrgEntities;
  const activeSubItem: SubItem | undefined = entity?.subs.find((s: SubItem) => s.id === activeSub);

  return (
    <div className="space-y-6">
      <IgxHero />
      <IgxTabBar active={tab} onChange={setTab} />

      {tab === "ecosystem" && (
        <EcosystemPanel
          live={liveStage}
          pendingCount={pendingCount}
          pendingLoading={isLoading}
          pendingError={!!pendingCountError}
          onOpenConsole={() => setTab("console")}
        />
      )}
      {tab === "architecture" && <ArchitecturePanel />}
      {tab === "decisions" && <DecisionsPanel />}
      {tab === "agents" && <AgentsPanel />}
      {tab === "models" && <ModelsPanel />}

      {tab === "console" && (
        <>
      {/* Pending Review tile — real proposals from the database */}
      <GlassCard index={1} className="p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setPendingOpen((v) => !v)}
          aria-expanded={pendingOpen}
          className="flex w-full items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
            <Shield className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Pending Review
              </span>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : pendingCountError ? (
                <span className="font-mono text-[10px] text-destructive">ERR</span>
              ) : (
                <span className="font-display text-2xl font-semibold text-gold">
                  {pendingCount ?? 0}
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: pendingCount ? `${Math.min((pendingCount / 10) * 100, 100)}%` : "0%",
                }}
              />
            </div>
            <p className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              <span>Proposals awaiting your review</span>
              <span className="text-gold">{pendingOpen ? "Hide" : "View"}</span>
            </p>
          </div>
        </button>

        {pendingOpen && (
          <div className="mt-4 border-t border-gold/20 pt-4">
            {pendingActionError && (
              <div className="mb-3 flex items-center gap-2 font-mono text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pendingActionError}</span>
              </div>
            )}

            {pendingCountError ? (
              <p className="font-mono text-xs text-destructive">
                Could not load the pending list: {pendingCountError}
              </p>
            ) : pendingList.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">Nothing is awaiting review.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {pendingList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-l-2 border-l-primary bg-black/20 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm font-medium text-foreground">
                        {item.intent}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        Saved {formatDateTime(item.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => resolvePending(item.id, "approved")}
                        className="gap-1.5"
                      >
                        {resolvingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}{" "}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => resolvePending(item.id, "rejected")}
                        className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Breadcrumb once inside a person / entity */}
      {view !== "dashboard" && entity && (
        <nav
          aria-label="Console location"
          className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]"
        >
          <button
            type="button"
            onClick={goDashboard}
            className="flex items-center gap-1.5 rounded-md border border-gold/30 bg-black/20 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> IGX AI
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          {view === "entity" ? (
            <span className="text-foreground">{entity.label}</span>
          ) : (
            <>
              <button
                type="button"
                onClick={goEntity}
                className="text-muted-foreground transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                {entity.label}
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">{activeSubItem?.label}</span>
            </>
          )}
        </nav>
      )}

      {/* Dashboard: people and entities as tiles */}
      {view === "dashboard" && (
        <>
          <TileGroup
            title="HUMAN-IN-THE-LOOP"
            group={peopleGroup}
            startIndex={2}
            onOpen={openEntity}
          />
          <TileGroup
            title="ENTITIES"
            group={entityGroup}
            startIndex={4}
            onOpen={openEntity}
          />

          {/* Recent activity — the real activity log */}
          <GlassCard index={8} className="p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-gold" />
              <Eyebrow>Recent activity</Eyebrow>
            </div>
            <div className="mt-4">
              {activityLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">
                    Loading activity...
                  </span>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log: any, i: number) => (
                  <div
                    key={log.id || i}
                    className="flex items-center justify-between gap-3 border-b border-gold/15 py-2.5 font-mono text-xs last:border-0"
                  >
                    <span className="min-w-0 truncate text-foreground">
                      {log.actor ? `${String(log.actor).toUpperCase()} · ` : ""}
                      {log.action || log.message || "System event"}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatTime(log.timestamp ?? log.created_at)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="font-mono text-xs text-muted-foreground">No recent activity logs.</p>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* Entity: its module tiles */}
      {view === "entity" && entity && (
        <section>
          <Eyebrow className="mb-3 text-gold">
            {entity.label} · {entity.subs.length} modules
          </Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entity.subs.map((sub: SubItem, i: number) => (
              <Tile
                key={sub.id}
                index={2 + i}
                badge={String(i + 1).padStart(2, "0")}
                title={sub.label}
                caption={sub.pillar ?? "Scoped thread"}
                onOpen={() => setActiveSub(sub.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Thread: chat stream and input for one module */}
      {view === "thread" && entity && activeSubItem && (
        <GlassCard index={2} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-5 py-3">
            <div className="min-w-0">
              <div className="truncate font-display text-base font-semibold text-foreground">
                {activeSubItem.label}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {entity.label}
                {activeSubItem.pillar ? ` · ${activeSubItem.pillar}` : ""}
              </div>
            </div>
          </div>

          {/* Chat stream: scrolls on its own, never the whole page */}
          <div ref={streamRef} className="h-[50vh] min-h-[300px] space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-gold/40" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Console ready
                </h3>
                <p className="mt-1 max-w-sm font-mono text-xs text-muted-foreground">
                  Dispatch an instruction for evaluation and proposal synthesis.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const accent =
                  msg.status === "approved"
                    ? "border-l-accent"
                    : msg.status === "rejected" || msg.status === "error"
                    ? "border-l-destructive"
                    : "border-l-primary";
                return (
                  <div
                    key={idx}
                    className={cn(
                      "space-y-3 rounded-lg border border-l-2 bg-black/20 p-4 transition-colors",
                      accent
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-sans text-sm font-medium text-foreground">{msg.intent}</p>
                      <StatusBadge status={msg.status} />
                    </div>

                    {msg.errorMessage && (
                      <div className="flex items-center gap-2 font-mono text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{msg.errorMessage}</span>
                      </div>
                    )}

                    {msg.status === "pending_review" && msg.proposalId && (
                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => resolveProposal(idx, "approved")}
                          className="gap-2"
                        >
                          {resolving === idx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}{" "}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => resolveProposal(idx, "rejected")}
                          className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}

                    {msg.detailsOpen && (
                      <div className="space-y-1 rounded border border-gold/15 bg-black/25 p-3 font-mono text-xs text-muted-foreground">
                        <div>Proposal ID: {msg.proposalId || "Saving..."}</div>
                        <div>Status: {msg.status}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <button
                        onClick={() => toggleDetails(idx)}
                        aria-label="Toggle details"
                        className="p-1 hover:text-foreground"
                      >
                        {msg.detailsOpen ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(msg.intent)}
                        aria-label="Copy request"
                        className="p-1 hover:text-foreground"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => readAloud(msg.intent)}
                        aria-label="Read aloud"
                        className="p-1 hover:text-foreground"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-gold/20 bg-black/15 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-3"
            >
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAttachOpen((v) => !v)}
                  aria-label="Attach"
                  className="shrink-0 rounded-lg p-2.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                {attachOpen && (
                  <div className="absolute bottom-12 left-0 z-50 w-56 space-y-1 rounded-lg border border-gold/25 bg-black/75 p-2 font-mono text-xs shadow-lg backdrop-blur-md">
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left disabled:opacity-40"
                    >
                      Attach Document · soon
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left disabled:opacity-40"
                    >
                      Attach Activity Log · soon
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={input}
                disabled={isSubmitting}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Instruction for IGX AI"
                placeholder="Enter instructions for IGX AI..."
                className="min-w-0 flex-1 rounded-lg border border-gold/25 bg-black/30 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />

              <Button
                type="submit"
                disabled={!input.trim() || isSubmitting}
                aria-label="Send"
                className="shrink-0 gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </GlassCard>
      )}
        </>
      )}
    </div>
  );
}
