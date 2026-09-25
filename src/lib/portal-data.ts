// src/lib/portal-data.ts
export type DataStatus = "not-tracked" | "tracked" | "estimated";

// Sidebar groups, in display order. Each navItem below carries one of these
// in its `group` field; the shell builds the grouped sidebar from that.
export const navGroupOrder = ["COMMAND", "ECOSYSTEM", "KNOWLEDGE", "IDENTITY"] as const;

// Flat list, already in display order (groups are contiguous). Used by the
// sidebar, the command palette and the header page label.
export const navItems = [
  { label: "Command Center", to: "/", icon: "⌂", key: "01", group: "COMMAND" },
  { label: "IGX AI", to: "/igx-ai", icon: "›_", key: "02", group: "COMMAND" },
  { label: "Governance", to: "/governance", icon: "◎", key: "03", group: "COMMAND" },
  { label: "Ecosystem", to: "/ecosystem", icon: "⌘", key: "04", group: "ECOSYSTEM" },
  { label: "Capital Engine", to: "/capital", icon: "◈", key: "05", group: "ECOSYSTEM" },
  { label: "Foundation", to: "/foundation", icon: "✦", key: "06", group: "ECOSYSTEM" },
  { label: "Atelier", to: "/atelier", icon: "◆", key: "07", group: "ECOSYSTEM" },
  { label: "Media", to: "/media", icon: "❖", key: "08", group: "ECOSYSTEM" },
  { label: "Directory", to: "/directory", icon: "☰", key: "09", group: "ECOSYSTEM" },
  { label: "The Vault", to: "/vault", icon: "▣", key: "10", group: "KNOWLEDGE" },
  { label: "Identity", to: "/settings", icon: "◌", key: "11", group: "IDENTITY" },
] as const;

// Generalized top entity switcher bar — used on Command Center, IGX AI,
// and any other page that renders <EntitySwitcherBar />. Status drives
// the .entity-status-dot color in styles.css ("standby" = --success,
// "forming" = --gold).
export const entitySwitcherItems = [
  { key: "group", label: "IJIDI Group", to: "/ecosystem", status: "standby" },
  { key: "atelier", label: "IJIDI Atelier", to: "/atelier", status: "forming" },
  { key: "media", label: "IJIDI Media", to: "/media", status: "forming" },
  { key: "foundation", label: "IJIDI Foundation", to: "/foundation", status: "standby" },
] as const;

// Floating entity dock (bottom centre of every governor page except the IGX AI
// console). "person" chips open the IGX AI console on that person; "route"
// chips go straight to the entity's page.
export const floatingSwitcherItems = [
  { key: "mandela", label: "Mandela", kind: "person", entity: "mandela" },
  { key: "ifeoma", label: "Ifeoma", kind: "person", entity: "ifeoma" },
  { key: "group", label: "Group", kind: "route", to: "/ecosystem" },
  { key: "foundation", label: "Foundation", kind: "route", to: "/foundation" },
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
  {
    label: "System readiness",
    value: "—",
    status: "not-tracked" as const,
    detail: "No verified check",
  },
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
    to: "/ecosystem",
    handle: "@ijidigroup",
    siteUrl: "https://ijidigroup.com",
  },
  {
    name: "IJIDI Atelier",
    code: "ATL-01",
    detail: "Luxury fashion house",
    state: "forming",
    to: "/atelier",
    handle: "@ijidiatelier",
  },
  {
    name: "IJIDI Media",
    code: "MED-01",
    detail: "AI-generated content studio",
    state: "forming",
    to: "/media",
  },
  {
    name: "IJIDI Foundation",
    code: "FND-01",
    detail: "Programmes & impact registry",
    state: "standby",
    to: "/foundation",
    handle: "@ijidifoundation",
    siteUrl: "https://ijidi.org",
  },
  {
    name: "IGX AI",
    code: "IGX-01",
    detail: "Intelligence console",
    state: "ready",
    to: "/igx-ai",
  },
] as const;

export const personalBrand = {
  name: "Mandela Onwusah",
  code: "MDL-01",
  detail: "Founder & sole governor — personal brand",
  handle: "@mandelaonwusah1",
  siteUrl: "https://mandelaonwusah.com",
} as const;

export const activity = [
  { time: "NOW", text: "Portal session established", tag: "SYSTEM", tone: "teal" },
  { time: "—", text: "No governance events recorded", tag: "EMPTY", tone: "gold" },
  { time: "—", text: "No capital movements tracked", tag: "EMPTY", tone: "gold" },
];

