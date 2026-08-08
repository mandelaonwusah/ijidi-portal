import type { ReactNode } from "react";
import { ArrowUpRight, Check, LockKeyhole, Minus, Radio, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function StatusBadge({
  status,
  label,
}: {
  status:
    | "active"
    | "standby"
    | "forming"
    | "restricted"
    | "frozen"
    | "open"
    | "ready"
    | "not-tracked"
    | "tracked"
    | "estimated";
  label?: string;
}) {
  const tone =
    status === "active" || status === "ready" || status === "tracked" || status === "frozen"
      ? "teal"
      : status === "restricted"
        ? "red"
        : status === "not-tracked"
          ? "muted"
          : "gold";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.13em]",
        tone === "teal" && "border-teal/30 bg-teal/10 text-teal",
        tone === "gold" && "border-gold/30 bg-gold/10 text-gold",
        tone === "red" && "border-danger/30 bg-danger/10 text-danger",
        tone === "muted" && "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "teal" && "bg-teal",
          tone === "gold" && "bg-gold",
          tone === "red" && "bg-danger",
          tone === "muted" && "bg-muted-foreground",
        )}
      />
      {label ?? status.replace("-", " ")}
    </span>
  );
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
  return (
    <div className="panel-bracket relative min-h-[132px] overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
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
          "mt-5 font-display text-4xl font-semibold tracking-tight",
          value === "—" ? "text-muted-foreground/70" : "text-gold",
        )}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-1 w-1 rounded-full bg-border" />
        {detail}
      </div>
      <div className="absolute bottom-0 left-0 h-px w-1/3 bg-gold/50" />
    </div>
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
    <div className="flex min-h-[140px] flex-col items-center justify-center border border-dashed border-border bg-muted/30 px-5 text-center">
      <div className="mb-3 flex h-8 w-8 items-center justify-center border border-border text-muted-foreground">
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
  return <StatusBadge status={status} />;
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
