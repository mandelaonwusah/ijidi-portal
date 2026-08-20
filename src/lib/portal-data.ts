export type DataStatus = "not-tracked" | "tracked" | "estimated";

export const navItems = [
  { label: "Command Center", to: "/", icon: "⌂", key: "01" },
  { label: "Ecosystem", to: "/ecosystem", icon: "⌘", key: "02" },
  { label: "Capital Engine", to: "/capital", icon: "◈", key: "03" },
  { label: "Foundation", to: "/foundation", icon: "✦", key: "04" },
  { label: "Atelier", to: "/atelier", icon: "◆", key: "05" },
  { label: "Media", to: "/media", icon: "▶", key: "06" },
  { label: "The Vault", to: "/vault", icon: "▣", key: "07" },
  { label: "IGX AI", to: "/igx-ai", icon: "›_", key: "08" },
  { label: "Proposals", to: "/proposals", icon: "☑", key: "09" },
  { label: "Governance", to: "/governance", icon: "◎", key: "10" },
  { label: "Identity", to: "/settings", icon: "◌", key: "11" },
] as const;

export const metricTiles = [
  {
    label: "Tracked capital",
    value: "—",
    status: "not-tracked" as const,
    detail: "No verified entries",
  },
  {
    label: "Active programmes",
    value: "—",
    status: "not-tracked" as const,
    detail: "No verified entries",
  },
  { label: "System readiness", value: "01", status: "tracked" as const, detail: "Governor online" },
  {
    label: "Open decisions",
    value: "—",
    status: "not-tracked" as const,
    detail: "No decisions logged",
  },
];

export const modules = [
  {
    name: "IJIDI Group",
    code: "GRP-01",
    detail: "Professional services & holding",
    state: "standby",
    to: "/ecosystem", // no dedicated Group page yet — open item, see reconciliation notes
  },
  {
    name: "IJIDI Foundation",
    code: "FND-01",
    detail: "Programmes & impact registry",
    state: "standby",
    to: "/foundation",
  },
  { name: "IGX AI", code: "IGX-01", detail: "Intelligence console", state: "ready", to: "/igx-ai" },
  {
    name: "IJIDI Atelier",
    code: "ATL-01",
    detail: "Luxury fashion house",
    state: "forming",
    to: "/atelier",
  },
  {
    name: "IJIDI Media",
    code: "MED-01",
    detail: "AI-generated content studio",
    state: "forming",
    to: "/media",
  },
];

export const activity = [
  { time: "NOW", text: "Portal session established", tag: "SYSTEM", tone: "teal" },
  { time: "—", text: "No governance events recorded", tag: "EMPTY", tone: "gold" },
  { time: "—", text: "No capital movements tracked", tag: "EMPTY", tone: "gold" },
];

// IGX AI intentionally excluded here — it is the connective layer across every
// entity, not a fifth peer arm, so it is not drawn as a hierarchy node.
// It is reachable everywhere via the ⌘J global panel and the /igx-ai console.
export const ecosystemNodes = [
  { name: "IJIDI Foundation", code: "FND", kind: "philanthropic", state: "forming", x: 15, y: 68 },
  { name: "IJIDI Group", code: "GRP", kind: "corporate", state: "forming", x: 38, y: 68 },
  { name: "IJIDI Atelier", code: "ATL", kind: "creative", state: "forming", x: 61, y: 68 },
  { name: "IJIDI Media", code: "MED", kind: "creative", state: "forming", x: 84, y: 68 },
];

export const vaultItems = [
  {
    title: "KB-ARCH-000 · Architecture Index",
    type: "GOVERNANCE",
    access: "ROOT",
    state: "Available",
    detail: "Frozen decisions & constraints",
  },
  {
    title: "KB-CAP-000 · Capital Index",
    type: "FINANCE",
    access: "OPERATOR",
    state: "Not tracked",
    detail: "No verified records",
  },
  {
    title: "KB-FND-000 · Foundation Index",
    type: "IMPACT",
    access: "OPERATOR",
    state: "Not tracked",
    detail: "No verified programmes",
  },
  {
    title: "KB-IDT-000 · Identity Manifest",
    type: "SYSTEM",
    access: "ROOT",
    state: "Available",
    detail: "IJIDI Portal identity",
  },
];

export const decisions = [
  {
    date: "08 AUG 2026",
    label: "Naming architecture",
    detail: "Use IJIDI Portal and IGX AI. Retire Nexus language. Never use 'IGX Mandela'.",
    state: "FROZEN",
  },
  {
    date: "08 AUG 2026",
    label: "Data integrity",
    detail: "Never present invented financial figures as real.",
    state: "FROZEN",
  },
  {
    date: "08 AUG 2026",
    label: "Brand reconciliation",
    detail:
      "Fraunces + Karla primary type, IBM Plex Mono for data only. Gold locked to #D4AF37. Indigo replaces teal accent. Governor identity corrected to Mandela Onwusah.",
    state: "FROZEN",
  },
  { date: "—", label: "Next decision", detail: "No decision has been logged.", state: "OPEN" },
];