export const ecosystemNodes = [
  { name: "IJIDI Group", code: "GRP", kind: "corporate", state: "forming", x: 15, y: 68 },
  { name: "IJIDI Atelier", code: "ATL", kind: "creative", state: "forming", x: 38, y: 68 },
  { name: "IJIDI Media", code: "MED", kind: "creative", state: "forming", x: 61, y: 68 },
  { name: "IJIDI Foundation", code: "FND", kind: "philanthropic", state: "forming", x: 84, y: 68 },
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
    state: "SUPERSEDED",
  },
  {
    date: "21 AUG 2026",
    label: "IJIDI Brand & Design System v1.0",
    detail:
      "Full 5-identity system adopted: Mandela (Midnight #141414 / Ivory #F4EFE6 / Terracotta #A6533B), IJIDI Group (Obsidian #111111 / Ivory #F5F1E8 / Champagne Gold #C6A15B), IJIDI Foundation (Deep Forest #173F35 / Ivory / Muted Gold #B99A5A), IJIDI Portal (Deep Navy #101C36 / Soft White #FCFBF8 / Electric Blue #356AE6), IJIDI Atelier (Black #0C0C0C / Bone #EEE8DC / Antique Gold #A8874A). Namespaced tokens (--mandela-*, --ijidi-group-*, --ijidi-foundation-*, --ijidi-portal-*, --ijidi-atelier-*), no decorative gradients, gold restrained. Supersedes the 08 AUG 2026 Brand reconciliation entry.",
    state: "FROZEN",
  },
  {
    date: "26 AUG 2026",
    label: "IGX AI console — gold/purple/orange confirmed",
    detail:
      "IGX AI console palette confirmed: gold #C6A15B (primary/human actor), deep purple #5C3D8C (system/IGX actor), orange #D97B3F (reject/attention), background #0C0E2E/#07081C, text #F5F2EB. Scoped to the IGX AI console only — does not alter the 21 AUG Portal Deep Navy #101C36 / Electric Blue #356AE6 tokens. Mandela is personally handling the live Portal repo's global retouch if and when that happens; not queued as a build task here.",
    state: "FROZEN",
  },
  {
    date: "12 SEP 2026",
    label: "Console overhaul — entity switcher + reasoning orb",
    detail:
      "Generalized top entity switcher bar (Group/Foundation/Atelier/Media, with status dots) added via entitySwitcherItems + .entity-switcher-bar/.entity-chip styles. Small Idle/Thinking/Routing strip in igx-ai.tsx replaced with a bigger glowing .reasoning-orb-wrap component.",
    state: "FROZEN",
  },
  { date: "—", label: "Next decision", detail: "No decision has been logged.", state: "OPEN" },
];

export const igxPeople = {
  mandela: {
    label: "Mandela Onwusah",
    state: "active",
    subs: [
      { id: "overview", label: "Overview" },
      { id: "thought-leader", label: "Thought Leader" },
      { id: "strategic-consultant", label: "Strategic Consultant" },
      { id: "diplomatic-architect", label: "Diplomatic Architect" },
      { id: "digital-catalyst", label: "Digital Catalyst" },
      { id: "blogging", label: "Blogging" },
    ],
  },
  ifeoma: {
    label: "Ifeoma Peace David",
    state: "active",
    subs: [
      { id: "vice-governor", label: "Vice Governor" },
      { id: "coco-powder", label: "Coco Powder (Milo)" },
      { id: "yoghurt", label: "Yoghurt *unregistered*" },
      { id: "custard", label: "Custard" },
      { id: "petroleum-jelly", label: "IJIDI Petroleum Jelly *unregistered*" },
    ],
  },
} as const;

export const igxOrgEntities = {
  group: {
    label: "IJIDI Group",
    state: "standby",
    subs: [
      { id: "holding-investment", label: "Holding & Investment *draft*" },
      { id: "general-contractors", label: "General Contractors *draft*" },
      { id: "merchandise-trading", label: "General Merchandise & Trading *draft*" },
      { id: "real-estate", label: "Real Estate *draft*" },
      { id: "tech-digital", label: "Technology & Digital Infrastructure *draft*" },
      { id: "consulting-strategic", label: "Consulting & Strategic Services *draft*" },
      { id: "media-comms", label: "Media & Communications *draft*" },
      { id: "ventures-enterprise", label: "Ventures & Enterprise Development *draft*" },
      { id: "agriculture", label: "Agriculture & Agro-Services *draft*" },
      { id: "energy-environment", label: "Energy & Environment *draft*" },
      { id: "import-export-logistics", label: "Importation, Exportation & Logistics *draft*" },
      { id: "representation-agency", label: "Representation & Agency Services *draft*" },
      { id: "nonprofit-humanitarian", label: "Nonprofit & Humanitarian (via IJIDI Foundation) *draft*" },
      { id: "global-development", label: "Global Development Initiatives *draft*" },
      { id: "intl-partnerships", label: "International Partnerships *draft*" },
      { id: "research-innovation", label: "Research, Innovation & Capacity Building *draft*" },
      { id: "financial-services", label: "Financial Services & Investments *draft*" },
      { id: "intellectual-property", label: "Intellectual Property *draft*" },
      { id: "other-lawful", label: "Any Other Lawful Business *draft*" },
      { id: "general-powers", label: "Power to Do All Things *draft*" },
    ],
  },
  foundation: {
    label: "IJIDI Foundation",
    state: "standby",
    subs: [
      { id: "arm1", label: "Arm 1: Infrastructure & Connectivity", pillar: "Pillar 1 — Digital Inclusion & Literacy" },
      { id: "arm2", label: "Arm 2: Digital Skills & Youth Empowerment", pillar: "Pillar 1 — Digital Inclusion & Literacy" },
      { id: "arm3", label: "Arm 3: Micro-Enterprise & Utility", pillar: "Pillar 2 — Economic Mobility & Utility Access" },
      { id: "arm4", label: "Arm 4: Creative Arts & Design Incubation", pillar: "Pillar 3 — Creative & Innovation Ecosystems" },
      { id: "arm5", label: "Arm 5: Humanitarian & Social Support", pillar: "Pillar 4 — Community Resilience & Welfare" },
    ],
  },
  atelier: {
    label: "IJIDI Atelier",
    state: "forming",
    subs: [
      { id: "shoes", label: "Shoes" },
      { id: "clothes", label: "Clothes" },
      {
        id: "brand",
        label: "Brand",
        pillar: "Positioning & identity hub — the Atelier brand concept itself, not a product line",
      },
    ],
  },
  media: {
    label: "IJIDI Media",
    state: "forming",
    subs: [
      { id: "orbit", label: "IJIDI Orbit" },
      { id: "wild", label: "IJIDI Wild" },
      { id: "arena", label: "IJIDI Arena" },
      { id: "drama", label: "IJIDI Drama" },
      { id: "toons", label: "IJIDI Toons" },
    ],
  },
} as const;

export const igxAllEntities = { ...igxPeople, ...igxOrgEntities } as const;
