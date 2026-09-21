import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  Copy as CopyIcon,
  Eye,
  EyeOff,
  Loader2,
  Paperclip,
  Plus,
  Settings2,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import {
  AgentsPanel,
  ArchitecturePanel,
  BrandLibraryPanel,
  DecisionsPanel,
  EcosystemPanel,
  IgxTabBar,
  ModelsPanel,
  type IgxTabKey,
  type LiveStage,
} from "@/components/IgxShowcase";
import { supabase } from "@/lib/supabase";
import { igxPeople, igxOrgEntities, igxAllEntities } from "@/lib/portal-data";
import { brandFor, brandSrc } from "@/lib/brand-assets";
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
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap",
      },
    ],
  }),
  // ?entity=mandela | ifeoma | group | foundation | atelier | media — opens the chat
  // with that person/entity already chosen as the scope.
  validateSearch: (search: Record<string, unknown>): { entity?: string } => ({
    entity: typeof search.entity === "string" ? search.entity : undefined,
  }),
  component: IgxAi,
});

type EntityKey = keyof typeof igxAllEntities;
type SubItem = { id: string; label: string; pillar?: string };
type EntityGroup = Record<string, { label: string; state?: string; subs: SubItem[] }>;
type ProposalStatus = "pending_review" | "approved" | "rejected" | "error";

type ChatMessage = {
  id: string;
  scopeLabel: string;
  text: string;
  intent: string;
  proposalId: string | null;
  status: ProposalStatus;
  errorMessage?: string;
  detailsOpen: boolean;
};

type RecentProposal = { id: string; intent: string; status: string; created_at: string };

// Starter instructions. They only fill the box; nothing is sent until you press send.
const STARTERS = [
  "Draft this week's Foundation impact update",
  "Prepare an investor update for IJIDI Group",
  "Plan the next IJIDI Atelier collection",
  "Outline a launch plan for IJIDI Wild",
];

function greetingWord(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

// A round picture with a letter fallback (a missing file never leaves a hole).
function Avatar({
  src,
  label,
  className,
  bare = false,
}: {
  src?: string | null;
  label: string;
  className?: string;
  bare?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-semibold text-gold",
        !bare && "border border-gold/40 bg-gold/10",
        bare && !showImage && "border border-gold/40 bg-gold/10",
        className
      )}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={label}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        label.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function PickerChip({
  selected,
  label,
  logo,
  onClick,
}: {
  selected: boolean;
  label: string;
  logo?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12px] transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
        selected
          ? "border-gold bg-gold/15 text-foreground"
          : "border-gold/20 text-muted-foreground hover:border-gold/45 hover:text-foreground"
      )}
    >
      <Avatar src={logo} label={label} bare className="h-6 w-6 text-[10px]" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */
