import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, GitBranch, Globe2 } from "lucide-react";
import { ecosystemNodes } from "@/lib/portal-data";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: "Ecosystem Map · IJIDI Portal" },
      {
        name: "description",
        content: "Visual hierarchy of the IJIDI ecosystem and its operating arms.",
      },
      { property: "og:title", content: "Ecosystem Map · IJIDI Portal" },
      { property: "og:description", content: "Visual hierarchy of the IJIDI ecosystem." },
    ],
  }),
  component: Ecosystem,
});
function Ecosystem() {
  return (
    <div>
      {/* Heading sits on glass so it stays readable over the board */}
      <GlassCard className="mb-6 px-5 py-4 sm:px-6">
        <SectionHeader
          eyebrow="02 / ECOSYSTEM"
          title="One root. Clear boundaries."
          detail="A visual registry of the operating arms. Forming means intentionally untracked, not fictional."
          action={<StatusBadge status="active" label="GOVERNOR SESSION" />}
        />
      </GlassCard>
      <GlassCard index={1} className="overflow-hidden p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between border-b border-gold/20 pb-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-4 w-4 text-gold" />
            <Eyebrow>Hierarchy / live registry</Eyebrow>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground">
            No valuation data loaded
          </span>
        </div>
        <div className="relative min-h-[440px] overflow-x-auto">
          <div className="absolute left-1/2 top-5 flex -translate-x-1/2 flex-col items-center">
            <div className="hex-badge flex h-24 w-24 items-center justify-center border border-gold bg-gold/10 shadow-[0_0_40px_var(--gold-glow)]">
              <Globe2 className="h-8 w-8 text-gold" />
            </div>
            <div className="mt-4 text-center">
              <Eyebrow className="text-gold">ROOT ACCESS</Eyebrow>
              <div className="mt-1 font-display text-lg font-semibold">IJIDI Portal</div>
              <span className="font-mono text-[9px] text-muted-foreground">
                GOVERNOR / SINGLE OPERATOR
              </span>
            </div>
          </div>
          <div className="absolute left-1/2 top-[172px] h-16 w-px bg-gold/60" />
          <div className="absolute left-[16%] right-[16%] top-[236px] h-px bg-gold/35" />
          {ecosystemNodes.map((node, i) => (
            <div
              key={node.code}
              className="absolute top-[236px] flex w-[28%] -translate-x-1/2 flex-col items-center"
              style={{ left: `${node.x}%` }}
            >
              <div className="h-4 w-4 -translate-y-1/2 rounded-full border-2 border-teal bg-background shadow-[0_0_15px_var(--teal)]" />
              <GlassCard index={i + 2} className="mt-5 w-full max-w-[210px] p-5 text-center">
                <Eyebrow className="text-teal">
                  {node.code} / {node.kind}
                </Eyebrow>
                <h3 className="mt-3 font-display font-semibold">{node.name}</h3>
                <div className="mt-3">
                  <StatusBadge status={node.state === "active" ? "active" : "forming"} />
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  No verified registry entries.
                </p>
              </GlassCard>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ecosystemNodes.map((node, i) => (
          <GlassCard key={node.code} index={i + 5} className="p-4">
            <div className="flex justify-between">
              <Eyebrow>{node.code}</Eyebrow>
              <ArrowDown className="h-3 w-3 text-teal" />
            </div>
            <div className="mt-8 font-display text-2xl text-muted-foreground">—</div>
            <div className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">
              Entities registered
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
