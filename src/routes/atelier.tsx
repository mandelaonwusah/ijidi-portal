import { createFileRoute } from "@tanstack/react-router";
import { Gem, Ruler, Shirt } from "lucide-react";
import {
  EmptyState,
  Eyebrow,
  MetricTile,
  SectionHeader,
  StatusBadge,
} from "@/components/portal-ui";
export const Route = createFileRoute("/atelier")({
  head: () => ({
    meta: [
      { title: "Atelier · IJIDI Portal" },
      { name: "description", content: "IJIDI Atelier collection and production registry." },
      { property: "og:title", content: "Atelier · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Atelier collection and production registry." },
    ],
  }),
  component: Atelier,
});
function Atelier() {
  return (
    <div>
      <SectionHeader
        eyebrow="09 / ATELIER"
        title="Designed for Distinction."
        detail="A future-facing registry for collections, product lines, and production status."
        action={<StatusBadge status="forming" label="BUILDING" />}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Active collections"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Products listed"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Mark status"
          value="Locked"
          detail="IA monogram — v1"
          status="tracked"
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel-bracket p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow className="text-teal">Production registry</Eyebrow>
              <h2 className="mt-2 font-display text-lg font-semibold">Collections</h2>
            </div>
            <Shirt className="h-5 w-5 text-gold" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-dashed border-border p-4">
              <Ruler className="h-5 w-5 text-teal" />
              <h3 className="mt-5 font-display font-semibold">First collection</h3>
              <p className="mt-2 text-xs text-muted-foreground">Not yet tracked.</p>
              <div className="mt-5">
                <StatusBadge status="not-tracked" label="NOT CONFIGURED" />
              </div>
            </div>
            <div className="border border-dashed border-border p-4">
              <Gem className="h-5 w-5 text-teal" />
              <h3 className="mt-5 font-display font-semibold">Signature pieces</h3>
              <p className="mt-2 text-xs text-muted-foreground">Not yet tracked.</p>
              <div className="mt-5">
                <StatusBadge status="not-tracked" label="NOT CONFIGURED" />
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          title="No production records"
          detail="The Atelier registry is ready for verified collections."
        />
      </div>
    </div>
  );
}
