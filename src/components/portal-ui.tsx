import type { ReactNode } from "react";
import { ArrowUpRight, Check, LockKeyhole, Minus, Radio, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";
import type { DataStatus } from "@/lib/portal-data";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow className="mb-2 text-teal">{eyebrow}</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {detail && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Button kinds (DESIGN.md §6). Use with cn() and add size/layout classes at the call site.
 * primary   gold gradient, dark text: one per view (Authenticate, Approve).
 * secondary neutral border on glass: everything else.
 * danger    red text and border on the error surface: reject, revoke, sign out.
 * dangerSolid  the filled red confirm button inside a danger confirm dialog.
 * ghost     text only, for inline links.
 */
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-default disabled:opacity-50";
export const buttonKind = {
  primary: `${BTN_BASE} border border-transparent bg-[linear-gradient(180deg,#e3c27a,#c6a15b_55%,#a98443)] text-primary-foreground hover:brightness-105`,
  secondary: `${BTN_BASE} border border-border bg-black/25 text-foreground backdrop-blur-[3px] hover:border-border-strong`,
  danger: `${BTN_BASE} border border-destructive/45 bg-[var(--error-surface)] text-destructive hover:border-destructive/70`,
  dangerSolid: `${BTN_BASE} border border-transparent bg-destructive text-[#0b0b0c] hover:bg-destructive/90`,
  ghost: `${BTN_BASE} border border-transparent px-0 text-muted-foreground hover:text-foreground`,
} as const;

/** The four honest states (DESIGN.md §2). Nothing else gets a colour. */
export type HonestState = "verified" | "pending" | "error" | "not-connected";

const STATE_LABEL: Record<HonestState, string> = {
  verified: "VERIFIED",
  pending: "PENDING",
  error: "ERROR",
  "not-connected": "NOT CONNECTED",
};

/**
 * 13 px mono pill with a 6 px dot.
 * verified      blue: the system checked it just now.
 * pending       attention orange: waiting, declared but unchecked, or loading.
 * error         red: a check failed or a decision was rejected.
 * not-connected grey: nothing is wired to check this.
 * Only a verified state that is also `live` may pulse (DESIGN.md pulse rule).
 */
export function StatusBadge({
  state,
  label,
  live = false,
}: {
  state: HonestState;
  label?: string;
  live?: boolean;
}) {
  return (
    <span
      data-state={state}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-xs font-semibold uppercase leading-none tracking-[0.08em]",
        state === "verified" && "border-verified/35 bg-verified/10 text-blue-light",
        state === "pending" && "border-attention/35 bg-attention/10 text-attention",
        state === "error" && "border-destructive/35 bg-destructive/10 text-destructive",
        state === "not-connected" && "border-border bg-white/[0.04] text-not-connected",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          state === "verified" && "bg-verified",
          state === "verified" && live && "animate-pulse",
          state === "pending" && "bg-attention",
          state === "error" && "bg-destructive",
          state === "not-connected" && "bg-[var(--not-connected-dot)]",
        )}
      />
      {label ?? STATE_LABEL[state]}
    </span>
  );
}

/** The plain-words reason from a failed query (Supabase errors are plain objects, not Error). */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return "the query failed";
}

/** A value typed into the code or the database by hand, never checked by the system. */
export function declaredLabel(value: string) {
  return `DECLARED · ${value.toUpperCase()}`;
}

/** Proposal review states (DESIGN.md §2 mapping). */
export function proposalBadge(status: string) {
  switch (status) {
    case "approved":
      return <StatusBadge state="verified" label="APPROVED" />;
    case "rejected":
      return <StatusBadge state="error" label="REJECTED" />;
    case "error":
      return <StatusBadge state="error" label="NOT SAVED" />;
    case "pending_review":
      return <StatusBadge state="pending" label="PENDING REVIEW" />;
    default:
      return <StatusBadge state="pending" label={status.replace(/_/g, " ").toUpperCase()} />;
  }
}

export function HexBadge({ label = "ROOT", small = false }: { label?: string; small?: boolean }) {
  return (
    <div
      className={cn(
        "hex-badge flex shrink-0 items-center justify-center border border-gold/60 bg-gold/10 font-mono font-bold text-gold shadow-[0_0_20px_var(--gold-glow)]",
        small ? "h-10 w-10 text-[9px]" : "h-16 w-16 text-[11px]",
      )}
    >
      <ShieldCheck className={small ? "h-4 w-4" : "h-6 w-6"} />
      <span className="sr-only">{label} access</span>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  status: DataStatus;
}) {
  // DESIGN.md §6: label 13 mono · value 32 Inter 600 · detail 14 muted.
  // A missing value is "—" in muted grey, never a number.
  return (
    <GlassCard variant="metric" className="min-h-[152px] overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <span
          className={cn(
            "font-mono text-[9px] uppercase",
            status === "tracked" ? "text-teal" : "text-muted-foreground",
          )}
        >
          {status === "not-tracked" ? "NOT TRACKED" : status}
        </span>
      </div>
      <div
        className={cn(
          "mt-5 font-sans text-2xl font-semibold tracking-tight",
          value === "—" ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{detail}</div>
    </GlassCard>
  );
}

export function EmptyState({
  title,
  detail,
  icon = <Minus className="h-4 w-4" />,
}: {
  title: string;
  detail: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-[168px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">

        {icon}
      </div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
        {title}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

export function DataProvenance({ status }: { status: DataStatus }) {
  if (status === "tracked") return <StatusBadge state="verified" label="TRACKED" />;
  if (status === "estimated") return <StatusBadge state="pending" label="ESTIMATED" />;
  return <StatusBadge state="not-connected" label="NOT TRACKED" />;
}

export function Signal({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-teal">
      <Radio className="h-3 w-3" />
      {children}
    </span>
  );
}

export function ActionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gold transition-colors group-hover:text-teal">
      {children}
      <ArrowUpRight className="h-3 w-3" />
    </span>
  );
}

export function RestrictedMark() {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
      <LockKeyhole className="h-3 w-3" />
      Restricted
    </span>
  );
}

export function CheckMark() {
  return <Check className="h-3.5 w-3.5 text-teal" />;
}
