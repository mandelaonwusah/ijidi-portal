import { createFileRoute } from "@tanstack/react-router";
import { Film, Music2, Radio as RadioIcon } from "lucide-react";
import {
  EmptyState,
  Eyebrow,
  MetricTile,
  SectionHeader,
  StatusBadge,
} from "@/components/portal-ui";
export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media · IJIDI Portal" },
      { name: "description", content: "IJIDI Media content studio and property registry." },
      { property: "og:title", content: "Media · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Media content studio and property registry." },
    ],
  }),
  component: Media,
});
function Media() {
  return (
    <div>
      <SectionHeader
        eyebrow="10 / MEDIA"
        title="Seven properties. One engine."
        detail="A future-facing registry for Wild, Orbit, Arena, Stage, Toons, Sound, and Restore."
        action={<StatusBadge status="forming" label="OPEN"/>}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Active properties"
          value="—"
          detail="No verified entries"
          status="not-tracked"
        />
        <MetricTile
          label="Content pipeline"
          value="—"
          detail="Not yet built"
          status="not-tracked"
        />
        <MetricTile
          label="Visual identity"
          value="—"
          detail="Undecided — own mark vs. family resemblance"
          status="not-tracked"
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel-bracket p-7 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow className="text-teal">Property registry</Eyebrow>
              <h2 className="mt-2 font-display text-lg font-semibold">Launch order</h2>
            </div>
            <Film className="h-5 w-5 text-gold" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-dashed border-border p-4">
              <RadioIcon className="h-5 w-5 text-teal" />
              <h3 className="mt-5 font-display font-semibold">Wild</h3>
              <p className="mt-2 text-xs text-muted-foreground">First launch priority.</p>
              <div className="mt-5">
                <StatusBadge status="not-tracked" label="NOT CONFIGURED" />
              </div>
            </div>
            <div className="border border-dashed border-border p-4">
              <Music2 className="h-5 w-5 text-teal" />
              <h3 className="mt-5 font-display font-semibold">Orbit</h3>
              <p className="mt-2 text-xs text-muted-foreground">Second launch priority.</p>
              <div className="mt-5">
                <StatusBadge status="not-tracked" label="NOT CONFIGURED" />
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          title="No content records"
          detail="The Media registry is ready for verified properties."
        />
      </div>
    </div>
  );
}
