# IJIDI Portal — Command Center (Advanced Rebuild)

Yes. I pulled frames across all three videos and I can see the actual UI: near-black canvas, gold/amber primary with teal and emerald status accents, condensed uppercase micro-labels, a live ticker strip along the top, KPI tiles with icon chips and delta chevrons, a left rail of module links with numeric counters, a deal-book table, and a terminal-styled AI console with streaming message blocks. That is the tier being rebuilt here.

Both flags are accepted and locked:

1. **Naming:** no "Nexus", no "Sovereign". Everything ships as **IJIDI Portal** and **IGX AI**.
2. **Data:** no fictional billions. Every metric that is not yet tracked renders as an honest empty state.

## Naming map (locked)

| In the video | In this build |
| --- | --- |
| IJIDI Global Nexus | IJIDI Portal |
| Sovereign Capital Engine | Capital Engine |
| Sovereign Intelligence Console | IGX AI · Intelligence Console |
| Sovereign Root | Root Access |
| Paramount Trust | Trust Registry |
| Classified | Restricted |

## Honest data contract

- Untracked numbers render as `—` with a `NOT YET TRACKED` micro-badge, never a zero and never a placeholder figure.
- The ticker shows real system state (session, build, module status, last sync), not fake market prices.
- Anything that would need real financials shows the styled tile with an empty value, so the layout reads finished without inventing figures.
- Stage is stated plainly where relevant: pre-revenue, single governor.

## Screens

1. **Command Center (`/`)** — ticker bar, identity strip with hexagon role badge, KPI grid (all honest empty states), ecosystem hierarchy preview, recent activity feed.
2. **Ecosystem (`/ecosystem`)** — root node branching into corporate and philanthropic arms as an SVG node tree with status rings.
3. **Capital Engine (`/capital`)** — pipeline tiles and a deal-book table rendered with real column structure and empty rows plus a "no entries yet" state.
4. **Foundation (`/foundation`)** — programme cards, impact metrics as untracked tiles.
5. **Vault (`/vault`)** — encrypted document cards with lock chips, access tier, and a restricted overlay.
6. **IGX AI Console (`/igx-ai`)** — terminal-feed console: monospace transcript, status line, capability chips. UI-only in this phase (scripted local responses), wired to a real model later.
7. **Governance (`/governance`)** — governor record, decision log, trust registry entries.
8. **Identity & Settings (`/settings`)** — profile panel, role badges, access tiers, theme and density controls.

## Things you need that were missing from the video version

- **Decision log** — timestamped record of frozen architecture decisions (e.g. the retired name), so choices are auditable instead of remembered.
- **Data provenance chips** — every metric labelled `tracked` / `estimated` / `not tracked`, which is what keeps this honest as real numbers arrive later.
- **Command palette (⌘K)** — jump to any module; the thing that makes a command center actually feel like one.
- **Access tier model in the UI** — Root / Operator / Observer badges applied consistently across vault and governance.
- **Keyboard-navigable, responsive rail** — collapses to an icon strip, works on the phone you are previewing from.

## Build sequence (strict, so nothing breaks mid-way)

1. Design tokens in `src/styles.css`: near-black surfaces, gold/amber primary, teal + emerald accents, hex-badge and glow utilities. Fonts loaded via `<link>` in `__root.tsx`.
2. Shell: sidebar rail, ticker bar, identity strip, command palette — mounted in `__root.tsx`.
3. Primitives: KPI tile, status badge, hex shield badge, section header, empty-state, data table.
4. Routes in order: `/` → `/ecosystem` → `/capital` → `/foundation` → `/vault` → `/igx-ai` → `/governance` → `/settings`, each with its own `head()` metadata.
5. Final pass: mobile check at 390px, contrast check, remove any leftover placeholder figures.

## Technical notes

- TanStack Start file routes under `src/routes`; shared shell around `<Outlet />` in `__root.tsx`.
- Tailwind v4 tokens only — no hardcoded colour utilities.
- Frontend-only in this phase: content lives in typed local modules under `src/data/`, so switching to Lovable Cloud later is a swap of the data source, not a rewrite.
- No backend, auth, or AI model calls in this pass; the console is styled and stateful but locally driven.
