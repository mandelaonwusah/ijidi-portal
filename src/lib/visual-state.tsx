// src/lib/visual-state.tsx
// Visual-state engine for the Portal skin (Stage 4).
// The route decides the section; each section has a preset. IGX AI (or any
// real system signal) can later push ids into `activeSignals`. Nothing here
// claims a system state: with no signals pushed, the list stays empty.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";

export type VisualSection =
  | "overview"
  | "governance"
  | "knowledge"
  | "igx-ai"
  | "media"
  | "finance"
  | "settings";

export type CardLayout = "grid" | "focus" | "stack";
export type TransitionMode = "soft" | "instant";

export interface VisualState {
  activeSection: VisualSection;
  /** 0..1: how strongly the circuit pulses and node glows read. */
  circuitIntensity: number;
  /** Ids of REAL signals only (set by a system that verified them). Empty by default. */
  activeSignals: string[];
  cardLayout: CardLayout;
  /** 0..1: overall brightness of the background behind the UI. */
  ambientOpacity: number;
  transitionMode: TransitionMode;
  reducedMotion: boolean;
  isMobile: boolean;
  setActiveSignals: (signals: string[]) => void;
}

type Preset = {
  circuitIntensity: number;
  ambientOpacity: number;
  cardLayout: CardLayout;
};

// Design choices, locked: the background stays a quiet layer behind the UI.
// IGX AI reads strongest because it is the intelligence surface.
const PRESETS: Record<VisualSection, Preset> = {
  overview: { circuitIntensity: 0.5, ambientOpacity: 0.5, cardLayout: "grid" },
  governance: { circuitIntensity: 0.4, ambientOpacity: 0.45, cardLayout: "grid" },
  knowledge: { circuitIntensity: 0.35, ambientOpacity: 0.4, cardLayout: "grid" },
  "igx-ai": { circuitIntensity: 0.8, ambientOpacity: 0.65, cardLayout: "focus" },
  media: { circuitIntensity: 0.55, ambientOpacity: 0.5, cardLayout: "grid" },
  finance: { circuitIntensity: 0.4, ambientOpacity: 0.4, cardLayout: "grid" },
  settings: { circuitIntensity: 0.2, ambientOpacity: 0.3, cardLayout: "stack" },
};

// Route prefix -> section. Anything not listed falls back to "overview".
// Check the prefixes below against the real sidebar routes.
export function sectionFromPath(pathname: string): VisualSection {
  const p = pathname.toLowerCase();
  if (p.startsWith("/igx")) return "igx-ai";
  if (p.startsWith("/vault") || p.startsWith("/knowledge")) return "knowledge";
  if (p.startsWith("/governance") || p.startsWith("/proposals")) return "governance";
  if (p.startsWith("/media")) return "media";
  if (p.startsWith("/capital") || p.startsWith("/finance")) return "finance";
  if (p.startsWith("/settings")) return "settings";
  return "overview";
}

function useMediaQuery(query: string): boolean {
  // Starts false so server and first client render match; updates after mount.
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

const DEFAULT_STATE: VisualState = {
  activeSection: "overview",
  circuitIntensity: PRESETS.overview.circuitIntensity,
  activeSignals: [],
  cardLayout: PRESETS.overview.cardLayout,
  ambientOpacity: PRESETS.overview.ambientOpacity,
  transitionMode: "soft",
  reducedMotion: false,
  isMobile: false,
  setActiveSignals: () => {},
};

const VisualStateContext = createContext<VisualState>(DEFAULT_STATE);

export function VisualStateProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeSignals, setActiveSignals] = useState<string[]>([]);

  const value = useMemo<VisualState>(() => {
    const section = sectionFromPath(pathname);
    const preset = PRESETS[section];
    // Mobile: calmer pulses and a single-column layout, to protect the GPU.
    const scale = isMobile ? 0.6 : 1;
    return {
      activeSection: section,
      circuitIntensity: reducedMotion ? 0 : preset.circuitIntensity * scale,
      activeSignals,
      cardLayout: isMobile ? "stack" : preset.cardLayout,
      ambientOpacity: preset.ambientOpacity,
      transitionMode: reducedMotion ? "instant" : "soft",
      reducedMotion,
      isMobile,
      setActiveSignals,
    };
  }, [pathname, reducedMotion, isMobile, activeSignals]);

  return <VisualStateContext.Provider value={value}>{children}</VisualStateContext.Provider>;
}

export function useVisualState(): VisualState {
  return useContext(VisualStateContext);
}
