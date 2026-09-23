import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AtSign, ExternalLink, Globe2, GitBranch, ArrowDown, Bot, Server, Network } from "lucide-react";
import { ecosystemNodes, modules, personalBrand } from "@/lib/portal-data";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import { brandFor, brandSrc } from "@/lib/brand-assets";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: "Ecosystem · IJIDI Portal" },
      {
        name: "description",
        content: "Entities, people, IGX AI, sites and handles across the IJIDI ecosystem.",
      },
      { property: "og:title", content: "Ecosystem · IJIDI Portal" },
      { property: "og:description", content: "Entities, people, IGX AI, sites and handles." },
    ],
  }),
  component: Ecosystem,
});

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

// ---------------------------------------------------------------------------
// TAB CONTENTS
// ---------------------------------------------------------------------------

function EntitiesTab({ rows, isLoading, isError }: {
  rows: EntityRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
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
    </GlassCard>
  );
}

function PeopleContactsTab() {
  const entries = [...modules, personalBrand];
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <div key={entry.code} className="panel-bracket p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>{entry.code}</Eyebrow>
            {"state" in entry && entry.state && <StatusBadge status={entry.state} />}
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold">{entry.name}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{entry.detail}</p>
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <AtSign className="h-3 w-3 text-teal" />
              {entry.handle ? (
                <span className="text-foreground">{entry.handle}</span>
              ) : (
                <span className="text-muted-foreground">Not tracked</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IgxAiTab() {
  const aiEntries = [
    { label: "Models", value: "Not tracked" },
    { label: "Agents", value: "Not tracked" },
    { label: "Extensions", value: "Not tracked" },
  ];
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {aiEntries.map((entry, i) => (
        <GlassCard key={entry.label} index={i + 1} className="p-6">
          <div className="flex items-center gap-3">
            <Bot className="h-4 w-4 text-gold" />
            <Eyebrow>{entry.label}</Eyebrow>
          </div>
          <div className="mt-5 font-mono text-sm text-muted-foreground">
            {entry.value}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function SitesHandlesTab() {
  const entries = [...modules, personalBrand];
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <div key={entry.code} className="panel-bracket p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>{entry.code}</Eyebrow>
            {"state" in entry && entry.state && <StatusBadge status={entry.state} />}
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold">{entry.name}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{entry.detail}</p>
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Globe2 className="h-3 w-3 text-gold" />
              {entry.siteUrl ? (
                <a href={entry.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-gold underline-offset-4 hover:underline"
                >
                  {entry.siteUrl.replace("https://", "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">Not deployed</span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <AtSign className="h-3 w-3 text-teal" />
              {entry.handle ? (
                <span className="text-foreground">{entry.handle}</span>
              ) : (
                <span className="text-muted-foreground">Not tracked</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

function Ecosystem() {
  const [open, setOpen] = useState(true);
  const { data: rows, isLoading, isError } = useEntityRows();

  return (
    <div>
      <GlassCard className="mb-6 px-5 py-4 sm:px-6">
        <SectionHeader
          eyebrow="02 / ECOSYSTEM"
          title="One root. Clear boundaries."
          detail="A visual registry of the operating arms. Each state shown is the one recorded in the registry; nothing is assumed."
          action={<StatusBadge status="active" label="GOVERNOR SESSION" />}
        />
      </GlassCard>

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="mb-4 flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 rounded-md border border-gold/30 bg-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60">
            <Network className="h-3.5 w-3.5" />
            {open ? "Collapse" : "Expand"} ecosystem directory
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <Tabs defaultValue="entities">
            <TabsList className="mb-4">
              <TabsTrigger value="entities">Entities</TabsTrigger>
              <TabsTrigger value="people">People & Contacts</TabsTrigger>
              <TabsTrigger value="igx-ai">IGX AI</TabsTrigger>
              <TabsTrigger value="sites">Sites & Handles</TabsTrigger>
            </TabsList>
            <TabsContent value="entities">
              <EntitiesTab rows={rows} isLoading={isLoading} isError={isError} />
            </TabsContent>
            <TabsContent value="people">
              <PeopleContactsTab />
            </TabsContent>
            <TabsContent value="igx-ai">
              <IgxAiTab />
            </TabsContent>
            <TabsContent value="sites">
              <SitesHandlesTab />
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
