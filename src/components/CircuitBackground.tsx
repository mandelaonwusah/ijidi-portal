// src/components/CircuitBackground.tsx
// Living neon circuit-board background, drawn on one canvas.
//
// One 336 x 720 board cell is drawn each frame, then mirrored left and right
// (and up and down on tall screens) so the whole screen is filled at the
// board's own line spacing. It is never stretched. Glowing pulses run along
// the traces, each in the colour of the line it travels on; nodes glow, and a
// trace lights up now and then.
//
// Kept calm on purpose: soft glows, thin halos, 30 frames per second, and a
// self-adjusting quality level. Driven by useVisualState() (section brightness
// and pulse count). Reduced motion: one still frame, no movement.
// Decoration only: it never claims a system state.
import { useEffect, useRef } from "react";
import { useVisualState } from "@/lib/visual-state";

/* ------------------------------------------------------------------ */
/* Tuning                                                              */
/* ------------------------------------------------------------------ */
const H = 720; // board cell height (logical units)
const CW = 336; // board cell width
const G = 6; // routing grid step
const TAU = Math.PI * 2;

const ZOOM = 1.5; // how far the board is scaled up on desktop (1 = whole board fits the screen height)
const ZOOM_SMALL = 1.25; // same, on phones and narrow screens
const LINE = 0.32; // line thickness, as a share of the original (kept fine because the board is zoomed)
const HALO_WIDTH = 0.2; // thick glow bands, as a share of their original width
const GLOW = 0.26; // thick glow brightness, as a share of the original
const CORE = 0.75; // crisp line brightness
const PULSE_ALPHA = 0.5;
// false = only the moving lights (pulses) glow; true = also the glowing dots that stay in place
// (wire-end nodes, breathing lights, the red core glow and the blinking spine dots).
const STILL_LIGHTS = false;
const LIGHT = 1.6; // brightness of the lights: moving pulses and glowing nodes (1 = as before)
const PULSE_WIDTH = 0.75; // pulse thickness
const HEAD = 2.2; // size of the bright dot at the front of each moving light
const SPEED = 0.34; // pulse and glow speed, as a share of the original
const BASE_PULSES = 130; // ambient pulses per cell at medium intensity
const FRAME_MS = 1000 / 30;

