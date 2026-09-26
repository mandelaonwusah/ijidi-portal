// src/lib/ui-prefs.ts
// Interface preferences the governor can change in Settings. Saved in this
// browser (localStorage) and shared live between the Settings page and the shell.
import { useSyncExternalStore } from "react";

export type TickerSpeed = "slow" | "normal" | "fast";

// Circuit background studio -------------------------------------------------
// Everything here defaults to exactly the look the board already had, so a
// governor who never opens the studio sees no change at all.
export type CircuitBackground =
  | "obsidian" // the existing default — unchanged
  | "black"
  | "midnight"
  | "emerald"
  | "bronze"
  | "violet"
  | "crimson"
  | "custom";

export type CircuitPalette =
  | "portal" // the existing default — unchanged
  | "ember"
  | "glacier"
  | "crimson"
  | "amethyst"
  | "sunset"
  | "mono"
  | "gold";

export type CircuitMotion = "calm" | "normal" | "lively";

export const CIRCUIT_BACKGROUND_HEX: Record<Exclude<CircuitBackground, "custom">, string> = {
  obsidian: "#03050a",
  black: "#02030a",
  midnight: "#061a48",
  emerald: "#04211a",
  bronze: "#1a1204",
  violet: "#170a33",
  crimson: "#2a0509",
};

export const CIRCUIT_BACKGROUND_LABELS: Record<CircuitBackground, string> = {
  obsidian: "Obsidian (default)",
  black: "Black",
  midnight: "Midnight",
  emerald: "Emerald",
  bronze: "Royal bronze",
  violet: "Deep violet",
  crimson: "Crimson night",
  custom: "Custom",
};

export const CIRCUIT_PALETTE_LABELS: Record<CircuitPalette, string> = {
  portal: "Portal (default)",
  ember: "Ember",
  glacier: "Glacier",
  crimson: "Crimson",
  amethyst: "Amethyst",
  sunset: "Sunset",
  mono: "Mono",
  gold: "IJIDI gold",
};

export const CIRCUIT_MOTION_LABELS: Record<CircuitMotion, string> = {
  calm: "Calm",
  normal: "Normal (default)",
  lively: "Lively",
};

/** Two representative hexes per palette, for the studio's swatch chips —
 * kept lightweight here so Settings doesn't need to import the canvas engine. */
export const CIRCUIT_PALETTE_PREVIEW: Record<CircuitPalette, [string, string]> = {
  portal: ["#4F86F7", "#C6A15B"],
  ember: ["#E86A3C", "#F0B860"],
  glacier: ["#4FA9E8", "#8FDCEF"],
  crimson: ["#D33A54", "#E084A0"],
  amethyst: ["#7C56E0", "#A47EE8"],
  sunset: ["#E0648C", "#F0C070"],
  mono: ["#A8B0C0", "#DCE0E8"],
  gold: ["#C6A15B", "#DFC07E"],
};

export interface UiPrefs {
  tickerSpeed: TickerSpeed;
  circuitBackground: CircuitBackground;
  circuitBackgroundCustom: string; // hex, used only when circuitBackground === "custom"
  circuitPalette: CircuitPalette;
  circuitMotion: CircuitMotion;
  /** 0..1. 0.5 reproduces the board's original brightness exactly. */
  circuitDimming: number;
}

// Ticker scroll speed in pixels per second for each setting.
// Slow is the old Fast speed (50); Normal and Fast are faster still.
export const TICKER_PX_PER_SEC: Record<TickerSpeed, number> = {
  slow: 50,
  normal: 70,
  fast: 100,
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const STORAGE_KEY = "ijidi_ui_prefs";
const DEFAULTS: UiPrefs = {
  tickerSpeed: "normal",
  circuitBackground: "obsidian",
  circuitBackgroundCustom: "#03050a",
  circuitPalette: "portal",
  circuitMotion: "normal",
  circuitDimming: 0.5,
};

let current: UiPrefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<UiPrefs> | null;
    const next = { ...current };
    if (typeof parsed?.tickerSpeed === "string" && parsed.tickerSpeed in TICKER_PX_PER_SEC) {
      next.tickerSpeed = parsed.tickerSpeed as TickerSpeed;
    }
    if (typeof parsed?.circuitBackground === "string" && parsed.circuitBackground in CIRCUIT_BACKGROUND_LABELS) {
      next.circuitBackground = parsed.circuitBackground as CircuitBackground;
    }
    if (typeof parsed?.circuitBackgroundCustom === "string" && HEX_RE.test(parsed.circuitBackgroundCustom)) {
      next.circuitBackgroundCustom = parsed.circuitBackgroundCustom;
    }
    if (typeof parsed?.circuitPalette === "string" && parsed.circuitPalette in CIRCUIT_PALETTE_LABELS) {
      next.circuitPalette = parsed.circuitPalette as CircuitPalette;
    }
    if (typeof parsed?.circuitMotion === "string" && parsed.circuitMotion in CIRCUIT_MOTION_LABELS) {
      next.circuitMotion = parsed.circuitMotion as CircuitMotion;
    }
    if (typeof parsed?.circuitDimming === "number" && parsed.circuitDimming >= 0 && parsed.circuitDimming <= 1) {
      next.circuitDimming = parsed.circuitDimming;
    }
    current = next;
  } catch {
    /* storage unavailable or unreadable: keep the defaults */
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): UiPrefs {
  load();
  return current;
}

function getServerSnapshot(): UiPrefs {
  return DEFAULTS;
}

export function setUiPref<K extends keyof UiPrefs>(key: K, value: UiPrefs[K]) {
  load();
  current = { ...current, [key]: value };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable: the choice still applies until the tab closes */
  }
  listeners.forEach((listener) => listener());
}

/** Resets every circuit-background-studio field to the board's original look. */
export function resetCircuitStudio() {
  load();
  current = {
    ...current,
    circuitBackground: DEFAULTS.circuitBackground,
    circuitBackgroundCustom: DEFAULTS.circuitBackgroundCustom,
    circuitPalette: DEFAULTS.circuitPalette,
    circuitMotion: DEFAULTS.circuitMotion,
    circuitDimming: DEFAULTS.circuitDimming,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable: the choice still applies until the tab closes */
  }
  listeners.forEach((listener) => listener());
}

export function useUiPrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Resolves the active background hex, including the custom-colour case. */
export function resolveCircuitBackground(prefs: UiPrefs): string {
  if (prefs.circuitBackground === "custom") {
    return HEX_RE.test(prefs.circuitBackgroundCustom)
      ? prefs.circuitBackgroundCustom
      : DEFAULTS.circuitBackgroundCustom;
  }
  return CIRCUIT_BACKGROUND_HEX[prefs.circuitBackground];
}
