import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AtSign, ChevronDown, ExternalLink, Globe2, LayoutGrid, Network, Users } from "lucide-react";
import { ecosystemNodes, igxOrgEntities, igxPeople, modules, personalBrand } from "@/lib/portal-data";
import {
  Eyebrow,
  SectionHeader,
  StatusBadge,
  buttonKind,
  declaredLabel,
  errorMessage,
} from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import { brandFor, brandSrc, loadBrandOverrides, useBrandVersion } from "@/lib/brand-assets";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: "Ecosystem & Directory · IJIDI Portal" },
      {
        name: "description",
        content: "The IJIDI hierarchy: governor, entities, arms, people, sites and handles.",
      },
      { property: "og:title", content: "Ecosystem & Directory · IJIDI Portal" },
      { property: "og:description", content: "Governor, entities, arms, people, sites and handles." },
    ],
  }),
  component: Ecosystem,
});

/* ------------------------------------------------------------------ */
/* Live registry (entity_status)                                       */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */
type SubItem = { id: string; label: string; pillar?: string };

// "Real Estate *draft*" -> { text: "Real Estate", tag: "draft" }
function splitTag(label: string): { text: string; tag: string | null } {
  const match = label.match(/\s*\*([^*]+)\*\s*$/);
  if (!match) return { text: label, tag: null };
  return { text: label.slice(0, match.index).trim(), tag: (match[1] ?? "").trim() || null };
}

function Portrait({ src, name, px }: { src?: string | null | undefined; name: string; px: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  return (
    <span
      className="inline-flex shrink-0 rounded-full bg-gradient-to-br from-[#E3C27A] via-[#C6A15B] to-[#5E9BFF] p-[2px] shadow-[0_0_26px_rgba(198,161,91,0.22)]"
      style={{ width: px + 4, height: px + 4 }}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0a0d14] font-display font-semibold text-foreground/80" style={{ fontSize: px / 2.4 }}>
        {src && !failed ? (
          <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
        ) : (
          name.replace(/^IJIDI\s+/i, "").charAt(0).toUpperCase()
        )}
      </span>
    </span>
  );
}

function Channels({ handle, siteUrl }: { handle?: string | undefined; siteUrl?: string | undefined }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black/25 px-2.5 py-1">
        <AtSign className="h-3 w-3 text-teal" />
        {handle ? <span className="text-foreground">{handle}</span> : <span className="text-muted-foreground">Not tracked</span>}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black/25 px-2.5 py-1">
        <Globe2 className="h-3 w-3 text-muted-foreground" />
        {siteUrl ? (
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-light underline-offset-4 hover:underline"
          >
            {siteUrl.replace("https://", "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">Not deployed</span>
        )}
      </span>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border bg-white/[0.04] px-2 py-0.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </span>
  );
}

// A slim connector card between the Governor and everything that branches
// from the Ecosystem — not an entity itself, so no channels/structure/status.
function EcosystemBridge() {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-black/10 px-5 py-4 text-center">
      <Eyebrow className="text-center text-teal">unified architecture</Eyebrow>
      <h3 className="mt-1 font-display text-base font-semibold">IJIDI Ecosystem</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
        The connective layer beneath the Governor — Vice Governor, entities and IGX AI all branch from here, not from one another.
      </p>
    </div>
  );
}

