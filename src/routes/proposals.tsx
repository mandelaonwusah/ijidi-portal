// src/routes/proposals.tsx
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/proposals")({
  component: ProposalsReview,
});

type ProposalStatus = "pending_review" | "approved" | "rejected";

type Proposal = {
  id: string;
  created_at: string;
  updated_at: string;
  actor_type: string;
  source: string | null;
  intent: string;
  suggested_action: string;
  reasoning: string | null;
  confidence_score: number | null;
  status: ProposalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

async function fetchProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const TABS: { key: ProposalStatus; label: string }[] = [
  { key: "pending_review", label: "PENDING REVIEW" },
  { key: "approved", label: "APPROVED" },
  { key: "rejected", label: "REJECTED" },
];

function ProposalsReview() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProposalStatus>("pending_review");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const {
    data: proposals,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const filtered = (proposals ?? []).filter((p) => p.status === activeTab);
  const counts = {
    pending_review: (proposals ?? []).filter((p) => p.status === "pending_review").length,
    approved: (proposals ?? []).filter((p) => p.status === "approved").length,
    rejected: (proposals ?? []).filter((p) => p.status === "rejected").length,
  };

  async function handleReview(proposal: Proposal, decision: "approved" | "rejected") {
    setSubmittingId(proposal.id);
    const note = noteDraft[proposal.id]?.trim() || null;
    // The reviewer is whoever is signed in; the database rules decide whether
    // that account may review at all.
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewerId = sessionData.session?.user.id;
    if (!reviewerId) {
      setSubmittingId(null);
      alert("Update failed: you are not signed in.");
      return;
    }
    const { error } = await supabase
      .from("proposals")
      .update({
        status: decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_note: note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    setSubmittingId(null);
    if (error) {
      // Honest-state: surface the real error, don't pretend it worked.
      alert(`Update failed: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["proposals"] });
    queryClient.invalidateQueries({ queryKey: ["ecosystem-metrics"] });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard variant="elevated">
        <Eyebrow className="text-amber-400">MODULE / PROPOSAL REVIEW</Eyebrow>
        <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Proposal Queue
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          IGX AI proposes, never executes. Reviewing here only flips status — no action is triggered.
        </p>
      </GlassCard>

      {/* Tabs */}
      <section className="flex flex-wrap gap-2 font-mono text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded border px-4 py-2 transition-colors ${
              activeTab === tab.key
                ? "border-amber-400/60 bg-amber-400/10 text-amber-400"
                : "border-border bg-card/30 text-muted-foreground hover:border-amber-400/30"
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </section>

      {/* List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center font-mono text-xs text-muted-foreground animate-pulse">
            Loading proposal queue...
          </div>
        ) : isError ? (
          <div className="py-8 text-center font-mono text-xs text-red-400">
            Failed to load proposals. Check connection.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-muted-foreground">
            No {activeTab.replace("_", " ")} proposals.
          </div>
        ) : (
          filtered.map((proposal, i) => (
            <GlassCard key={proposal.id} index={i} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                <span>
                  {proposal.actor_type} · {proposal.source ?? "unknown source"}
                </span>
                <span>{new Date(proposal.created_at).toLocaleString()}</span>
              </div>

              <div>
                <Eyebrow className="text-[9px] text-muted-foreground">INTENT</Eyebrow>
                <p className="mt-1 font-sans text-sm text-foreground">{proposal.intent}</p>
              </div>

              <div>
                <Eyebrow className="text-[9px] text-muted-foreground">SUGGESTED ACTION</Eyebrow>
                <p className="mt-1 font-mono text-xs text-foreground">{proposal.suggested_action}</p>
              </div>

              {proposal.reasoning && (
                <div>
                  <Eyebrow className="text-[9px] text-muted-foreground">REASONING</Eyebrow>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{proposal.reasoning}</p>
                </div>
              )}

              <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
                <span>
                  CONFIDENCE:{" "}
                  {proposal.confidence_score !== null ? proposal.confidence_score : "NOT TRACKED"}
                </span>
                {proposal.reviewed_at && (
                  <span>REVIEWED: {new Date(proposal.reviewed_at).toLocaleString()}</span>
                )}
              </div>

              {proposal.review_note && (
                <div>
                  <Eyebrow className="text-[9px] text-muted-foreground">REVIEW NOTE</Eyebrow>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{proposal.review_note}</p>
                </div>
              )}

              {proposal.status === "pending_review" && (
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <input
                    type="text"
                    placeholder="Optional review note..."
                    value={noteDraft[proposal.id] ?? ""}
                    onChange={(e) =>
                      setNoteDraft((prev) => ({ ...prev, [proposal.id]: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-400/50 focus:outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      disabled={submittingId === proposal.id}
                      onClick={() => handleReview(proposal, "approved")}
                      className="rounded border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 font-mono text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
                    >
                      {submittingId === proposal.id ? "..." : "APPROVE"}
                    </button>
                    <button
                      disabled={submittingId === proposal.id}
                      onClick={() => handleReview(proposal, "rejected")}
                      className="rounded border border-red-400/50 bg-red-400/10 px-4 py-2 font-mono text-xs font-bold text-red-400 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                    >
                      {submittingId === proposal.id ? "..." : "REJECT"}
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))
        )}
      </section>
    </div>
  );
}
