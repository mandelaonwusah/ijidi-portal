import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  FileCheck2,
  ListChecks,
  RefreshCw,
  Scale,
} from "lucide-react";
import { getDecisions, getProposals } from "@/lib/portal-queries";
import { supabase } from "@/lib/supabase";
import {
  Eyebrow,
  SectionHeader,
  StatusBadge,
  proposalBadge,
} from "@/components/portal-ui";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Governance · IJIDI Portal" },
      {
        name: "description",
        content: "IJIDI Portal governance, decision log, and trust registry.",
      },
      { property: "og:title", content: "Governance · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Portal governance and decision log." },
    ],
  }),
  component: Governance,
});

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border px-5 py-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {text}
    </div>
  );
}

function ErrorState({ what, message }: { what: string; message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/35 bg-[var(--error-surface)] px-5 py-5 text-center font-mono text-xs text-destructive"
    >
      Could not load {what}: {message}
      <div className="mt-1 text-muted-foreground">Retrying automatically.</div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3 border border-border bg-background/50 p-4">
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function Governance() {
  const proposalsQ = useQuery({
    queryKey: ["governance-proposals"],
    queryFn: getProposals,
    refetchInterval: 10000,
  });
  const decisionsQ = useQuery({
    queryKey: ["governance-decisions"],
    queryFn: getDecisions,
    refetchInterval: 10000,
  });

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // The "Active session" indicator reflects the real auth session.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSessionEmail(data.session?.user.email ?? null);
      setSessionChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSessionEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const proposals = proposalsQ.data ?? [];
  const decisions = decisionsQ.data ?? [];
  const isSyncing = proposalsQ.isRefetching || decisionsQ.isRefetching;

  const counts = {
    pending: proposals.filter((p) => p.status === "pending_review").length,
    approved: proposals.filter((p) => p.status === "approved").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  };

  const sync = () => {
    proposalsQ.refetch();
    decisionsQ.refetch();
  };

  return (
    <div className="space-y-6 tactical-grid">
      <SectionHeader
        eyebrow="07 / GOVERNANCE"
        title="Authority with a record."
        detail="The system should remember why it made a choice, not only what it looks like."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={sync}
              className="flex items-center gap-1.5 font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-attention" : ""}`} />
              Sync
            </button>
            <StatusBadge state="verified" label="SINGLE GOVERNOR" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        {/* Governor record */}
        <GlassCard>
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <div>
              <Eyebrow>Governor record</Eyebrow>
              <h2 className="mt-1 font-display text-lg font-semibold">Mandela Onwusah</h2>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <div className="flex justify-between">
              <Eyebrow>Role</Eyebrow>
              <span className="font-mono text-xs text-gold">ROOT</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  sessionEmail ? "bg-verified live-pulse-blue" : "bg-muted-foreground/40"
                }`}
              />
              <span
                className={`font-mono text-xs uppercase tracking-widest ${
                  sessionEmail ? "text-teal" : "text-muted-foreground"
                }`}
              >
                {!sessionChecked
                  ? "Checking session…"
                  : sessionEmail
                  ? "Active session"
                  : "No active session"}
              </span>
            </div>
            {sessionEmail && (
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                {sessionEmail}
              </p>
            )}
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <Eyebrow>Mandate</Eyebrow>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Build the infrastructure before making the claims.
            </p>
          </div>
        </GlassCard>

        <div className="space-y-6">
          {/* Proposals */}
          <GlassCard>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Eyebrow className="text-muted-foreground">IGX AI proposals</Eyebrow>
                  <h2 className="mt-1 font-display text-lg font-semibold">Proposal queue</h2>
                </div>
              </div>
              <Link
                to="/proposals"
                className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                Open review
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {proposalsQ.isLoading ? (
              <SkeletonRows />
            ) : proposalsQ.isError ? (
              <ErrorState
                what="proposals"
                message={(proposalsQ.error as Error | null)?.message ?? "unknown error"}
              />
            ) : proposals.length === 0 ? (
              <EmptyState text="No verified proposals found." />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <span>
                    <span className="text-attention">{counts.pending}</span> pending
                  </span>
                  <span>
                    <span className="text-teal">{counts.approved}</span> approved
                  </span>
                  <span>
                    <span className="text-foreground">{counts.rejected}</span> rejected
                  </span>
                </div>
                <div className="space-y-3">
                  {proposals.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="border border-border bg-background/50 p-4 transition-all hover:border-border-strong"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Eyebrow>{new Date(p.created_at).toLocaleDateString()}</Eyebrow>
                        {proposalBadge(p.status)}
                      </div>
                      <h3 className="mt-3 break-words font-display font-semibold">{p.intent}</h3>
                      <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                        {p.suggested_action}
                      </p>
                    </div>
                  ))}
                </div>
                {proposals.length > 5 && (
                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Showing 5 of {proposals.length} · see the full queue in Open review
                  </p>
                )}
              </>
            )}
          </GlassCard>

          {/* Decision log */}
          <GlassCard>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpenCheck className="h-5 w-5 text-teal" />
                <div>
                  <Eyebrow className="text-teal">Architecture decisions</Eyebrow>
                  <h2 className="mt-1 font-display text-lg font-semibold">Decision log</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground">
                {decisionsQ.isLoading && <span className="text-attention">FETCHING…</span>}
                {!decisionsQ.isLoading && !decisionsQ.isError && (
                  <span>{decisions.length} records</span>
                )}
              </div>
            </div>

            {decisionsQ.isLoading ? (
              <SkeletonRows />
            ) : decisionsQ.isError ? (
              <ErrorState
                what="the decision log"
                message={(decisionsQ.error as Error | null)?.message ?? "unknown error"}
              />
            ) : decisions.length === 0 ? (
              <EmptyState text="No verified decisions found." />
            ) : (
              <div className="space-y-3">
                {decisions.map((decision) => {
                  const state = String(decision.state).toUpperCase();
                  return (
                    <div
                      key={decision.id}
                      className="border border-border bg-background/50 p-4 transition-all hover:border-border-strong"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <Eyebrow>{decision.date}</Eyebrow>
                        </div>
                        <StatusBadge
                          state={state === "FROZEN" || state === "PASSED" ? "verified" : "pending"}
                          label={state}
                        />
                      </div>
                      <h3 className="mt-4 break-words font-display font-semibold">
                        {decision.label}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                        {decision.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
