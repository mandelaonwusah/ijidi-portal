import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowRight,
  MessageSquare,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Menu,
  X as XClose,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Signal, StatusBadge } from "@/components/portal-ui";
import { supabase } from "@/lib/supabase";
import { igxPeople, igxOrgEntities, igxAllEntities, personalBrand } from "@/lib/portal-data";
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
    <div className="mt-2 space-y-1">
      {Object.entries(group).map(([key, item]) => (
        <button
          key={key}
          onClick={() => onSelect(key as EntityKey)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-xs transition-all",
            activeEntity === key
              ? "bg-primary/10 font-bold text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{item.label}</span>
          <span className="text-[10px] opacity-60">{item.subs.length}</span>
        </button>
      ))}
    </div>
  );
}

function ReasoningOrb({ stage }: { stage: (typeof STAGES)[number] }) {
  const StageIcon = stage.icon;
  return (
    <div className="flex items-center gap-4 border-b bg-muted/30 px-6 py-3">
      <div className="reasoning-orb-wrap flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
        <StageIcon className="h-4 w-4" />
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
  const [stageIndex, setStageIndex] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
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

  const stage = STAGES[stageIndex];
  const recentActivities = activityLogs?.slice(0, 5) ?? [];

  return (
    <div className="relative flex h-[calc(100vh-5rem)] min-h-[600px] overflow-hidden rounded-xl border bg-background shadow-2xl">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary/10 font-bold text-primary">
              IGX
            </div>
            <div>
              <span className="font-sans text-lg font-bold tracking-tight text-foreground">
                IGX AI
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide text-primary">
                  Root
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {personalBrand.name}
                </span>
              </div>
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
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="border-b bg-card/50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-sans text-base font-semibold text-foreground">
                {entity.label}
              </span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex flex-1 flex-wrap gap-1.5">
              {entity.subs.map((sub: SubItem) => (
                <button
                  key={sub.id}
                  onClick={() => selectSub(sub.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    sub.id === activeSub
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            <button
              className="relative shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-primary"
              onClick={() => setActivityOpen((v) => !v)}
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>

          {/* Activity Feed Dropdown */}
          {activityOpen && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border bg-card p-3 shadow-lg">
              {activityLoading ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Loading activity...</span>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="py-2 text-center text-xs text-muted-foreground">No recent activity</div>
              ) : (
                recentActivities.map((act: any, idx: number) => (
                  <div key={idx} className="border-b py-1.5 text-xs text-muted-foreground last:border-0">
                    <span className="font-mono text-primary">{act.actor ?? "SYSTEM"}</span>: {act.action}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Reasoning Status Bar */}
        <ReasoningOrb stage={stage} />

        {/* Chat / Thread Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeSub ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="h-12 w-12 text-primary/40 mb-3" />
              <p className="font-mono text-sm">Select a sub-category above to activate the stream.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 text-primary/30 mb-2" />
              <p className="font-mono text-xs">Console initialized for scope. Enter an operational request below.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-primary font-bold">{msg.intent}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                    msg.status === "approved" ? "bg-green-500/10 text-green-500" :
                    msg.status === "rejected" ? "bg-red-500/10 text-red-500" :
                    msg.status === "error" ? "bg-destructive/10 text-destructive" :
                    "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {msg.status}
                  </span>
                </div>

                {msg.status === "pending_review" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => resolveProposal(i, "approved")} className="h-7 text-xs">
                      Approve Action
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resolveProposal(i, "rejected")} className="h-7 text-xs">
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t bg-card/50 p-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              disabled={!activeSub || isSubmitting}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={activeSub ? "Type a prompt or system command..." : "Select a pillar above to type..."}
              className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <Button disabled={!activeSub || isSubmitting || !input.trim()} onClick={submit} size="icon">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
