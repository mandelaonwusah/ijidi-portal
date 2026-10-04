# IJIDI Portal — Design System

Status: **target design**, written 2026-10-03 from a read-only map of `main` at `5b78a60`.
Nothing in `src/` has been changed for this document. Where today's code differs from
this document, the "Today" notes say so; the build plan closes those gaps one PR at a time.

Uniqueness rule: outside references may inform behaviour, structure, layout and motion
only. Colours, fonts, copy, images, logos and signature elements are IJIDI's own. When a
reference and IJIDI identity disagree, IJIDI wins.

---

## 1. Overview

The IJIDI Portal is a **human-control window** over the IJIDI ecosystem (Group,
Foundation, Atelier, Media). It shows state and routes decisions to the governor; it does
not run the businesses. The design follows from that job:

- **Honest state first.** Nothing reads as ACTIVE, LIVE, ONLINE, CONNECTED or VERIFIED
  unless the system checked it. Unknown values show `—` with **NOT YET TRACKED**.
- **Calm, dark, deliberate.** Obsidian surfaces, Ivory text, one gold (Champagne Gold)
  reserved for what matters, Electric Blue for what is verified.
- **One of each.** One card system, one border language, one status vocabulary, two fonts.
- **Keyboard-first for the governor.** Every action reachable from the command palette;
  every focusable element shows a ring.

### IJIDI-native elements (kept unchanged)

| Element | Where it lives | Rule |
|---|---|---|
| Circuit background + Settings studio | `src/components/CircuitBackground.tsx`, `src/lib/ui-prefs.ts`, `src/routes/settings.tsx` | Keep as is. It owns its own palette engine; its colours are not part of the token set below. |
| GlassCard glass and gold corner arcs | `src/components/GlassCard.tsx` | The four gold corner arcs are IJIDI's signature and the **only decorative use of gold**. |
| Visual-state engine | `src/lib/visual-state.tsx` | Keep. It already reads `prefers-reduced-motion`; all motion in this document obeys it. |
| Sound engine | `src/lib/sound-engine.ts` | Keep. Hover and click sounds stay; no new sounds without a decision. |
| Colour identity | Obsidian, Champagne Gold, Electric Blue | Keep. Defined in section 2. |

---

## 2. Colours

### Core palette (IJIDI values, already in `src/styles.css`)

| Role | Token | Value | Use |
|---|---|---|---|
| Obsidian (page) | `--background` | `#06080d` | Page background behind the circuit board |
| Panel | `--panel` | `#0a0e16` | Sidebar, header base |
| Card | `--card` | `#0b0f17` | Card base under glass |
| Elevated | `--panel-elevated` | `#121826` | Popovers, menus, palette |
| Ivory (text) | `--foreground` | `#f5f1e8` | Primary text |
| Muted text | `--muted-foreground` | `#9aa3b5` | Secondary text, labels |
| Champagne Gold | `--gold` / `--primary` | `#c6a15b` | Selected, focus, governor-only, primary button, corner arcs |
| Gold high / low | — | `#e3c27a` / `#a98443` | Primary button gradient only |
| Electric Blue | `--accent` / `--blue` | `#4f86f7` | **Verified** state, links |
| Electric Blue (light) | `--teal` today | `#5e9bff` | Verified text on dark where `#4f86f7` is too dim. **Rename `teal` → `blue-light`**; it was never teal. |
| Attention orange | `--attention` (new) | `#d97b3f` | **Pending / Warning** state. IJIDI's existing IGX attention orange (recorded in the console palette decision in `src/lib/portal-data.ts`). |
| Error | `--destructive` | `#e5677a` | Errors, danger buttons |

Champagne Gold `#c6a15b` stays reserved for selected, focus and governor-only (plus the corner
arcs). It is **never** used to mean "pending" or "warning".

### Borders

