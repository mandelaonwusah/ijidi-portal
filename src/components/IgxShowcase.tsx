// src/components/IgxShowcase.tsx
// The IGX AI settings panels: glass tab bar, the living orb (Ecosystem), Architecture,
// Decisions, Agents, Models and the Brand library. Look and structure follow the IGX
// Executive Command Center prototype, in the portal's gold and blue. The main IGX AI page
// is the chat; everything here lives behind its settings button.
//
// Honest-state rules for this file:
//  - The orb's status text is the REAL console state (idle / submitting / awaiting
//    review / error). The six animation states are only a labelled PREVIEW.
//  - The four stat cards are real counts from `proposals`, or "Not tracked".
//  - Decisions come from the real `decisions` table.
//  - Agents and Models list what is recorded in the IGX AI knowledge base; every
//    runtime metric says "Not tracked" until something real reports it.
//  - Architecture is design documentation, not system status.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { Eyebrow } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import { BRAND_ASSETS } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */
export const IGX_TABS = [
  { key: "ecosystem", label: "Ecosystem" },
  { key: "architecture", label: "Architecture" },
  { key: "decisions", label: "Decisions" },
  { key: "agents", label: "Agents" },
  { key: "models", label: "Models" },
  { key: "brand", label: "Brand library" },
] as const;

export type IgxTabKey = (typeof IGX_TABS)[number]["key"];

