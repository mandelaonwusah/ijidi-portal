import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Bell,
  Check,
  Copy as CopyIcon,
  History,
  Paperclip,
  PlusCircle,
  Send,
  Settings,
  Volume2,
  X,
  Zap,
  Shield,
  Brain,
  Building2,
  MessageSquare,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Menu,
  X as XClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, StatusBadge } from "@/components/portal-ui";
import { supabase } from "@/lib/supabase";
import {
  igxPeople,
  igxOrgEntities,
  igxAllEntities,
  entitySwitcherItems,
  personalBrand,
} from "@/lib/portal-data";
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
  }),
  component: IgxAi,
});

type EntityKey = keyof typeof igxAllEntities;
type SubItem = { id: string; label: string; pillar?: string };
type ProposalStatus = "pending_review" | "approved" | "rejected" | "error";

type ThreadMessage = {
  proposalId: string | null;
  intent: string;
  status: ProposalStatus;
  errorMessage?: string;
  detailsOpen: boolean;
  moreOpen: boolean;
};

// Honest-state readout: every stage below maps to something that really
// happens in this console. No model is called yet (IGX AI Step B is not wired),
// so there are no "thinking / routing / orchestrating" stages to show.
const STAGES = [
  { name: "Idle", detail: "No request in flight", icon: Brain },
  { name: "Submitting", detail: "Writing the proposal to the database", icon: Zap },
  { name: "Awaiting review", detail: "Saved — waiting for your decision", icon: Shield },
  { name: "Error", detail: "The last request failed", icon: AlertCircle },
] as const;

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

// Generalized top entity switcher — Group/Foundation/Atelier/Media.
// Same component/data contract as the one on the Command Center route.
function EntitySwitcherBar() {
  return (
    <div className="entity-switcher-bar">
      {entitySwitcherItems.map((item) => (
        <Link key={item.key} to={item.to} className="entity-chip">
          <span className={cn("entity-status-dot", item.status)} />
          {item.label}
        </Link>
      ))}
    </div>
  );
}

// Glowing status orb — shows the console's real state (see STAGES above).
function ReasoningOrb({ stage }: { stage: (typeof STAGES)[number] }) {
  const StageIcon = stage.icon;
  return (
    <div className="flex items-center gap-4 border-b bg-muted/30 px-6 py-3">
      <div className="reasoning-orb-wrap">
        <span className="reasoning-orb-ring" />
        <span className="reasoning-orb-ring delay" />
        <span className="reasoning-orb-core">
          <StageIcon className="h-5 w-5 text-primary-foreground" />
        </span>
      </div>
      <div>
        <div className="font-mono text-sm font-semibold uppercase tracking-wide text-primary">
          {stage.name}
        </div>
        <div className="font-mono text-xs text-muted-foreground">{stage.detail}</div>
      </div>
    </div>
  );
}

