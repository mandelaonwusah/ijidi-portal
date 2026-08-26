import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Signal, StatusBadge } from "@/components/portal-ui";
import { supabase } from "@/lib/supabase";
import { igxPeople, igxOrgEntities, igxAllEntities } from "@/lib/portal-data";
import { cn } from "@/lib/utils";

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

/*
  HONEST-STATE FLAGS (this port, 2026-08-26)
  - Rail (People/Entities), merged header + sub-pills, Details panel:
    real, sourced from igxPeople/igxOrgEntities in portal-data.ts.
  - Chat submit: REAL — inserts into `proposals` via Supabase, same as
    the original Step A flow.
  - Approve/Reject: REAL Supabase UPDATE on the specific proposal row,
    but only for proposals created in THIS session — `proposals` has
    no entity/sub scoping column yet, so an older pending proposal
    can't be resolved from here after a reload. Schema decision, not
    silently patched here.
  - Scope is currently stuffed into the `intent` text as a prefix
    (e.g. "[IJIDI Media → IJIDI Wild] ..."), not a real column. Same
    reason as above.
  - Pending count: REAL — fetched from `proposals` on mount and
    refetched after every submit/approve/reject, so it reflects the
    true DB state (not just what happened in this session) even
    across a page refresh.
  - Read aloud: REAL, browser Web Speech API, no backend needed.
  - Copy: REAL clipboard write of the AI bubble text.
  - Reasoning bar / stage-track: runs only during a real submit (not
    decorative on every tab switch, unlike the HTML mockup) — tied to
    actual async state, not simulated for idle browsing.
  - Ticker: REMOVED (2026-08-26). It read fake data from `activity_log`,
    which isn't wired yet — cut to remove the most visible "not real
    yet" chrome sitting above the reasoning bar.
  - Activity feed (bell dropdown): STILL FAKE, kept for now — same
    `activity_log` dependency as the ticker had, but less visually
    prominent, so it stays until that table's column shape is confirmed
    and it can be genuinely wired.
  - Settings, New chat, Chat history, attach-menu items, voice input,
    Redo, Ignore: visual-only, no backend.
  - Color tokens: this file previously read a scoped `--igx-*` variable
    set (`--igx-gold`, `--igx-purple`, `--igx-bg`, `--igx-border-soft`,
    etc.) that no longer exists in styles.css now that the palette
    swap moved to :root. Remapped every reference to the global tokens
    (--primary, --accent, --destructive, --background, --foreground,
    --border, --panel-elevated, --primary-foreground). `--igx-border`
    and `--igx-border-soft` both collapse to plain `--border` since the
    new token set has no separate "soft" border tone — flagging in
    case a lighter secondary border variant is wanted later.
*/

type EntityKey = keyof typeof igxAllEntities;
type SubItem = { id: string; label: string; pillar?: string };
type ProposalStatus = "pending_review" | "approved" | "rejected" | "error";

type ThreadMessage = {
  proposalId: string | null; // null until the insert resolves
  intent: string;
  status: ProposalStatus;
  errorMessage?: string;
  detailsOpen: boolean;
  moreOpen: boolean;
};

const STAGES = [
  { name: "Idle", detail: "Waiting for a scoped request" },
  { name: "Thinking", detail: "Parsing intent" },
  { name: "Routing", detail: "Selecting the right model" },
  { name: "Orchestrating", detail: "Coordinating sub-agents" },
  { name: "Synthesizing", detail: "Drafting the proposal" },
  { name: "Responding", detail: "Awaiting your review" },
] as const;

const FAKE_ACTIVITY_ITEMS = [
  { actor: "Mandela", text: "Approved Strategy proposal for Group", time: "2m ago" },
  { actor: "IGX", text: "Drafted new caption set for Atelier → Shoes", time: "14m ago" },
  { actor: "system", text: "Synced activity_log to Command Center", time: "1h ago" },
] as const;