export function IgxTabBar({
  active,
  onChange,
}: {
  active: IgxTabKey;
  onChange: (key: IgxTabKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="IGX AI sections"
      className="mx-auto flex max-w-3xl flex-wrap justify-center gap-1 rounded-2xl border border-gold/20 bg-black/15 p-1 backdrop-blur-[4px]"
    >
      {IGX_TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-xl px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
              on
                ? "bg-gold font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function PanelHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-6 text-center">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The orb                                                             */
/* ------------------------------------------------------------------ */
export type OrbState =
  | "idle"
  | "thinking"
  | "routing"
  | "orchestrating"
  | "synthesizing"
  | "responding";

const ORB_STATES: { key: OrbState; label: string; desc: string }[] = [
  { key: "idle", label: "Idle", desc: "System ready and monitoring." },
  { key: "thinking", label: "Thinking", desc: "Information flows in from multiple sources." },
  { key: "routing", label: "Routing", desc: "Tasks are routed to the best available resources." },
  { key: "orchestrating", label: "Orchestrating", desc: "Nodes collaborate and exchange data directly." },
  { key: "synthesizing", label: "Synthesizing", desc: "Insights are synthesized into unified intelligence." },
  { key: "responding", label: "Responding", desc: "Results are delivered back to you." },
];

type NodeType = "ai" | "agent" | "tool" | "kb" | "workflow" | "external";

const NODES: { x: number; y: number; color: string; type: NodeType; label: string }[] = [
  { x: 300, y: 110, color: "#4F86F7", type: "ai", label: "AI Models" },
  { x: 434.3, y: 165.7, color: "#E3C27A", type: "agent", label: "Agents" },
  { x: 490, y: 300, color: "#C6A15B", type: "tool", label: "APIs & Tools" },
  { x: 434.3, y: 434.3, color: "#5E9BFF", type: "kb", label: "Knowledge Bases" },
  { x: 300, y: 490, color: "#8FB4FF", type: "workflow", label: "Workflows" },
  { x: 165.7, y: 434.3, color: "#F0D9A0", type: "external", label: "External Systems" },
  { x: 110, y: 300, color: "#4F86F7", type: "ai", label: "AI Models" },
  { x: 165.7, y: 165.7, color: "#E3C27A", type: "agent", label: "Agents" },
];

const MESH_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [0, 4], [2, 6],
];

const LEGEND: { type: NodeType; color: string; label: string }[] = [
  { type: "ai", color: "#4F86F7", label: "AI Models" },
  { type: "agent", color: "#E3C27A", label: "Agents" },
  { type: "tool", color: "#C6A15B", label: "APIs & Tools" },
  { type: "kb", color: "#5E9BFF", label: "Knowledge Bases" },
  { type: "workflow", color: "#8FB4FF", label: "Workflows" },
  { type: "external", color: "#F0D9A0", label: "External Systems" },
];

const NODE_R = 23;

function shapePoints(type: NodeType, cx: number, cy: number, r: number): string {
  const pt = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const deg = Math.PI / 180;
  let pts: number[][] = [];
  if (type === "ai") for (let i = 0; i < 6; i++) pts.push(pt(deg * (60 * i - 30)));
  else if (type === "tool") pts = [pt(deg * -90), pt(0), pt(deg * 90), pt(deg * 180)];
  else if (type === "workflow") for (let i = 0; i < 3; i++) pts.push(pt(deg * (120 * i - 90)));
  else if (type === "external") for (let i = 0; i < 8; i++) pts.push(pt(deg * (45 * i - 22.5)));
  return pts.map((p) => p.join(",")).join(" ");
}

function NodeShape({
  type,
  x,
  y,
  className,
}: {
  type: NodeType;
  x: number;
  y: number;
  className: string;
}) {
  if (type === "agent") return <circle className={className} cx={x} cy={y} r={NODE_R} />;
  if (type === "kb")
    return (
      <rect
        className={className}
        x={x - NODE_R}
        y={y - NODE_R * 0.86}
        width={NODE_R * 2}
        height={NODE_R * 1.72}
        rx={9}
      />
    );
  return <polygon className={className} points={shapePoints(type, x, y, NODE_R)} />;
}

function NodeIcon({ type }: { type: NodeType }) {
  switch (type) {
    case "ai":
      return (
        <>
          <circle cx="12" cy="6" r="1.8" />
          <circle cx="6" cy="17" r="1.8" />
          <circle cx="18" cy="17" r="1.8" />
          <line x1="12" y1="7.8" x2="7" y2="15.3" />
          <line x1="12" y1="7.8" x2="17" y2="15.3" />
          <line x1="7.7" y1="17" x2="16.3" y2="17" />
        </>
      );
    case "agent":
      return (
        <>
          <rect x="6" y="9" width="12" height="10" rx="3" />
          <circle className="filled" cx="9.6" cy="14.2" r="1.1" />
          <circle className="filled" cx="14.4" cy="14.2" r="1.1" />
          <line x1="12" y1="9" x2="12" y2="5.3" />
          <circle className="filled" cx="12" cy="4.3" r="1.1" />
        </>
      );
    case "tool":
      return <path d="M15.6 8.3a3 3 0 1 1-4.2 4.2L6.3 17.6l-1-1 5.1-5.1a3 3 0 0 1 5.2-3.2Z" />;
    case "kb":
      return (
        <>
          <ellipse cx="12" cy="6.3" rx="6" ry="2.3" />
          <path d="M6 6.3v5.4c0 1.27 2.7 2.3 6 2.3s6-1.03 6-2.3V6.3" />
          <path d="M6 11.7v5.4c0 1.27 2.7 2.3 6 2.3s6-1.03 6-2.3v-5.4" />
        </>
      );
    case "workflow":
      return (
        <>
          <rect x="3.5" y="4.5" width="5" height="5" rx="1.2" />
          <rect x="15.5" y="4.5" width="5" height="5" rx="1.2" />
          <rect x="9.5" y="14.5" width="5" height="5" rx="1.2" />
          <path d="M8.5 8 12 14.5M15.5 8 12 14.5" />
        </>
      );
    default:
      return <path d="M17.5 15.2a3 3 0 0 0 0-6 5 5 0 0 0-9.6-1.4A4 4 0 0 0 6.5 15.2Z" />;
  }
}

const ORB_CSS = `
.igx-orb{ --igx-line:#1c2033; }
.igx-orb svg{ width:100%; height:auto; display:block; overflow:visible; }
.igx-orb .igx-conn{ stroke-width:1.3; opacity:.07; transition:opacity .5s ease,stroke .5s ease; fill:none; }
.igx-orb .igx-conn.mesh{ stroke:#3a4368; stroke-width:1; }
.igx-orb .igx-particle{ opacity:0; transition:opacity .4s ease; }
.igx-orb .igx-particle circle{ filter:drop-shadow(0 0 3px currentColor); }
.igx-orb .igx-node-glow{ filter:drop-shadow(0 0 2px currentColor) drop-shadow(0 0 6px currentColor); }
.igx-orb .igx-node-ring{ fill:none; stroke:currentColor; stroke-width:2.2; transition:opacity .5s ease,filter .5s ease; }
.igx-orb .igx-node-fill{ fill:currentColor; opacity:.16; transition:opacity .5s ease; }
.igx-orb .igx-node-icon{ stroke:#e7eaf5; fill:none; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; opacity:.92; }
.igx-orb .igx-node-icon .filled{ fill:#e7eaf5; stroke:none; }
.igx-orb .igx-node-tag{ font-family:"IBM Plex Mono",monospace; font-size:7.5px; letter-spacing:.5px; fill:#9aa3b5; text-anchor:middle; opacity:0; transition:opacity .4s ease; text-transform:uppercase; }
.igx-orb[data-state="orchestrating"] .igx-node-tag,.igx-orb[data-state="synthesizing"] .igx-node-tag{ opacity:.85; }
.igx-orb .igx-core-emblem{ transform-origin:300px 300px; }
.igx-orb .igx-core-ring{ fill:none; stroke:url(#igx-ring-grad); stroke-width:3; filter:drop-shadow(0 0 12px #f3c96baa) drop-shadow(0 0 26px #4c8dff55); transition:filter .6s ease; }

@keyframes igxBreathe{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.035); } }
@keyframes igxCoreBright{ 0%,100%{ filter:drop-shadow(0 0 10px #4c8dff88) drop-shadow(0 0 22px #4c8dff44); } 50%{ filter:drop-shadow(0 0 16px #7aa9ffcc) drop-shadow(0 0 34px #4c8dff88); } }
@keyframes igxContract{ 0%{ transform:scale(1); } 40%{ transform:scale(1.12); } 100%{ transform:scale(1); } }
@keyframes igxDash{ to{ stroke-dashoffset:-24; } }
@keyframes igxSeq{ 0%,100%{ opacity:.16; } 50%{ opacity:.85; } }

.igx-orb[data-state="idle"] .igx-node-ring{ opacity:.32; filter:none; }
.igx-orb[data-state="idle"] .igx-node-fill{ opacity:.07; }
.igx-orb[data-state="idle"] .igx-conn.spoke{ opacity:.28; }
.igx-orb[data-state="idle"] .igx-conn.mesh{ opacity:.16; }
.igx-orb[data-state="idle"] .igx-core-emblem{ animation:igxBreathe 3.2s ease-in-out infinite; }

.igx-orb[data-state="thinking"] .igx-node-ring{ opacity:.65; }
.igx-orb[data-state="thinking"] .igx-node-fill{ opacity:.2; }
.igx-orb[data-state="thinking"] .igx-conn.spoke{ opacity:.3; stroke-dasharray:3 5; animation:igxDash 1s linear infinite; }
.igx-orb[data-state="thinking"] .igx-conn.mesh{ opacity:.18; }
.igx-orb[data-state="thinking"] .igx-core-ring{ animation:igxCoreBright 1.4s ease-in-out infinite; }
.igx-orb[data-state="thinking"] .igx-particle.spoke{ opacity:.8; }

.igx-orb[data-state="routing"] .igx-node-ring{ opacity:.32; }
.igx-orb[data-state="routing"] .igx-node-fill{ opacity:.09; }
.igx-orb[data-state="routing"] .igx-conn{ opacity:.18; }
.igx-orb[data-state="routing"] .igx-conn.active{ opacity:.95; stroke-dasharray:5 4; animation:igxDash .7s linear infinite; }
.igx-orb[data-state="routing"] .igx-node.active .igx-node-ring{ opacity:1; filter:drop-shadow(0 0 6px currentColor); }
.igx-orb[data-state="routing"] .igx-node.active .igx-node-fill{ opacity:.3; }
.igx-orb[data-state="routing"] .igx-particle.active{ opacity:1; }

.igx-orb[data-state="orchestrating"] .igx-node-ring{ opacity:1; filter:drop-shadow(0 0 5px currentColor); }
.igx-orb[data-state="orchestrating"] .igx-node-fill{ opacity:.26; }
.igx-orb[data-state="orchestrating"] .igx-conn.spoke{ opacity:.55; }
.igx-orb[data-state="orchestrating"] .igx-conn.mesh{ opacity:.5; stroke-dasharray:2 4; animation:igxDash 1.1s linear infinite; }
.igx-orb[data-state="orchestrating"] .igx-core-ring{ animation:igxCoreBright 1.8s ease-in-out infinite; }
.igx-orb[data-state="orchestrating"] .igx-particle{ opacity:.95; }

.igx-orb[data-state="synthesizing"] .igx-node-ring{ opacity:.88; }
.igx-orb[data-state="synthesizing"] .igx-node-fill{ animation:igxSeq 2.2s ease-in-out infinite; animation-delay:var(--d); }
.igx-orb[data-state="synthesizing"] .igx-conn{ opacity:.45; stroke-dasharray:4 5; animation:igxDash .9s linear infinite; animation-delay:var(--d); }
.igx-orb[data-state="synthesizing"] .igx-core-ring{ animation:igxCoreBright 1s ease-in-out infinite; }
.igx-orb[data-state="synthesizing"] .igx-particle{ opacity:1; }

.igx-orb[data-state="responding"] .igx-node-ring{ opacity:.1; }
.igx-orb[data-state="responding"] .igx-node-fill{ opacity:.03; }
.igx-orb[data-state="responding"] .igx-conn{ opacity:.12; }
.igx-orb[data-state="responding"] .igx-core-ring{ filter:drop-shadow(0 0 20px #a9c6ffee) drop-shadow(0 0 46px #7aa9ffaa); }
.igx-orb[data-state="responding"] .igx-core-emblem{ animation:igxContract .9s ease-out 1; }

@media (prefers-reduced-motion:reduce){
  .igx-orb *{ animation:none !important; transition:none !important; }
  .igx-orb .igx-particle{ display:none; }
}
`;

function IgxOrb({ state, activeNodes }: { state: OrbState; activeNodes: number[] }) {
  return (
    <div className="igx-orb w-[min(420px,90vw)] shrink-0" data-state={state}>
      <style>{ORB_CSS}</style>
      <svg viewBox="0 0 600 600" role="img" aria-label="IGX AI ecosystem map">
        <defs>
          <linearGradient id="igx-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3c96b" />
            <stop offset="50%" stopColor="#7aa9ff" />
            <stop offset="100%" stopColor="#f3c96b" />
          </linearGradient>
          <clipPath id="igx-core-clip">
            <circle cx="300" cy="300" r="66" />
          </clipPath>
        </defs>
        <circle cx="300" cy="300" r="190" fill="none" stroke="#1c2033" strokeWidth="1" />

        {/* mesh connections */}
        <g>
          {MESH_EDGES.map(([a, b], i) => (
            <path
              key={`mesh-${i}`}
              id={`igx-mesh-${i}`}
              className="igx-conn mesh"
              d={`M${NODES[a].x},${NODES[a].y} L${NODES[b].x},${NODES[b].y}`}
              style={{ ["--d" as string]: `${(i * 0.22).toFixed(2)}s` }}
            />
          ))}
        </g>
        {/* spokes from the core */}
        <g>
          {NODES.map((n, i) => (
            <path
              key={`spoke-${i}`}
              id={`igx-spoke-${i}`}
              className={cn("igx-conn spoke", activeNodes.includes(i) && "active")}
              d={`M300,300 L${n.x},${n.y}`}
              stroke={n.color}
              style={{ color: n.color, ["--d" as string]: `${(i * 0.18).toFixed(2)}s` }}
            />
          ))}
        </g>
        {/* moving particles */}
        <g>
          {NODES.map((n, i) => (
            <g
              key={`sp-${i}`}
              className={cn("igx-particle spoke", activeNodes.includes(i) && "active")}
              style={{ color: n.color }}
            >
              <circle r="2.6" fill={n.color}>
                <animateMotion dur={`${(2.2 + ((i * 37) % 8) / 10).toFixed(2)}s`} repeatCount="indefinite">
                  <mpath href={`#igx-spoke-${i}`} />
                </animateMotion>
              </circle>
            </g>
          ))}
          {MESH_EDGES.map((_, i) => (
            <g key={`mp-${i}`} className="igx-particle mesh" style={{ color: "#9fb3ea" }}>
              <circle r="2.6" fill="#9fb3ea">
                <animateMotion dur={`${(2.6 + ((i * 53) % 12) / 10).toFixed(2)}s`} repeatCount="indefinite">
                  <mpath href={`#igx-mesh-${i}`} />
                </animateMotion>
              </circle>
            </g>
          ))}
        </g>
        {/* nodes */}
        <g>
          {NODES.map((n, i) => (
            <g
              key={`node-${i}`}
              className={cn("igx-node", activeNodes.includes(i) && "active")}
              style={{ color: n.color, ["--d" as string]: `${(i * 0.18).toFixed(2)}s` }}
            >
              <NodeShape type={n.type} x={n.x} y={n.y} className="igx-node-fill" />
              <NodeShape type={n.type} x={n.x} y={n.y} className="igx-node-ring igx-node-glow" />
              <g
                className="igx-node-icon"
                transform={`translate(${n.x - 9},${n.y - 9}) scale(0.75)`}
              >
                <NodeIcon type={n.type} />
              </g>
              <text className="igx-node-tag" x={n.x} y={n.y + NODE_R + 13}>
                {n.label}
              </text>
            </g>
          ))}
        </g>
        {/* core */}
        <g className="igx-core-emblem">
          <circle cx="300" cy="300" r="70" fill="#05060d" />
          <image
            href="/brand/igx-core.jpg"
            x="230"
            y="230"
            width="140"
            height="140"
            clipPath="url(#igx-core-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
          <circle className="igx-core-ring" cx="300" cy="300" r="66" />
        </g>
      </svg>
    </div>
  );
}

function LegendSwatch({ type, color }: { type: NodeType; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style={{ color }}>
      {type === "agent" ? (
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".25" stroke="currentColor" strokeWidth="1.4" />
      ) : type === "kb" ? (
        <rect x="3" y="4" width="18" height="16" rx="4" fill="currentColor" opacity=".25" stroke="currentColor" strokeWidth="1.4" />
      ) : (
        <polygon
          points={shapePoints(type, 12, 12, 9.5)}
          fill="currentColor"
          opacity=".25"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Ecosystem panel: the orb, the real state, and real counts           */
/* ------------------------------------------------------------------ */
export type LiveStage = {
  key: "idle" | "submitting" | "awaiting" | "error";
  name: string;
  detail: string;
};

function liveToOrb(key: LiveStage["key"]): OrbState {
  switch (key) {
    case "submitting":
      return "thinking";
    case "awaiting":
      return "responding";
    default:
      return "idle";
  }
}

function useDecidedCounts() {
  return useQuery({
    queryKey: ["igx-decided-counts"],
    retry: 1,
    refetchInterval: 15_000,
    queryFn: async () => {
      const [approved, rejected] = await Promise.all([
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      if (approved.error) throw approved.error;
      if (rejected.error) throw rejected.error;
      return { approved: approved.count ?? 0, rejected: rejected.count ?? 0 };
    },
  });
}

function StatCard({
  label,
  value,
  note,
  onClick,
}: {
  label: string;
  value: string;
  note?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-gold/60" />
        {label}
      </p>
      <div className="mt-2 font-mono text-xl text-foreground">{value}</div>
      {note && <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{note}</p>}
    </>
  );
  const cls = "rounded-xl border border-gold/20 bg-black/20 p-3 text-left";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(cls, "transition-colors hover:border-gold/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60")}
    >
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function EcosystemPanel({
  live,
  pendingCount,
  pendingLoading,
  pendingError,
  onOpenQueue,
}: {
  live: LiveStage;
  pendingCount: number | null;
  pendingLoading: boolean;
  pendingError: boolean;
  onOpenQueue: () => void;
}) {
  const { data: decided, isLoading: decidedLoading, isError: decidedError } = useDecidedCounts();

  // null = follow the real console state; otherwise a labelled animation preview
  const [preview, setPreview] = useState<OrbState | null>(null);
  const [auto, setAuto] = useState(false);
  const [activeNodes, setActiveNodes] = useState<number[]>([0, 3, 6]);

  const orbState: OrbState = preview ?? liveToOrb(live.key);
  const previewIndex = preview ? ORB_STATES.findIndex((s) => s.key === preview) : -1;
  const previewMeta = preview ? ORB_STATES.find((s) => s.key === preview) : undefined;

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      setPreview((current) => {
        const at = ORB_STATES.findIndex((s) => s.key === (current ?? "idle"));
        return ORB_STATES[(at + 1) % ORB_STATES.length].key;
      });
    }, 2800);
    return () => window.clearInterval(id);
  }, [auto]);

  // Routing lights up two or three nodes at random, like the prototype.
  useEffect(() => {
    if (orbState !== "routing") return;
    const pool = NODES.map((_, i) => i);
    const picks: number[] = [];
    const count = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < count; k++) {
      picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    setActiveNodes(picks);
  }, [orbState]);

  const pickState = (next: OrbState | null) => {
    setAuto(false);
    setPreview(next);
  };

  const pendingValue = pendingLoading ? "…" : pendingError ? "ERR" : String(pendingCount ?? 0);
  const decidedValue = (n?: number) => (decidedLoading ? "…" : decidedError ? "ERR" : String(n ?? 0));

  return (
    <GlassCard index={1} className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-center gap-7">
        <IgxOrb state={orbState} activeNodes={activeNodes} />

        <div className="min-w-[240px] flex-1 basis-64">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-muted-foreground">
            {preview ? "Animation preview" : "Console state"}
          </p>
          <h2 className="mt-1.5 flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#5E9BFF] shadow-[0_0_8px_#5E9BFF]" />
            {previewMeta ? previewMeta.label : live.name}
          </h2>
          <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-muted-foreground">
            {previewMeta ? previewMeta.desc : live.detail}
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold">
            {preview ? "Preview only — not a live status" : "Live — read from your proposals"}
          </p>

          <div className="mt-4 flex gap-1.5" aria-hidden="true">
            {ORB_STATES.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  "h-[3px] flex-1 rounded-full bg-white/10",
                  i < previewIndex && "bg-[#4F86F7]",
                  i === previewIndex && "bg-[#8FB4FF]"
                )}
              />
            ))}
          </div>

          <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Preview the animation
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => pickState(null)}
              aria-pressed={preview === null}
              className={cn(
                "rounded-full border px-3 py-1 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                preview === null
                  ? "border-gold bg-gold font-medium text-primary-foreground"
                  : "border-gold/25 text-muted-foreground hover:text-foreground"
              )}
            >
              Live
            </button>
            {ORB_STATES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => pickState(s.key)}
                aria-pressed={preview === s.key}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                  preview === s.key
                    ? "border-[#8FB4FF] bg-[#8FB4FF] font-medium text-[#0a0c18]"
                    : "border-gold/25 text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (auto) {
                setAuto(false);
              } else {
                setPreview((p) => p ?? "idle");
                setAuto(true);
              }
            }}
            className="mt-3 rounded-lg border border-gold/25 bg-black/20 px-3.5 py-2 font-mono text-[11px] tracking-wide text-foreground transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            {auto ? "‖ Pause auto-cycle" : "▶ Auto-cycle the preview"}
          </button>
        </div>
      </div>

      {/* Real counts only */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gold/20 pt-5 lg:grid-cols-4">
        <StatCard label="Pending review" value={pendingValue} note="Open the queue" onClick={onOpenQueue} />
        <StatCard label="Approved" value={decidedValue(decided?.approved)} note="Proposals" />
        <StatCard label="Rejected" value={decidedValue(decided?.rejected)} note="Proposals" />
        <StatCard label="Model calls" value="Not tracked" note="No model is wired yet" />
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-gold/20 pt-4 text-[11.5px] text-muted-foreground">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <LegendSwatch type={item.type} color={item.color} />
            {item.label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        The map shows the intended design of the ecosystem. Nothing on it is a live connection.
      </p>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Architecture: design documentation                                  */
/* ------------------------------------------------------------------ */
const LAYERS = [
  { color: "#E3C27A", title: "Constitution Layer", tag: "Boot-time primitive", body: "Vision, mission, governance, ethics. Loaded at boot as a first-class primitive, not a passive document. Every agent and router validates its actions against it before execution: the alignment layer that prevents drift." },
  { color: "#E5677A", title: "Identity & Trust Layer", tag: "Who is acting", body: "Users, roles, permissions, organizations. Answers who requested a task, under which role, and what they are allowed to approve, spend, or publish. Without this, the system cannot safely scale beyond one user." },
  { color: "#5E9BFF", title: "Knowledge & Memory Layer", tag: "Track A + cognitive stack", body: "Track A canonical knowledge base, memory engine, retrieval, context builder. Stratified into working, episodic, semantic, and procedural memory, governed by a schema registry so document formats can evolve without corrupting downstream agents." },
  { color: "#C6A15B", title: "Capability Layer", tag: "Models · tools · agents", body: "Described by capability, not hard-coded name. The router asks who can research, reason or translate rather than which model to call. Includes the tool registry (permissions, health, cost) for the tools IJIDI connects." },
  { color: "#4F86F7", title: "Executive Intelligence Layer", tag: "Routing · consensus · planning", body: "The model router and the consensus arbiter. Decides who researches, who drafts, who critiques, then evaluates competing outputs against the canonical knowledge base to synthesize one grounded answer." },
  { color: "#8FB4FF", title: "Execution Layer", tag: "Workflows · automations", body: "Where work actually happens: the 10-agent system (Executive, Research, Content and Automation active; COO, CTO, CMO, Finance, Knowledge and NGO deferred until their unlock conditions are met) plus n8n and API automations, guarded by an adversarial-defense trust boundary." },
  { color: "#F0D9A0", title: "Learning Layer", tag: "Decision registry · ledger", body: "Turns every human correction into signal: the decision registry, the execution ledger, and a feedback-driven reinforcement router. This is how IGX AI gets better at matching your judgment over time." },
  { color: "#A9C4FF", title: "Resilience Layer", tag: "Sovereignty · failsafe", body: "Sovereign data vault, simulation sandbox, air-gapped failsafe core. Anonymizes sensitive data before it leaves the system, tests major changes on a digital twin first, and keeps a local fallback alive if every external API goes down." },
  { color: "#C6A15B", title: "Experience Layer", tag: "What you actually touch", body: "Portal, dashboards, visualizations, approvals. The living ecosystem screen, the executive command center, the state indicators: the human-facing surface of everything below it." },
] as const;

export function ArchitecturePanel() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <GlassCard index={1} className="p-5 sm:p-7">
      <PanelHead
        eyebrow="System architecture · design reference"
        title="Nine Governing Layers"
        desc="Everything IGX AI does traces back through this stack, from the constitution that bounds it to the experience layer you touch. This describes the intended design, not live system state. Tap a layer to expand."
      />
      <div className="space-y-2">
        {LAYERS.map((layer, i) => {
          const isOpen = open === i;
          return (
            <div
              key={layer.title}
              className={cn(
                "overflow-hidden rounded-xl border bg-black/20 transition-colors",
                isOpen ? "border-gold/40" : "border-gold/15"
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold text-[#0a0c18]"
                  style={{ background: layer.color }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[14.5px] font-semibold text-foreground">{layer.title}</span>
                <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground sm:inline">
                  {layer.tag}
                </span>
                <ChevronRight
                  className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")}
                />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 pl-[52px] text-[13px] leading-relaxed text-muted-foreground">
                  {layer.body}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Decisions: the real `decisions` table                               */
/* ------------------------------------------------------------------ */
type DecisionRow = {
  id: string | number;
  date: string | null;
  label: string | null;
  detail: string | null;
  state: string | null;
  created_at: string | null;
};

export function DecisionsPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["igx-decisions"],
    retry: 1,
    queryFn: async (): Promise<DecisionRow[]> => {
      const { data: rows, error } = await supabase
        .from("decisions")
        .select("id, date, label, detail, state, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (rows ?? []) as DecisionRow[];
    },
  });

  return (
    <GlassCard index={1} className="p-5 sm:p-7">
      <PanelHead
        eyebrow="Learning layer"
        title="Decision Registry"
        desc="Every architectural choice becomes a permanent, referenceable record instead of a forgotten conversation. These are read live from the decisions table."
      />
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="font-mono text-xs text-muted-foreground">Loading decisions...</span>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center gap-2 py-6 font-mono text-xs text-destructive">
          <AlertCircle className="h-4 w-4" /> Decisions unavailable
        </div>
      ) : !data || data.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-muted-foreground">
          No decisions recorded yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {data.map((row) => (
            <div key={String(row.id)} className="rounded-xl border border-gold/20 bg-black/20 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#8FB4FF]">
                  REF {String(row.id).slice(0, 8).toUpperCase()}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{row.date ?? "—"}</span>
              </div>
              <div className="mt-1.5 text-sm font-semibold text-foreground">{row.label ?? "Untitled decision"}</div>
              {row.detail && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{row.detail}</p>
              )}
              {row.state && (
                <span className="mt-2.5 inline-block rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-gold">
                  {row.state}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Agents: the roster recorded in the knowledge base                   */
/* ------------------------------------------------------------------ */
const AGENTS: { name: string; role: string; status: "Active" | "Deferred" }[] = [
  { name: "Executive", role: "Strategy and investor narrative", status: "Active" },
  { name: "Research", role: "Market intelligence", status: "Active" },
  { name: "Content", role: "Multi-platform content", status: "Active" },
  { name: "Automation", role: "n8n and APIs", status: "Active" },
  { name: "COO", role: "Unlocks when staff are hired", status: "Deferred" },
  { name: "CTO", role: "Unlocks when all 15 knowledge-base domains have populated indexes and n8n automation is reactivated", status: "Deferred" },
  { name: "CMO", role: "Unlocks when paid ads begin", status: "Deferred" },
  { name: "Finance", role: "Unlocks when monthly recurring revenue exceeds $5,000", status: "Deferred" },
  { name: "Knowledge", role: "Unlocks when the team exceeds 3 people", status: "Deferred" },
  { name: "NGO", role: "Unlocks when ijidi.org is fully deployed and the first real programme activity is recorded", status: "Deferred" },
];

export function AgentsPanel() {
  return (
    <GlassCard index={1} className="p-5 sm:p-7">
      <PanelHead
        eyebrow="Internal observability"
        title="Agent Roster"
        desc="The ten agents recorded in the IGX AI knowledge base, with what unlocks each deferred one. No run, success or cost data is collected yet, so those columns say so."
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
          <thead>
            <tr>
              {["Agent", "Role / unlock condition", "Status (KB)", "Runs"].map((h) => (
                <th
                  key={h}
                  className="border-b border-gold/20 px-2.5 pb-2.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent) => (
              <tr key={agent.name} className="border-b border-gold/10 last:border-0">
                <td className="px-2.5 py-3 font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-[7px] w-[7px] shrink-0 rounded-full",
                        agent.status === "Active" ? "bg-[#5E9BFF] shadow-[0_0_5px_#5E9BFF]" : "bg-muted-foreground/50"
                      )}
                    />
                    {agent.name}
                  </span>
                </td>
                <td className="px-2.5 py-3 text-muted-foreground">{agent.role}</td>
                <td className="px-2.5 py-3">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em]",
                      agent.status === "Active"
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-white/15 text-muted-foreground"
                    )}
                  >
                    {agent.status}
                  </span>
                </td>
                <td className="px-2.5 py-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  Not tracked
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Models: the pipeline recorded in the knowledge base                 */
/* ------------------------------------------------------------------ */
const MODELS: { name: string; role: string; primary?: boolean }[] = [
  { name: "Claude", role: "Primary reasoning engine", primary: true },
  { name: "ChatGPT", role: "Supporting model" },
  { name: "Gemini", role: "Supporting model" },
  { name: "DeepSeek", role: "Supporting model" },
  { name: "Kimi", role: "Supporting model" },
];

export function ModelsPanel() {
  return (
    <GlassCard index={1} className="p-5 sm:p-7">
      <PanelHead
        eyebrow="Capability layer"
        title="Model Pipeline"
        desc="The models IGX AI is designed to route between. IGX AI does not call any model yet (real Claude reasoning is waiting on API credit), so health and latency are not tracked."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODELS.map((model) => (
          <div
            key={model.name}
            className={cn(
              "rounded-xl border bg-black/20 p-4",
              model.primary ? "border-gold/40" : "border-gold/20"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-foreground">{model.name}</span>
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            </div>
            <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              Not tracked
            </div>
            <div className="mt-3 font-mono text-[11px] text-muted-foreground">{model.role}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        The pipeline is expandable: more models can be added as they are needed.
      </p>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Brand library: every picture, where it is used, and the leads        */
/* ------------------------------------------------------------------ */
function BrandThumb({ src, label }: { src: string | null; label: string }) {
  const [failed, setFailed] = useState(false);
  if (!src) {
    return (
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gold/40 text-center font-mono text-[8px] uppercase leading-tight tracking-wider text-muted-foreground">
        No art
      </span>
    );
  }
  if (failed) {
    return (
      <span
        title="The file is not in public/brand yet"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-destructive/50 text-center font-mono text-[8px] uppercase leading-tight tracking-wider text-destructive"
      >
        Upload me
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={label}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-full object-cover"
    />
  );
}

export function BrandLibraryPanel({ usage }: { usage: Record<string, string[]> }) {
  const rows = BRAND_ASSETS.map((asset) => ({
    asset,
    used: Array.from(new Set([...asset.placedIn, ...(usage[asset.id] ?? [])])),
  }));
  const placed = rows.filter((row) => row.used.length > 0).length;
  return (
    <GlassCard index={1} className="p-5 sm:p-7">
      <PanelHead
        eyebrow="Brand library"
        title="Logos, portraits and leads"
        desc={`${placed} of ${rows.length} pictures are on a page today. Each of the rest has leads: where it is meant to go next. Files live in public/brand.`}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ asset, used }) => {
          const status = !asset.src ? "Artwork needed" : used.length > 0 ? "On a page" : "Not placed yet";
          return (
            <div key={asset.id} className="rounded-xl border border-gold/20 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <BrandThumb src={asset.src} label={asset.label} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-foreground">{asset.label}</div>
                  {asset.tagline && (
                    <div className="mt-0.5 text-[11px] italic text-muted-foreground">{asset.tagline}</div>
                  )}
                  <span
                    className={cn(
                      "mt-2 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
                      status === "On a page"
                        ? "border-[#5E9BFF]/50 bg-[#5E9BFF]/10 text-[#8FB4FF]"
                        : "border-gold/40 bg-gold/10 text-gold"
                    )}
                  >
                    {status}
                  </span>
                </div>
              </div>
              {used.length > 0 && (
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  Shown in: {used.join(" · ")}
                </p>
              )}
              {asset.leads.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
                  {asset.leads.map((lead) => (
                    <li key={lead} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                      <span>{lead}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