- **Default border:** neutral translucent white, `rgba(255,255,255,0.08)`.
- **Strong border** (hover, dividers that must read): `rgba(255,255,255,0.14)`.
- **Top inset highlight** on glass surfaces: `inset 0 1px 0 rgba(255,255,255,0.06)`.
- **Gold border only for:** the selected item, keyboard focus, and governor-only surfaces
  (e.g. the governor identity card, the proposal decision bar).
- **Today:** `--border`, `--border-strong` and `--sidebar-border` are gold
  (`rgba(198,161,91,…)`), and the code uses about 300 `gold` utilities, most of them borders.
  The tokens group switches the variables; the cards group replaces the per-component gold borders.

### Honest-state colours

| State | Meaning | Colour | Surface | Dot |
|---|---|---|---|---|
| **Verified** | The system checked it just now (a query succeeded, a session exists, a role check returned true) | Electric Blue `#4f86f7` (text `#5e9bff`) | `rgba(79,134,247,0.10)` | Solid; **may pulse only if it is verified and live** |
| **Pending / Warning** | Waiting on someone, declared but unchecked, loading | Attention orange `#d97b3f` | `rgba(217,123,63,0.10)` | Solid, never pulses |
| **Error** | A check failed, or a decision was rejected | `#e5677a` | Dark error surface `rgba(229,103,122,0.10)` over Obsidian | Solid, never pulses |
| **NOT CONNECTED** | Nothing is wired to check this | Grey `#9aa3b5` text, `#5c6476` dot | `rgba(255,255,255,0.04)` | Solid grey, **no pulse** |

Attention orange `#d97b3f` replaces every warning/pending colour in use today:
- the stray Tailwind `amber-400` and `amber-300`
- the `#FBBF24` "forming" dot
- the `--amber` / `--amber-bright` tokens, which are really gold

