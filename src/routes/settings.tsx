import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Fingerprint, MonitorCog, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, HexBadge, SectionHeader, StatusBadge } from "@/components/portal-ui";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Identity & Settings · IJIDI Portal" },
      {
        name: "description",
        content: "IJIDI Portal identity, access tier, and interface settings.",
      },
      { property: "og:title", content: "Identity & Settings · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Portal identity and access settings." },
    ],
  }),
  component: Settings,
});
function Settings() {
  return (
    <div>
      <SectionHeader
        eyebrow="08 / IDENTITY"
        title="The person behind the access."
        detail="A clear identity panel keeps authority visible and scoped."
        action={<StatusBadge status="active" label="IDENTITY VERIFIED" />}
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="panel-bracket p-6">
          <div className="flex items-start gap-5">
            <HexBadge />
            <div>
              <Eyebrow className="text-teal">Root identity</Eyebrow>
              <h2 className="mt-2 font-display text-2xl font-semibold">J. IJIDI</h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Governor / primary operator
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="border border-border p-3">
              <Eyebrow>Access</Eyebrow>
              <div className="mt-3 font-mono text-sm text-gold">ROOT</div>
            </div>
            <div className="border border-border p-3">
              <Eyebrow>Session</Eyebrow>
              <div className="mt-3 font-mono text-sm text-teal">NOMINAL</div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-border pt-5">
            <Fingerprint className="h-4 w-4 text-teal" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Identity manifest active
            </span>
          </div>
        </section>
        <section className="space-y-4">
          <div className="panel-bracket p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <Eyebrow>Role badges</Eyebrow>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status="active" label="ROOT / FULL ACCESS" />
              <StatusBadge status="ready" label="GOVERNOR" />
              <StatusBadge status="forming" label="SINGLE OPERATOR" />
            </div>
          </div>
          <div className="panel-bracket p-5">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 text-teal" />
              <Eyebrow>Interface controls</Eyebrow>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-sm">Command density</div>
                  <div className="mt-1 text-xs text-muted-foreground">Focused / compact</div>
                </div>
                <Button variant="outline" size="sm">
                  Compact
                </Button>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-sm">System alerts</div>
                  <div className="mt-1 text-xs text-muted-foreground">Operational events only</div>
                </div>
                <BellRing className="h-4 w-4 text-teal" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">Display surface</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Near-black / amber signal
                  </div>
                </div>
                <MonitorCog className="h-4 w-4 text-gold" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
