import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, FileCheck2, Scale } from "lucide-react";
import { decisions } from "@/lib/portal-data";
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
  return (
    <div>
      <SectionHeader
        eyebrow="07 / GOVERNANCE"
        title="Authority with a record."
        detail="The system should remember why it made a choice, not only what it looks like."
        action={<StatusBadge status="active" label="SINGLE GOVERNOR" />}
      />
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="panel-bracket p-7">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-gold" />
            <div>
              <Eyebrow>Governor record</Eyebrow>
              <h2 className="mt-1 font-display text-lg font-semibold">Mandela Onwusah</h2>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                @mandelaonwusah1 · Governor
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <div className="flex justify-between">
              <Eyebrow>Role</Eyebrow>
              <span className="font-mono text-[10px] text-gold">ROOT</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal" />
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
        <section className="panel-bracket p-7">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-5 w-5 text-teal" />
              <div>
                <Eyebrow className="text-teal">Architecture decisions</Eyebrow>
                <h2 className="mt-1 font-display text-lg font-semibold">Decision log</h2>
              </div>
            </div>
            <span className="font-mono text-[9px] uppercase text-muted-foreground">
              {decisions.length} records
            </span>
          </div>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <div key={decision.label} className="border border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-gold" />
                    <Eyebrow>{decision.date}</Eyebrow>
                  </div>
                  <StatusBadge
                    status={decision.state === "FROZEN" ? "frozen" : "open"}
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