Gold-tinted "pending" badges (StatusBadge's gold tone) also move to orange, so gold keeps
only its reserved meaning.

### StatusBadge mapping (every status in use today)

| Status today | Where it appears | New state | Label rule |
|---|---|---|---|
| `active` (GOVERNOR, SINGLE GOVERNOR, GOVERNOR SESSION) | ecosystem, governance, settings | **Verified**: backed by `is_sovereign()` / a real session | As now |
| `active` with `N SITES LISTED` | ecosystem | **Verified**: a count from the database | As now |
| `active` from `entity_status = live` | ecosystem | **Pending**: typed in by hand, not checked | `DECLARED · LIVE` |
| `ready` | ecosystem, settings | **Verified** | As now |
| `tracked` | MetricTile | **Verified** | `TRACKED` |
| `frozen` | decisions | **Verified**: a recorded decision state | `FROZEN` |
| `standby`, `forming`, `open`, `building` | foundation, atelier, media, ecosystem | **Pending** | `DECLARED · <STATE>` when read from `entity_status` |
| `estimated` | type only | **Pending** | `ESTIMATED` |
| `forming` used as CHECKING | ecosystem, settings | **Pending** (loading) | `CHECKING…` |
| `restricted` (UNAVAILABLE) | ecosystem | **Error** | As now |
| `error` (UNAVAILABLE) | settings: **not a valid status today, renders gold** | **Error** | As now |
| `not-tracked` (NOT TRACKED, NOT CONFIGURED, NO FINANCIAL DATA) | capital, foundation, atelier, media, MetricTile | **NOT CONNECTED** | As now |
| proposal `pending_review` | IGX AI: **renders gold today** | **Pending** | `PENDING REVIEW` |
| proposal `approved` | IGX AI: **renders gold today** | **Verified** | `APPROVED` |
| proposal `rejected` | IGX AI: **renders gold today** | **Error** | `REJECTED` |
| proposal `error` | IGX AI: **renders gold today** | **Error** | `NOT SAVED` |

### Pulse rule

A pulsing dot means **verified and live right now**. Allowed today:
- Header data link "verified" (a real query every 5 s): pulse blue.
- Governance "Active session" (a real session): pulse blue.
- Command Center connected ping: pulse blue.

Not allowed (to be removed): the entity dock dots (hand-typed state), the member view's
email chip (always on), "FETCHING…" on Governance (loading is Pending, not live), and every
red, gold or orange pulse.

---

## 3. Typography

### Fonts

| Font | Use | Weights |
|---|---|---|
| **Inter** | All UI text: headings, body, buttons, labels | 400, 500, 600 |
| **IBM Plex Mono** | Machine values only: IDs, times, dates, codes, counts in tables, keycaps, the build tag | 400, 500 |

- **Load exactly these two** from Google Fonts in `__root.tsx`.
- **Drop:**
  - **Fraunces** and **Karla**: loaded globally today but used only on `/login`.
  - **Cormorant Garamond**: loaded on `/igx-ai` only to typeset the "IGX AI" wordmark. The
    wordmark becomes an image (see "Logos and wordmarks" in section 6), so no font is needed.
- **Today:** the CSS asks for Inter but never loads it, so the UI renders in the system sans-serif.
- **Wordmarks are never typeset** in any font, including Inter.

### Type scale

| Step | Size / line height | Use |
|---|---|---|
| `text-xs` | 13 / 18 | Labels, eyebrows (mono uppercase, tracking 0.12em), captions, keycaps |
| `text-sm` | 14 / 20 | Body, table cells, buttons |
| `text-base` | 16 / 24 | Lead text, inputs (16 px stops iOS zoom) |
| `text-lg` | 20 / 28 | Card titles |
| `text-xl` | 24 / 32 | Section titles |
| `text-2xl` | 32 / 40 | Page titles |

- Nothing smaller than 13 px. **Today:** much of the mono text is 9–10.5 px; it moves to 13 px.
- Large figures in metric cards use 32 px Inter 600, Ivory; a missing value is `—` in muted grey.

---

## 4. Layout

### Spacing (8 px rhythm)

`4` (icon gaps only) · `8` · `16` · `24` · `32` · `40` · `48` · `64` · `80` · `96`

- Card padding: **24** (default, metric) or **32** (elevated, hero).
- Gap between cards: 16 (mobile) / 24 (desktop).
- Section spacing (top of one page section to the next): **80–96**.
- Page gutters: 16 (mobile), 24 (tablet), 32 (desktop).

### Shell

| Region | Height / width | Notes |
|---|---|---|
| Ticker | 32 | Always on top |
| Status bar (data link, session, clock) | 32 | Hidden on IGX AI |
| Header (page title, governor card, sign out) | 76 | Glass + top highlight (section 5). Hidden on IGX AI |
| Page tabs | 48 | Under the header; directly under the ticker on IGX AI |
| Sidebar | 244 / 76 collapsed | Desktop; drawer on mobile |
| Footer | 32 | Build tag (section 6) |

### Radius

`8` buttons, inputs, chips · `12` cards (GlassCard `rounded-xl`) · `16` dialogs and the palette ·
`999` pills and dots. Drop ad-hoc `rounded-[2px]`, `rounded-sm` and `rounded-2xl` on cards.

---

## 5. Elevation

| Level | Surface | Border | Shadow |
|---|---|---|---|
| 0 Page | Obsidian + circuit board | — | — |
| 1 Card | Glass `rgba(11,15,23,0.34)` + 10 px blur | Default neutral | `--shadow-card` `0 4px 24px -12px rgba(0,0,0,.6)` + top highlight |
| 2 Elevated card | Glass `rgba(18,24,38,0.50)` | Strong neutral | `--shadow-lift` `0 30px 60px -32px rgba(0,0,0,.75)` + top highlight |
| 3 Header | Glass over panel + 10 px blur | Bottom: default neutral | Top highlight only (**header only** among chrome) |
| 4 Overlay (palette, dialogs, sheets) | `--panel-elevated` `#121826` at 92 % | Strong neutral | `--shadow-lift` |

- Remove the unused `--shadow-sheet` and Tailwind `shadow-sm/md/lg` on cards; cards use the two shadow tokens only.
- `--gold-glow` is referenced by `HexBadge` but never defined; define it or remove the reference.

---

## 6. Components

### GlassCard: the one card system

`<GlassCard variant="default | elevated | metric | danger">`. It replaces `panel-bracket`,
`panel-bracket-elevated`, the unused `premium-card*` and `metric-tile` classes, and the ad-hoc
`border bg-card/40` boxes on Proposals.

| Variant | Surface | Border | Corner arcs | Padding | Use |
|---|---|---|---|---|---|
| `default` | Level 1 | Neutral | Gold | 24 | Most content |
| `elevated` | Level 2 | Strong neutral | Gold | 32 | Page hero, governor record |
| `metric` | Level 1 | Neutral | Gold | 24 | Label (13 mono) · value (32 Inter) · detail (14 muted) · state badge |
| `danger` | Level 1 + error surface | `rgba(229,103,122,0.35)` | **None** | 24 | Error panels, destructive confirmations |

Hover: border moves default → strong. Selected or focused: gold border.

### StatusBadge

Four states only: `verified | pending | error | not-connected` (section 2). The pill is 13 px
mono uppercase with a 6 px dot. Only `verified` + `live` may pulse.

### Buttons

| Kind | Look | Use |
|---|---|---|
| Primary | Gold gradient `#e3c27a → #c6a15b → #a98443`, dark text | One per view: Authenticate, Approve |
| Secondary | Neutral border, glass | Everything else |
| **Danger** | `#e5677a` text and border on the error surface; filled `#e5677a` in its confirm dialog | Reject, revoke, sign out |
| Ghost | Text only | Inline links |

**Confirm step** (`AlertDialog`, already in `src/components/ui/alert-dialog.tsx`) before:
- **Reject proposal:** "Reject this proposal? It will be recorded as rejected. Nothing runs either way."
- **Revoke:** any future revoke action (none exists today).
- **Sign out:** "Sign out of the IJIDI Portal?"

### Feedback: toasts, not alerts

- Mount sonner's `<Toaster>` once in `__root.tsx` (`src/components/ui/sonner.tsx` exists but is not mounted).
- Replace every `alert()` with a toast:
  - Sign-out failure: `__root.tsx` ×2
  - Proposal update failure: `proposals.tsx` ×2
- Error toasts use the error state and say what failed and why, in plain words.

### Focus ring

Always visible for keyboard users, on every focusable element:
`outline: 2px solid #c6a15b; outline-offset: 2px` via a global `:focus-visible` rule.
**Today:** rings exist only where a component adds `focus-visible:ring-*`.

### Kbd keycap

`<Kbd>K</Kbd>`: 13 px IBM Plex Mono, 20 px tall, min-width 20, radius 6,
neutral strong border, `inset 0 -1px 0 rgba(255,255,255,0.08)` bottom edge,
muted Ivory text. Combos render as `<Kbd>Ctrl</Kbd><Kbd>K</Kbd>` (⌘ on macOS).

### Command palette (Ctrl/⌘ + K)

Groups, in this order:

| Group | Rows | Source |
|---|---|---|
| **Navigate** | The 11 pages | `navItems` in `src/lib/portal-data.ts` |
| **Actions** | New IGX AI chat · Review proposals · Open settings · Sign out (with confirm) | Existing routes and handlers |
| **Entities** | One row per `entity_status` row | Database; shows `—` and NOT CONNECTED if the query fails |
| **Recent** | Pages visited this session | The existing route trail in `__root.tsx` (no new storage) |

- **Each row:** icon · label · muted detail (e.g. group name, declared state) · keycap hint at the right.
- **Keycap hints show only real shortcuts.** The "01–11" labels today look like shortcuts but
  trigger nothing; they are removed unless a shortcut is actually built.
- **"?"** (when focus is not in a text field) opens a **Shortcuts sheet** (`sheet.tsx`) listing
  every shortcut: Ctrl/⌘+K palette, Ctrl/⌘+J IGX AI, Esc close, ? this sheet, Enter send,
  Shift+Enter new line.

### Motion

- Press: `scale(0.98)` on `:active` for buttons, tabs and palette rows (80 ms).
- Arrow nudge: icons in "Open review →"-style links move 3 px right on hover (150 ms).
- **Off** when `prefers-reduced-motion` is set (already tracked by `visual-state.tsx`).
- No new looping animations; the pulse rule in section 2 governs the existing ones.

### Logos and wordmarks

Logos and wordmarks are **approved artwork shown as images**, never typeset in a font.

- **Format:** SVG preferred; PNG accepted (at 2× its display size). Stored in `public/brand/`.
- **Rendering:** `<img>` with `alt` set to the name (e.g. `alt="IGX AI"`), and explicit width
  and height so nothing shifts while it loads. If the file fails to load, show nothing: never
  fall back to typed text in a font.
- **IGX AI wordmark** (the "IGX AI" title on the IGX AI screen):
  - **Today:** typeset in Cormorant Garamond with a blue "X".
  - **Target:** the approved wordmark artwork as an image.
  - **Asset status: not in the repo.** `public/brand/igx-ai-button.webp` is the round emblem,
    not the wordmark. The approved wordmark file (SVG or PNG) has to be supplied.
  - **Until it's supplied,** the screen shows the emblem image only, with no typed wordmark
    next to it, and `aria-label="IGX AI"` on the heading.
- **Other emblems already in use** (unchanged): `ijidi-fan-emblem.png` (portal emblem),
  `ijidi-group-medallion.png`, and the entity images in `public/brand/`.

### Header

Glass + 10 px blur + top inset highlight + bottom neutral border. **The header is the only
chrome surface with the highlight**; sidebar and tabs stay flat.

### Footer build tag

- **Shows:** `BUILD 5b78a60` in 13 px Plex Mono, muted.
- **Source:** the first 7 characters of the real commit, read **at build time** from Vercel's
  `VERCEL_GIT_COMMIT_SHA` and passed into the app by `vite.config.ts`.
- **Not yet verified:** that this project exposes the variable. The first build PR checks it on its preview.
- **If it isn't available:** the tag is **left out**, not faked, and this section is updated to say so.
- It replaces the hard-coded `Build / 01` label in the status bar.

### Loading, empty and error states (every page)

| Page | Loading | Empty | Error |
|---|---|---|---|
| Command Center | ✓ | ✓ | ✓, plus **add** an error state for the activity log (today a failed query shows "No activity on record") |
| IGX AI | ✓ | ✓ | ✓ |
| Governance | ✓ (Pending style, no pulse) | ✓ | ✓ |
| Proposals | ✓ | ✓ | ✓ (toast instead of `alert()`) |
| Ecosystem | ✓ | **add:** "No entities recorded." | ✓ |
| Settings / Identity | ✓ | — | ✓ (Error state; gold today) |
| Capital · Foundation · Atelier · Media · Vault | No data source yet: NOT CONNECTED cards with `—` | — | — |
| Member view | ✓ | — | toast instead of `alert()` |

Wording rules:
- **Loading:** "Loading <thing>…".
- **Empty:** "No <thing> recorded yet."
- **Error:** "Could not load <thing>: <reason>." and, when it makes sense, a Retry button.
- **Never placeholder data:** no sample rows, no invented numbers, no lorem ipsum.

---

## 7. Do's and Don'ts

| Do | Don't |
|---|---|
| Show `—` + NOT YET TRACKED when there is no source | Show a number, a "LIVE" badge or a green dot that nothing checks |
| Use gold for selected, focus, governor-only and the corner arcs | Use gold for ordinary borders, headings or decoration |
| Use the four honest states and their colours | Invent a fifth colour for a status |
| Pulse only verified-live signals | Pulse loading, warnings, errors or declared states |
| Use Inter for UI and Plex Mono for machine values | Load or inline any other font |
| Show logos and wordmarks as the approved image files | Typeset a wordmark in any font |
| Use attention orange `#d97b3f` for pending and warning | Use gold to mean pending or warning |
| Confirm before reject, revoke, sign out | Use `alert()` or act without a confirm |
| Keep every action in the palette | Hide a governor action behind hover only |
| Respect `prefers-reduced-motion` | Add motion that ignores it |
| Copy behaviour, structure, layout and motion from references | Copy a reference's colours, fonts, copy, images, logos or signature elements |

---

## 8. Responsive

| Breakpoint | Width | Behaviour |
|---|---|---|
| Base | < 640 | Sidebar becomes a drawer (menu button or swipe down on IGX AI). Page tabs scroll sideways. Cards stack. Inputs 16 px. Touch targets ≥ 44 px. Sign-in: logo top-left, form centred. |
| `sm` | ≥ 640 | Session timer appears in the status bar. |
| `md` | ≥ 768 | Governor card appears in the header; two-column card grids. |
| `lg` | ≥ 1024 | Sidebar is fixed and collapsible (244 / 76). IGX AI chat list panel appears. |
| `xl` | ≥ 1280 | Three-column grids where content allows. |

IGX AI at every width: only the ticker and page tabs above the chat; the chat fills the
rest of the screen without page scroll (checked at 390×844, 1280×720, 1440×900).

---

## 9. Iteration Guide

1. **Start from a token.** Use a variable from section 2; if none fits, add a token first, then use it.
2. **One card system.** New surfaces are a `GlassCard` variant; never a new class.
3. **State honestly.** Every value has a source or shows `—` + NOT YET TRACKED; every badge
   uses one of the four states; nothing pulses unless it is verified and live.
4. **Cover all states.** Loading, empty and error before the happy path is considered done.
5. **Keyboard.** The action is in the palette, focusable, and shows the focus ring.
6. **Motion.** Press and nudge only; check with reduced motion on.
7. **Before handing over code:** full-file replacements, esbuild syntax check, full
   `npx vite build`, and a Vercel preview per PR. No secrets in chat or code.
8. **Update this file** in the same PR when a rule changes.

---

## Borrowed vs Mine

The reference file named in the brief (`design-reference/portal/raycast-DESIGN.md`) was **not
in the repository** when this document was written, so nothing below was taken from it
directly. "Borrowed" lists the behaviour and structure patterns the brief asked for; every
value that realises them is IJIDI's.

| Area | Borrowed (behaviour / structure / layout / motion only) | Mine (IJIDI) |
|---|---|---|
| Document structure | 9-section design-file layout | All content, values and rules |
| Borders | Neutral translucent border with a top inset highlight | Gold reserved for selected, focus, governor-only; gold corner arcs |
| Command palette | Grouped palette; rows with icon, label, detail, keycap hint; "?" shortcuts sheet | Groups (Navigate, Actions, Entities, Recent) and their IJIDI sources; IJIDI wording |
| Keycaps | Keycap component for shortcuts | Plex Mono, IJIDI neutrals |
| Motion | Press scale 0.98; 3 px arrow nudge; off under reduced motion | Timing values; the pulse rule |
| Header | Glass header with top highlight | Obsidian glass over the circuit board |
| Footer | Build tag showing the real commit | Plex Mono, muted; left out if the commit can't be read |
| Colours | — | Obsidian, Ivory, Champagne Gold, Electric Blue, attention orange `#d97b3f`, error `#e5677a` |
| Logos | — | Approved IJIDI and IGX AI artwork as images; no typeset wordmarks |
| Fonts | — | Inter + IBM Plex Mono |
| Cards | — | GlassCard glass and gold corner arcs, four variants |
| Background | — | Circuit background and the Settings studio |
| Engines | — | Visual-state engine, sound engine |
| States | — | Honest-state vocabulary and the NOT YET TRACKED rule |