// Board colours: the portal's own champagne gold and electric blue, kept calm.
// Cool blue carries most of the board; gold marks the chip and its buses.
const PALETTE: Record<string, string[]> = {
  hot: ["#C69B4A", "#D2A85A", "#B98A3E"],
  amber: ["#E0C078", "#D2B064"],
  cool: ["#3F7BEB", "#5A92F5", "#4A86F0", "#6A9CF8"],
  teal: ["#5CB3E8", "#7CC6F2"],
  violet: ["#5B6FE0", "#7382EA", "#6674E6"],
  pink: ["#7E8BE6", "#98A3EE"],
  red: ["#C98A3A", "#D69A4A"],
  white: ["#CFE0FA", "#EEF5FF"],
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type RGB = [number, number, number];
interface Pt {
  x: number;
  y: number;
}
interface PathT {
  pts: Pt[];
  cum: number[];
  total: number;
  role: string;
  tone: number;
  w: number;
  a: number;
  fiber?: boolean;
  hex?: string;
  s1?: string;
  s2?: string;
}
interface NodeT {
  x: number;
  y: number;
  r: number;
  role: string;
  tone: number;
}
interface OrbT {
  x: number;
  y: number;
  r: number;
  role: string;
  tone: number;
  f: number;
  ph: number;
  hex?: string;
  ring?: number;
  flare?: boolean;
}
interface PadT {
  x: number;
  y: number;
  w: number;
  h: number;
  role: string;
  tone: number;
}
interface GlyphT {
  x: number;
  y: number;
  w: number;
  h: number;
  f: number;
  ph: number;
}
interface IconT {
  x: number;
  y: number;
  w: number;
  h: number;
  role: string;
  f: number;
  ph: number;
}
interface SampleT {
  x: number;
  y: number;
  pi: number;
  d: number;
}
interface World {
  paths: PathT[];
  nodes: NodeT[];
  orbs: OrbT[];
  pads: PadT[];
  glyphs: GlyphT[];
  icons: IconT[];
  samples: SampleT[];
}
interface PulseT {
  pi: number;
  dir: number;
  len: number;
  v: number;
  k: number;
  d: number;
}
interface FlashT {
  pi: number;
  t: number;
  dur: number;
}
export interface EngineControl {
  intensity: number; // 0..1
  reduced: boolean;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function rng(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexCache = new Map<string, RGB>();
function hexRgb(h: string): RGB {
  let v = hexCache.get(h);
  if (!v) {
    const n = parseInt(h.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(h, v);
  }
  return v;
}
const rgba = (c: RGB | number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixW = (c: RGB, t: number): RGB => [
  Math.round(c[0] + (255 - c[0]) * t),
  Math.round(c[1] + (255 - c[1]) * t),
  Math.round(c[2] + (255 - c[2]) * t),
];
function col(role: string, tone: number): string {
  const arr = PALETTE[role];
  return arr[Math.min(arr.length - 1, Math.floor(tone * arr.length))];
}
function wpick(R: () => number, w: Record<string, number>): string {
  let t = 0;
  for (const k in w) t += w[k];
  let r = R() * t;
  for (const k in w) {
    r -= w[k];
    if (r <= 0) return k;
  }
  return "cool";
}
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}
function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/* ---------- path geometry ---------- */
function simplify(p: Pt[]): Pt[] {
  const out = [p[0]];
  for (let i = 1; i < p.length; i++) {
    const a = out[out.length - 1];
    const b = p[i];
    if (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6) continue;
    out.push(b);
  }
  const res = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = res[res.length - 1];
    const b = out[i];
    const c = out[i + 1];
    const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const dt = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
    if (Math.abs(cr) < 1e-6 && dt > 0) continue;
    res.push(b);
  }
  if (out.length > 1) res.push(out[out.length - 1]);
  return res;
}
function offsetPath(p: Pt[], o: number): Pt[] {
  const n = p.length;
  const nrm: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = p[i + 1].x - p[i].x;
    const dy = p[i + 1].y - p[i].y;
    const l = Math.hypot(dx, dy) || 1;
    nrm.push({ x: -dy / l, y: dx / l });
  }
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) out.push({ x: p[0].x + nrm[0].x * o, y: p[0].y + nrm[0].y * o });
    else if (i === n - 1) out.push({ x: p[i].x + nrm[i - 1].x * o, y: p[i].y + nrm[i - 1].y * o });
    else {
      const a = nrm[i - 1];
      const b = nrm[i];
      const m = 1 / Math.max(0.3, 1 + a.x * b.x + a.y * b.y);
      out.push({ x: p[i].x + (a.x + b.x) * o * m, y: p[i].y + (a.y + b.y) * o * m });
    }
  }
  return out;
}
function segIndex(p: PathT, d: number): number {
  const cum = p.cum;
  let lo = 0;
  let hi = cum.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
function pointAt(p: PathT, d: number): Pt {
  d = clamp(d, 0, p.total);
  const i = segIndex(p, d);
  const a = p.pts[i];
  const b = p.pts[i + 1];
  const t = (d - p.cum[i]) / (p.cum[i + 1] - p.cum[i] || 1);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function tracePath(c: CanvasRenderingContext2D, p: PathT) {
  c.beginPath();
  c.moveTo(p.pts[0].x, p.pts[0].y);
  for (let i = 1; i < p.pts.length; i++) c.lineTo(p.pts[i].x, p.pts[i].y);
}
function subPath(c: CanvasRenderingContext2D, p: PathT, d0: number, d1: number) {
  const pts = p.pts;
  const cum = p.cum;
  const i = segIndex(p, d0);
  let a = pts[i];
  let b = pts[i + 1];
  let t = (d0 - cum[i]) / (cum[i + 1] - cum[i] || 1);
  c.moveTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  let j = i + 1;
  while (j < pts.length - 1 && cum[j] < d1) {
    c.lineTo(pts[j].x, pts[j].y);
    j++;
  }
  a = pts[j - 1];
  b = pts[j];
  t = (d1 - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
  c.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
}

/* ------------------------------------------------------------------ */
/* World: the board layout (deterministic, no DOM)                     */
/* ------------------------------------------------------------------ */
const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];

interface RouteOpts {
  main: number;
  segs: number;
  min: number;
  max: number;
  jog: number;
  lanes: number;
  gap?: number;
  w?: number;
  role?: string;
  pre?: Pt[];
  endNode?: number;
}

export function buildWorld(seed: number, density: number): World {
  const R = rng(seed * 7919 + 13);
  const rand = (a: number, b: number) => a + (b - a) * R();
  const ri = (a: number, b: number) => Math.floor(rand(a, b + 1));
  const pick = <T,>(a: T[]): T => a[Math.floor(R() * a.length)];

  const paths: PathT[] = [];
  const nodes: NodeT[] = [];
  const orbs: OrbT[] = [];
  const pads: PadT[] = [];
  const glyphs: GlyphT[] = [];
  const icons: IconT[] = [];
  const samples: SampleT[] = [];

  const cols = Math.floor(CW / G);
  const rows = Math.floor(H / G);
  const gw = cols + 1;
  const gh = rows + 1;
  const occ = new Uint8Array(gw * gh);
  const inb = (x: number, y: number) => x >= 0 && x <= cols && y >= 0 && y <= rows;
  const isOcc = (x: number, y: number) => occ[y * gw + x] === 1;
  const mark = (x: number, y: number) => {
    if (inb(x, y)) occ[y * gw + x] = 1;
  };
  const reserve = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = Math.floor(y0 / G); y <= Math.ceil(y1 / G); y++)
      for (let x = Math.floor(x0 / G); x <= Math.ceil(x1 / G); x++) mark(x, y);
  };

  function roleAt(x: number, y: number): string {
    if (y > 230 && y < 420 && x > CW - 200) return wpick(R, { hot: 6, amber: 3, violet: 1, cool: 0.6, white: 0.4 });
    if (y < 250) return wpick(R, { cool: 3, hot: 1.2, white: 1, violet: 1, amber: 0.6, red: 0.3 });
    if (y >= 420 && y < 620) return wpick(R, { cool: 3, violet: 2.2, pink: 1, hot: 0.8, teal: 0.5, red: 0.3 });
    return wpick(R, { red: 1.6, cool: 1.6, violet: 1, hot: 1.2, pink: 0.5 });
  }

  function route(gx: number, gy: number, dir: number, o: RouteOpts): number[][] | null {
    if (!inb(gx, gy) || isOcc(gx, gy)) return null;
    const main = o.main;
    let d = dir;
    let x = gx;
    let y = gy;
    let fails = 0;
    const pts: number[][] = [[x, y]];
    mark(x, y);
    for (let s = 0; s < o.segs; s++) {
      const len = ri(o.min, o.max);
      let moved = 0;
      for (let k = 0; k < len; k++) {
        const nx = x + DX[d];
        const ny = y + DY[d];
        if (!inb(nx, ny) || isOcc(nx, ny)) break;
        x = nx;
        y = ny;
        mark(x, y);
        moved++;
      }
      if (moved > 0) {
        pts.push([x, y]);
        fails = 0;
      } else {
        if (++fails > 3) break;
        d = (main + pick([0, 1, 7, 2, 6]) + 8) % 8;
        continue;
      }
      let rel = (d - main + 8) % 8;
      if (rel > 4) rel -= 8;
      if (rel === 0) d = R() < o.jog ? (main + (R() < 0.5 ? 1 : 7)) % 8 : main;
      else if (Math.abs(rel) === 1) d = R() < 0.86 ? main : (main + rel * 2 + 8) % 8;
      else if (Math.abs(rel) === 2) d = (main + rel / 2 + 8) % 8;
      else d = main;
    }
    return pts.length >= 2 ? pts : null;
  }

  function pushPath(pts: Pt[], role: string, tone: number, w: number, ex?: Partial<PathT>): PathT | null {
    pts = simplify(pts);
    if (pts.length < 2) return null;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1];
    if (total < 10) return null;
    const p: PathT = Object.assign({ pts, cum, total, role, tone, w, a: rand(0.6, 1) }, ex || {});
    paths.push(p);
    return p;
  }

  function addBus(gx: number, gy: number, dir: number, o: RouteOpts) {
    const center = route(gx, gy, dir, o);
    if (!center) return;
    let pts: Pt[] = center.map((p) => ({ x: p[0] * G, y: p[1] * G }));
    if (o.pre) pts = o.pre.concat(pts);
    pts = simplify(pts);
    if (pts.length < 2) return;
    const mid = pts[pts.length >> 1];
    const baseRole = o.role || roleAt(mid.x, mid.y);
    const t0 = R();
    for (let l = 0; l < o.lanes; l++) {
      const off = (l - (o.lanes - 1) / 2) * (o.gap || 3.6);
      const role = R() < 0.14 ? (R() < 0.5 ? "white" : "amber") : baseRole;
      const lp = o.lanes === 1 ? pts : offsetPath(pts, off);
      const p = pushPath(lp, role, clamp(t0 + l * 0.13, 0, 0.99), o.w || rand(0.8, 1.15));
      if (p && R() < (o.endNode ?? 0.55)) {
        const e = p.pts[p.pts.length - 1];
        nodes.push({ x: e.x, y: e.y, r: rand(2, 3.4), role, tone: p.tone });
      }
    }
  }

  const O = (main: number, ex: Partial<RouteOpts>): RouteOpts =>
    Object.assign({ main, segs: 10, min: 3, max: 12, jog: 0.5, lanes: 1 }, ex);

  /* reserved regions for hand-placed hardware */
  reserve(214, 352, CW, 402); // chip
  reserve(276, 490, CW, 596); // frames
  reserve(270, 612, CW, H); // red core
  reserve(222, 632, 248, H); // blue connector
  reserve(0, 168, 16, 312); // spine icons
  reserve(14, 452, 52, 498); // red ring
  reserve(226, 444, CW, 462); // teal rail

  /* chip pin buses: up, down, and out of the chip ends */
  for (const gx of [40, 45, 50, 55]) {
    addBus(gx, 57, 6, O(6, { lanes: ri(2, 4), gap: rand(3.2, 4.4), segs: 14, min: 3, max: 14, jog: 0.7, role: pick(["hot", "amber", "hot"]), pre: [{ x: gx * G, y: 352 }] }));
  }
  for (const gx of [41, 47, 53]) {
    addBus(gx, 68, 2, O(2, { lanes: ri(2, 3), gap: rand(3.4, 4.4), segs: 10, min: 3, max: 12, jog: 0.6, role: pick(["hot", "violet", "cool"]), pre: [{ x: gx * G, y: 402 }] }));
  }
  addBus(36, 57, 5, O(6, { lanes: 4, gap: 4, segs: 14, jog: 0.75, role: "hot", pre: [{ x: 222, y: 356 }] }));
  addBus(36, 68, 3, O(2, { lanes: 4, gap: 4, segs: 12, jog: 0.7, role: "hot", pre: [{ x: 222, y: 398 }] }));
  addBus(35, 62, 4, O(4, { lanes: 4, gap: 4.4, segs: 10, min: 3, max: 10, jog: 0.5, role: "amber", pre: [{ x: 222, y: 372 }] }));

  /* spine trunks along the centre axis */
  for (const gx of [2, 5, 9]) {
    addBus(gx, 0, 2, O(2, { lanes: ri(2, 3), gap: 4.6, segs: 22, min: 4, max: 16, jog: 0.35, role: pick(["cool", "violet", "white"]), w: 1.1 }));
  }

  /* spine pieces: V marks and a rail under the chip */
  pushPath([{ x: 26, y: 268 }, { x: 0, y: 296 }], "white", 0.3, 0.9);
  pushPath([{ x: 40, y: 268 }, { x: 12, y: 300 }], "cool", 0.2, 0.8);
  pushPath([{ x: 232, y: 453 }, { x: CW, y: 453 }], "teal", 0.3, 1.1, { a: 1 });
  pushPath([{ x: 236, y: 445 }, { x: 236, y: 461 }], "teal", 0.3, 0.8);
  pushPath([{ x: 300, y: 402 }, { x: 300, y: 490 }], "hot", 0.2, 1);
  pushPath([{ x: 314, y: 402 }, { x: 314, y: 490 }], "amber", 0.2, 1);

  /* fill traces */
  const attempts = Math.round(300 * density);
  for (let i = 0; i < attempts; i++) {
    const gx = ri(0, cols);
    const gy = ri(0, rows);
    const r = R();
    let main: number;
    if (r < 0.55) main = R() < 0.5 ? 2 : 6;
    else if (r < 0.8) main = R() < 0.5 ? 0 : 4;
    else main = pick([1, 3, 5, 7]);
    const lanes = R() < 0.22 ? ri(2, 4) : 1;
    const pts = route(gx, gy, main, O(main, { segs: ri(3, 12), min: 2, max: ri(6, 14), jog: rand(0.3, 0.7) }));
    if (!pts) continue;
    const cp: Pt[] = pts.map((p) => ({ x: p[0] * G, y: p[1] * G }));
    const mid = cp[cp.length >> 1];
    const baseRole = roleAt(mid.x, mid.y);
    const t0 = R();
    for (let l = 0; l < lanes; l++) {
      const lp = lanes === 1 ? cp : offsetPath(simplify(cp), (l - (lanes - 1) / 2) * 3.6);
      const p = pushPath(lp, baseRole, clamp(t0 + l * 0.13, 0, 0.99), lanes === 1 ? rand(0.7, 1.1) : rand(0.7, 1));
      if (!p) continue;
      if (R() < 0.5) p.a *= 0.5;
      if (R() < 0.55) {
        const e = p.pts[p.pts.length - 1];
        nodes.push({ x: e.x, y: e.y, r: rand(1.8, 3.6), role: baseRole, tone: p.tone });
      }
    }
  }

  /* fibre bundle at the top */
  for (let i = 0; i < 16; i++) {
    const x = 150 + R() * 64;
    pushPath([{ x, y: -4 }, { x, y: rand(90, 270) }], R() < 0.5 ? "white" : "cool", R(), rand(0.5, 0.9), { fiber: true, a: rand(0.5, 1) });
  }

  /* samples along every path: used for snapping orbs */
  paths.forEach((p, pi) => {
    for (let d = 0; d <= p.total; d += 10) {
      const q = pointAt(p, d);
      samples.push({ x: q.x, y: q.y, pi, d });
    }
  });

  /* hand-placed light sources */
  const fixed: Partial<OrbT>[] = [
    { x: 222, y: 352, r: 5, role: "amber" },
    { x: 222, y: 402, r: 5, role: "amber" },
    { x: 267, y: 453, r: 8, role: "teal", f: 1.3 },
    { x: 235, y: 662, r: 7, role: "cool" },
    { x: 70, y: 42, r: 8, role: "red" },
    { x: 4, y: 70, r: 5, role: "red" },
    { x: 6, y: 647, r: 3.5, role: "red" },
    { x: 32, y: 475, r: 10, role: "red", f: 1.1, ring: 14 },
  ];
  for (const o of fixed) orbs.push(Object.assign({ f: rand(0.8, 2), ph: rand(0, TAU), tone: 0.1 }, o) as OrbT);
  const snapped: Partial<OrbT>[] = [
    { x: 150, y: 100, r: 11, role: "white", flare: true },
    { x: 148, y: 228, r: 9, role: "violet" },
    { x: 125, y: 388, r: 6, role: "pink" },
    { x: 170, y: 507, r: 9, role: "cool" },
    { x: 210, y: 523, r: 6, role: "cool" },
    { x: 92, y: 530, r: 7, role: "hot" },
    { x: 193, y: 594, r: 5, role: "pink" },
    { x: 270, y: 573, r: 5, role: "cool" },
    { x: 140, y: 475, r: 6, role: "cool" },
    { x: 120, y: 458, r: 5, role: "violet" },
    { x: 29, y: 385, r: 5, role: "pink" },
    { x: 186, y: 40, r: 5, role: "cool" },
  ];
  for (const o of snapped) {
    let best: SampleT | null = null;
    let bd = 50 * 50;
    for (const s of samples) {
      const dd = (s.x - (o.x as number)) ** 2 + (s.y - (o.y as number)) ** 2;
      if (dd < bd) {
        bd = dd;
        best = s;
      }
    }
    if (best) {
      o.x = best.x;
      o.y = best.y;
    }
    orbs.push(Object.assign({ f: rand(0.8, 2.2), ph: rand(0, TAU), tone: R() }, o) as OrbT);
  }
  const extra = Math.round(34 * density);
  for (let i = 0; i < extra && paths.length; i++) {
    const p = paths[Math.floor(R() * paths.length)];
    if (p.fiber || p.total < 40) continue;
    const q = pointAt(p, R() < 0.5 ? p.total : rand(0, p.total));
    orbs.push({ x: q.x, y: q.y, r: rand(3.5, 6.5), role: p.role, tone: p.tone, f: rand(0.8, 2.4), ph: rand(0, TAU) });
  }

  /* small pads beside traces */
  const padCount = Math.round(40 * density);
  for (let i = 0; i < padCount && samples.length; i++) {
    const s = samples[Math.floor(R() * samples.length)];
    const p = paths[s.pi];
    if (p.fiber) continue;
    const side = R() < 0.5 ? -1 : 1;
    const off = rand(4, 8);
    pads.push({ x: s.x + side * off, y: s.y + rand(-4, 4), w: rand(2, 3.6), h: rand(5, 10), role: R() < 0.6 ? p.role : pick(["hot", "red", "cool"]), tone: R() });
  }

  /* chip glyphs (a half chip; the mirror completes it) */
  let gx = 238;
  while (gx < CW - 6) {
    const w = ri(2, 6);
    const h = pick([8, 14, 20, 26]);
    glyphs.push({ x: gx, y: 377 - h / 2, w, h, f: rand(0.8, 3), ph: rand(0, TAU) });
    gx += w + ri(2, 5);
  }
  /* spine icons */
  for (let y = 176; y < 264; y += 10) {
    icons.push({ x: rand(1, 12), y, w: rand(2, 4), h: rand(3, 6), role: pick(["red", "white", "cool", "red"]), f: rand(0.6, 3), ph: rand(0, TAU) });
  }

  return { paths, nodes, orbs, pads, glyphs, icons, samples };
}

