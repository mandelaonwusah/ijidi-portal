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
// The files in public/brand/ are the defaults. The governor can replace any picture from
// inside the portal ("Change picture", from a phone or a computer). Replacements live in
// the Supabase Storage bucket "brand" and win over the default until "Use default" is used.

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

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
    src: `${B}/ijidi-fan-emblem.png`,
    placedIn: ["Sidebar badge", "Login page"],
    leads: ["Browser tab icon", "Loading screen"],
    match: ["portal"],
  },
  {
    id: "igx",
    label: "IGX AI core",
    kind: "igx",
    src: `${B}/igx-core.jpg`,
    placedIn: ["IGX AI orb", "IGX AI chat avatar", "Floating IGX AI button (bottom right)"],
    leads: [],
    match: ["igx"],
  },

  // ---- Entities ---------------------------------------------------------------
  {
    id: "group",
    label: "IJIDI Group",
    kind: "entity",
    src: `${B}/ijidi-group.webp`,
    tagline: "Converging Capital | Building legacy",
    placedIn: ["Ecosystem map (matched by name)", "Entity dock (matched by name)", "IGX AI scope picker"],
    leads: ["ijidigroup.com header"],
    match: ["group"],
  },
  {
    id: "foundation",
    label: "IJIDI Foundation",
    kind: "entity",
    src: `${B}/ijidi-foundation.webp`,
    tagline: "Empowering Communities | Restoring Hope",
    placedIn: ["Ecosystem map (matched by name)", "Entity dock (matched by name)", "IGX AI scope picker"],
    leads: ["Foundation site (ijidi.org)"],
    match: ["foundation"],
  },
  {
    id: "atelier",
    label: "IJIDI Atelier",
    kind: "entity",
    src: `${B}/ijidi-atelier.webp`,
    tagline: "Designed for Distinction.",
    placedIn: ["Ecosystem map (matched by name)", "IGX AI scope picker"],
    leads: ["atelier.ijidigroup.com (not deployed yet)"],
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
    src: `${B}/ijidi-orbit.webp`,
    tagline: "Empowering Global Connection",
    placedIn: ["Ecosystem map (matched by name)", "IGX AI scope picker"],
    leads: ["media.ijidigroup.com (not deployed yet)"],
    match: ["orbit"],
  },

  // ---- People -----------------------------------------------------------------
  {
    id: "mandela",
    label: "Mandela Onwusah",
    kind: "person",
    src: `${B}/mandela.webp`,
    placedIn: ["Settings identity panel", "Header governor chip", "IGX AI chat avatar", "Entity dock (matched by name)"],
    leads: ["mandelaonwusah.com"],
    match: ["mandela"],
  },
  {
    id: "ifeoma",
    label: "Ifeoma Peace David",
    kind: "person",
    src: `${B}/ifeoma.webp`,
    placedIn: ["Entity dock (matched by name)", "IGX AI scope picker"],
    leads: ["Foundation trustee card", "ifeoma.ijidigroup.com (not built yet)"],
    match: ["ifeoma"],
  },
];

const BY_ID = new Map(BRAND_ASSETS.map((asset) => [asset.id, asset]));

export function brandById(id: string): BrandAsset | undefined {
  return BY_ID.get(id);
}

/** The picture for an id, or null if there is none (or the artwork is missing).
 *  A picture uploaded from the portal wins over the default file. */
export function brandSrc(id: string): string | null {
  const asset = BY_ID.get(id);
  if (!asset) return null;
  return overrides[id] ?? asset.src ?? null;
}

/* ---------------- pictures changed from inside the portal ---------------- */

const BUCKET = "brand";
const overrides: Record<string, string> = {};
let overridesVersion = 0;
let overridesLoaded = false;
let overridesLoading: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function emit() {
  overridesVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Call this in a component that shows a brand picture so it redraws when one changes. */
export function useBrandVersion(): number {
  return useSyncExternalStore(subscribe, () => overridesVersion, () => 0);
}

function publicUrl(name: string, stamp?: string | null): string {
  const base = supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  const time = stamp ? Date.parse(stamp) : NaN;
  return `${base}?v=${Number.isFinite(time) ? time : Date.now()}`;
}

export function hasBrandOverride(id: string): boolean {
  return id in overrides;
}

/** Reads which pictures have been replaced. Safe to call often; it only fetches once.
 *  Resolves true when at least one replacement picture was found.
 *  If the storage bucket is missing or unreadable, the default pictures stay in place. */
export function loadBrandOverrides(force = false): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (overridesLoaded && !force) return Promise.resolve(Object.keys(overrides).length > 0);
  if (overridesLoading) return overridesLoading;
  overridesLoading = (async () => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 200 });
      if (error || !data) return false;
      const next: Record<string, string> = {};
      for (const file of data) {
        if (BY_ID.has(file.name)) next[file.name] = publicUrl(file.name, file.updated_at);
      }
      const changed = JSON.stringify(next) !== JSON.stringify(overrides);
      Object.keys(overrides).forEach((key) => delete overrides[key]);
      Object.assign(overrides, next);
      overridesLoaded = true;
      if (changed) emit();
      return Object.keys(overrides).length > 0;
    } catch {
      /* keep the defaults */
      return false;
    } finally {
      overridesLoading = null;
    }
  })();
  return overridesLoading;
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const OUTPUT_SIZE = 512;

// Portraits fill the square (centre-cropped). Logos are fitted inside it, never cropped.
async function prepareImage(file: File, fill: boolean): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot resize pictures.");
  const scale = fill
    ? Math.max(OUTPUT_SIZE / bitmap.width, OUTPUT_SIZE / bitmap.height)
    : Math.min(OUTPUT_SIZE / bitmap.width, OUTPUT_SIZE / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (OUTPUT_SIZE - width) / 2, (OUTPUT_SIZE - height) / 2, width, height);
  bitmap.close();
  const toBlob = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp", 0.9);
  if (webp && webp.type === "image/webp") return webp;
  const png = await toBlob("image/png");
  if (!png) throw new Error("Could not prepare that picture.");
  return png;
}

function friendlyStorageError(message: string): string {
  if (/bucket not found/i.test(message)) return "Picture storage is not set up yet.";
  if (/row-level security|not authorized|unauthorized|policy|permission/i.test(message)) {
    return "Only the governor can change pictures.";
  }
  return message;
}

export type BrandChangeResult = { ok: true } | { ok: false; error: string };

/** Replace a picture with a photo from the phone or computer. */
export async function uploadBrandImage(id: string, file: File): Promise<BrandChangeResult> {
  const asset = BY_ID.get(id);
  if (!asset) return { ok: false, error: "That picture is not in the brand list." };
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return { ok: false, error: "Choose a photo or image file (JPG, PNG or WebP)." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "That file is over 15 MB. Choose a smaller one." };
  }
  let blob: Blob;
  try {
    blob = await prepareImage(file, asset.kind === "person");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not read that picture." };
  }
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(id, blob, { upsert: true, contentType: blob.type, cacheControl: "300" });
  if (error) return { ok: false, error: friendlyStorageError(error.message) };
  overrides[id] = publicUrl(id);
  emit();
  return { ok: true };
}

/** Go back to the default file in public/brand. */
export async function resetBrandImage(id: string): Promise<BrandChangeResult> {
  if (!hasBrandOverride(id)) return { ok: true };
  const { error } = await supabase.storage.from(BUCKET).remove([id]);
  if (error) return { ok: false, error: friendlyStorageError(error.message) };
  delete overrides[id];
  emit();
  return { ok: true };
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