function IgxAi() {
  const { entity: entityParam } = Route.useSearch();
  const initialEntity: EntityKey | null =
    entityParam && entityParam in igxAllEntities ? (entityParam as EntityKey) : null;

  const [mode, setMode] = useState<"chat" | "settings">("chat");
  const [settingsTab, setSettingsTab] = useState<IgxTabKey>("ecosystem");

  // Chat
  const [scope, setScope] = useState<{ entity: EntityKey | null; sub: string | null }>({
    entity: initialEntity,
    sub: null,
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerEntity, setPickerEntity] = useState<EntityKey | null>(initialEntity);
  const [attachOpen, setAttachOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Requests queue (real proposals)
  const [queueOpen, setQueueOpen] = useState(false);
  const [recent, setRecent] = useState<RecentProposal[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const streamRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The governor's first name, for the greeting (from the real profile).
  const { data: displayName } = useQuery({
    queryKey: ["igx-display-name"],
    retry: 1,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      return ((data as { display_name?: string | null } | null)?.display_name as string | null) ?? null;
    },
  });
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;

  const peopleGroup: EntityGroup = igxPeople;
  const entityGroup: EntityGroup = igxOrgEntities;
  const scopeEntity = scope.entity ? igxAllEntities[scope.entity] : null;
  const scopeSub: SubItem | undefined = scopeEntity?.subs.find((s: SubItem) => s.id === scope.sub);
  const scopeLabel = scopeEntity
    ? scopeSub
      ? `${scopeEntity.label} › ${scopeSub.label}`
      : scopeEntity.label
    : "General";
  const scopeLogo = scopeSub
    ? brandSrc(brandFor(scopeSub.label)?.id ?? "") ?? brandSrc(brandFor(scopeEntity?.label)?.id ?? "")
    : scopeEntity
    ? brandSrc(brandFor(scopeEntity.label)?.id ?? "")
    : null;
  const pickerEntityData = pickerEntity ? igxAllEntities[pickerEntity] : null;

  // Loads the real queue: the pending count and the latest proposals, so requests
  // survive a refresh and can always be reviewed.
  const refreshQueue = async () => {
    const [pending, latest] = await Promise.all([
      supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("proposals")
        .select("id, intent, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    const failure = pending.error ?? latest.error;
    if (failure) {
      setQueueError(failure.message);
      return;
    }
    setQueueError(null);
    setPendingCount(pending.count ?? 0);
    setRecent((latest.data ?? []) as RecentProposal[]);
  };

  useEffect(() => {
    refreshQueue().finally(() => setQueueLoading(false));
  }, []);

  // Keep the newest message in view by scrolling the chat stream only, never the window.
  useEffect(() => {
    const el = streamRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Follow the ?entity= link if it changes while the page is open.
  useEffect(() => {
    if (entityParam && entityParam in igxAllEntities) {
      setScope({ entity: entityParam as EntityKey, sub: null });
      setPickerEntity(entityParam as EntityKey);
      setMode("chat");
    }
  }, [entityParam]);

  // Escape closes whatever is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPickerOpen(false);
      setAttachOpen(false);
      setQueueOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const growTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const chooseScope = (entity: EntityKey | null, sub: string | null) => {
    setScope({ entity, sub });
    setPickerOpen(false);
    textareaRef.current?.focus({ preventScroll: true });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isSubmitting) return;

    const prefix = scopeEntity
      ? scopeSub
        ? `[${scopeEntity.label} → ${scopeSub.label}]`
        : `[${scopeEntity.label}]`
      : "[General]";
    const intent = `${prefix} ${text}`;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setInput("");
    requestAnimationFrame(growTextarea);
    setIsSubmitting(true);
    setSubmitError(false);
    setMessages((prev) => [
      ...prev,
      { id, scopeLabel, text, intent, proposalId: null, status: "pending_review", detailsOpen: false },
    ]);

    const { data, error } = await supabase
      .from("proposals")
      .insert([
        {
          actor_type: "IGX_AI",
          source: "igx-ai-console",
          intent,
          suggested_action: `Evaluate and process request: "${text}"`,
          reasoning: "Pending intelligence routing.",
          status: "pending_review",
        },
      ])
      .select()
      .single();

    setMessages((prev) =>
      prev.map((m) =>
        m.id !== id
          ? m
          : error || !data
          ? { ...m, status: "error", errorMessage: error?.message ?? "The proposal was not saved." }
          : { ...m, proposalId: data.id }
      )
    );
    if (error || !data) setSubmitError(true);
    setIsSubmitting(false);
    requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
    if (!error) refreshQueue();
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

  const resolveProposal = async (id: string, nextStatus: "approved" | "rejected") => {
    if (busyId) return;
    setBusyId(id);
    setReviewError(null);
    const failure = await reviewProposal(id, nextStatus);
    if (failure) setReviewError(failure);
    setMessages((prev) =>
      prev.map((m) =>
        m.proposalId !== id
          ? m
          : failure
          ? { ...m, errorMessage: failure }
          : { ...m, status: nextStatus, errorMessage: undefined }
      )
    );
    setBusyId(null);
    refreshQueue();
  };

  const toggleDetails = (id: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, detailsOpen: !m.detailsOpen } : m)));

  const readAloud = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      return;
    }
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setSubmitError(false);
    requestAnimationFrame(growTextarea);
  };

  // Console state for the orb in settings, from what is really happening.
  const liveStage: LiveStage = isSubmitting
    ? { key: "submitting", name: "Submitting", detail: "Writing the proposal to the database" }
    : submitError
    ? { key: "error", name: "Error", detail: "The last request failed" }
    : queueError
    ? { key: "error", name: "Unavailable", detail: "Could not read the pending queue" }
    : (pendingCount ?? 0) > 0
    ? {
        key: "awaiting",
        name: "Awaiting review",
        detail: `${pendingCount} ${pendingCount === 1 ? "proposal is" : "proposals are"} waiting for your decision`,
      }
    : { key: "idle", name: "Idle", detail: "No request in flight" };

  // Where each picture is shown by this page, for the Brand library.
  const brandUsage: Record<string, string[]> = { igx: ["IGX AI chat and orb"], mandela: ["IGX AI chat avatar"] };
  const noteUse = (label: string | undefined) => {
    const asset = brandFor(label);
    if (!asset?.src) return;
    const list = (brandUsage[asset.id] ??= []);
    if (!list.includes("IGX AI scope picker")) list.push("IGX AI scope picker");
  };
  [...Object.values(peopleGroup), ...Object.values(entityGroup)].forEach((item) => {
    noteUse(item.label);
    item.subs.forEach((sub) => noteUse(sub.label));
  });

  const mandelaAvatar = brandSrc("mandela");
  const igxAvatar = brandSrc("igx");
  const empty = messages.length === 0;

  /* ---------------- composer (used centred when empty, docked otherwise) ---------------- */
  const composer = (below: boolean) => (
    <div className="w-full">
      <div className="igx-composer p-3 sm:p-4">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          disabled={isSubmitting}
          onChange={(e) => {
            setInput(e.target.value);
            growTextarea();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          aria-label="Instruction for IGX AI"
          placeholder={
            scopeEntity ? `Give IGX AI an instruction about ${scopeLabel}…` : "Give IGX AI an instruction…"
          }
          className="max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <div className="mt-1 flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAttachOpen((v) => !v);
                setPickerOpen(false);
              }}
              aria-label="Attach"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>
            {attachOpen && (
              <div
                className={cn(
                  "absolute left-0 z-50 w-56 space-y-1 rounded-xl border border-gold/25 bg-black/80 p-2 font-mono text-xs shadow-lg backdrop-blur-md",
                  below ? "top-full mt-2" : "bottom-full mb-2"
                )}
              >
                <button type="button" disabled className="flex w-full rounded px-3 py-2 text-left disabled:opacity-40">
                  Attach a document · soon
                </button>
                <button type="button" disabled className="flex w-full rounded px-3 py-2 text-left disabled:opacity-40">
                  Attach the activity log · soon
                </button>
              </div>
            )}
          </div>

          {/* Scope: who or what the instruction is about */}
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => {
                setPickerOpen((v) => !v);
                setAttachOpen(false);
              }}
              aria-expanded={pickerOpen}
              className="flex max-w-full items-center gap-2 rounded-full border border-gold/25 bg-black/25 py-1 pl-1.5 pr-3 text-[12px] text-foreground transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
            >
              <Avatar src={scopeLogo} label={scopeLabel} bare className="h-6 w-6 text-[10px]" />
              <span className="truncate">{scopeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>

            {pickerOpen && (
              <div
                className={cn(
                  "absolute left-0 z-50 w-[min(560px,88vw)] rounded-2xl border border-gold/25 bg-black/85 p-4 shadow-2xl backdrop-blur-xl",
                  below ? "top-full mt-2" : "bottom-full mb-2"
                )}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Who or what is this about?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PickerChip
                    selected={!scope.entity}
                    label="General"
                    onClick={() => {
                      setPickerEntity(null);
                      chooseScope(null, null);
                    }}
                  />
                  {[...Object.entries(peopleGroup), ...Object.entries(entityGroup)].map(([key, item]) => (
                    <PickerChip
                      key={key}
                      selected={pickerEntity === key}
                      label={item.label}
                      logo={brandSrc(brandFor(item.label)?.id ?? "")}
                      onClick={() => setPickerEntity(key as EntityKey)}
                    />
                  ))}
                </div>

                {pickerEntityData && (
                  <>
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {pickerEntityData.label} · module
                    </p>
                    <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                      <PickerChip
                        selected={scope.entity === pickerEntity && !scope.sub}
                        label={`Whole ${pickerEntityData.label}`}
                        logo={brandSrc(brandFor(pickerEntityData.label)?.id ?? "")}
                        onClick={() => chooseScope(pickerEntity, null)}
                      />
                      {pickerEntityData.subs.map((sub: SubItem) => (
                        <PickerChip
                          key={sub.id}
                          selected={scope.entity === pickerEntity && scope.sub === sub.id}
                          label={sub.label}
                          logo={brandSrc(brandFor(sub.label)?.id ?? "")}
                          onClick={() => chooseScope(pickerEntity, sub.id)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || isSubmitting}
            aria-label="Send"
            className="igx-send ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#15120a] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:cursor-default disabled:opacity-40 disabled:hover:scale-100"
          >
            {isSubmitting ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
      <p className="mt-2 text-center font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
        IGX AI saves your instruction as a proposal for your review. No model is connected yet.
      </p>
    </div>
  );

  /* ---------------- settings ---------------- */
  if (mode === "settings") {
    return (
      <div className="space-y-6">
        <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Avatar src={igxAvatar} label="IGX" className="h-12 w-12 text-lg" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">IGX AI</p>
              <h1 className="font-display text-xl font-semibold text-foreground">Settings</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMode("chat")}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-black/25 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to chat
          </button>
        </GlassCard>

        <IgxTabBar active={settingsTab} onChange={setSettingsTab} />

        {settingsTab === "ecosystem" && (
          <EcosystemPanel
            live={liveStage}
            pendingCount={pendingCount}
            pendingLoading={queueLoading}
            pendingError={!!queueError}
            onOpenQueue={() => {
              setMode("chat");
              setQueueOpen(true);
            }}
          />
        )}
        {settingsTab === "architecture" && <ArchitecturePanel />}
        {settingsTab === "decisions" && <DecisionsPanel />}
        {settingsTab === "agents" && <AgentsPanel />}
        {settingsTab === "models" && <ModelsPanel />}
        {settingsTab === "brand" && <BrandLibraryPanel usage={brandUsage} />}
      </div>
    );
  }

  /* ---------------- chat ---------------- */
  return (
    <div className="igx-chat mx-auto flex h-[calc(100dvh-15rem)] min-h-[560px] w-full max-w-3xl flex-col">
      <style>{`
        @property --igx-a { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @keyframes igxSpin { to { --igx-a: 360deg; } }
        @keyframes igxRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes igxBreathe { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .95; transform: scale(1.06); } }

        .igx-chat .igx-wordmark { font-family: "Cormorant Garamond", "Fraunces", Georgia, serif; font-weight: 600;
          font-size: clamp(34px, 5vw, 46px); line-height: 1; letter-spacing: .5px; }
        .igx-chat .igx-wordmark span { color: #5E9BFF; }

        .igx-chat .igx-emblem { position: relative; width: 96px; height: 96px; }
        .igx-chat .igx-emblem::before { content: ""; position: absolute; inset: -7px; border-radius: 50%;
          background: conic-gradient(from var(--igx-a), transparent 0 55%, #C6A15B, #5E9BFF, transparent);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));
          animation: igxSpin 7s linear infinite; }
        .igx-chat .igx-emblem::after { content: ""; position: absolute; inset: -34px; z-index: -1; border-radius: 50%;
          background: radial-gradient(circle, rgba(94,155,255,.24), rgba(198,161,91,.10) 45%, transparent 68%);
          animation: igxBreathe 4.5s ease-in-out infinite; }

        .igx-chat .igx-composer { position: relative; border-radius: 24px; border: 1px solid transparent;
          background: linear-gradient(rgba(9,12,20,.74), rgba(7,9,15,.8)) padding-box,
                      linear-gradient(135deg, rgba(198,161,91,.5), rgba(79,134,247,.4)) border-box;
          backdrop-filter: blur(10px) saturate(140%); -webkit-backdrop-filter: blur(10px) saturate(140%);
          box-shadow: 0 18px 50px rgba(0,0,0,.45); transition: box-shadow .3s ease; }
        .igx-chat .igx-composer:focus-within { box-shadow: 0 18px 60px rgba(79,134,247,.2), 0 0 0 1px rgba(198,161,91,.12);
          background: linear-gradient(rgba(9,12,20,.8), rgba(7,9,15,.86)) padding-box,
                      conic-gradient(from var(--igx-a), #C6A15B, #4F86F7, #E3C27A, #5E9BFF, #C6A15B) border-box;
          animation: igxSpin 6s linear infinite; }

        .igx-chat .igx-send { background: linear-gradient(135deg, #E3C27A, #C6A15B 55%, #A98443);
          box-shadow: 0 6px 18px rgba(198,161,91,.35); }
        .igx-chat .igx-rise { animation: igxRise .5s cubic-bezier(.22,1,.36,1) both; }
        .igx-chat .igx-chip { transition: transform .2s ease, border-color .2s ease, background .2s ease; }
        .igx-chat .igx-chip:hover { transform: translateY(-2px); }

        @media (prefers-reduced-motion: reduce) {
          .igx-chat .igx-emblem::before, .igx-chat .igx-emblem::after,
          .igx-chat .igx-composer:focus-within, .igx-chat .igx-rise { animation: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={newChat}
          className="flex items-center gap-2 rounded-full border border-gold/25 bg-black/25 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
        >
          <Plus className="h-3.5 w-3.5 text-gold" /> New chat
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQueueOpen(true)}
            className="flex items-center gap-2 rounded-full border border-gold/25 bg-black/25 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            <Clock className="h-3.5 w-3.5 text-gold" /> Requests
            {!queueLoading && !queueError && (pendingCount ?? 0) > 0 && (
              <span className="rounded-full bg-gold px-1.5 py-px text-[10px] font-bold text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMode("settings")}
            aria-label="IGX AI settings"
            title="IGX AI settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-black/25 text-gold transition-colors hover:border-gold/50 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {empty ? (
        /* Empty state: greeting and composer, centred */
        <div className="flex flex-1 flex-col items-center justify-center px-1 pb-6">
          <div className="igx-emblem igx-rise">
            <Avatar src={igxAvatar} label="IGX" bare className="h-full w-full border-0 text-3xl" />
          </div>
          <h1 className="igx-wordmark igx-rise mt-6" style={{ animationDelay: ".08s" }}>
            IG<span>X</span>
          </h1>
          <p
            className="igx-rise mt-3 text-center font-display text-2xl text-foreground sm:text-[28px]"
            style={{ animationDelay: ".14s" }}
          >
            {greetingWord()}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <p
            className="igx-rise mt-2 max-w-md text-center text-sm text-muted-foreground"
            style={{ animationDelay: ".2s" }}
          >
            Tell IGX AI what needs doing. It becomes a proposal, and nothing runs without your
            decision.
          </p>
          <div className="igx-rise mt-7 w-full max-w-2xl" style={{ animationDelay: ".26s" }}>
            {composer(true)}
          </div>
          <div
            className="igx-rise mt-5 flex max-w-2xl flex-wrap justify-center gap-2"
            style={{ animationDelay: ".32s" }}
          >
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => {
                  setInput(starter);
                  requestAnimationFrame(() => {
                    growTextarea();
                    textareaRef.current?.focus({ preventScroll: true });
                  });
                }}
                className="igx-chip flex items-center gap-1.5 rounded-full border border-gold/20 bg-black/25 px-3.5 py-2 text-[12px] text-muted-foreground hover:border-gold/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                {starter}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Conversation: scrolls on its own, never the whole page */}
          <div ref={streamRef} className="flex-1 space-y-7 overflow-y-auto px-1 pb-4 pt-2">
            {messages.map((msg) => (
              <div key={msg.id} className="igx-rise space-y-4">
                {/* You */}
                <div className="flex flex-row-reverse items-start gap-3">
                  <Avatar src={mandelaAvatar} label={firstName ?? "You"} className="h-9 w-9 text-sm" />
                  <div className="max-w-[85%]">
                    <p className="mb-1 text-right font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      {msg.scopeLabel}
                    </p>
                    <div className="rounded-2xl rounded-tr-md border border-gold/25 bg-gold/10 px-4 py-3 text-[14.5px] leading-relaxed text-foreground">
                      {msg.text}
                    </div>
                  </div>
                </div>

                {/* IGX AI */}
                <div className="flex items-start gap-3">
                  <Avatar src={igxAvatar} label="IGX" bare className="h-9 w-9 text-sm" />
                  <div className="max-w-[88%] space-y-3 rounded-2xl rounded-tl-md border border-white/10 bg-black/25 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[14px] leading-relaxed text-foreground">
                        {msg.status === "error"
                          ? "I could not save that request."
                          : !msg.proposalId
                          ? "Saving your request…"
                          : msg.status === "approved"
                          ? "Approved and recorded. Execution is not connected yet, so nothing runs automatically."
                          : msg.status === "rejected"
                          ? "Rejected and recorded."
                          : "Saved as a proposal. It is waiting for your decision, and nothing runs until you approve."}
                      </p>
                      {msg.proposalId || msg.status === "error" ? <StatusBadge status={msg.status} /> : null}
                    </div>

                    {msg.errorMessage && (
                      <div className="flex items-center gap-2 font-mono text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{msg.errorMessage}</span>
                      </div>
                    )}

                    {msg.status === "pending_review" && msg.proposalId && (
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          disabled={!!busyId}
                          onClick={() => resolveProposal(msg.proposalId as string, "approved")}
                          className="gap-2"
                        >
                          {busyId === msg.proposalId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}{" "}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!busyId}
                          onClick={() => resolveProposal(msg.proposalId as string, "rejected")}
                          className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}

                    {msg.detailsOpen && (
                      <div className="space-y-1 rounded-lg border border-gold/15 bg-black/25 p-3 font-mono text-xs text-muted-foreground">
                        <div>Proposal ID: {msg.proposalId || "Saving..."}</div>
                        <div>Status: {msg.status}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => toggleDetails(msg.id)}
                        aria-label="Toggle details"
                        className="rounded p-1.5 hover:text-foreground"
                      >
                        {msg.detailsOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(msg.intent)}
                        aria-label="Copy request"
                        className="rounded p-1.5 hover:text-foreground"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => readAloud(msg.text)}
                        aria-label="Read aloud"
                        className="rounded p-1.5 hover:text-foreground"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2">{composer(false)}</div>
        </>
      )}

      {/* Requests queue: real proposals, newest first */}
      {queueOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Requests">
          <button
            type="button"
            aria-label="Close requests"
            onClick={() => setQueueOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[400px] max-w-[92vw] flex-col border-l border-gold/25 bg-[#080b12]/92 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Requests</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {queueLoading
                    ? "Loading…"
                    : queueError
                    ? "Unavailable"
                    : `${pendingCount ?? 0} waiting for your decision`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQueueOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 text-gold hover:bg-gold/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {reviewError && (
                <div className="flex items-center gap-2 font-mono text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}
              {queueError ? (
                <p className="font-mono text-xs text-destructive">Could not load the queue: {queueError}</p>
              ) : !queueLoading && recent.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">No requests yet.</p>
              ) : (
                recent.map((item) => {
                  const pending = item.status === "pending_review";
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border border-l-2 bg-black/25 p-3",
                        pending ? "border-gold/25 border-l-primary" : "border-white/10 border-l-white/25"
                      )}
                    >
                      <p className="text-[13px] leading-snug text-foreground">{item.intent}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatDateTime(item.created_at)}
                        </span>
                        {pending ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={!!busyId}
                              onClick={() => resolveProposal(item.id, "approved")}
                              className="h-8 gap-1.5"
                            >
                              {busyId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}{" "}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!busyId}
                              onClick={() => resolveProposal(item.id, "rejected")}
                              className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                            {item.status.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
