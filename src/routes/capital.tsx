import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { BriefcaseBusiness, FileSearch, Table2 } from "lucide-react";
import {
  EmptyState,
  Eyebrow,
  MetricTile,
  SectionHeader,
  StatusBadge,
} from "@/components/portal-ui";
export const Route = createFileRoute("/capital")({
  head: () => ({
    meta: [
      { title: "Capital Engine · IJIDI Portal" },
      {
        name: "description",
        content: "Grounded capital pipeline and treasury registry for IJIDI Portal.",
      },
      { property: "og:title", content: "Capital Engine · IJIDI Portal" },
      { property: "og:description", content: "Grounded capital pipeline and treasury registry." },
    ],
  }),
  component: Capital,
});
function Capital() {
  return (
    <div>
      <SectionHeader
        eyebrow="03 / CAPITAL ENGINE"
        title="Capital, without theatre."
        detail="The structure is ready. Verified financial records are not yet loaded."
        action={<StatusBadge status="not-tracked" label="NO FINANCIAL DATA" />}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Pipeline entries"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Committed capital"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Treasury status"
          value="—"
          detail="Awaiting ledger"
          status="not-tracked"
        />
      </div>
      <GlassCard className="mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <Table2 className="h-4 w-4 text-gold" />
            <div>
              <Eyebrow>Deal book / registry</Eyebrow>
              <h2 className="mt-1 font-display font-semibold">Capital pipeline</h2>
            </div>
          </div>
          <span className="font-mono text-[9px] uppercase text-muted-foreground">
            Schema ready · rows 0
          </span>
        </div>
        <div className="hidden grid-cols-5 gap-4 border-b border-border px-5 py-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground md:grid">
          <span>Opportunity</span>
          <span>Vehicle</span>
          <span>Stage</span>
          <span>Value</span>
          <span>Status</span>
        </div>
        <div className="p-5">
          <EmptyState
            icon={<FileSearch className="h-4 w-4" />}
            title="No capital entries yet"
            detail="Add verified records when the engine is operational."
          />
        </div>
      </GlassCard>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="border border-border bg-panel p-5">
          <BriefcaseBusiness className="h-5 w-5 text-teal" />
          <h3 className="mt-5 font-display text-lg font-semibold">Pipeline discipline</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This module will separate opportunities, commitments, and settled movements so one
            number never implies another.
          </p>
        </div>
        <div className="border border-border bg-gold/5 p-5">
          <Eyebrow className="text-gold">Truth protocol</Eyebrow>
          <p className="mt-4 font-mono text-sm leading-6 text-gold/90">
            No invented deal size. No implied yield. No fake treasury balance.
          </p>
        </div>
      </div>
    </div>
  );
}