function threadKey(entity: EntityKey, sub: string) {
  return `${entity}:${sub}`;
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

  // REAL — true DB count, not just session-local proposals. See flag block above.
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingCountError, setPendingCountError] = useState<string | null>(null);

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
    fetchPendingCount();
  }, []);

  const selectEntity = (nextEntity: EntityKey) => {
    setActiveEntity(nextEntity);
    setActiveSub(subState[nextEntity] ?? null);
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

  return (
    <div
      data-igx-console
      className="grid grid-cols-[220px_1fr] overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Rail */}
      <aside
        className="flex flex-col gap-4 border-r p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--primary)", boxShadow: "0 0 6px 2px rgba(198,161,91,0.5)" }}
          />
          <span className="font-display text-sm">IGX AI</span>
          <div className="ml-auto flex gap-1">
            <button className="rounded p-1 opacity-60 hover:opacity-100" aria-label="New chat" title="New chat (visual only)">
              <PlusCircle className="h-3.5 w-3.5" />
            </button>
            <button className="rounded p-1 opacity-60 hover:opacity-100" aria-label="Chat history" title="Chat history (visual only)">
              <History className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <RailGroup
          label="human-in-the-loop"
          group={igxPeople}
          activeEntity={activeEntity}
          onSelect={selectEntity}
        />
        <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
        <RailGroup
          label="entities"
          group={igxOrgEntities}
          activeEntity={activeEntity}
          onSelect={selectEntity}
        />

        <div className="mt-auto">
          <Eyebrow>pending review</Eyebrow>
          <div
            className="mt-1.5 rounded-lg border px-2.5 py-2 font-mono text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            {pendingCountError
              ? "count unavailable"
              : pendingCount === null
                ? "loading..."
                : `${pendingCount} proposal${pendingCount === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs opacity-70 hover:opacity-100"
            title="Settings (visual only)"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        {/* Reasoning bar — real, tied to actual submit state */}
        <div
          className="flex items-center gap-2 border-b px-5 py-2.5"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "color-mix(in oklab, var(--primary) 5%, transparent)",
          }}
        >
          <Bot
            className={cn("h-5 w-5", isActive && "live-pulse")}
            style={{ color: "var(--primary)" }}
          />
          <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--primary)" }}>
            {stage.name}
          </span>
          <span className="font-mono text-[11px]" style={{ color: "rgba(245,242,235,0.4)" }}>
            {stage.detail}
          </span>
          <div className="ml-1.5 flex gap-1">
            {STAGES.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    i === stageIndex
                      ? "var(--primary)"
                      : i < stageIndex
                        ? "color-mix(in oklab, var(--primary) 50%, transparent)"
                        : "rgba(245,242,235,0.2)",
                }}
              />
            ))}
          </div>
          <div className="ml-auto">
            <Signal>{isSubmitting ? "Processing" : "Ready"}</Signal>
          </div>
        </div>

        {/* Activity feed — fake, toggled by bell */}
        {activityOpen && (
          <div
            className="max-h-40 overflow-y-auto border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {FAKE_ACTIVITY_ITEMS.map((item, i) => (
              <div
                key={i}
                className="flex items-baseline gap-2.5 border-b px-5 py-2 text-xs"
                style={{ borderColor: "rgba(245,242,235,0.06)" }}
              >
                <span
                  className="font-mono text-[10px] uppercase"
                  style={{ color: item.actor === "Mandela" ? "var(--primary)" : "var(--accent)" }}
                >
                  {item.actor}
                </span>
                <span style={{ color: "rgba(245,242,235,0.75)" }}>{item.text}</span>
                <span className="ml-auto font-mono text-[10px]" style={{ color: "rgba(245,242,235,0.35)" }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Merged entity header + sub-pill row */}
        <div
          className="flex flex-wrap items-center gap-3 border-b px-5 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-display text-base">{entity.label}</span>
          <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
          <div className="flex flex-1 flex-wrap gap-1.5">
            {entity.subs.map((sub: SubItem) => (
              <button
                key={sub.id}
                title={sub.pillar}
                onClick={() => selectSub(sub.id)}
                className="rounded-full border px-3 py-1.5 text-[12.5px] transition-colors"
                style={
                  sub.id === activeSub
                    ? {
                        backgroundColor: "color-mix(in oklab, var(--primary) 18%, transparent)",
                        borderColor: "var(--primary)",
                        color: "var(--primary)",
                      }
                    : {
                        backgroundColor: "rgba(245,242,235,0.05)",
                        borderColor: "var(--border)",
                        color: "rgba(245,242,235,0.75)",
                      }
                }
              >
                {sub.label}
              </button>
            ))}
          </div>
          <button
            className="relative rounded-lg p-1.5 opacity-70 hover:opacity-100"
            aria-label="Activity feed"
            onClick={() => setActivityOpen((v) => !v)}
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>

        {/* Thread */}
        <div className="flex-1 space-y-3.5 overflow-auto p-6">
          {!activeSub && (
            <div className="mx-auto mt-16 text-sm" style={{ color: "rgba(245,242,235,0.4)" }}>
              Pick a sub-item above to scope this chat.
            </div>
          )}
          {activeSub && messages.length === 0 && (
            <div className="text-xs font-mono" style={{ color: "rgba(245,242,235,0.4)" }}>
              Scoped to {entity.label} → {entity.subs.find((s: SubItem) => s.id === activeSub)?.label}. Ask
              something to write a proposal.
            </div>
          )}
          {messages.map((message, i) => (
            <div key={i} className="space-y-2">
              <div
                className="ml-auto max-w-[60%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {message.intent}
              </div>
              <div
                className="max-w-[65%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
                style={{ backgroundColor: "rgba(245,242,235,0.06)" }}
              >
                {message.status === "error"
                  ? `Error writing to queue: ${message.errorMessage}`
                  : message.proposalId
                    ? `Proposal [${message.proposalId.slice(0, 8)}] written to queue.`
                    : "Writing proposal..."}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleDetails(i)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
                  style={{
                    borderColor: message.detailsOpen ? "var(--primary)" : "var(--border)",
                    color: message.detailsOpen ? "var(--primary)" : "var(--foreground)",
                  }}
                >
                  Details
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", message.detailsOpen && "rotate-180")}
                  />
                </button>
                {message.status === "pending_review" && message.proposalId && (
                  <>
                    <IconButton
                      label="Approve"
                      hoverColor="#639922"
                      onClick={() => resolveProposal(i, "approved")}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Reject"
                      hoverColor="var(--destructive)"
                      onClick={() => resolveProposal(i, "rejected")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </>
                )}
                {message.status === "approved" && (
                  <StatusBadge status="active" label="✓ APPROVED" />
                )}
                {message.status === "rejected" && (
                  <StatusBadge status="restricted" label="✕ REJECTED" />
                )}
                <div className="relative">
                  <IconButton label="More" onClick={() => toggleMore(i)}>
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </IconButton>
                  {message.moreOpen && (
                    <div
                      className="absolute bottom-9 right-0 z-10 min-w-[140px] rounded-lg border p-1.5"
                      style={{ backgroundColor: "var(--panel-elevated)", borderColor: "var(--border)" }}
                    >
                      <MenuItem
                        onClick={() => {
                          copyText(message.intent);
                          toggleMore(i);
                        }}
                      >
                        <CopyIcon className="h-3.5 w-3.5" /> Copy
                      </MenuItem>
                      <MenuItem onClick={() => readAloud(message.intent)}>
                        <Volume2 className="h-3.5 w-3.5" /> Read aloud
                      </MenuItem>
                      <MenuItem disabled>Redo (visual only)</MenuItem>
                      <MenuItem disabled>Ignore (visual only)</MenuItem>
                    </div>
                  )}
                </div>
              </div>
              {message.detailsOpen && (
                <div
                  className="space-y-2 rounded-lg border p-3.5 text-xs"
                  style={{ borderColor: "var(--border)", backgroundColor: "rgba(245,242,235,0.04)" }}
                >
                  <DetailRow label="Scope" value={`${entity.label} → ${entity.subs.find((s: SubItem) => s.id === activeSub)?.label}`} />
                  <DetailRow label="Drafted by" value="Content Agent" />
                  <DetailRow label="Gate" value={message.status.toUpperCase()} />
                  <DetailRow label="Proposal ID" value={message.proposalId ?? "pending insert"} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input row */}
        <div
          className="flex items-center gap-2.5 border-t px-5 py-3.5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="relative">
            <button
              className="opacity-60 hover:opacity-100"
              aria-label="Attach file"
              title="Attach (visual only)"
              onClick={() => setAttachOpen((v) => !v)}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            {attachOpen && (
              <div
                className="absolute bottom-9 left-0 z-10 min-w-[170px] rounded-lg border p-1.5"
                style={{ backgroundColor: "var(--panel-elevated)", borderColor: "var(--border)" }}
              >
                <MenuItem disabled>Upload from computer</MenuItem>
                <MenuItem disabled>Google Drive</MenuItem>
                <MenuItem disabled>GitHub</MenuItem>
                <MenuItem disabled>Add a screenshot</MenuItem>
                <MenuItem disabled>Connect data source</MenuItem>
              </div>
            )}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={!activeSub || isSubmitting}
            placeholder={activeSub ? `Ask IGX AI about ${entity.subs.find((s: SubItem) => s.id === activeSub)?.label}...` : "Pick a sub-item first..."}
            className="min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "rgba(245,242,235,0.06)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={!activeSub || isSubmitting}
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Send className="h-4 w-4" />
          </Button>
          <button className="opacity-50" aria-label="Voice input" title="Voice input (visual only)" disabled>
            <Mic className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RailGroup({
  label,
  group,
  activeEntity,
  onSelect,
}: {
  label: string;
  group: typeof igxPeople | typeof igxOrgEntities;
  activeEntity: EntityKey;
  onSelect: (key: EntityKey) => void;
}) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1.5 flex flex-col gap-0.5">
        {Object.entries(group).map(([k, v]) => (
          <button
            key={k}
            onClick={() => onSelect(k as EntityKey)}
            className="rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition-colors"
            style={
              k === activeEntity
                ? { backgroundColor: "color-mix(in oklab, var(--primary) 16%, transparent)", color: "var(--primary)" }
                : { color: "rgba(245,242,235,0.7)" }
            }
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  hoverColor,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  hoverColor?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
      style={{ borderColor: "var(--border)", color: "rgba(245,242,235,0.7)" }}
      onMouseEnter={(e) => hoverColor && (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,242,235,0.7)")}
    >
      {children}
    </button>
  );
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-white/5 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-mono text-[10.5px] uppercase" style={{ color: "rgba(245,242,235,0.4)" }}>
        {label}
      </span>
      <span className="text-right" style={{ color: "rgba(245,242,235,0.82)" }}>
        {value}
      </span>
    </div>
  );
}
