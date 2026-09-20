// src/lib/ui-prefs.ts
// Interface preferences the governor can change in Settings. Saved in this
// browser (localStorage) and shared live between the Settings page and the shell.
// Today: ticker speed. The background studio settings will be added here later.
import { useSyncExternalStore } from "react";

export type TickerSpeed = "slow" | "normal" | "fast";

export interface UiPrefs {
  tickerSpeed: TickerSpeed;
}

// Ticker scroll speed in pixels per second for each setting.
export const TICKER_PX_PER_SEC: Record<TickerSpeed, number> = {
  slow: 22,
  normal: 34,
  fast: 50,
};

const STORAGE_KEY = "ijidi_ui_prefs";
const DEFAULTS: UiPrefs = { tickerSpeed: "normal" };

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
    const speed = parsed?.tickerSpeed;
    if (typeof speed === "string" && speed in TICKER_PX_PER_SEC) {
      current = { ...current, tickerSpeed: speed as TickerSpeed };
    }
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

export function useUiPrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