function IgxAi() {
  const [activeEntity, setActiveEntity] = useState<EntityKey>("mandela");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [subState, setSubState] = useState<Partial<Record<EntityKey, string>>>({});
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolving, setResolving] = useState<number | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingCountError, setPendingCountError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { logs: activityLogs, isLoading: activityLoading } = useLiveActivityLog();

  const entity = igxAllEntities[activeEntity];
  const key = activeSub ? threadKey(activeEntity, activeSub) : null;
  const messages = key ? threads[key] ?? [] : [];

  const fetchPendingCount = async () => {
    const { count, error } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");

    if (error) {
      setPendingCountError(error.message);
      return;
    }
    setPendingCountError(null);
    setPendingCount(count ?? 0);
  };

  useEffect(() => {
    Promise.all([fetchPendingCount()]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeSub && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSub]);

  const selectEntity = (nextEntity: EntityKey) => {
    setActiveEntity(nextEntity);
    setActiveSub(subState[nextEntity] ?? null);
    setMobileMenuOpen(false);
  };

  const selectSub = (subId: string) => {
    setActiveSub(subId);
    setSubState((prev) => ({ ...prev, [activeEntity]: subId }));
  };

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeSub || isSubmitting) return;

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
  // never a hardcoded id. A failed or blocked update leaves the proposal pending
  // so it can be retried, and a zero-row update is reported instead of ignored.
  const resolveProposal = async (msgIndex: number, nextStatus: "approved" | "rejected") => {
    if (!key || resolving !== null) return;
    const message = threads[key]?.[msgIndex];
    if (!message?.proposalId) return;

    setResolving(msgIndex);
    let failure: string | undefined;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      failure = userError?.message ?? "No signed-in user — the reviewer cannot be recorded.";
    } else {
      const { data, error } = await supabase
        .from("proposals")
        .update({
          status: nextStatus,
          reviewed_by: userData.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", message.proposalId)
        .eq("status", "pending_review")
        .select("id");
      if (error) {
        failure = error.message;
      } else if (!data || data.length === 0) {
        failure = "Not updated — the proposal was already decided or the change was blocked.";
      }
    }

    setThreads((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated[msgIndex] = failure
        ? { ...updated[msgIndex], errorMessage: failure }
        : { ...updated[msgIndex], status: nextStatus, errorMessage: undefined };
      return { ...prev, [key]: updated };
    });

    setResolving(null);
    if (!failure) fetchPendingCount();
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

  // Console state, derived from what is really happening in this thread.
  const lastMessage = messages[messages.length - 1];
  const hasPendingSaved = messages.some((m) => m.status === "pending_review" && !!m.proposalId);
  const stage = isSubmitting
    ? STAGES[1]
    : lastMessage?.status === "error"
    ? STAGES[3]
    : hasPendingSaved
    ? STAGES[2]
    : STAGES[0];

  const recentActivities = activityLogs?.slice(0, 5) ?? [];

  return (
    <div className="relative flex h-[calc(100vh-5rem)] min-h-[600px] overflow-hidden rounded-xl border bg-background shadow-2xl">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        className="absolute left-4 top-4 z-50 rounded-lg border bg-card p-2 shadow-sm lg:hidden"
      >
        {mobileMenuOpen ? <XClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Rail - Left Sidebar */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-40 w-[260px] border-r bg-card transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-lg font-bold tracking-tight text-foreground">
                IGX AI
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide text-primary">
                  Root
                </span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {personalBrand.name}
                </span>
              </div>
              <div className="font-mono text-[9px] text-muted-foreground/60">
                {personalBrand.handle} · Governor
              </div>
            </div>
            <div className="ml-auto flex gap-1">
              <button
                disabled
                className="rounded-lg p-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40"
                aria-label="New chat (not available yet)"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
              <button
                disabled
                className="rounded-lg p-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40"
                aria-label="Chat history (not available yet)"
              >
                <History className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* People */}
          <div className="mt-5">
            <Eyebrow className="text-[10px] text-muted-foreground">HUMAN-IN-THE-LOOP</Eyebrow>
            <RailGroup
              group={igxPeople}
              activeEntity={activeEntity}
              onSelect={selectEntity}
            />
          </div>

          <div className="my-3 h-px bg-border" />

          {/* Entities */}
          <div>
            <Eyebrow className="text-[10px] text-muted-foreground">ENTITIES</Eyebrow>
            <RailGroup
              group={igxOrgEntities}
              activeEntity={activeEntity}
              onSelect={selectEntity}
            />
          </div>

          {/* Pending Review */}
          <div className="mt-auto border-t pt-4">
            <div className="rounded-lg border bg-card p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  Pending Review
                </span>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : pendingCountError ? (
                  <span className="font-mono text-[10px] text-destructive">ERR</span>
                ) : (
                  <span className="font-mono text-sm font-bold text-primary">
                    {pendingCount ?? 0}
                  </span>
                )}
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: pendingCount
                      ? `${Math.min((pendingCount / 10) * 100, 100)}%`
                      : "0%",
                  }}
                />
              </div>
              <p className="mt-2 font-mono text-[9px] text-muted-foreground/60">
                Proposals awaiting your review
              </p>
            </div>
          </div>

          {/* Settings */}
          <Link to="/settings"
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Generalized top entity switcher */}
        <div className="border-b bg-card/50 px-6 py-3">
          <EntitySwitcherBar />
        </div>

        {/* Header: Entity + Pills + Actions */}
        <div className="border-b bg-card/50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-sans text-base font-semibold text-foreground">
                {entity.label}
              </span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex flex-1 flex-wrap gap-1.5">
              {entity.subs.map((sub: SubItem) => (
                <button
                  key={sub.id}
                  title={sub.pillar}
                  onClick={() => selectSub(sub.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    sub.id === activeSub
                      ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                      : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            <button
              className="relative shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="Activity feed"
              onClick={() => setActivityOpen((v) => !v)}
            >
              <Bell className="h-4 w-4" />
              {recentActivities.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Activity Feed Dropdown */}
          {activityOpen && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border bg-card shadow-lg">
              {activityLoading ? (
                <div className="flex items-center justify-center gap-3 px-4 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">
                    Loading activity...
                  </span>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log: any, i: number) => (
                  <div
                    key={log.id || i}
                    className="flex items-center justify-between gap-3 border-b p-3 font-mono text-xs last:border-0"
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
                <div className="p-4 text-center font-mono text-xs text-muted-foreground">No recent activity logs.</div>
              )}
            </div>
          )}
        </div>

        {/* Status orb — real console state */}
        <ReasoningOrb stage={stage} />

        {/* Chat Stream */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {!activeSub ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <h3 className="font-sans text-lg font-semibold text-foreground">Select a Sub-Module</h3>
              <p className="mt-1 max-w-sm font-mono text-xs text-muted-foreground">
                Choose a targeted scope from the top pills to open an intelligence thread.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Brain className="mb-3 h-12 w-12 text-primary/40" />
              <h3 className="font-sans text-lg font-semibold text-foreground">Console Ready</h3>
              <p className="mt-1 max-w-sm font-mono text-xs text-muted-foreground">
                Dispatch an instruction for evaluation and proposal synthesis.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const accent =
                msg.status === "approved"
                  ? "border-l-emerald-500"
                  : msg.status === "rejected" || msg.status === "error"
                  ? "border-l-destructive"
                  : "border-l-primary";
              return (
                <div
                  key={idx}
                  className={cn(
                    "space-y-4 rounded-lg border border-l-2 bg-card p-5 shadow-sm transition-colors",
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
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        size="sm"
                        disabled={resolving !== null}
                        onClick={() => resolveProposal(idx, "approved")}
                        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
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
                        disabled={resolving !== null}
                        onClick={() => resolveProposal(idx, "rejected")}
                        className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}

                  {msg.detailsOpen && (
                    <div className="space-y-1 rounded border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                      <div>Proposal ID: {msg.proposalId || "Saving..."}</div>
                      <div>Status: {msg.status}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                    <button
                      onClick={() => toggleDetails(idx)}
                      aria-label="Toggle details"
                      className="p-1 hover:text-foreground"
                    >
                      {msg.detailsOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t bg-card p-4">
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
                className="shrink-0 rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              {attachOpen && (
                <div className="absolute bottom-12 left-0 z-50 w-56 space-y-1 rounded-lg border bg-card p-2 font-mono text-xs shadow-lg">
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
              disabled={!activeSub || isSubmitting}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Instruction for IGX AI"
              placeholder={
                activeSub
                  ? "Enter instructions for IGX AI..."
                  : "Select a module pill above to begin..."
              }
              className="min-w-0 flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />

            <Button
              type="submit"
              disabled={!input.trim() || !activeSub || isSubmitting}
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
      </div>
    </div>
  );
}

function RailGroup({
  group,
  activeEntity,
  onSelect,
}: {
  group: Record<string, { label: string; state?: string; subs: SubItem[] }>;
  activeEntity: EntityKey;
  onSelect: (key: EntityKey) => void;
}) {
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(group).map(([key, item]) => (
        <button
          key={key}
          onClick={() => onSelect(key as EntityKey)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-xs transition-all",
            activeEntity === key
              ? "bg-primary/10 font-semibold text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "entity-status-dot",
                item.state === "forming" ? "forming" : "standby"
              )}
            />
            {item.label}
          </span>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>
      ))}
    </div>
  );
}
