import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, GitBranch, Globe2 } from "lucide-react";
import { ecosystemNodes } from "@/lib/portal-data";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import { brandFor, brandSrc } from "@/lib/brand-assets";
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

// Real registry rows. entity_status is the governor's own record of each arm; the
// map shows exactly what is recorded there, and says so when nothing is.
type EntityRow = {
  entity_name: string | null;
  current_state: string | null;
  last_updated: string | null;
  logo_url: string | null;
};

function useEntityRows() {
  return useQuery({
    queryKey: ["ecosystem-entity-status"],
    retry: 1,
    staleTime: 60_000,
    queryFn: async (): Promise<EntityRow[]> => {
      const { data, error } = await supabase
        .from("entity_status")
        .select("entity_name, current_state, last_updated, logo_url");
      if (error) throw error;
      return (data ?? []) as EntityRow[];
    },
  });
}

// Match a map node to its registry row by name ("IJIDI Group" ↔ "Group").
function findRow(rows: EntityRow[] | undefined, nodeName: string): EntityRow | undefined {
  if (!rows) return undefined;
  const node = nodeName.toLowerCase().trim();
  return rows.find((row) => {
    const entity = (row.entity_name ?? "").toLowerCase().trim();
    return entity.length > 0 && (node.includes(entity) || entity.includes(node));
  });
}

function formatRecorded(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// An entity logo: the registry row's own picture if it has one, otherwise the brand
// library's (matched by name). Nothing shows if neither exists or the file fails to load.
function EntityLogo({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="mx-auto mb-3 h-14 w-14 rounded-full object-cover shadow-[0_0_18px_rgba(198,161,91,0.25)]"
    />
  );
}

function Ecosystem() {
  const { data: rows, isLoading, isError } = useEntityRows();

  return (
    <div>
      {/* Heading sits on glass so it stays readable over the board */}
      <GlassCard className="mb-6 px-5 py-4 sm:px-6">
        <SectionHeader
          eyebrow="02 / ECOSYSTEM"
          title="One root. Clear boundaries."
          detail="A visual registry of the operating arms. Each state shown is the one recorded in the registry; nothing is assumed."
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
          {ecosystemNodes.map((node, i) => {
            const row = findRow(rows, node.name);
            const state = row?.current_state?.trim() ?? "";
            const recorded = formatRecorded(row?.last_updated);
            const badge = isLoading ? (
              <StatusBadge status="forming" label="CHECKING" />
            ) : isError ? (
              <StatusBadge status="error" label="UNAVAILABLE" />
            ) : state ? (
              <StatusBadge
                status={state.toLowerCase() === "live" ? "active" : "forming"}
                label={state.toUpperCase()}
              />
            ) : (
              <StatusBadge status="forming" label="NOT TRACKED" />
            );
            return (
              <div
                key={node.code}
                className="absolute top-[236px] flex w-[28%] -translate-x-1/2 flex-col items-center"
                style={{ left: `${node.x}%` }}
              >
                <div className="h-4 w-4 -translate-y-1/2 rounded-full border-2 border-teal bg-background shadow-[0_0_15px_var(--teal)]" />
                <GlassCard index={i + 2} className="mt-5 w-full max-w-[210px] p-5 text-center">
                  <EntityLogo
                    src={row?.logo_url || brandSrc(brandFor(node.name)?.id ?? "")}
                    alt={`${node.name} logo`}
                  />
                  <Eyebrow className="text-teal">
                    {node.code} / {node.kind}
                  </Eyebrow>
                  <h3 className="mt-3 font-display font-semibold">{node.name}</h3>
                  <div className="mt-3">{badge}</div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {recorded ? `Recorded ${recorded}` : "No verified registry entries."}
                  </p>
                </GlassCard>
              </div>
            );
          })}
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
