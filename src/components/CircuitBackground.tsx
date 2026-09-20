// src/components/CircuitBackground.tsx
// Full-viewport living background built from the supplied circuit artwork.
//
// - The artwork keeps its own line spacing (about native size). To fill the
//   screen it is repeated side by side, every second copy mirrored so the seams
//   are invisible. It is never stretched or zoomed to fit.
// - Glowing dots travel along the existing traces, each in the colour of the
//   line it runs on. Existing nodes glow and breathe. The lines themselves
//   breathe brighter and softer.
// - Driven by useVisualState(): section presets set brightness and how many
//   dots run. Reduced motion: static artwork, no movement.
// - Decoration only: it never claims a system state.
// - Light theme: hidden (the artwork is designed for dark).
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useVisualState } from "@/lib/visual-state";
import { CIRCUIT_NODES, CIRCUIT_PATHS, CIRCUIT_SIZE } from "@/lib/circuit-paths";

const ARTWORK_SRC = "/brand/circuit-master.jpg";

const MIN_SCALE = 0.55; // smallest the artwork is ever shown
const MAX_SCALE = 1.15; // largest the artwork is ever shown
const MAX_PULSES = 120; // total travelling dots across all copies (performance cap)
const MAX_NODES = 60; // total glowing nodes across all copies
const DOT_LENGTH = 8; // image units
const DOT_SPEED = 100; // image units per second

function useViewport() {
  const [size, setSize] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSize({ w: window.innerWidth, h: window.innerHeight }));
    };
    setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, []);
  return size;
}

function useIsLightTheme(): boolean {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setLight(el.classList.contains("light"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return light;
}

// How many copies of the artwork are needed, and which part of the tiled
// surface the screen shows. Copies are centred; edges crop a little.
function computeLayout(vw: number, vh: number) {
  const { width: iw, height: ih } = CIRCUIT_SIZE;
  let scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vh / ih));
  const cols = Math.max(1, Math.ceil(vw / (iw * scale) - 0.04));
  const rows = Math.max(1, Math.ceil(vh / (ih * scale) - 0.04));
  // Grow a hair if needed so the copies always cover the whole screen.
  scale = Math.max(scale, vw / (cols * iw), vh / (rows * ih));
  const viewW = vw / scale;
  const viewH = vh / scale;
  const ox = (cols * iw - viewW) / 2;
  const oy = (rows * ih - viewH) / 2;
  return { cols, rows, viewBox: `${ox} ${oy} ${viewW} ${viewH}` };
}