/* ------------------------------------------------------------------ */
/* Engine: paints, animates and presents the board on a canvas         */
/* ------------------------------------------------------------------ */
const sprites = new Map<string, HTMLCanvasElement>();
function sprite(hex: string): HTMLCanvasElement {
  let sp = sprites.get(hex);
  if (sp) return sp;
  const rgb = hexRgb(hex);
  sp = makeCanvas(64, 64);
  const g = sp.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.1, rgba(mixW(rgb, 0.6), 0.95));
  gr.addColorStop(0.28, rgba(rgb, 0.55));
  gr.addColorStop(0.6, rgba(rgb, 0.14));
  gr.addColorStop(1, rgba(rgb, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  sprites.set(hex, sp);
  return sp;
}

export function createCircuitEngine(canvas: HTMLCanvasElement, getControl: () => EngineControl) {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const stat = makeCanvas(2, 2);
  const sctx = stat.getContext("2d") as CanvasRenderingContext2D;
  const cell = makeCanvas(2, 2);
  const cctx = cell.getContext("2d") as CanvasRenderingContext2D;

  const world = buildWorld(11, 1);
  const RT = rng(99);
  let pulses: PulseT[] = [];
  let flashes: FlashT[] = [];
  let T = 0;
  let flashT = 0;
  let quality = 1;
  let cw = 2;
  let ch = 2;
  let sx = 1;
  let sy = 1;
  let wasReduced: boolean | null = null;
  let axisView = false;

  /* ---------- static layer (lines, nodes, chip, frames) ---------- */
  function paintStatic() {
    const c = sctx;
    const { paths, nodes, orbs, pads, glyphs } = world;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, stat.width, stat.height);
    c.setTransform(sx, 0, 0, sy, 0, 0);
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    c.lineJoin = "round";

    for (const p of paths) {
      const hex = col(p.role, p.tone);
      const rgb = hexRgb(hex);
      p.hex = hex;
      p.s1 = rgba(rgb, 0.22);
      p.s2 = rgba(mixW(rgb, 0.2), 0.85);
      if (p.fiber) {
        const y1 = p.pts[p.pts.length - 1].y;
        const g = c.createLinearGradient(0, 0, 0, y1);
        g.addColorStop(0, rgba(mixW(rgb, 0.8), 0.8 * p.a));
        g.addColorStop(0.5, rgba(rgb, 0.4 * p.a));
        g.addColorStop(1, rgba(rgb, 0));
        c.strokeStyle = g;
        c.lineWidth = p.w * LINE;
        tracePath(c, p);
        c.stroke();
        continue;
      }
      tracePath(c, p);
      c.strokeStyle = rgba(rgb, 0.035 * GLOW * p.a);
      c.lineWidth = p.w * 6 * HALO_WIDTH * LINE;
      c.stroke();
      c.strokeStyle = rgba(rgb, 0.1 * GLOW * p.a);
      c.lineWidth = p.w * 2.6 * HALO_WIDTH * LINE;
      c.stroke();
      c.strokeStyle = rgba(rgb, 0.6 * CORE * p.a);
      c.lineWidth = p.w * 0.9 * LINE;
      c.stroke();
      c.strokeStyle = rgba(mixW(rgb, 0.5), 0.25 * CORE * p.a);
      c.lineWidth = p.w * 0.35 * LINE;
      c.stroke();
    }

    for (const n of STILL_LIGHTS ? nodes : []) {
      const rgb = hexRgb(col(n.role, n.tone));
      c.fillStyle = rgba(rgb, 0.4 * GLOW * LIGHT);
      c.beginPath();
      c.arc(n.x, n.y, n.r * 2.1, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(rgb, 0.85);
      c.lineWidth = 0.9;
      c.beginPath();
      c.arc(n.x, n.y, n.r, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(mixW(rgb, 0.6), 0.95);
      c.beginPath();
      c.arc(n.x, n.y, n.r * 0.36, 0, TAU);
      c.fill();
    }

    for (const o of STILL_LIGHTS ? orbs : []) {
      o.hex = col(o.role, o.tone);
      const rgb = hexRgb(o.hex);
      c.strokeStyle = rgba(rgb, 0.5);
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(o.x, o.y, o.ring || o.r * 0.55, 0, TAU);
      c.stroke();
      if (o.ring) {
        c.strokeStyle = rgba(rgb, 0.1);
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(o.x, o.y, o.ring, 0, TAU);
        c.stroke();
        c.strokeStyle = rgba(rgb, 0.5);
        c.lineWidth = 0.9;
        c.beginPath();
        c.arc(o.x, o.y, o.ring, 0, TAU);
        c.stroke();
        c.strokeStyle = rgba(rgb, 0.4);
        c.lineWidth = 0.8;
        c.beginPath();
        c.arc(o.x, o.y, o.ring - 5, 0, TAU);
        c.stroke();
      }
    }

    for (const p of pads) {
      const rgb = hexRgb(col(p.role, p.tone));
      c.fillStyle = rgba(rgb, 0.1);
      c.fillRect(p.x - p.w * 1.5, p.y - p.h * 0.8, p.w * 3, p.h * 1.6);
      c.fillStyle = rgba(rgb, 0.65);
      c.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
    }

    /* warm bloom above the chip */
    const bloomC = hexRgb(col("hot", 0.1));
    for (const [bx, by, br, ba] of [
      [CW - 60, 300, 150, 0.05],
      [CW - 118, 262, 90, 0.035],
    ]) {
      const bgd = c.createRadialGradient(bx, by, 0, bx, by, br);
      bgd.addColorStop(0, rgba(bloomC, ba));
      bgd.addColorStop(1, rgba(bloomC, 0));
      c.fillStyle = bgd;
      c.fillRect(bx - br, by - br, br * 2, br * 2);
    }

    /* chip */
    const am = hexRgb(col("amber", 0.1));
    const ho = hexRgb(col("hot", 0.1));
    const chipPath = () => {
      c.beginPath();
      c.moveTo(CW, 352);
      c.lineTo(228, 352);
      c.quadraticCurveTo(222, 352, 222, 358);
      c.lineTo(222, 396);
      c.quadraticCurveTo(222, 402, 228, 402);
      c.lineTo(CW, 402);
    };
    const cg = c.createLinearGradient(0, 352, 0, 402);
    cg.addColorStop(0, rgba(ho, 0.05));
    cg.addColorStop(1, rgba(am, 0.015));
    c.fillStyle = cg;
    c.fillRect(222, 352, CW - 222, 50);
    chipPath();
    c.strokeStyle = rgba(am, 0.025);
    c.lineWidth = 2;
    c.stroke();
    chipPath();
    c.strokeStyle = rgba(am, 0.07);
    c.lineWidth = 1.1;
    c.stroke();
    chipPath();
    c.strokeStyle = rgba(mixW(am, 0.1), 0.5);
    c.lineWidth = 0.8;
    c.stroke();
    c.strokeStyle = rgba(am, 0.25);
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(CW, 358);
    c.lineTo(230, 358);
    c.lineTo(228, 360);
    c.lineTo(228, 394);
    c.lineTo(230, 396);
    c.lineTo(CW, 396);
    c.stroke();
    for (const g of glyphs) {
      c.fillStyle = rgba(am, 0.22);
      c.fillRect(g.x, g.y, g.w, g.h);
    }

    /* frames under the chip */
    const fr = (x: number, y: number, w: number, h: number, r: number, a: number, lw: number) => {
      rr(c, x, y, w, h, r);
      c.strokeStyle = rgba(am, a);
      c.lineWidth = lw;
      c.stroke();
    };
    fr(285, 497, CW - 285 + 40, 93, 9, 0.03, 2);
    fr(285, 497, CW - 285 + 40, 93, 9, 0.38, 0.8);
    fr(294, 506, CW - 294 + 40, 75, 6, 0.2, 0.8);
    c.strokeStyle = rgba(hexRgb(col("cool", 0.1)), 0.45);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(300, 570);
    c.lineTo(CW, 570);
    c.stroke();

    /* teal rail brackets */
    const te = hexRgb(col("teal", 0.2));
    c.strokeStyle = rgba(te, 0.6);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(226, 446);
    c.lineTo(226, 460);
    c.lineTo(232, 460);
    c.moveTo(226, 446);
    c.lineTo(232, 446);
    c.stroke();

    /* red core */
    const rd = hexRgb(col("red", 0.1));
    const rg = c.createLinearGradient(0, 630, 0, 700);
    rg.addColorStop(0, rgba(rd, 0.12));
    rg.addColorStop(1, rgba(rd, 0.02));
    c.fillStyle = rg;
    rr(c, 292, 632, CW - 292 + 60, 62, 26);
    c.fill();
    rr(c, 292, 632, CW - 292 + 60, 62, 26);
    c.strokeStyle = rgba(rd, 0.16);
    c.lineWidth = 0.7;
    c.stroke();
    for (const px of [CW - 8, CW + 8]) {
      const pg = c.createLinearGradient(0, 634, 0, 692);
      pg.addColorStop(0, rgba([255, 255, 255], 0.5));
      pg.addColorStop(1, rgba(rd, 0.1));
      c.strokeStyle = pg;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(px, 636);
      c.lineTo(px, 692);
      c.stroke();
    }

    /* blue connector */
    const bl = hexRgb(col("cool", 0.3));
    const bg = c.createLinearGradient(0, 640, 0, 692);
    bg.addColorStop(0, rgba(mixW(bl, 0.2), 0.45));
    bg.addColorStop(1, rgba(bl, 0.15));
    c.fillStyle = bg;
    rr(c, 228, 640, 14, 52, 4);
    c.fill();
    c.strokeStyle = rgba(mixW(bl, 0.4), 0.45);
    c.lineWidth = 0.9;
    rr(c, 228, 640, 14, 52, 4);
    c.stroke();
    c.strokeStyle = rgba([255, 255, 255], 0.3);
    c.lineWidth = 0.6;
    for (let y = 650; y < 690; y += 6) {
      c.beginPath();
      c.moveTo(231, y);
      c.lineTo(239, y);
      c.stroke();
    }
  }

  /* ---------- pulses ---------- */
  function pickPath(): number {
    const { paths } = world;
    for (let i = 0; i < 6; i++) {
      const idx = (RT() * paths.length) | 0;
      if (RT() < Math.min(1, paths[idx].total / 160)) return idx;
    }
    return (RT() * paths.length) | 0;
  }
  function makePulse(pi: number): PulseT {
    const p = world.paths[pi];
    const dir = RT() < 0.5 ? 1 : -1;
    const len = p.fiber ? 40 + RT() * 80 : 22 + RT() * 70;
    const v = (p.fiber ? 200 + RT() * 160 : 60 + RT() * 150) * SPEED;
    return { pi, dir, len, v, k: 0.55 + RT() * 0.45, d: 0 };
  }
  function pulseTarget(): number {
    const f = clamp(getControl().intensity / 0.5, 0.35, 1.6);
    return Math.round(BASE_PULSES * f * quality);
  }
  function seedPulses() {
    pulses = [];
    if (!world.paths.length) return;
    const n = pulseTarget();
    for (let i = 0; i < n; i++) {
      const p = makePulse(pickPath());
      p.d = -p.len + RT() * (world.paths[p.pi].total + p.len * 2);
      pulses.push(p);
    }
  }
  function respawn(p: PulseT) {
    const q = makePulse(pickPath());
    const path = world.paths[q.pi];
    q.d = q.dir > 0 ? -q.len * 0.2 : path.total + q.len * 0.2;
    Object.assign(p, q);
  }

  function update(dt: number) {
    const { paths } = world;
    T += dt;
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const path = paths[p.pi];
      p.d += p.v * p.dir * dt;
      const gone = p.dir > 0 ? p.d - p.len > path.total : p.d + p.len < 0;
      if (gone) respawn(p);
    }
    const target = pulseTarget();
    if (pulses.length < target - 4) {
      for (let i = 0; i < 4; i++) {
        const p = makePulse(pickPath());
        p.d = -p.len;
        pulses.push(p);
      }
    } else if (pulses.length > target + 4) {
      pulses.splice(pulses.length - 4, 4);
    }

    flashT -= dt;
    if (flashT <= 0 && paths.length) {
      flashT = 0.9 + RT() * 1.6;
      flashes.push({ pi: pickPath(), t: 0, dur: 1.4 + RT() * 1.6 });
      if (flashes.length > 8) flashes.shift();
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t += dt;
      if (flashes[i].t > flashes[i].dur) flashes.splice(i, 1);
    }
  }

  /* ---------- dynamic layer, drawn on top of the static one ---------- */
  function drawCell(animate: boolean) {
    const c = cctx;
    const { paths, orbs, glyphs, icons } = world;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.clearRect(0, 0, cw, ch);
    c.drawImage(stat, 0, 0);
    c.setTransform(sx, 0, 0, sy, 0, 0);
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    c.lineJoin = "round";

    if (animate) {
      /* a trace lights up for a moment */
      for (const f of flashes) {
        const p = paths[f.pi];
        if (!p.s2) continue;
        const a = Math.pow(1 - f.t / f.dur, 1.5);
        c.globalAlpha = a * 0.07;
        c.strokeStyle = p.s1 as string;
        c.lineWidth = p.w * 1.6;
        tracePath(c, p);
        c.stroke();
        c.globalAlpha = clamp(a * 0.35 * LIGHT, 0, 1);
        c.strokeStyle = p.s2;
        c.lineWidth = p.w * 0.7;
        tracePath(c, p);
        c.stroke();
      }

      /* pulses: a thin halo, a bright short head, a small glowing dot */
      for (const pl of pulses) {
        const p = paths[pl.pi];
        if (!p.s2) continue;
        let d0: number;
        let d1: number;
        if (pl.dir > 0) {
          d1 = pl.d;
          d0 = pl.d - pl.len;
        } else {
          d0 = pl.d;
          d1 = pl.d + pl.len;
        }
        d0 = Math.max(0, d0);
        d1 = Math.min(p.total, d1);
        if (d1 - d0 < 0.5) continue;
        c.globalAlpha = clamp(pl.k * PULSE_ALPHA * LIGHT, 0, 1);
        c.beginPath();
        subPath(c, p, d0, d1);
        c.strokeStyle = p.s1 as string;
        c.lineWidth = p.w * PULSE_WIDTH;
        c.stroke();
        const L = (d1 - d0) * 0.45;
        c.beginPath();
        if (pl.dir > 0) subPath(c, p, Math.max(d0, d1 - L), d1);
        else subPath(c, p, d0, Math.min(d1, d0 + L));
        c.strokeStyle = p.s2;
        c.lineWidth = p.w * PULSE_WIDTH * 0.85;
        c.stroke();
        if (pl.d >= 0 && pl.d <= p.total) {
          const q = pointAt(p, pl.d);
          const r = (p.w * 1.1 + 0.8) * HEAD;
          c.drawImage(sprite(p.hex as string), q.x - r, q.y - r, r * 2, r * 2);
        }
      }
      c.globalAlpha = 1;
    }

    /* glowing nodes */
    for (const o of STILL_LIGHTS ? orbs : []) {
      if (!o.hex) continue;
      const k = animate ? 0.62 + 0.38 * Math.sin(T * o.f * 2.2 * SPEED + o.ph) : 0.75;
      const r = o.r * 2;
      c.globalAlpha = clamp(k, 0, 1) * clamp(0.42 * LIGHT, 0, 1);
      c.drawImage(sprite(o.hex), o.x - r, o.y - r, r * 2, r * 2);
      // a small bright core so each light reads as a point of light
      c.globalAlpha = clamp(k, 0, 1) * clamp(0.3 * LIGHT, 0, 1);
      const rc = o.r * 0.9;
      c.drawImage(sprite(o.hex), o.x - rc, o.y - rc, rc * 2, rc * 2);
      if (o.flare) {
        c.globalAlpha = 0.22 * clamp(k, 0, 1);
        const gh = c.createLinearGradient(o.x - 60, 0, o.x + 60, 0);
        gh.addColorStop(0, "rgba(255,255,255,0)");
        gh.addColorStop(0.5, "rgba(255,255,255,.9)");
        gh.addColorStop(1, "rgba(255,255,255,0)");
        c.strokeStyle = gh;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(o.x - 60, o.y);
        c.lineTo(o.x + 60, o.y);
        c.stroke();
        const gv = c.createLinearGradient(0, o.y - 44, 0, o.y + 44);
        gv.addColorStop(0, "rgba(255,255,255,0)");
        gv.addColorStop(0.5, "rgba(255,255,255,.9)");
        gv.addColorStop(1, "rgba(255,255,255,0)");
        c.strokeStyle = gv;
        c.beginPath();
        c.moveTo(o.x, o.y - 44);
        c.lineTo(o.x, o.y + 44);
        c.stroke();
      }
    }
    c.globalAlpha = 1;

    /* chip: flicker and a scanning highlight */
    const am = hexRgb(col("amber", 0.1));
    const scan = 232 + ((T * 60 * SPEED) % (CW - 232 + 60));
    for (const g of glyphs) {
      const fl = animate ? 0.5 + 0.5 * Math.sin(T * g.f * 2 * SPEED + g.ph) : 0.5;
      const near = animate ? Math.max(0, 1 - Math.abs(g.x - scan) / 26) : 0;
      c.fillStyle = rgba(am, clamp(0.14 + fl * 0.3 + near * 0.25, 0, 1));
      c.fillRect(g.x, g.y, g.w, g.h);
    }

    /* red core breathing */
    const rb = animate ? 0.1 + 0.05 * Math.sin(T * 2.2 * SPEED) : 0.15;
    c.globalAlpha = rb;
    if (STILL_LIGHTS) c.drawImage(sprite(col("red", 0.1)), CW - 110, 570, 220, 180);
    c.globalAlpha = 1;

    /* spine icons */
    for (const ic of STILL_LIGHTS ? icons : []) {
      const rgb = hexRgb(col(ic.role, 0.2));
      const k = animate ? 0.3 + 0.7 * Math.max(0, Math.sin(T * ic.f * SPEED + ic.ph)) : 0.6;
      c.fillStyle = rgba(rgb, k * 0.8);
      c.fillRect(ic.x, ic.y, ic.w, ic.h);
    }
  }

  /* ---------- present: mirror the cell across the whole screen ---------- */
  function present(axis: boolean) {
    const W = canvas.width;
    const Hh = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#03050a";
    ctx.fillRect(0, 0, W, Hh);
    const cxm = Math.round(W / 2) - (axis ? cw : 0);
    const y0 = Math.round((Hh - ch) / 2);
    const kx = Math.ceil(Math.max(cxm, W - cxm) / cw) + 1;
    const ky = y0 > 0 ? Math.ceil(y0 / ch) : 0;
    for (let j = -kx; j < kx; j++) {
      for (let k = -ky; k <= ky; k++) {
        const x = cxm + j * cw;
        const y = y0 + k * ch;
        if (x > W || x + cw < 0 || y > Hh || y + ch < 0) continue;
        const mx = j & 1;
        const my = k & 1;
        ctx.save();
        ctx.translate(mx ? x + cw : x, my ? y + ch : y);
        ctx.scale(mx ? -1 : 1, my ? -1 : 1);
        ctx.drawImage(cell, 0, 0);
        ctx.restore();
      }
    }
  }

  /* ---------- sizing ---------- */
  function resize(cssW: number, cssH: number, dpr: number, axis = false, zoom = 1) {
    axisView = axis;
    canvas.width = Math.max(2, Math.round(cssW * dpr));
    canvas.height = Math.max(2, Math.round(cssH * dpr));
    const s = (cssH / H) * zoom;
    ch = Math.max(2, Math.round(H * s * dpr));
    cw = Math.max(2, Math.round(CW * s * dpr));
    sx = cw / CW;
    sy = ch / H;
    stat.width = cw;
    stat.height = ch;
    cell.width = cw;
    cell.height = ch;
    paintStatic();
    redrawStill();
  }

  function redrawStill() {
    drawCell(false);
    present(axisView);
  }

  /* ---------- one frame ---------- */
  function step(dt: number) {
    const control = getControl();
    if (control.reduced) {
      if (wasReduced !== true) {
        pulses = [];
        flashes = [];
        redrawStill();
      }
      wasReduced = true;
      return;
    }
    if (wasReduced !== false) seedPulses();
    wasReduced = false;

    const t0 = performance.now();
    update(Math.min(0.06, dt));
    drawCell(true);
    present(axisView);
    // Keep the work per frame small: back off on slow machines.
    const work = performance.now() - t0;
    if (work > 14 && quality > 0.35) quality *= 0.9;
    else if (work < 7 && quality < 1) quality = Math.min(1, quality * 1.03);
  }

  return { resize, step, redrawStill, frameMs: FRAME_MS };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function CircuitBackground() {
  const { activeSection, circuitIntensity, ambientOpacity, reducedMotion } = useVisualState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlRef = useRef<EngineControl>({ intensity: circuitIntensity, reduced: reducedMotion });
  controlRef.current = { intensity: circuitIntensity, reduced: reducedMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createCircuitEngine(canvas, () => controlRef.current);

    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = w < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      // Phones and tall screens are centred on the dense chip side of the board.
      engine.resize(w, h, dpr, w < 900 || w < h, w < 768 ? ZOOM_SMALL : ZOOM);
    };
    fit();

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed < engine.frameMs) return;
      last = now;
      engine.step(elapsed / 1000);
    };
    raf = requestAnimationFrame(loop);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(fit, 150);
    };
    window.addEventListener("resize", onResize);

    // Fade in once the first frame is painted.
    canvas.style.opacity = String(0.6 + 0.2 * ambientOpacity);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
    // The engine is created once; live values are read through controlRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Section brightness follows the visual-state preset.
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.style.opacity = String(0.6 + 0.2 * ambientOpacity);
  }, [ambientOpacity]);

  return (
    <div
      aria-hidden="true"
      data-visual-section={activeSection}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#03050a",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          opacity: 0,
          transition: "opacity 1.2s ease",
        }}
      />
      {/* Edge vignette only: seats the interface without dulling the board */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
