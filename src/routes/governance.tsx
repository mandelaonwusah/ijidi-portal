import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, FileCheck2, Scale, RefreshCw } from "lucide-react";
import { decisions as fallbackDecisions } from "@/lib/portal-data";
import { getProposals } from "@/lib/portal-queries";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";

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

function Governance() {
  const { data: proposals, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["governance-proposals"],
    queryFn: getProposals,
    refetchInterval: 5000, // Live poll every 5 seconds
  });

  // Map dynamic live proposals into decision log format if present, else fallback
  const records = proposals && proposals.length > 0
    ? proposals.map((p) => ({
        label: `${p.id}: ${p.title}`,
        date: p.endsIn === "CLOSED" ? "RESOLVED" : `CLOSES IN ${p.endsIn}`,
        state: p.status,
        detail: `Quorum: ${p.quorumPct}% · Votes: ${p.votesFor} FOR / ${p.votesAgainst} AGAINST`,
      }))
    : fallbackDecisions;

  return (
    <div className="space-y-6 tactical-grid">
      <SectionHeader
        eyebrow="07 / GOVERNANCE"
        title="Authority with a record."
        detail="The system should remember why it made a choice, not only what it looks like."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground hover:text-gold transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin text-gold" : ""}`} />
              Sync
            </button>
            <StatusBadge status="active" label="SINGLE GOVERNOR" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="panel-bracket p-5">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-gold" />
            <div>
              <Eyebrow>Governor record</Eyebrow>
              <h2 className="mt-1 font-display text-lg font-semibold">Mandela Onwusah</h2>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <div className="flex justify-between">
              <Eyebrow>Role</Eyebrow>
              <span className="font-mono text-[10px] text-gold">ROOT</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal live-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-teal">
                Active session
              </span>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <Eyebrow>Mandate</Eyebrow>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Build the infrastructure before making the claims.
            </p>
          </div>
        </section>

        <section className="panel-bracket p-5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-5 w-5 text-teal" />
              <div>
                <Eyebrow className="text-teal">Architecture decisions</Eyebrow>
                <h2 className="mt-1 font-display text-lg font-semibold">Decision log</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase text-muted-foreground">
              {isLoading && <span className="text-gold live-pulse">FETCHING…</span>}
              <span>{records.length} records</span>
            </div>
          </div>

          <div className="space-y-3">
            {records.map((decision) => (
              <div key={decision.label} className="border border-border bg-background/50 p-4 transition-all hover:border-gold/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-gold" />
                    <Eyebrow>{decision.date}</Eyebrow>
                  </div>
                  <StatusBadge
                    status={
                      decision.state === "FROZEN" || decision.state === "PASSED"
                        ? "frozen"
                        : "open"
                    }
                    label={decision.state}
                  />
                </div>
                <h3 className="mt-4 font-display font-semibold">{decision.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{decision.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
