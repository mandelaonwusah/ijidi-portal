// src/components/GlassCard.tsx
// Transparent glass card: the circuit background shows through, the text on it
// stays clean (blur + light dark tint + soft text shadow).
// Entrance: fade, scale from 0.96, rise, and unblur, staggered by `index`.
// Skipped entirely when the visitor prefers reduced motion.
import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useVisualState } from "@/lib/visual-state";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Position in a group of cards; sets the stagger delay (max 8 steps). */
  index?: number;
}

export function GlassCard({ index = 0, className, children, ...rest }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { transitionMode } = useVisualState();

  useEffect(() => {
    const el = ref.current;
    if (!el || transitionMode === "instant" || typeof el.animate !== "function") return;

    const animation = el.animate(
      [
        { opacity: 0, transform: "translateY(14px) scale(0.96)", filter: "blur(8px)" },
        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)" },
      ],
      {
        duration: 620,
        delay: Math.min(index, 8) * 70,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      }
    );
    return () => animation.cancel();
    // Plays once when the card mounts (a route change remounts it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-gold/20 bg-black/35 shadow-lg shadow-black/30",
        "backdrop-blur-xl backdrop-saturate-150",
        "[text-shadow:0_1px_2px_rgba(0,0,0,0.55)]",
        "transition-colors hover:border-gold/40",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
