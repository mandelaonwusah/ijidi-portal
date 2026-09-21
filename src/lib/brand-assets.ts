// src/lib/brand-assets.ts
// One registry for every logo and portrait in the portal.
//
// - `src` is the file under public/brand/ (circle-cropped, transparent outside the frame).
// - `placedIn` lists where the portal already shows it. Keep it truthful.
// - `leads` lists where it is meant to go next. This is the to-do list for the logos
//   that are not on a page yet, so nothing is forgotten.
// - `match` are lowercase words that identify the asset in a module or entity name, so
//   the IGX AI scope picker and the Ecosystem map can find a logo without hardcoding.
//
// To add or replace a picture: put the file in public/brand/ and edit its entry here.

export type BrandKind = "portal" | "igx" | "entity" | "media" | "person";

export interface BrandAsset {
  id: string;
  label: string;
  kind: BrandKind;
  /** Path under public/. null = artwork not supplied yet. */
  src: string | null;
  tagline?: string;
  placedIn: string[];
  leads: string[];
  match: string[];
}

const B = "/brand";

export const BRAND_ASSETS: BrandAsset[] = [
  // ---- The portal and IGX AI --------------------------------------------------
  {
    id: "portal",
    label: "IJIDI Portal emblem",
    kind: "portal",
    src: `${B}/ijidi-fan-emblem.webp`,
    placedIn: ["Login page (the PNG in /public)"],
    leads: ["Sidebar badge (top left)", "Browser tab icon", "Loading screen"],
    match: ["portal"],
  },
  {
    id: "igx",
    label: "IGX AI core",
    kind: "igx",
    src: `${B}/igx-core.jpg`,
    placedIn: ["IGX AI orb"],
    leads: ["IGX AI chat avatar"],
    match: ["igx"],
  },

  // ---- Entities ---------------------------------------------------------------
  {
    id: "group",
    label: "IJIDI Group",
    kind: "entity",
    src: `${B}/ijidi-group.webp`,
    tagline: "Converging Capital | Building legacy",
    placedIn: [],
    leads: ["IGX AI scope: Group", "Ecosystem map: Group node", "Sidebar entity dock"],
    match: ["group"],
  },
  {
    id: "foundation",
    label: "IJIDI Foundation",
    kind: "entity",
    src: `${B}/ijidi-foundation.webp`,
    tagline: "Empowering Communities | Restoring Hope",
    placedIn: [],
    leads: ["IGX AI scope: Foundation", "Ecosystem map: Foundation node", "Foundation site (ijidi.org)"],
    match: ["foundation"],
  },
  {
    id: "atelier",
    label: "IJIDI Atelier",
    kind: "entity",
    src: `${B}/ijidi-atelier.webp`,
    tagline: "Designed for Distinction.",
    placedIn: [],
    leads: ["IGX AI scope: Atelier", "Ecosystem map: Atelier node", "atelier.ijidigroup.com (not deployed yet)"],
    match: ["atelier"],
  },

  // ---- IJIDI Media properties (none has a page in the portal yet) -------------
  {
    id: "wild",
    label: "IJIDI Wild",
    kind: "media",
    src: `${B}/ijidi-wild.webp`,
    tagline: "Where Nature Speaks",
    placedIn: [],
    leads: ["IGX AI scope: Media › Wild", "Ecosystem map: Media", "media.ijidigroup.com (not deployed yet)"],
    match: ["wild"],
  },
  {
    id: "toons",
    label: "IJIDI Toons",
    kind: "media",
    src: `${B}/ijidi-toons.webp`,
    tagline: "Where Imagination Comes Alive",
    placedIn: [],
    leads: ["IGX AI scope: Media › Toons", "media.ijidigroup.com (not deployed yet)"],
    match: ["toons"],
  },
  {
    id: "arena",
    label: "IJIDI Arena",
    kind: "media",
    src: `${B}/ijidi-arena.webp`,
    tagline: "Where Champions Rise",
    placedIn: [],
    leads: ["IGX AI scope: Media › Arena", "media.ijidigroup.com (not deployed yet)"],
    match: ["arena"],
  },
  {
    id: "stage",
    label: "IJIDI Stage",
    kind: "media",
    src: `${B}/ijidi-stage.webp`,
    tagline: "Where Stories Come Alive",
    placedIn: [],
    leads: ["IGX AI scope: Media › Stage", "media.ijidigroup.com (not deployed yet)"],
    match: ["stage"],
  },
  {
    id: "restore",
    label: "IJIDI Restore",
    kind: "media",
    src: `${B}/ijidi-restore.webp`,
    tagline: "From what was to what can be",
    placedIn: [],
    leads: ["IGX AI scope: Media › Restore", "media.ijidigroup.com (not deployed yet)"],
    match: ["restore"],
  },
  {
    id: "sound",
    label: "IJIDI Sound",
    kind: "media",
    src: `${B}/ijidi-sound.webp`,
    tagline: "The Sound of Our Stories",
    placedIn: [],
    leads: ["IGX AI scope: Media › Sound", "media.ijidigroup.com (not deployed yet)"],
    match: ["sound"],
  },
  {
    // The seventh confirmed Media property. No artwork has been supplied.
    id: "orbit",
    label: "IJIDI Orbit",
    kind: "media",
    src: null,
    tagline: "Empowering Global Connection",
    placedIn: [],
    leads: ["Logo artwork still needed", "IGX AI scope: Media › Orbit (once the logo exists)"],
    match: ["orbit"],
  },

  // ---- People -----------------------------------------------------------------
  {
    id: "mandela",
    label: "Mandela Onwusah",
    kind: "person",
    src: `${B}/mandela.webp`,
    placedIn: [],
    leads: ["IGX AI scope: Mandela", "Settings: identity panel", "Header: governor chip"],
    match: ["mandela"],
  },
  {
    id: "ifeoma",
    label: "Ifeoma Peace David",
    kind: "person",
    src: `${B}/ifeoma.webp`,
    placedIn: [],
    leads: ["IGX AI scope: Ifeoma", "Foundation trustee card"],
    match: ["ifeoma"],
  },
];

const BY_ID = new Map(BRAND_ASSETS.map((asset) => [asset.id, asset]));

export function brandById(id: string): BrandAsset | undefined {
  return BY_ID.get(id);
}

/** The picture for an id, or null if there is none (or the artwork is missing). */
export function brandSrc(id: string): string | null {
  return BY_ID.get(id)?.src ?? null;
}

// Specific names first, so "Media › Wild" finds Wild rather than Group.
const MATCH_ORDER = [
  "wild", "toons", "arena", "stage", "restore", "sound", "orbit",
  "foundation", "atelier", "mandela", "ifeoma", "igx", "group", "portal",
];

/** Find a brand asset from any module, entity or person label. */
export function brandFor(...texts: (string | null | undefined)[]): BrandAsset | undefined {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  if (!hay) return undefined;
  for (const id of MATCH_ORDER) {
    const asset = BY_ID.get(id);
    if (asset && asset.match.some((word) => hay.includes(word))) return asset;
  }
  return undefined;
}

/** Assets with no page yet: the lead list. */
export function unplacedAssets(): BrandAsset[] {
  return BRAND_ASSETS.filter((asset) => asset.placedIn.length === 0);
}