export function CircuitBackground() {
  const { activeSection, circuitIntensity, ambientOpacity, transitionMode, reducedMotion } =
    useVisualState();
  const isLight = useIsLightTheme();
  const { w, h } = useViewport();
  const { cols, rows, viewBox } = useMemo(() => computeLayout(w, h), [w, h]);

  const tiles = cols * rows;
  const perTilePulses = Math.max(4, Math.min(CIRCUIT_PATHS.length, Math.floor(MAX_PULSES / tiles)));
  const perTileNodes = Math.max(3, Math.min(CIRCUIT_NODES.length, Math.floor(MAX_NODES / tiles)));
  const layoutKey = `${cols}x${rows}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(SVGImageElement | null)[]>([]);
  const breatheWrapRefs = useRef<(SVGGElement | null)[]>([]);
  const breatheImageRefs = useRef<(SVGImageElement | null)[]>([]);
  const pulseGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pulseTweens = useRef<(gsap.core.Tween | undefined)[]>([]);
  const nodeTweens = useRef<(gsap.core.Tween | undefined)[]>([]);
  const breatheTweens = useRef<(gsap.core.Tween | undefined)[]>([]);
  const ctxRef = useRef<gsap.Context | null>(null);

  // Build the looping animations (rebuilt when the number of copies changes).
  useEffect(() => {
    if (isLight || !rootRef.current) return;
    pulseTweens.current = [];
    nodeTweens.current = [];
    breatheTweens.current = [];

    const ctx = gsap.context(() => {
      if (reducedMotion) return;

      pulseGroupRefs.current.forEach((group, k) => {
        if (!group) return;
        const paths = Array.from(group.querySelectorAll<SVGPathElement>("path"));
        const length = paths[0]?.getTotalLength() ?? 0;
        if (!length) return;

        // The dot is a fixed length in image units, expressed on a 0..100 scale.
        const frac = Math.min(12, Math.max(1.5, (DOT_LENGTH / length) * 100));
        paths.forEach((p) => {
          p.style.strokeDasharray = `${frac} ${100 - frac}`;
          p.style.strokeDashoffset = String(frac);
        });

        pulseTweens.current[k] = gsap.fromTo(
          paths,
          { strokeDashoffset: frac },
          {
            strokeDashoffset: -100,
            duration: (length * (1 + frac / 100)) / DOT_SPEED,
            ease: "none",
            repeat: -1,
            repeatDelay: 0.8 + Math.random() * 3.2,
            delay: Math.random() * 5,
            paused: true,
          }
        );
      });

      nodeRefs.current.forEach((node, k) => {
        if (!node) return;
        nodeTweens.current[k] = gsap.fromTo(
          node,
          { opacity: 0.1 },
          {
            opacity: 0.7,
            duration: 1.6 + Math.random() * 2.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 3,
            paused: true,
          }
        );
      });

      breatheImageRefs.current.forEach((img, k) => {
        if (!img) return;
        breatheTweens.current[k] = gsap.fromTo(
          img,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 3.2 + Math.random() * 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 2,
            paused: true,
          }
        );
      });
    }, rootRef);

    ctxRef.current = ctx;
    return () => {
      ctx.revert();
      ctxRef.current = null;
    };
  }, [reducedMotion, isLight, layoutKey]);

  // Apply the current section: brightness, how many dots and nodes run.
  useEffect(() => {
    if (isLight || !rootRef.current) return;
    const soft = transitionMode === "soft" && !reducedMotion;
    const fade = soft ? 1.2 : 0;

    const apply = () => {
      // Artwork stays vivid; the section only nudges it (0.72 to 0.86).
      const artOpacity = 0.6 + 0.4 * ambientOpacity;
      imageRefs.current.forEach((img) => {
        if (img) gsap.to(img, { opacity: artOpacity, duration: fade, overwrite: true });
      });

      // Breathing glow layer (the lines glow brighter and softer, slowly).
      const breatheAmp = reducedMotion ? 0 : 0.15 + 0.35 * circuitIntensity;
      breatheWrapRefs.current.forEach((wrap, k) => {
        if (!wrap) return;
        gsap.to(wrap, { opacity: breatheAmp, duration: fade, overwrite: true });
        breatheTweens.current[k]?.paused(breatheAmp === 0);
      });

      // Dots: interleave across copies so every copy gets some.
      const totalPulses = perTilePulses * tiles;
      const activePulses = reducedMotion ? 0 : Math.round(circuitIntensity * totalPulses);
      const dotOpacity = 0.55 + 0.45 * circuitIntensity;
      pulseGroupRefs.current.forEach((group, k) => {
        if (!group) return;
        const tile = Math.floor(k / perTilePulses);
        const idx = k % perTilePulses;
        const on = idx * tiles + tile < activePulses;
        gsap.to(group, { opacity: on ? dotOpacity : 0, duration: soft ? 0.8 : 0, overwrite: true });
        pulseTweens.current[k]?.paused(!on);
      });

      const totalNodes = perTileNodes * tiles;
      const activeNodes = reducedMotion ? 0 : Math.ceil(circuitIntensity * totalNodes);
      nodeRefs.current.forEach((node, k) => {
        if (!node) return;
        const tile = Math.floor(k / perTileNodes);
        const idx = k % perTileNodes;
        const on = idx * tiles + tile < activeNodes;
        nodeTweens.current[k]?.paused(!on);
        if (!on) gsap.to(node, { opacity: 0, duration: soft ? 0.8 : 0, overwrite: true });
      });
    };

    if (ctxRef.current) ctxRef.current.add(apply);
    else apply();
  }, [
    circuitIntensity,
    ambientOpacity,
    transitionMode,
    reducedMotion,
    isLight,
    layoutKey,
    perTilePulses,
    perTileNodes,
    tiles,
  ]);

  if (isLight) return null;

  const { width: iw, height: ih } = CIRCUIT_SIZE;
  const pulsePaths = CIRCUIT_PATHS.slice(0, perTilePulses);
  const nodes = CIRCUIT_NODES.slice(0, perTileNodes);

  const tileList: { key: string; t: number; transform: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const flipX = c % 2 === 1;
      const flipY = r % 2 === 1;
      const tx = c * iw + (flipX ? iw : 0);
      const ty = r * ih + (flipY ? ih : 0);
      tileList.push({
        key: `${r}-${c}`,
        t: r * cols + c,
        transform: `translate(${tx} ${ty}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})`,
      });
    }
  }

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-visual-section={activeSection}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#050505",
      }}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          {nodes.map((n, j) => (
            <radialGradient key={`g${j}`} id={`cb-node-${j}`}>
              <stop offset="0%" stopColor={n.color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={n.color} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {tileList.map((tile) => (
          <g key={tile.key} transform={tile.transform}>
            <image
              ref={(el) => {
                imageRefs.current[tile.t] = el;
              }}
              href={ARTWORK_SRC}
              x={0}
              y={0}
              width={iw}
              height={ih}
              preserveAspectRatio="none"
              style={{ opacity: 0 }}
            />

            {/* Breathing glow: the same artwork, screen-blended, slowly fading in and out */}
            <g
              ref={(el) => {
                breatheWrapRefs.current[tile.t] = el;
              }}
              style={{ opacity: 0, mixBlendMode: "screen" }}
            >
              <image
                ref={(el) => {
                  breatheImageRefs.current[tile.t] = el;
                }}
                href={ARTWORK_SRC}
                x={0}
                y={0}
                width={iw}
                height={ih}
                preserveAspectRatio="none"
                style={{ opacity: 0 }}
              />
            </g>

            <g style={{ mixBlendMode: "screen" }}>
              {pulsePaths.map((p, i) => (
                <g
                  key={p.id}
                  ref={(el) => {
                    pulseGroupRefs.current[tile.t * perTilePulses + i] = el;
                  }}
                  style={{ opacity: 0 }}
                >
                  {/* soft halo in the line's own colour */}
                  <path
                    d={p.d}
                    pathLength={100}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={11}
                    strokeOpacity={0.42}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* bright core */}
                  <path
                    d={p.d}
                    pathLength={100}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={2.8}
                    strokeOpacity={0.95}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ))}

              {nodes.map((n, j) => (
                <circle
                  key={`${n.x}-${n.y}`}
                  ref={(el) => {
                    nodeRefs.current[tile.t * perTileNodes + j] = el;
                  }}
                  cx={n.x}
                  cy={n.y}
                  r={22}
                  fill={`url(#cb-node-${j})`}
                  style={{ opacity: 0 }}
                />
              ))}
            </g>
          </g>
        ))}
      </svg>

      {/* Edge vignette only: seats the interface without dulling the artwork */}
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
