// src/routes/igx-ai.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  Copy as CopyIcon,
  History,
  Mic,
  MoreHorizontal,
  Paperclip,
  PlusCircle,
  Send,
  Settings,
  Volume2,
  X,
  Sparkles,
  Zap,
  Shield,
  Brain,
  Globe,
  Users,
  Building2,
  User,
  ArrowRight,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Menu,
  X as XClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Signal, StatusBadge } from "@/components/portal-ui";
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

const STAGES = [
  { name: "Idle", detail: "Waiting for a scoped request", icon: Brain },
  { name: "Thinking", detail: "Parsing intent", icon: Zap },
  { name: "Routing", detail: "Selecting the right model", icon: Globe },
  { name: "Orchestrating", detail: "Coordinating sub-agents", icon: Users },
  { name: "Synthesizing", detail: "Drafting the proposal", icon: Sparkles },
  { name: "Responding", detail: "Awaiting your review", icon: Shield },
] as const;

function threadKey(entity: EntityKey, sub: string) {
  return `${entity}:${sub}`;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function IgxAi() {
  const [activeEntity, setActiveEntity] = useState<EntityKey>("mandela");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [subState, setSubState] = useState<Partial<Record<EntityKey, string>>>({});
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingCountError, setPendingCountError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real activity feed from Portal
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

  const selectEntity = (nextEntity: EntityKey) => {
    setActiveEntity(nextEntity);
    setActiveSub(subState[nextEntity] ?? null);
    setMobileMenuOpen(false);
  };

  const selectSub = (subId: string) => {
    setActiveSub(subId);
    setSubState((prev) => ({ ...prev, [activeEntity]: subId }));
  };

  const runStages = () => {
    setStageIndex(1);
    let i = 1;
    const timer = setInterval(() => {
      i += 1;
      if (i >= STAGES.length) {
        clearInterval(timer);
        i = STAGES.length - 1;
      }
      setStageIndex(i);
    }, 700);
    return () => clearInterval(timer);
  };

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeSub || isSubmitting) return;

    const sub = entity.subs.find((s: SubItem) => s.id === activeSub)!;
    const scopedIntent = `[${entity.label} → ${sub.label}] ${trimmed}`;
    const k = threadKey(activeEntity, activeSub);

    setInput("");
    setIsSubmitting(true);
    runStages();

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
          reasoning: "Pending intelligence routing (Step A plumbing, no reasoning yet).",
          status: "pending_review",
        },
      ])
      .select()
      .single();

    setThreads((prev) => {
      const current = prev[k] ?? [];
      const updated = [...current];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = error
        ? { ...updated[lastIndex], status: "error", errorMessage: error.message }
        : { ...updated[lastIndex], proposalId: data.id };
      return { ...prev, [k]: updated };
    });

    setIsSubmitting(false);
    if (!error) fetchPendingCount();
  };

  const resolveProposal = async (msgIndex: number, nextStatus: "approved" | "rejected") => {
    if (!key) return;
    const message = threads[key]?.[msgIndex];
    if (!message?.proposalId) return;

    const { error } = await supabase
      .from("proposals")
      .update({ status: nextStatus })
      .eq("id", message.proposalId);

    setThreads((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated[msgIndex] = {
        ...updated[msgIndex],
        status: error ? "error" : nextStatus,
        errorMessage: error?.message,
      };
      return { ...prev, [key]: updated };
    });

    if (!error) fetchPendingCount();
  };

  const toggleDetails = (msgIndex: number) => {
    if (!key) return;
    setThreads((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated[msgIndex] = { ...updated[msgIndex], detailsOpen: !updated[msgIndex].detailsOpen };
      return { ...prev, [key]: updated };
    });
  };

  const toggleMore = (msgIndex: number) => {
    if (!key) return;
    setThreads((prev) => {
      const updated = [...(prev[key] ?? [])];
      updated[msgIndex] = { ...updated[msgIndex], moreOpen: !updated[msgIndex].moreOpen };
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

  const stage = STAGES[stageIndex];
  const isActive = stageIndex !== 0;
  const StageIcon = stage.icon;

  // Recent activity for the feed (real logs)
  const recentActivities = activityLogs?.slice(0, 5) ?? [];

  return (
    <div className="relative h-[calc(100vh-5rem)] min-h-[600px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
      {/* Premium gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-30" />

      <div className="relative flex h-full flex-col lg:flex-row">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="absolute left-4 top-4 z-50 rounded-lg border border-border bg-background/80 p-2 backdrop-blur-sm lg:hidden"
        >
          {mobileMenuOpen ? <XClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Rail - Left Sidebar */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 z-40 w-[280px] border-r border-border bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col p-5">
            {/* Brand Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-sans text-lg font-bold tracking-tight text-foreground">
                  IGX AI
                </span>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-muted-foreground">ONLINE</span>
                </div>
              </div>
              <div className="ml-auto flex gap-1">
                <button
                  className="rounded-lg p-1.5 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
                  aria-label="New chat"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg p-1.5 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
                  aria-label="Chat history"
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
            <div className="mt-auto border-t border-border pt-4">
              <div className="rounded-lg border border-border bg-card/20 p-3.5">
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
            <button
              className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Reasoning Bar */}
          <div
            className={cn(
              "flex items-center gap-3 border-b border-border px-6 py-3 transition-colors",
              isActive && "bg-primary/5"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                isActive ? "bg-primary/20" : "bg-muted/10"
              )}
            >
              <StageIcon
                className={cn(
                  "h-4 w-4 transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-mono text-xs font-bold uppercase tracking-wider transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">
                  {stage.detail}
                </span>
              </div>
              <div className="mt-1.5 flex gap-1">
                {STAGES.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 w-8 rounded-full transition-all duration-500",
                      i === stageIndex
                        ? "bg-primary"
                        : i < stageIndex
                          ? "bg-primary/40"
                          : "bg-border"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Signal>{isSubmitting ? "Processing" : "Ready"}</Signal>
            </div>
          </div>

          {/* Activity Feed Toggle */}
          <button
            onClick={() => setActivityOpen(!activityOpen)}
            className="flex items-center gap-2 border-b border-border px-6 py-2 text-xs text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Activity Feed</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                activityOpen && "rotate-180"
              )}
            />
            {recentActivities.length > 0 && (
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[9px] text-primary">
                {recentActivities.length}
              </span>
            )}
          </button>

          {/* Activity Feed Dropdown */}
          {activityOpen && (
            <div className="max-h-48 overflow-y-auto border-b border-border bg-card/10">
              {activityLoading ? (
                <div className="flex items-center justify-center gap-3 px-6 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">
                    Loading telemetry...
                  </span>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log, i) => (
                  <div
                    key={log.id || i}
                    className="flex items-center gap-3 border-b border-border/50 px-6 py-3 last:border-0 hover:bg-primary/5"
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-medium text-foreground">
                      {log.actor?.toUpperCase() ?? "SYSTEM"}
                    </span>
                    <span className="flex-1 text-xs text-muted-foreground">{log.action}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/40">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-6 py-6 text-center">
                  <p className="font-mono text-xs text-muted-foreground/60">
                    No verified activity entries logged in current epoch.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Entity Header + Sub Pills */}
          <div className="border-b border-border bg-card/5 px-6 py-4">
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
            </div>
          </div>

          {/* Thread Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            {!activeSub && (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-10 w-10 text-primary/40" />
                </div>
                <div className="text-center">
                  <p className="font-sans text-lg font-semibold text-foreground">
                    Scope Your Query
                  </p>
                  <p className="font-mono text-sm text-muted-foreground/60">
                    Pick a sub-item above to begin
                  </p>
                </div>
              </div>
            )}

            {activeSub && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
                  <MessageSquare className="h-8 w-8 text-primary/30" />
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm text-muted-foreground/60">
                    Scoped to {entity.label} →{" "}
                    {entity.subs.find((s: SubItem) => s.id === activeSub)?.label}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground/40">
                    Ask something to draft a proposal
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message, i) => (
                <div key={i} className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-primary/10 px-5 py-3">
                      <p className="text-sm text-foreground">{message.intent}</p>
                      {message.status === "pending_review" && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="font-mono text-[10px] text-primary/70">
                            Awaiting review
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex">
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm border border-border bg-card/30 px-5 py-3.5">
                      {message.status === "error" ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            Error: {message.errorMessage}
                          </span>
                        </div>
                      ) : message.proposalId ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-foreground">
                              Proposal queued
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                            <span>ID:</span>
                            <span className="rounded bg-border/30 px-2 py-0.5 font-mono">
                              {message.proposalId.slice(0, 8)}
                            </span>
                            <span className="text-muted-foreground/40">···</span>
                            <span className="rounded bg-border/30 px-2 py-0.5 font-mono">
                              {message.proposalId.slice(-8)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Writing proposal...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 pl-4">
                    <button
                      onClick={() => toggleDetails(i)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Details</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          message.detailsOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {message.status === "pending_review" && message.proposalId && (
                      <>
                        <button
                          onClick={() => resolveProposal(i, "approved")}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-400 transition-all hover:bg-emerald-400/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => resolveProposal(i, "rejected")}
                          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive transition-all hover:bg-destructive/20"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {message.status === "approved" && (
                      <StatusBadge status="active" label="✓ APPROVED" />
                    )}
                    {message.status === "rejected" && (
                      <StatusBadge status="restricted" label="✕ REJECTED" />
                    )}

                    <div className="relative">
                      <button
                        onClick={() => toggleMore(i)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                      {message.moreOpen && (
                        <div className="absolute bottom-8 right-0 z-10 min-w-[160px] rounded-lg border border-border bg-background/95 p-1 shadow-xl backdrop-blur-sm">
                          <MenuItem
                            onClick={() => {
                              copyText(message.intent);
                              toggleMore(i);
                            }}
                            icon={<CopyIcon className="h-3.5 w-3.5" />}
                          >
                            Copy
                          </MenuItem>
                          <MenuItem
                            onClick={() => readAloud(message.intent)}
                            icon={<Volume2 className="h-3.5 w-3.5" />}
                          >
                            Read aloud
                          </MenuItem>
                          <MenuItem disabled icon={<ArrowRight className="h-3.5 w-3.5" />}>
                            Redo (visual only)
                          </MenuItem>
                          <MenuItem disabled icon={<EyeOff className="h-3.5 w-3.5" />}>
                            Ignore (visual only)
                          </MenuItem>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Panel */}
                  {message.detailsOpen && (
                    <div className="ml-4 space-y-2 rounded-lg border border-border bg-card/20 p-4">
                      <DetailRow
                        label="Scope"
                        value={`${entity.label} → ${entity.subs.find((s: SubItem) => s.id === activeSub)?.label}`}
                      />
                      <DetailRow label="Drafted by" value="Content Agent" />
                      <DetailRow
                        label="Gate"
                        value={message.status.toUpperCase()}
                        valueClassName={cn(
                          message.status === "approved" && "text-emerald-400",
                          message.status === "rejected" && "text-destructive",
                          message.status === "pending_review" && "text-primary"
                        )}
                      />
                      <DetailRow
                        label="Proposal ID"
                        value={message.proposalId ?? "pending insert"}
                        valueClassName="font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Row */}
          <div className="border-t border-border bg-card/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                  aria-label="Attach file"
                  onClick={() => setAttachOpen((v) => !v)}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                {attachOpen && (
                  <div className="absolute bottom-12 left-0 z-10 min-w-[180px] rounded-lg border border-border bg-background/95 p-1 shadow-xl backdrop-blur-sm">
                    <MenuItem disabled icon={<Paperclip className="h-3.5 w-3.5" />}>
                      Upload from computer
                    </MenuItem>
                    <MenuItem disabled icon={<Globe className="h-3.5 w-3.5" />}>
                      Google Drive
                    </MenuItem>
                    <MenuItem disabled icon={<Users className="h-3.5 w-3.5" />}>
                      GitHub
                    </MenuItem>
                    <MenuItem disabled icon={<Eye className="h-3.5 w-3.5" />}>
                      Add a screenshot
                    </MenuItem>
                    <MenuItem disabled icon={<Zap className="h-3.5 w-3.5" />}>
                      Connect data source
                    </MenuItem>
                  </div>
                )}
              </div>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                disabled={!activeSub || isSubmitting}
                placeholder={
                  activeSub
                    ? `Ask IGX AI about ${entity.subs.find((s: SubItem) => s.id === activeSub)?.label}...`
                    : "Pick a sub-item first..."
                }
                className="flex-1 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />

              <button
                className="rounded-lg p-2 text-muted-foreground/50 transition-all hover:text-foreground disabled:opacity-30"
                aria-label="Voice input"
                disabled
              >
                <Mic className="h-4 w-4" />
              </button>

              <Button
                size="icon"
                onClick={submit}
                disabled={!activeSub || isSubmitting || !input.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-components =====

function RailGroup({
  group,
  activeEntity,
  onSelect,
}: {
  group: typeof igxPeople | typeof igxOrgEntities;
  activeEntity: EntityKey;
  onSelect: (key: EntityKey) => void;
}) {
  return (
    <div className="mt-2 space-y-0.5">
      {Object.entries(group).map(([k, v]) => {
        const isActive = k === activeEntity;
        const Icon = isActive ? ChevronRight : null;
        return (
          <button
            key={k}
            onClick={() => onSelect(k as EntityKey)}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            )}
          >
            <StatusDot state={"state" in v ? v.state : undefined} />
            <span className="flex-1">{v.label}</span>
            {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function StatusDot({ state }: { state?: string }) {
  const color =
    state === "active" || state === "ready"
      ? "#4ADE80"
      : state === "forming"
        ? "#FBBF24"
        : "rgba(255,255,255,0.15)";
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      title={state ?? "status not tracked"}
    />
  );
}

function MenuItem({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-primary/10 disabled:opacity-40"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="font-mono text-[10px] uppercase text-muted-foreground/50">
        {label}
      </span>
      <span className={cn("text-sm text-foreground/80", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
