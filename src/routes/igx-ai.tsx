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

  const recentActivities = activityLogs?.slice(0, 5) ?? [];

  return (
    <div className="flex h-[calc(100vh-5rem)] min-h-[600px] overflow-hidden rounded-xl border border-[#E8DDD2] bg-[#F5F0EB] shadow-2xl">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="absolute left-4 top-4 z-50 rounded-lg border border-[#E8DDD2] bg-[#FAF6F1] p-2 shadow-sm lg:hidden"
      >
        {mobileMenuOpen ? <XClose className="h-5 w-5 text-[#1A1614]" /> : <Menu className="h-5 w-5 text-[#1A1614]" />}
      </button>

      {/* Rail - Left Sidebar */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-40 w-[260px] border-r border-[#E8DDD2] bg-[#FAF6F1] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-[#E8DDD2] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#B85C3A]/10">
              <Bot className="h-5 w-5 text-[#B85C3A]" />
            </div>
            <div>
              <span className="font-sans text-lg font-bold tracking-tight text-[#1A1614]">
                IGX AI
              </span>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7A9B76] animate-pulse" />
                <span className="font-mono text-[10px] text-[#6B5F55]">ONLINE</span>
              </div>
            </div>
            <div className="ml-auto flex gap-1">
              <button
                className="rounded-lg p-1.5 text-[#6B5F55] transition-all hover:bg-[#B85C3A]/10 hover:text-[#B85C3A]"
                aria-label="New chat"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg p-1.5 text-[#6B5F55] transition-all hover:bg-[#B85C3A]/10 hover:text-[#B85C3A]"
                aria-label="Chat history"
              >
                <History className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* People */}
          <div className="mt-5">
            <Eyebrow className="text-[10px] text-[#6B5F55]">HUMAN-IN-THE-LOOP</Eyebrow>
            <RailGroup
              group={igxPeople}
              activeEntity={activeEntity}
              onSelect={selectEntity}
            />
          </div>

          <div className="my-3 h-px bg-[#E8DDD2]" />

          {/* Entities */}
          <div>
            <Eyebrow className="text-[10px] text-[#6B5F55]">ENTITIES</Eyebrow>
            <RailGroup
              group={igxOrgEntities}
              activeEntity={activeEntity}
              onSelect={selectEntity}
            />
          </div>

          {/* Pending Review */}
          <div className="mt-auto border-t border-[#E8DDD2] pt-4">
            <div className="rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#6B5F55]">
                  Pending Review
                </span>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#6B5F55]" />
                ) : pendingCountError ? (
                  <span className="font-mono text-[10px] text-[#C45A3C]">ERR</span>
                ) : (
                  <span className="font-mono text-sm font-bold text-[#B85C3A]">
                    {pendingCount ?? 0}
                  </span>
                )}
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E8DDD2]">
                <div
                  className="h-full rounded-full bg-[#B85C3A] transition-all duration-500"
                  style={{
                    width: pendingCount
                      ? `${Math.min((pendingCount / 10) * 100, 100)}%`
                      : "0%",
                  }}
                />
              </div>
              <p className="mt-2 font-mono text-[9px] text-[#A6978A]">
                Proposals awaiting your review
              </p>
            </div>
          </div>

          {/* Settings */}
          <button
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#6B5F55] transition-all hover:bg-[#B85C3A]/10 hover:text-[#B85C3A]"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#F5F0EB]">
        {/* Header: Entity + Pills + Actions */}
        <div className="border-b border-[#E8DDD2] bg-[#FAF6F1] px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B85C3A]/10">
                <Building2 className="h-4 w-4 text-[#B85C3A]" />
              </div>
              <span className="font-sans text-base font-semibold text-[#1A1614]">
                {entity.label}
              </span>
            </div>
            <div className="h-6 w-px bg-[#E8DDD2]" />
            <div className="flex flex-1 flex-wrap gap-1.5">
              {entity.subs.map((sub: SubItem) => (
                <button
                  key={sub.id}
                  title={sub.pillar}
                  onClick={() => selectSub(sub.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    sub.id === activeSub
                      ? "border-[#B85C3A] bg-[#B85C3A]/10 text-[#B85C3A] shadow-sm shadow-[#B85C3A]/20"
                      : "border-[#E8DDD2] bg-transparent text-[#6B5F55] hover:border-[#B85C3A]/40 hover:bg-[#B85C3A]/5 hover:text-[#1A1614]"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            <button
              className="relative rounded-lg p-1.5 text-[#6B5F55] transition-all hover:bg-[#B85C3A]/10 hover:text-[#B85C3A]"
              aria-label="Activity feed"
              onClick={() => setActivityOpen((v) => !v)}
            >
              <Bell className="h-4 w-4" />
              {recentActivities.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#B85C3A]" />
              )}
            </button>
          </div>

          {/* Activity Feed Dropdown */}
          {activityOpen && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] shadow-lg">
              {activityLoading ? (
                <div className="flex items-center justify-center gap-3 px-4 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#B85C3A]" />
                  <span className="font-mono text-xs text-[#6B5F55]">
                    Loading telemetry...
                  </span>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((log, i) => (
                  <div
                    key={log.id || i}
                    className="flex items-center gap-3 border-b border-[#E8DDD2]/50 px-4 py-3 last:border-0 hover:bg-[#B85C3A]/5"
                  >
                    <div className="h-2 w-2 rounded-full bg-[#7A9B76] animate-pulse" />
                    <span className="font-mono text-xs font-medium text-[#1A1614]">
                      {log.actor?.toUpperCase() ?? "SYSTEM"}
                    </span>
                    <span className="flex-1 text-xs text-[#6B5F55]">{log.action}</span>
                    <span className="font-mono text-[10px] text-[#A6978A]">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="font-mono text-xs text-[#A6978A]">
                    No verified activity entries logged.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#E8DDD2]">
          {!activeSub && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B85C3A]/10">
                <Bot className="h-10 w-10 text-[#B85C3A]/40" />
              </div>
              <div className="text-center">
                <p className="font-sans text-lg font-semibold text-[#1A1614]">
                  Scope Your Query
                </p>
                <p className="font-mono text-sm text-[#6B5F55]">
                  Pick a sub-item above to begin
                </p>
              </div>
            </div>
          )}

          {activeSub && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B85C3A]/5">
                <MessageSquare className="h-8 w-8 text-[#B85C3A]/30" />
              </div>
              <div className="text-center">
                <p className="font-mono text-sm text-[#6B5F55]">
                  Scoped to {entity.label} →{" "}
                  {entity.subs.find((s: SubItem) => s.id === activeSub)?.label}
                </p>
                <p className="font-mono text-xs text-[#A6978A]">
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
                  <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-[#B85C3A]/10 px-5 py-3">
                    <p className="text-sm text-[#1A1614]">{message.intent}</p>
                    {message.status === "pending_review" && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-[#B85C3A]" />
                        <span className="font-mono text-[10px] text-[#B85C3A]/70">
                          Awaiting review
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI response */}
                <div className="flex">
                  <div className="max-w-[75%] rounded-2xl rounded-tl-sm border border-[#E8DDD2] bg-[#FFFCF8] px-5 py-3.5 shadow-sm">
                    {message.status === "error" ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[#C45A3C]" />
                        <span className="text-sm text-[#C45A3C]">
                          Error: {message.errorMessage}
                        </span>
                      </div>
                    ) : message.proposalId ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#7A9B76]" />
                          <span className="text-sm text-[#1A1614]">
                            Proposal queued
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-[#6B5F55]">
                          <span>ID:</span>
                          <span className="rounded bg-[#F5F0EB] px-2 py-0.5 font-mono">
                            {message.proposalId.slice(0, 8)}
                          </span>
                          <span className="text-[#A6978A]">···</span>
                          <span className="rounded bg-[#F5F0EB] px-2 py-0.5 font-mono">
                            {message.proposalId.slice(-8)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#B85C3A]" />
                        <span className="text-sm text-[#6B5F55]">
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
                    className="flex items-center gap-1.5 rounded-lg border border-[#E8DDD2] px-3 py-1.5 text-xs text-[#6B5F55] transition-all hover:border-[#B85C3A]/40 hover:bg-[#B85C3A]/5 hover:text-[#B85C3A]"
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
                        className="flex items-center gap-1.5 rounded-lg border border-[#7A9B76]/30 bg-[#7A9B76]/10 px-3 py-1.5 text-xs text-[#7A9B76] transition-all hover:bg-[#7A9B76]/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => resolveProposal(i, "rejected")}
                        className="flex items-center gap-1.5 rounded-lg border border-[#C45A3C]/30 bg-[#C45A3C]/10 px-3 py-1.5 text-xs text-[#C45A3C] transition-all hover:bg-[#C45A3C]/20"
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
                      className="rounded-lg p-1.5 text-[#6B5F55] transition-all hover:bg-[#B85C3A]/10 hover:text-[#B85C3A]"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {message.moreOpen && (
                      <div className="absolute bottom-8 right-0 z-10 min-w-[160px] rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] p-1 shadow-xl">
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
                  <div className="ml-4 space-y-2 rounded-lg border border-[#E8DDD2] bg-[#FAF6F1] p-4">
                    <DetailRow
                      label="Scope"
                      value={`${entity.label} → ${entity.subs.find((s: SubItem) => s.id === activeSub)?.label}`}
                    />
                    <DetailRow label="Drafted by" value="Content Agent" />
                    <DetailRow
                      label="Gate"
                      value={message.status.toUpperCase()}
                      valueClassName={cn(
                        message.status === "approved" && "text-[#7A9B76]",
                        message.status === "rejected" && "text-[#C45A3C]",
                        message.status === "pending_review" && "text-[#B85C3A]"
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

        {/* Reasoning Bar + Input Row - Fixed Bottom */}
        <div className="border-t border-[#E8DDD2] bg-[#FAF6F1]">
          {/* Reasoning Bar */}
          <div
            className={cn(
              "flex items-center gap-3 border-b border-[#E8DDD2] px-6 py-2.5 transition-colors",
              isActive && "bg-[#B85C3A]/5"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                isActive ? "bg-[#B85C3A]/20" : "bg-[#E8DDD2]/30"
              )}
            >
              <StageIcon
                className={cn(
                  "h-3.5 w-3.5 transition-all",
                  isActive ? "text-[#B85C3A]" : "text-[#A6978A]"
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
                    isActive ? "text-[#B85C3A]" : "text-[#A6978A]"
                  )}
                >
                  {stage.name}
                </span>
                <span className="font-mono text-[10px] text-[#A6978A]">
                  {stage.detail}
                </span>
              </div>
              <div className="mt-1 flex gap-1">
                {STAGES.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 w-6 rounded-full transition-all duration-500",
                      i === stageIndex
                        ? "bg-[#B85C3A]"
                        : i < stageIndex
                          ? "bg-[#B85C3A]/40"
                          : "bg-[#E8DDD2]"
                    )}
                  />
                ))}
              </div>
            </div>
            <Signal>{isSubmitting ? "Processing" : "Ready"}</Signal>
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-3 px-6 py-3">
            <div className="relative">
              <button
                className="rounded-lg p-2 text-[#6B5F55] transition-all hover:bg-[#B85C3A]/10 hover:text-[#B85C3A]"
                aria-label="Attach file"
                onClick={() => setAttachOpen((v) => !v)}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              {attachOpen && (
                <div className="absolute bottom-12 left-0 z-10 min-w-[180px] rounded-lg border border-[#E8DDD2] bg-[#FFFCF8] p-1 shadow-xl">
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
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              disabled={!activeSub || isSubmitting}
              placeholder={
                activeSub
                  ? `Ask IGX AI about ${entity.subs.find((s: SubItem) => s.id === activeSub)?.label}...`
                  : "Pick a sub-item first..."
              }
              className="flex-1 rounded-xl border border-[#E8DDD2] bg-[#FFFCF8] px-4 py-2.5 text-sm text-[#1A1614] outline-none transition-all placeholder:text-[#A6978A] focus:border-[#B85C3A]/50 focus:ring-1 focus:ring-[#B85C3A]/20 disabled:opacity-50"
            />

            <button
              className="rounded-lg p-2 text-[#A6978A] transition-all hover:text-[#6B5F55] disabled:opacity-30"
              aria-label="Voice input"
              disabled
            >
              <Mic className="h-4 w-4" />
            </button>

            <Button
              size="icon"
              onClick={submit}
              disabled={!activeSub || isSubmitting || !input.trim()}
              className="h-10 w-10 rounded-xl bg-[#B85C3A] text-[#F5F0EB] shadow-lg shadow-[#B85C3A]/30 transition-all hover:bg-[#9C4A2E] hover:shadow-[#B85C3A]/40 disabled:opacity-50"
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
        return (
          <button
            key={k}
            onClick={() => onSelect(k as EntityKey)}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200",
              isActive
                ? "bg-[#B85C3A]/10 text-[#B85C3A] shadow-sm shadow-[#B85C3A]/10"
                : "text-[#6B5F55] hover:bg-[#B85C3A]/5 hover:text-[#1A1614]"
            )}
          >
            <StatusDot state={"state" in v ? v.state : undefined} />
            <span className="flex-1">{v.label}</span>
            {isActive && <ChevronRight className="h-3.5 w-3.5 text-[#B85C3A]" />}
          </button>
        );
      })}
    </div>
  );
}

function StatusDot({ state }: { state?: string }) {
  const color =
    state === "active" || state === "ready"
      ? "#7A9B76"
      : state === "forming"
        ? "#C6A15B"
        : "#A6978A";
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
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs text-[#1A1614] transition-colors hover:bg-[#B85C3A]/10 disabled:opacity-40"
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
      <span className="font-mono text-[10px] uppercase text-[#A6978A]">
        {label}
      </span>
      <span className={cn("text-sm text-[#1A1614]", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