// The rows under a branch. Groups have an optional heading (a Foundation pillar).
function SubTree({ groups }: { groups: { heading: string | null; items: SubItem[]; noteFromPillar: boolean }[] }) {
  return (
    <div className="mt-3 space-y-4">
      {groups.map((group, gi) => (
        <div key={group.heading ?? `g${gi}`}>
          {group.heading && (
            <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.13em] text-teal">{group.heading}</p>
          )}
          <ul className="ml-2 space-y-0.5 border-l border-border-strong">
            {group.items.map((item) => {
              const { text, tag } = splitTag(item.label);
              return (
                <li key={item.id} className="relative py-1.5 pl-5">
                  <span aria-hidden className="absolute left-0 top-[17px] h-px w-3.5 bg-white/20" />
                  <span aria-hidden className="absolute left-[11px] top-[14px] h-[7px] w-[7px] rounded-full border border-border-strong bg-background" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
                    <span>{text}</span>
                    {tag && <Tag>{tag}</Tag>}
                  </div>
                  {group.noteFromPillar && item.pillar && (
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.pillar}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

type BranchProps = {
  index: number;
  code?: string | undefined;
  kind?: string | undefined;
  title: string;
  detail?: string | undefined;
  src?: string | null | undefined;
  px?: number | undefined;
  handle?: string | undefined;
  siteUrl?: string | undefined;
  badge?: React.ReactNode;
  recorded?: string | null | undefined;
  structureLabel: string;
  count: number;
  groups: { heading: string | null; items: SubItem[]; noteFromPillar: boolean }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link?: { to: (typeof modules)[number]["to"]; label: string } | undefined;
  big?: boolean | undefined;
};

function Branch(props: BranchProps) {
  const { open, onOpenChange } = props;
  return (
    <GlassCard index={props.index} variant={props.big ? "elevated" : "default"} selected={props.big === true}>
      <div className="flex flex-wrap items-start gap-4">
        <Portrait src={props.src} name={props.title} px={props.px ?? 56} />
        <div className="min-w-0 flex-1">
          {(props.code || props.kind) && (
            <Eyebrow className="text-teal">{[props.code, props.kind].filter(Boolean).join(" / ")}</Eyebrow>
          )}
          <h3 className={cn("mt-1 font-display font-semibold", props.big ? "text-2xl" : "text-lg")}>{props.title}</h3>
          {props.detail && <p className="mt-1 text-xs text-muted-foreground">{props.detail}</p>}
          {(props.handle !== undefined || props.siteUrl !== undefined || props.big) && (
            <Channels handle={props.handle} siteUrl={props.siteUrl} />
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {props.badge}
          {props.recorded && <span className="font-mono text-xs text-muted-foreground">Recorded {props.recorded}</span>}
          {props.link && (
            <Link
              to={props.link.to}
              className="font-mono text-xs uppercase tracking-[0.12em] text-blue-light underline-offset-4 hover:underline"
            >
              {props.link.label} →
            </Link>
          )}
        </div>
      </div>
      {props.count > 0 && (
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger className="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-black/25 px-3.5 py-2 font-mono text-xs uppercase tracking-[0.13em] text-foreground transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60">
            <span>
              {props.structureLabel} · {props.count}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SubTree groups={props.groups} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </GlassCard>
  );
}

function plainGroup(items: readonly SubItem[]) {
  return [{ heading: null, items: [...items], noteFromPillar: true }];
}

// Foundation arms are grouped under their pillar; other pillar text is a one-line note.
function pillarGroups(items: readonly SubItem[]) {
  const groups: { heading: string | null; items: SubItem[]; noteFromPillar: boolean }[] = [];
  for (const item of items) {
    const heading = item.pillar ?? null;
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(item);
    else groups.push({ heading, items: [item], noteFromPillar: false });
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/* Tab 1: Hierarchy                                                    */
/* ------------------------------------------------------------------ */
const ENTITY_KEYS = ["group", "atelier", "media", "foundation"] as const;

function HierarchyTab({
  rows,
  isLoading,
  isError,
}: {
  rows: EntityRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({
    mandela: true,
    ifeoma: false,
    group: false,
    foundation: true,
    atelier: true,
    media: true,
  });
  const setAll = (value: boolean) =>
    setOpenKeys(Object.fromEntries(Object.keys(openKeys).map((key) => [key, value])));
  const setOne = (key: string) => (value: boolean) => setOpenKeys((prev) => ({ ...prev, [key]: value }));

  const igxModule = modules.find((m) => m.name === "IGX AI");

  const badgeFor = (row: EntityRow | undefined) => {
    const state = row?.current_state?.trim() ?? "";
    if (isLoading) return <StatusBadge state="pending" label="CHECKING…" />;
    if (isError) return <StatusBadge state="error" label="UNAVAILABLE" />;
    if (state) {
      // entity_status is typed in by hand, never checked: declared, not verified.
      return <StatusBadge state="pending" label={declaredLabel(state)} />;
    }
    return <StatusBadge state="not-connected" label="NOT TRACKED" />;
  };

  const trunk = "absolute bottom-6 left-3 top-2 w-px bg-gradient-to-b from-white/30 via-white/15 to-transparent sm:left-5";

  // The branches under the governor, in order: ecosystem connector, vice
  // governor, the four entities, IGX AI.
  const branches: { key: string; node: React.ReactNode }[] = [
    {
      key: "ecosystem",
      node: <EcosystemBridge />,
    },
    {
      key: "ifeoma",
      node: (
        <Branch
          index={2}
          kind="vice governor"
          title={igxPeople.ifeoma.label}
          detail="Vice Governor, with product lines under her name"
          src={brandSrc("ifeoma")}
          structureLabel="Roles & product lines"
          count={igxPeople.ifeoma.subs.length}
          groups={plainGroup(igxPeople.ifeoma.subs)}
          open={!!openKeys["ifeoma"]}
          onOpenChange={setOne("ifeoma")}
        />
      ),
    },
  ];
  ENTITY_KEYS.forEach((key, i) => {
    const org = igxOrgEntities[key];
    const mod = modules.find((m) => m.name === org.label);
    const node = ecosystemNodes.find((n) => n.name === org.label);
    const row = findRow(rows, org.label);
    const subs = org.subs as unknown as readonly SubItem[];
    branches.push({
      key,
      node: (
        <Branch
          index={i + 3}
          code={node?.code}
          kind={node?.kind}
          title={org.label}
          detail={mod?.detail}
          src={row?.logo_url || brandSrc(brandFor(org.label)?.id ?? "")}
          handle={mod && "handle" in mod ? mod.handle : undefined}
          siteUrl={mod && "siteUrl" in mod ? mod.siteUrl : undefined}
          badge={badgeFor(row)}
          recorded={formatRecorded(row?.last_updated)}
          structureLabel={
            key === "foundation" ? "Arms by pillar" : key === "group" ? "Objects (draft)" : key === "atelier" ? "Lines" : "Properties"
          }
          count={subs.length}
          groups={key === "foundation" ? pillarGroups(subs) : plainGroup(subs)}
          open={!!openKeys[key]}
          onOpenChange={setOne(key)}
          link={mod ? { to: mod.to, label: `Open ${org.label.replace("IJIDI ", "")}` } : undefined}
        />
      ),
    });
  });
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Governor → ecosystem → vice governor → entities → arms
        </p>
        <div className="flex gap-2">
          {(["Expand all", "Collapse all"] as const).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setAll(label === "Expand all")}
              className="rounded-full border border-border bg-black/25 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Root: the governor */}
      <Branch
        index={1}
        big
        px={84}
        code={personalBrand.code}
        kind="root · governor"
        title={personalBrand.name}
        detail={personalBrand.detail}
        src={brandSrc("mandela")}
        handle={personalBrand.handle}
        siteUrl={personalBrand.siteUrl}
        badge={<StatusBadge state="verified" label="GOVERNOR" />}
        structureLabel="Roles & lanes"
        count={igxPeople.mandela.subs.length}
        groups={plainGroup(igxPeople.mandela.subs)}
        open={!!openKeys["mandela"]}
        onOpenChange={setOne("mandela")}
      />

      {/* Everything else hangs off one gold trunk */}
      <div className="relative mt-5 pl-7 sm:pl-12">
        <span aria-hidden className={trunk} />

        {branches.map((entry) => (
          <div key={entry.key} className="relative mb-5 last:mb-0">
            <span aria-hidden className="absolute -left-4 top-9 h-px w-4 bg-white/25 sm:-left-7 sm:w-7" />
            <span
              aria-hidden
              className="absolute -left-5 top-[33px] h-2 w-2 rounded-full border border-gold bg-background shadow-[0_0_10px_var(--gold-glow)] sm:-left-8"
            />
            {entry.node}
          </div>
        ))}
      </div>

      {/* IGX AI: outside the trunk, drawn as a cross-ecosystem layer */}
      <IgxCrossLayer igxModule={igxModule} />
    </div>
  );
}

// IGX AI sits outside the trunk entirely — a cross-ecosystem layer, not a
// seventh branch off the Governor. Teal-accented and undocked from the
// gold spine so it reads as "connects to everything above", not "one more
// entity below Group."
function IgxCrossLayer({ igxModule }: { igxModule: (typeof modules)[number] | undefined }) {
  if (!igxModule) return null;
  return (
    <div className="mt-8">
      <div className="section-divider" />
      <p className="mb-3 text-center font-mono text-xs uppercase tracking-[0.14em] text-teal">
        Cross-ecosystem — reasons across every branch above, owns none of them
      </p>
      <GlassCard>
        <div className="flex flex-wrap items-start gap-4">
          <Portrait src={brandSrc("igx")} name={igxModule.name} px={56} />
          <div className="min-w-0 flex-1">
            <Eyebrow className="text-teal">
              {[igxModule.code, "executive intelligence layer"].filter(Boolean).join(" / ")}
            </Eyebrow>
            <h3 className="mt-1 font-display text-lg font-semibold">{igxModule.name}</h3>
            {igxModule.detail && <p className="mt-1 text-xs text-muted-foreground">{igxModule.detail}</p>}
            <p className="mt-2 max-w-xl text-xs text-muted-foreground">
              Reads and reasons across Group, Atelier, Media and Foundation — and the Portal itself.
              Proposals, not actions: nothing executes without the Governor's approval.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge state="pending" label={declaredLabel("ready")} />
            <Link
              to={igxModule.to}
              className="font-mono text-xs uppercase tracking-[0.12em] text-blue-light underline-offset-4 hover:underline"
            >
              Open IGX AI →
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: Directory                                                    */
/* ------------------------------------------------------------------ */
function DirectoryTab() {
  // Mandela's card already sits in this grid as the founder/personal-brand
  // entry, so Ifeoma — Vice Governor, not tied to one entity — sits beside
  // him rather than being absent from Directory while present in Hierarchy.
  const ifeomaEntry = {
    name: igxPeople.ifeoma.label,
    code: "VGV-01",
    detail: "Vice Governor — Foundation & home production lines",
    state: "active" as const,
  };
  const entries = [...modules, personalBrand, ifeomaEntry];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => {
        const asset = brandFor(entry.name);
        const to = "to" in entry ? entry.to : undefined;
        const state = "state" in entry ? entry.state : undefined;
        return (
          <GlassCard key={entry.code}>
            <div className="flex items-start gap-3.5">
              <Portrait src={asset ? brandSrc(asset.id) : null} name={entry.name} px={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Eyebrow>{entry.code}</Eyebrow>
                  {state && <StatusBadge state="pending" label={declaredLabel(state)} />}
                </div>
                <h3 className="mt-1.5 font-display text-lg font-semibold">{entry.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p>
              </div>
            </div>
            <Channels handle={"handle" in entry ? entry.handle : undefined} siteUrl={"siteUrl" in entry ? entry.siteUrl : undefined} />
            {to && (
              <Link
                to={to}
                className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.12em] text-blue-light underline-offset-4 hover:underline"
              >
                Open page →
              </Link>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 3: People                                                       */
/* ------------------------------------------------------------------ */
function PeopleTab() {
  const people = [
    {
      key: "mandela",
      name: igxPeople.mandela.label,
      title: "Founder & sole governor",
      src: brandSrc("mandela"),
      handle: personalBrand.handle as string | undefined,
      heading: "Roles & lanes",
      subs: igxPeople.mandela.subs as unknown as readonly SubItem[],
    },
    {
      key: "ifeoma",
      name: igxPeople.ifeoma.label,
      title: "Vice Governor",
      src: brandSrc("ifeoma"),
      handle: undefined as string | undefined,
      heading: "Roles & product lines",
      subs: igxPeople.ifeoma.subs as unknown as readonly SubItem[],
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {people.map((person, i) => (
        <GlassCard key={person.key} index={i + 1}>
          <div className="flex items-center gap-4">
            <Portrait src={person.src} name={person.name} px={72} />
            <div className="min-w-0">
              <Eyebrow className="text-teal">{person.title}</Eyebrow>
              <h3 className="mt-1 font-display text-xl font-semibold">{person.name}</h3>
              <div className="mt-2 flex items-center gap-1.5 font-mono text-xs">
                <AtSign className="h-3 w-3 text-teal" />
                {person.handle ? (
                  <span className="text-foreground">{person.handle}</span>
                ) : (
                  <span className="text-muted-foreground">Not tracked</span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">{person.heading}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {person.subs.map((sub) => {
              const { text, tag } = splitTag(sub.label);
              return (
                <span
                  key={sub.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black/25 px-3 py-1 text-xs text-foreground"
                >
                  {text}
                  {tag && <Tag>{tag}</Tag>}
                </span>
              );
            })}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function Ecosystem() {
  const { data: rows, isLoading, isError, error, refetch } = useEntityRows();
  useBrandVersion();
  useEffect(() => {
    void loadBrandOverrides();
  }, []);
  const sitesListed = [...modules, personalBrand].filter((entry) => "siteUrl" in entry && entry.siteUrl).length;

  return (
    <div>
      <GlassCard className="mb-6 px-5 py-4 sm:px-6">
        <SectionHeader
          eyebrow="04 / ECOSYSTEM & DIRECTORY"
          title="One root. Clear boundaries."
          detail="The whole structure in one place: who governs, each entity and its arms, and where each one lives online. States come from the registry; anything unconfirmed reads as not tracked."
          action={<StatusBadge state="verified" label={`${sitesListed} SITES LISTED`} />}
        />
      </GlassCard>

      {/* Registry state (DESIGN.md page states): a failed query is an error, and an
          empty registry says so, instead of every badge silently reading NOT TRACKED. */}
      {isError && (
        <GlassCard variant="danger" className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-destructive">
            Could not load entity states: {errorMessage(error)}.
          </p>
          <button type="button" onClick={() => refetch()} className={buttonKind.secondary}>
            Retry
          </button>
        </GlassCard>
      )}
      {!isLoading && !isError && (rows?.length ?? 0) === 0 && (
        <p className="mb-6 font-mono text-xs text-muted-foreground">No entities recorded yet.</p>
      )}
      <Tabs defaultValue="hierarchy">
        <TabsList className="mb-4">
          <TabsTrigger value="hierarchy">
            <Network className="mr-1.5 h-3.5 w-3.5" />
            Hierarchy
          </TabsTrigger>
          <TabsTrigger value="directory">
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="people">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            People
          </TabsTrigger>
        </TabsList>
        <TabsContent value="hierarchy">
          <HierarchyTab rows={rows} isLoading={isLoading} isError={isError} />
        </TabsContent>
        <TabsContent value="directory">
          <DirectoryTab />
        </TabsContent>
        <TabsContent value="people">
          <PeopleTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
