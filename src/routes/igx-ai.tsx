import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy as CopyIcon,
  Eye,
  EyeOff,
  History,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
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
  IGX_TABS,
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

type Conversation = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };
type RecentProposal = { id: string; intent: string; status: string; created_at: string };

// Where the user is: back / forward move through these.
type ViewState = { mode: "chat" | "settings"; tab: IgxTabKey; chatId: string | null };
type DrawerKind = "chats" | "requests" | null;

// Chats live in Supabase (igx_conversations / igx_messages). Chats saved in this browser
// before that existed are copied across once (HISTORY_KEY is only read for that).
const HISTORY_KEY = "ijidi_igx_chats";
const IMPORT_FLAG = "ijidi_igx_chats_imported";
const MAX_CHATS = 30;
// Pinned chats are remembered on this device only (the database has no pin column).
const PIN_KEY = "ijidi_igx_pins";

// Which heading a chat sits under in the chat panel.
function chatGroupLabel(ts: number): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  if (ts >= startOfToday) return "Today";
  if (ts >= startOfToday - day) return "Yesterday";
  if (ts >= startOfToday - 7 * day) return "Previous 7 days";
  return "Older";
}
const MAX_MESSAGES = 100;

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

function formatDateTime(value?: string | number): string {
  if (value === undefined || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asProposalStatus(status: string): ProposalStatus {
  return status === "approved" || status === "rejected" ? status : "pending_review";
}

// A saved chat can hold a request that never finished saving (tab closed mid-send).
// Say so instead of leaving it on "Saving…" forever.
function normalizeConversation(raw: unknown): Conversation | null {
  const c = raw as Partial<Conversation> | null;
  if (!c || typeof c.id !== "string" || !Array.isArray(c.messages)) return null;
  const messages = (c.messages as ChatMessage[]).map((m) =>
    !m.proposalId && m.status !== "error"
      ? { ...m, status: "error" as const, errorMessage: "This request did not finish saving." }
      : m
  );
  return {
    id: c.id,
    title: typeof c.title === "string" && c.title ? c.title : "Chat",
    updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : Date.now(),
    messages,
  };
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

type DbConversation = { id: string; title: string; updated_at: string };
type DbMessage = {
  id: string;
  conversation_id: string;
  scope_label: string;
  text: string;
  proposal_id: string | null;
  created_at: string;
};

// Reads the governor's chats, newest first. Row-level security limits this to their own.
// Returns null if the database could not be read.
async function loadHistory(): Promise<Conversation[] | null> {
  const convRes = await supabase
    .from("igx_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_CHATS);
  if (convRes.error) return null;
  const convs = (convRes.data ?? []) as DbConversation[];
  if (convs.length === 0) return [];

  const msgRes = await supabase
    .from("igx_messages")
    .select("id, conversation_id, scope_label, text, proposal_id, created_at")
    .in("conversation_id", convs.map((c) => c.id))
    .order("created_at", { ascending: true });
  if (msgRes.error) return null;
  const msgs = (msgRes.data ?? []) as DbMessage[];

  // The status of each request always comes from its proposal, never from a copy.
  const proposalIds = Array.from(
    new Set(msgs.map((m) => m.proposal_id).filter((id): id is string => !!id))
  );
  const proposals = new Map<string, { intent: string; status: string }>();
  if (proposalIds.length > 0) {
    const propRes = await supabase.from("proposals").select("id, intent, status").in("id", proposalIds);
    if (!propRes.error) {
      (propRes.data ?? []).forEach((row) =>
        proposals.set(row.id as string, { intent: row.intent as string, status: row.status as string })
      );
    }
  }

  return convs.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: Date.parse(c.updated_at) || Date.now(),
    messages: msgs
      .filter((m) => m.conversation_id === c.id)
      .map((m): ChatMessage => {
        const proposal = m.proposal_id ? proposals.get(m.proposal_id) : undefined;
        return {
          id: m.id,
          scopeLabel: m.scope_label,
          text: m.text,
          intent: proposal?.intent ?? `[${m.scope_label}] ${m.text}`,
          proposalId: m.proposal_id,
          status: m.proposal_id ? asProposalStatus(proposal?.status ?? "pending_review") : "error",
          errorMessage: m.proposal_id ? undefined : "This request has no saved proposal.",
          detailsOpen: false,
        };
      }),
  }));
}

// One-time copy of chats saved in this browser into the database. Returns true if it
// copied something. The flag is set only after every insert succeeded.
async function importLocalChats(): Promise<boolean> {
  try {
    if (window.localStorage.getItem(IMPORT_FLAG)) return false;
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const local = (Array.isArray(parsed) ? parsed : [])
      .map(normalizeConversation)
      .filter((c): c is Conversation => c !== null);
    if (local.length === 0) {
      window.localStorage.setItem(IMPORT_FLAG, "1");
      return false;
    }

    const convRows = local.map((c) => ({
      id: isUuid(c.id) ? c.id : newId(),
      title: c.title,
      created_at: new Date(c.updatedAt).toISOString(),
      updated_at: new Date(c.updatedAt).toISOString(),
    }));

    // Only link proposals that still exist.
    const wanted = Array.from(
      new Set(local.flatMap((c) => c.messages.map((m) => m.proposalId).filter((id): id is string => !!id)))
    );
    const existing = new Set<string>();
    if (wanted.length > 0) {
      const { data } = await supabase.from("proposals").select("id").in("id", wanted);
      (data ?? []).forEach((row) => existing.add(row.id as string));
    }

    const msgRows = local.flatMap((c, i) =>
      c.messages
        .filter((m) => m.proposalId) // requests that never saved are not worth keeping
        .map((m) => ({
          id: isUuid(m.id) ? m.id : newId(),
          conversation_id: convRows[i].id,
          scope_label: m.scopeLabel,
          text: m.text,
          proposal_id: m.proposalId && existing.has(m.proposalId) ? m.proposalId : null,
          created_at: new Date(c.updatedAt).toISOString(),
        }))
    );

    const convInsert = await supabase.from("igx_conversations").insert(convRows);
    if (convInsert.error) return false;
    if (msgRows.length > 0) {
      const msgInsert = await supabase.from("igx_messages").insert(msgRows);
      if (msgInsert.error) return false;
    }
    window.localStorage.setItem(IMPORT_FLAG, "1");
    return true;
  } catch {
    return false;
  }
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

// The close button every pop-up carries.
function CloseX({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/25 text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
    >
      <X className="h-3.5 w-3.5" />
    </button>
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

const pillButton =
  "flex items-center gap-2 rounded-full border border-gold/25 bg-black/25 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60";

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */
function IgxAi() {
  const { entity: entityParam } = Route.useSearch();
  const initialEntity: EntityKey | null =
    entityParam && entityParam in igxAllEntities ? (entityParam as EntityKey) : null;

  // Navigation: a stack of views, so back / forward work like a browser's.
  const [stack, setStack] = useState<ViewState[]>([{ mode: "chat", tab: "ecosystem", chatId: null }]);
  const [idx, setIdx] = useState(0);
  const view = stack[idx];
  const mode = view.mode;
  const settingsTab = view.tab;
  const activeId = view.chatId;

  // Saved chats (this browser)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);
  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConv?.messages ?? [];

  // Composer
  const [scope, setScope] = useState<{ entity: EntityKey | null; sub: string | null }>({
    entity: initialEntity,
    sub: null,
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerEntity, setPickerEntity] = useState<EntityKey | null>(initialEntity);
  const [attachOpen, setAttachOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Drawer: chats and requests
  const [drawer, setDrawer] = useState<DrawerKind>(null);

  // Chat panel: search, rename, pin, delete confirmation
  const [chatQuery, setChatQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PIN_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPinnedIds(parsed.filter((x): x is string => typeof x === "string"));
      }
    } catch {
      /* pins are only a convenience */
    }
  }, []);
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

  /* ---------------- navigation ---------------- */
  const go = (next: ViewState) => {
    setStack((prev) => [...prev.slice(0, idx + 1), next]);
    setIdx(idx + 1);
  };
  const replaceView = (next: ViewState) =>
    setStack((prev) => prev.map((v, i) => (i === idx ? next : v)));

  const viewLabel = (v: ViewState): string =>
    v.mode === "settings"
      ? `Settings › ${IGX_TABS.find((t) => t.key === v.tab)?.label ?? ""}`
      : v.chatId
      ? conversations.find((c) => c.id === v.chatId)?.title ?? "Chat"
      : "New chat";

  const canBack = idx > 0;
  const canForward = idx < stack.length - 1;

  const navArrows = (
    <div className="flex items-center gap-1" role="group" aria-label="History navigation">
      <button
        type="button"
        disabled={!canBack}
        onClick={() => setIdx(idx - 1)}
        aria-label="Back"
        title={canBack ? `Back to: ${viewLabel(stack[idx - 1])}` : "Nothing to go back to"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-black/25 text-gold transition-colors hover:border-gold/50 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-black/25"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span
        title={`You are here: ${viewLabel(view)}`}
        className="hidden max-w-[190px] truncate px-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground md:inline"
      >
        {viewLabel(view)}
      </span>
      <button
        type="button"
        disabled={!canForward}
        onClick={() => setIdx(idx + 1)}
        aria-label="Forward"
        title={canForward ? `Forward to: ${viewLabel(stack[idx + 1])}` : "Nothing to go forward to"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-black/25 text-gold transition-colors hover:border-gold/50 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-black/25"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  /* ---------------- saved chats ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await importLocalChats();
      const loaded = await loadHistory();
      if (cancelled) return;
      if (loaded) setConversations(loaded);
      else setHistoryNotice("Could not load your saved chats from the database.");
      setHistoryLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateConversation = (id: string, fn: (c: Conversation) => Conversation) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  const deleteConversation = async (id: string) => {
    const removed = conversations.find((c) => c.id === id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setStack((prev) => prev.map((v) => (v.chatId === id ? { ...v, chatId: null } : v)));
    const { error } = await supabase.from("igx_conversations").delete().eq("id", id);
    if (error) {
      if (removed) setConversations((prev) => [removed, ...prev]);
      setHistoryNotice(`Could not delete that chat: ${error.message}`);
    }
  };

  const removeChat = async (id: string) => {
    setConfirmDeleteId(null);
    setPinnedIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((x) => x !== id);
      try {
        window.localStorage.setItem(PIN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    await deleteConversation(id);
  };

  // Rename. The new title shows at once and is put back if the database refuses it.
  const renameConversation = async (id: string, rawTitle: string) => {
    const title = rawTitle.trim().slice(0, 80);
    setRenamingId(null);
    const current = conversations.find((c) => c.id === id);
    if (!title || !current || title === current.title) return;
    const previous = current.title;
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    const { data, error } = await supabase
      .from("igx_conversations")
      .update({ title })
      .eq("id", id)
      .select("id");
    if (error || (data?.length ?? 0) === 0) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: previous } : c)));
      setHistoryNotice(`Could not rename that chat${error ? `: ${error.message}` : "."}`);
    }
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        window.localStorage.setItem(PIN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const openConversation = (id: string) => {
    go({ mode: "chat", tab: view.tab, chatId: id });
    setDrawer(null);
  };

  const newChat = () => {
    if (mode === "chat" && !activeId) {
      textareaRef.current?.focus({ preventScroll: true });
      return;
    }
    go({ mode: "chat", tab: view.tab, chatId: null });
    setInput("");
    setSubmitError(false);
    requestAnimationFrame(growTextarea);
  };

  // When a saved chat is opened, refresh its request statuses from the database.
  useEffect(() => {
    if (!historyLoaded || !activeConv) return;
    const ids = activeConv.messages
      .filter((m) => m.proposalId && m.status === "pending_review")
      .map((m) => m.proposalId as string);
    if (ids.length === 0) return;
    let cancelled = false;
    supabase
      .from("proposals")
      .select("id, status")
      .in("id", ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const latest = new Map(data.map((row) => [row.id as string, row.status as string]));
        updateConversation(activeConv.id, (c) => ({
          ...c,
          messages: c.messages.map((m) => {
            const status = m.proposalId ? latest.get(m.proposalId) : undefined;
            return status && status !== "pending_review" ? { ...m, status: asProposalStatus(status) } : m;
          }),
        }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, historyLoaded]);

  /* ---------------- the real queue ---------------- */
  // Loads the pending count and the latest proposals, so requests survive a
  // refresh and can always be reviewed.
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
    }
  }, [entityParam]);

  // Escape closes whatever is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPickerOpen(false);
      setAttachOpen(false);
      setDrawer(null);
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

  /* ---------------- sending and reviewing ---------------- */
  const send = async () => {
    const text = input.trim();
    if (!text || isSubmitting) return;

    const prefix = scopeEntity
      ? scopeSub
        ? `[${scopeEntity.label} → ${scopeSub.label}]`
        : `[${scopeEntity.label}]`
      : "[General]";
    const intent = `${prefix} ${text}`;
    const msgId = newId();
    const message: ChatMessage = {
      id: msgId,
      scopeLabel,
      text,
      intent,
      proposalId: null,
      status: "pending_review",
      detailsOpen: false,
    };

    // Add to the open chat, or start a new one.
    const existingId = activeId && conversations.some((c) => c.id === activeId) ? activeId : null;
    const cid = existingId ?? newId();
    const isNew = !existingId;
    const title = text.length > 50 ? `${text.slice(0, 50)}…` : text;
    if (existingId) {
      updateConversation(cid, (c) => ({
        ...c,
        updatedAt: Date.now(),
        messages: [...c.messages, message].slice(-MAX_MESSAGES),
      }));
    } else {
      const conversation: Conversation = { id: cid, title, updatedAt: Date.now(), messages: [message] };
      setConversations((prev) => [conversation, ...prev].slice(0, MAX_CHATS));
      replaceView({ ...view, mode: "chat", chatId: cid });
    }

    setInput("");
    requestAnimationFrame(growTextarea);
    setIsSubmitting(true);
    setSubmitError(false);

    // A new chat needs its row before its first message can be saved.
    let historyOk = true;
    if (isNew) {
      const convInsert = await supabase.from("igx_conversations").insert({ id: cid, title });
      if (convInsert.error) {
        historyOk = false;
        setHistoryNotice(`This chat could not be saved to your history: ${convInsert.error.message}`);
      }
    }

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

    updateConversation(cid, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.id !== msgId
          ? m
          : error || !data
          ? { ...m, status: "error", errorMessage: error?.message ?? "The proposal was not saved." }
          : { ...m, proposalId: data.id }
      ),
    }));
    if (error || !data) setSubmitError(true);

    // Save the message to the chat, linked to its proposal.
    if (historyOk) {
      const msgInsert = await supabase.from("igx_messages").insert({
        id: msgId,
        conversation_id: cid,
        scope_label: scopeLabel,
        text,
        proposal_id: data?.id ?? null,
      });
      if (msgInsert.error) {
        setHistoryNotice(`This message could not be saved to your history: ${msgInsert.error.message}`);
      } else if (!isNew) {
        await supabase
          .from("igx_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", cid);
      }
    }

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
    // Keep every saved chat in step with the database.
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.proposalId !== id
            ? m
            : failure
            ? { ...m, errorMessage: failure }
            : { ...m, status: nextStatus, errorMessage: undefined }
        ),
      }))
    );
    setBusyId(null);
    refreshQueue();
  };

  const toggleDetails = (id: string) => {
    if (!activeConv) return;
    updateConversation(activeConv.id, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === id ? { ...m, detailsOpen: !m.detailsOpen } : m)),
    }));
  };

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
  const popoverOpen = pickerOpen || attachOpen;
  const closePopovers = () => {
    setPickerOpen(false);
    setAttachOpen(false);
  };

  /* ---------------- composer (used centred when empty, docked otherwise) ---------------- */
  const composer = (below: boolean) => (
    <div className="w-full">
      <div className={cn("igx-composer p-3 sm:p-4", popoverOpen && "z-50")}>
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
                  "absolute left-0 z-[60] w-60 rounded-xl border border-gold/25 bg-black/85 p-3 shadow-lg backdrop-blur-md",
                  below ? "top-full mt-2" : "bottom-full mb-2"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Attach</span>
                  <CloseX onClick={() => setAttachOpen(false)} label="Close attach menu" />
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <button type="button" disabled className="flex w-full rounded px-2 py-2 text-left disabled:opacity-40">
                    Attach a document · soon
                  </button>
                  <button type="button" disabled className="flex w-full rounded px-2 py-2 text-left disabled:opacity-40">
                    Attach the activity log · soon
                  </button>
                </div>
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
                  "absolute left-0 z-[60] w-[min(560px,88vw)] rounded-2xl border border-gold/25 bg-black/90 p-4 shadow-2xl backdrop-blur-xl",
                  below ? "top-full mt-2" : "bottom-full mb-2"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Who or what is this about?
                  </p>
                  <CloseX onClick={() => setPickerOpen(false)} label="Close scope picker" />
                </div>
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

          <div className="ml-auto flex items-center gap-1.5">
            {/* Voice: placeholder until speech input exists */}
            <button
              type="button"
              disabled
              aria-label="Voice input (coming soon)"
              title="Voice input — coming soon"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground opacity-50"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || isSubmitting}
              aria-label="Send"
              className="igx-send flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#15120a] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:cursor-default disabled:opacity-40 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              )}
            </button>
          </div>
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
          <div className="flex flex-wrap items-center gap-2">
            {navArrows}
            <button
              type="button"
              onClick={() => go({ mode: "chat", tab: view.tab, chatId: view.chatId })}
              className={pillButton}
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gold" /> Back to chat
            </button>
          </div>
        </GlassCard>

        <IgxTabBar active={settingsTab} onChange={(tab) => go({ ...view, tab })} />

        {settingsTab === "ecosystem" && (
          <EcosystemPanel
            live={liveStage}
            pendingCount={pendingCount}
            pendingLoading={queueLoading}
            pendingError={!!queueError}
            onOpenQueue={() => {
              go({ mode: "chat", tab: view.tab, chatId: view.chatId });
              setDrawer("requests");
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
  const sortedChats = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const chatSearch = chatQuery.trim().toLowerCase();
  const visibleChats = chatSearch
    ? sortedChats.filter(
        (c) =>
          c.title.toLowerCase().includes(chatSearch) ||
          c.messages.some((m) => m.text.toLowerCase().includes(chatSearch))
      )
    : sortedChats;
  const chatGroups: { label: string; chats: Conversation[] }[] = [];
  const pinnedVisible = visibleChats.filter((c) => pinnedIds.includes(c.id));
  if (pinnedVisible.length > 0) chatGroups.push({ label: "Pinned", chats: pinnedVisible });
  visibleChats
    .filter((c) => !pinnedIds.includes(c.id))
    .forEach((c) => {
      const label = chatGroupLabel(c.updatedAt);
      const found = chatGroups.find((g) => g.label === label);
      if (found) found.chats.push(c);
      else chatGroups.push({ label, chats: [c] });
    });

  const rowIcon =
    "flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60";

  const renderChatRow = (chat: Conversation) => {
    const active = chat.id === activeId;
    const pinned = pinnedIds.includes(chat.id);

    if (renamingId === chat.id) {
      return (
        <div key={chat.id} className="rounded-xl border border-gold/50 bg-black/40 p-2">
          <input
            autoFocus
            value={renameValue}
            maxLength={80}
            aria-label="Chat name"
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") renameConversation(chat.id, renameValue);
              if (e.key === "Escape") setRenamingId(null);
            }}
            className="h-8 w-full rounded-lg border border-gold/25 bg-black/40 px-2.5 text-[13px] text-foreground focus-visible:border-gold/60 focus-visible:outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setRenamingId(null)}
              className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => renameConversation(chat.id, renameValue)}
              className="rounded-full bg-gold px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    if (confirmDeleteId === chat.id) {
      return (
        <div key={chat.id} className="rounded-xl border border-destructive/40 bg-destructive/10 p-2.5">
          <p className="truncate text-[12.5px] text-foreground">Delete “{chat.title}”?</p>
          <p className="mt-0.5 font-mono text-[9.5px] text-muted-foreground">
            The chat is removed. Requests already sent stay in the queue.
          </p>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={() => removeChat(chat.id)}
              className="rounded-full border border-destructive/50 bg-destructive/20 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60"
            >
              Delete
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={chat.id}
        className={cn(
          "group flex items-center rounded-xl border-l-2 pr-1 transition-colors",
          active ? "border-l-gold bg-gold/10" : "border-l-transparent hover:bg-white/5"
        )}
      >
        <button
          type="button"
          onClick={() => openConversation(chat.id)}
          title={chat.title}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
        >
          {pinned ? (
            <Pin className="h-3.5 w-3.5 shrink-0 text-gold" />
          ) : (
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-[13px] text-foreground">{chat.title}</span>
            <span className="block font-mono text-[9.5px] text-muted-foreground">
              {formatDateTime(chat.updatedAt)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center lg:opacity-0 lg:transition-opacity lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => togglePin(chat.id)}
            aria-label={pinned ? "Unpin this chat" : "Pin this chat"}
            title={pinned ? "Unpin" : "Pin"}
            className={cn(rowIcon, pinned && "text-gold")}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmDeleteId(null);
              setRenameValue(chat.title);
              setRenamingId(chat.id);
            }}
            aria-label="Rename this chat"
            title="Rename"
            className={rowIcon}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRenamingId(null);
              setConfirmDeleteId(chat.id);
            }}
            aria-label="Delete this chat"
            title="Delete"
            className={cn(rowIcon, "hover:text-destructive")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Search box plus the chats grouped by day. Used by the left panel and the mobile drawer.
  const chatList = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="h-9 w-full rounded-full border border-gold/20 bg-black/30 pl-8 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground focus-visible:border-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 pb-3">
        {!historyLoaded ? (
          <p className="px-2 font-mono text-xs text-muted-foreground">Loading…</p>
        ) : visibleChats.length === 0 ? (
          <p className="px-2 pt-1 font-mono text-xs text-muted-foreground">
            {chatSearch ? "No chats match your search." : "No chats yet. Your conversations will appear here."}
          </p>
        ) : (
          chatGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-0.5">{group.chats.map(renderChatRow)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="igx-chat mx-auto flex h-[calc(100dvh-15rem)] min-h-[500px] w-full max-w-6xl gap-4">
      <style>{`
        @property --igx-a { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @keyframes igxSpin { to { --igx-a: 360deg; } }
        @keyframes igxRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes igxBreathe { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .95; transform: scale(1.06); } }

        .igx-chat .igx-wordmark { font-family: "Cormorant Garamond", "Fraunces", Georgia, serif; font-weight: 600;
          font-size: clamp(38px, 6vw, 52px); line-height: 1; letter-spacing: .5px; white-space: nowrap; margin: 0; }
        .igx-chat .igx-wordmark span { color: #5E9BFF; }

        .igx-chat .igx-emblem { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .igx-chat .igx-emblem::before { content: ""; position: absolute; inset: -5px; border-radius: 50%;
          background: conic-gradient(from var(--igx-a), transparent 0 55%, #C6A15B, #5E9BFF, transparent);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));
          animation: igxSpin 7s linear infinite; }
        .igx-chat .igx-emblem::after { content: ""; position: absolute; inset: -26px; z-index: -1; border-radius: 50%;
          background: radial-gradient(circle, rgba(94,155,255,.24), rgba(198,161,91,.10) 45%, transparent 68%);
          animation: igxBreathe 4.5s ease-in-out infinite; }

        .igx-chat .igx-composer { position: relative; border-radius: 24px; border: 1px solid transparent;
          background: linear-gradient(rgba(9,12,20,.42), rgba(7,9,15,.5)) padding-box,
                      linear-gradient(135deg, rgba(198,161,91,.5), rgba(79,134,247,.4)) border-box;
          backdrop-filter: blur(12px) saturate(140%); -webkit-backdrop-filter: blur(12px) saturate(140%);
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

      {/* Left panel: saved chats (wide screens). Phones use the History drawer. */}
      <aside
        aria-label="Chat history"
        className="hidden h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-gold/20 bg-black/25 shadow-[0_18px_50px_rgba(0,0,0,.35)] backdrop-blur-xl lg:flex"
      >
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">Chats</p>
          <button
            type="button"
            onClick={newChat}
            className="flex h-8 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
        {chatList}
        <p className="border-t border-gold/15 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          Saved to your account · pins stay on this device
        </p>
      </aside>

      <div className="mx-auto flex h-full w-full min-w-0 max-w-3xl flex-1 flex-col">

      {/* A click anywhere outside an open pop-up closes it */}
      {popoverOpen && (
        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={closePopovers} />
      )}

      {/* Top bar — New chat, History, Requests and IGX AI settings kept as one tight group,
          all with their text label always showing (no more icon-only on narrow screens). */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {navArrows}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={newChat} className={cn(pillButton, "lg:hidden")} aria-label="New chat">
            <Plus className="h-3.5 w-3.5 text-gold" /> <span>New</span>
          </button>
          <button type="button" onClick={() => setDrawer("chats")} className={cn(pillButton, "lg:hidden")} aria-label="Chat history">
            <History className="h-3.5 w-3.5 text-gold" /> <span>History</span>
          </button>
          <button type="button" onClick={() => setDrawer("requests")} className={pillButton} aria-label="Requests">
            <Clock className="h-3.5 w-3.5 text-gold" /> <span>Requests</span>
            {!queueLoading && !queueError && (pendingCount ?? 0) > 0 && (
              <span className="rounded-full bg-gold px-1.5 py-px text-[10px] font-bold text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => go({ mode: "settings", tab: view.tab, chatId: view.chatId })}
            aria-label="IGX AI settings"
            title="IGX AI settings"
            className={pillButton}
          >
            <Settings2 className="h-4 w-4 text-gold" /> <span>IGX AI</span>
          </button>
        </div>
      </div>

      {historyNotice && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[12.5px] text-foreground">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            {historyNotice}
          </span>
          <CloseX onClick={() => setHistoryNotice(null)} label="Dismiss" />
        </div>
      )}

      {empty ? (
        /* Empty state: logo and name lifted tight against the greeting and
           composer, clustered close to center instead of spread apart. */
        <div className="flex flex-1 flex-col items-center justify-center px-1 pb-6">
          <div className="igx-rise flex items-center justify-center gap-3">
            <div className="igx-emblem">
              <Avatar src={igxAvatar} label="IGX" bare className="h-full w-full border-0 text-xl" />
            </div>
            <h1 className="igx-wordmark">
              IG<span>X</span> <em className="not-italic text-foreground">AI</em>
            </h1>
          </div>
          <p
            className="igx-rise mt-2 text-center font-display text-2xl text-foreground sm:text-[28px]"
            style={{ animationDelay: ".08s" }}
          >
            {greetingWord()}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <p
            className="igx-rise mt-1.5 max-w-md text-center text-sm text-muted-foreground"
            style={{ animationDelay: ".14s" }}
          >
            Tell IGX AI what needs doing. It becomes a proposal, and nothing runs without your
            decision.
          </p>
          {/* The entrance animation makes each block its own layer, so the block that holds
              the pop-up must sit above the blocks after it (the starter chips). */}
          <div
            className={cn("igx-rise mt-4 w-full max-w-2xl", popoverOpen && "relative z-50")}
            style={{ animationDelay: ".2s" }}
          >
            {composer(true)}
          </div>
          <div
            className="igx-rise mt-3 flex max-w-2xl flex-wrap justify-center gap-2"
            style={{ animationDelay: ".26s" }}
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
                    <div className="rounded-2xl rounded-tr-md border border-gold/25 bg-gold/10 px-4 py-3 text-[14.5px] leading-relaxed text-gold backdrop-blur-md backdrop-saturate-150">
                      {msg.text}
                    </div>
                  </div>
                </div>

                {/* IGX AI */}
                <div className="flex items-start gap-3">
                  <Avatar src={igxAvatar} label="IGX" bare className="h-9 w-9 text-sm" />
                  <div className="max-w-[88%] space-y-3 rounded-2xl rounded-tl-md border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md backdrop-saturate-150">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[14px] leading-relaxed text-white">
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
          <div className={cn("pt-2", popoverOpen && "relative z-50")}>{composer(false)}</div>
        </>
      )}

      </div>

      {/* Drawer: saved chats and the real requests queue */}
      {drawer && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={drawer === "chats" ? "Chat history" : "Requests"}>
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setDrawer(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[400px] max-w-[92vw] flex-col border-l border-gold/25 bg-[#080b12]/92 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-5 py-4">
              <div className="flex items-center gap-1 rounded-full border border-gold/20 bg-black/25 p-1">
                {(["chats", "requests"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setDrawer(kind)}
                    aria-pressed={drawer === kind}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                      drawer === kind
                        ? "bg-gold font-semibold text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {kind === "chats" ? "Chats" : "Requests"}
                    {kind === "requests" && !queueLoading && !queueError && (pendingCount ?? 0) > 0
                      ? ` · ${pendingCount}`
                      : ""}
                  </button>
                ))}
              </div>
              <CloseX onClick={() => setDrawer(null)} label="Close panel" />
            </div>

            {drawer === "chats" ? (
              <div className="flex min-h-0 flex-1 flex-col pt-3">
                <p className="px-4 pb-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  Saved to your account · on every device you sign in on
                </p>
                {chatList}
              </div>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {queueLoading
                    ? "Loading…"
                    : queueError
                    ? "Unavailable"
                    : `${pendingCount ?? 0} waiting for your decision`}
                </p>
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
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
