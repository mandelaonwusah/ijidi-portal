import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, Leaf, Users } from "lucide-react";
import {
  EmptyState,
  Eyebrow,
  MetricTile,
  SectionHeader,
  StatusBadge,
} from "@/components/portal-ui";
export const Route = createFileRoute("/foundation")({
  head: () => ({
    meta: [
      { title: "Foundation · IJIDI Portal" },
      { name: "description", content: "IJIDI Foundation programme and impact registry." },
      { property: "og:title", content: "Foundation · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Foundation programme and impact registry." },
    ],
  }),
  component: Foundation,
});
function Foundation() {
  return (
    <div>
      <SectionHeader
        eyebrow="04 / FOUNDATION"
        title="Impact, made accountable."
        detail="A future-facing registry for programmes, beneficiaries, and measurable outcomes."
        action={<StatusBadge status="forming" label="FORMATION STAGE" />}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Active programmes"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Beneficiaries reached"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Impact reporting"
          value="—"
          detail="Not yet configured"
          status="not-tracked"
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel-bracket p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow className="text-teal">Programme registry</Eyebrow>
              <h2 className="mt-2 font-display text-lg font-semibold">Foundation arms</h2>
            </div>
            <HeartHandshake className="h-5 w-5 text-gold" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-dashed border-border p-4">
              <Leaf className="h-5 w-5 text-teal" />
              <h3 className="mt-5 font-display font-semibold">Programme one</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Programme details not yet tracked.
              </p>
              <div className="mt-5">
                <StatusBadge status="not-tracked" label="NOT CONFIGURED" />
              </div>
            </div>
            <div className="border border-dashed border-border p-4">
              <Users className="h-5 w-5 text-teal" />
              <h3 className="mt-5 font-display font-semibold">Programme two</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Programme details not yet tracked.
              </p>
              <div className="mt-5">
                <StatusBadge status="not-tracked" label="NOT CONFIGURED" />
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          title="No impact records"
          detail="The foundation registry is ready for verified programmes."
        />
      </div>
    </div>
  );
}
