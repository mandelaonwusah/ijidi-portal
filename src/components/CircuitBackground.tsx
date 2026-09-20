// src/components/CircuitBackground.tsx
// Full-viewport living background: the circuit artwork stays exactly as
// supplied; light pulses travel along its existing traces and its existing
// nodes glow. Decoration only: it never claims a system state.
//
// - Portrait screens: artwork shown as-is, covering the screen.
// - Landscape screens: artwork is turned 90 degrees so it covers a wide screen
//   without heavy zoom or cropping. Nothing is stretched or rearranged.
// - Driven by useVisualState(): section presets set brightness and pulse count.
// - Reduced motion: static artwork, no pulses.
// - Light theme: hidden (the artwork is designed for dark).
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useVisualState } from "@/lib/visual-state";
import { CIRCUIT_NODES, CIRCUIT_PATHS, CIRCUIT_SIZE } from "@/lib/circuit-paths";

const ARTWORK_SRC = "/brand/circuit-master.jpg";
const ROTATE_ON_LANDSCAPE = true; // set false to keep the artwork upright everywhere

const PULSE_COLOR_DEFAULT = "#E8C878"; // champagne gold
const PULSE_COLOR_IGX = "#6FD3FF"; // IGX AI cyan
const PULSE_SPEED = 120; // image units per second
const PULSE_LENGTH = 28; // image units

function useMatchMedia(query: string): boolean {
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

export function CircuitBackground() {
  const { activeSection, circuitIntensity, ambientOpacity, transitionMode, reducedMotion } =
    useVisualState();
  const isLandscape = useMatchMedia("(min-aspect-ratio: 1/1)");
  const isLight = useIsLightTheme();

  const rootRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const pulseGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pulseTweens = useRef<gsap.core.Tween[]>([]);
  const nodeTweens = useRef<gsap.core.Tween[]>([]);
  const ctxRef = useRef<gsap.Context | null>(null);

  const rotated = ROTATE_ON_LANDSCAPE && isLandscape;
  const pulseColor = activeSection === "igx-ai" ? PULSE_COLOR_IGX : PULSE_COLOR_DEFAULT;

  // Build the looping pulse and node animations once (rebuilt if reduced-motion
  // or the theme changes, because the elements are re-created).
  useEffect(() => {
    if (isLight || !rootRef.current) return;
    pulseTweens.current = [];
    nodeTweens.current = [];

    const ctx = gsap.context(() => {
      if (reducedMotion) return;

      pulseGroupRefs.current.forEach((group) => {
        if (!group) return;
        const paths = Array.from(group.querySelectorAll<SVGPathElement>("path"));
        const length = paths[0]?.getTotalLength() ?? 0;
        if (!length) return;

        // Pulse is a fixed length in image units, expressed on a 0..100 scale.
        const frac = Math.min(40, Math.max(6, (PULSE_LENGTH / length) * 100));
        paths.forEach((p) => {
          p.style.strokeDasharray = `${frac} ${100 - frac}`;
          p.style.strokeDashoffset = String(frac);
        });

        const travel = length * (1 + frac / 100);
        const tween = gsap.fromTo(
          paths,
          { strokeDashoffset: frac },
          {
            strokeDashoffset: -100,
            duration: travel / PULSE_SPEED,
            ease: "none",
            repeat: -1,
            repeatDelay: 1.5 + Math.random() * 4.5,
            delay: Math.random() * 6,
            paused: true,
          }
        );
        pulseTweens.current.push(tween);
      });

      nodeRefs.current.forEach((node) => {
        if (!node) return;
        const tween = gsap.fromTo(
          node,
          { opacity: 0.08 },
          {
            opacity: 0.55,
            duration: 1.8 + Math.random() * 2.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 3,
            paused: true,
          }
        );
        nodeTweens.current.push(tween);
      });
    }, rootRef);

    ctxRef.current = ctx;
    return () => {
      ctx.revert();
      ctxRef.current = null;
    };
  }, [reducedMotion, isLight]);

  // Apply the current section: brightness, how many pulses and nodes run.
  useEffect(() => {
    if (isLight || !rootRef.current) return;
    const soft = transitionMode === "soft" && !reducedMotion;
    const fade = soft ? 1.2 : 0;

    const apply = () => {
      if (imageRef.current) {
        gsap.to(imageRef.current, { opacity: ambientOpacity, duration: fade, overwrite: true });
      }

      const activePulses = reducedMotion
        ? 0
        : Math.round(circuitIntensity * CIRCUIT_PATHS.length);
      const pulseOpacity = 0.4 + 0.6 * circuitIntensity;
      pulseGroupRefs.current.forEach((group, i) => {
        if (!group) return;
        const on = i < activePulses;
        gsap.to(group, { opacity: on ? pulseOpacity : 0, duration: soft ? 0.8 : 0, overwrite: true });
        pulseTweens.current[i]?.paused(!on);
      });

      const activeNodes = reducedMotion
        ? 0
        : Math.ceil(circuitIntensity * CIRCUIT_NODES.length);
      nodeRefs.current.forEach((node, i) => {
        if (!node) return;
        const on = i < activeNodes;
        nodeTweens.current[i]?.paused(!on);
        if (!on) gsap.to(node, { opacity: 0, duration: soft ? 0.8 : 0, overwrite: true });
      });
    };

    if (ctxRef.current) ctxRef.current.add(apply);
    else apply();
  }, [circuitIntensity, ambientOpacity, transitionMode, reducedMotion, isLight]);

  if (isLight) return null;

  const { width, height } = CIRCUIT_SIZE;
  const viewBox = rotated ? `0 0 ${height} ${width}` : `0 0 ${width} ${height}`;
  const contentTransform = rotated ? `translate(${height} 0) rotate(90)` : undefined;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-visual-section={activeSection}
      style={
        {
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          background: "#080809",
          "--cb-pulse": pulseColor,
        } as React.CSSProperties
      }
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="cb-node-glow">
            <stop
              offset="0%"
              style={{ stopColor: "var(--cb-pulse)", stopOpacity: 0.9, transition: "stop-color 0.9s ease" }}
            />
            <stop offset="100%" style={{ stopColor: "var(--cb-pulse)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        <g transform={contentTransform}>
          <image
            ref={imageRef}
            href={ARTWORK_SRC}
            x={0}
            y={0}
            width={width}
            height={height}
            preserveAspectRatio="none"
            style={{ opacity: 0 }}
          />

          <g style={{ mixBlendMode: "screen" }}>
            {CIRCUIT_PATHS.map((p, i) => (
              <g
                key={p.id}
                ref={(el) => {
                  pulseGroupRefs.current[i] = el;
                }}
                style={{ opacity: 0 }}
              >
                <path
                  d={p.d}
                  pathLength={100}
                  fill="none"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.22}
                  style={{ stroke: "var(--cb-pulse)", transition: "stroke 0.9s ease" }}
                />
                <path
                  d={p.d}
                  pathLength={100}
                  fill="none"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.95}
                  style={{ stroke: "var(--cb-pulse)", transition: "stroke 0.9s ease" }}
                />
              </g>
            ))}

            {CIRCUIT_NODES.map((n, i) => (
              <circle
                key={`${n.x}-${n.y}`}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                cx={n.x}
                cy={n.y}
                r={20}
                fill="url(#cb-node-glow)"
                style={{ opacity: 0 }}
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Scrim: keeps text readable; the interface stays the primary layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(8,8,9,0.25) 0%, rgba(8,8,9,0.72) 100%)",
        }}
      />
    </div>
  );
}
