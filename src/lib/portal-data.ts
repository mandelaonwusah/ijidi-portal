export type DataStatus = "not-tracked" | "tracked" | "estimated";

export const navItems = [
  { label: "Command Center", to: "/", icon: "⌂", key: "01" },
  { label: "Ecosystem", to: "/ecosystem", icon: "⌘", key: "02" },
  { label: "Capital Engine", to: "/capital", icon: "◈", key: "03" },
  { label: "Foundation", to: "/foundation", icon: "✦", key: "04" },
  { label: "The Vault", to: "/vault", icon: "▣", key: "05" },
  { label: "IGX AI", to: "/igx-ai", icon: "›_", key: "06" },
  { label: "Governance", to: "/governance", icon: "◎", key: "07" },
  { label: "Identity", to: "/settings", icon: "◌", key: "08" },
] as const;

export const metricTiles = [
  { label: "Tracked capital", value: "—", status: "not-tracked" as const, detail: "No verified entries" },
  { label: "Active programmes", value: "—", status: "not-tracked" as const, detail: "No verified entries" },
  { label: "System readiness", value: "01", status: "tracked" as const, detail: "Governor online" },
  { label: "Open decisions", value: "—", status: "not-tracked" as const, detail: "No decisions logged" },
];

export const modules = [
  { name: "Capital Engine", code: "CAP-01", detail: "Pipeline & treasury records", state: "standby", to: "/capital" },
  { name: "Foundation", code: "FND-01", detail: "Programmes & impact registry", state: "standby", to: "/foundation" },
  { name: "IGX AI", code: "AI-01", detail: "Intelligence console", state: "ready", to: "/igx-ai" },
];

export const activity = [
  { time: "NOW", text: "Portal session established", tag: "SYSTEM", tone: "teal" },
  { time: "—", text: "No governance events recorded", tag: "EMPTY", tone: "gold" },
  { time: "—", text: "No capital movements tracked", tag: "EMPTY", tone: "gold" },
];

export const ecosystemNodes = [
  { name: "IJIDI Foundation", code: "FND", kind: "philanthropic", state: "forming", x: 16, y: 68 },
  { name: "IJIDI Capital", code: "CAP", kind: "corporate", state: "forming", x: 50, y: 68 },
  { name: "IGX AI", code: "AI", kind: "intelligence", state: "active", x: 84, y: 68 },
];

export const vaultItems = [
  { title: "Architecture charter", type: "GOVERNANCE", access: "ROOT", state: "Available", detail: "Frozen decisions & constraints" },
  { title: "Capital registry", type: "FINANCE", access: "OPERATOR", state: "Not tracked", detail: "No verified records" },
  { title: "Foundation programmes", type: "IMPACT", access: "OPERATOR", state: "Not tracked", detail: "No verified programmes" },
  { title: "Identity manifest", type: "SYSTEM", access: "ROOT", state: "Available", detail: "IJIDI Portal identity" },
];

export const decisions = [
  { date: "08 AUG 2026", label: "Naming architecture", detail: "Use IJIDI Portal and IGX AI. Retire Nexus language.", state: "FROZEN" },
  { date: "08 AUG 2026", label: "Data integrity", detail: "Never present invented financial figures as real.", state: "FROZEN" },
  { date: "—", label: "Next decision", detail: "No decision has been logged.", state: "OPEN" },
];
