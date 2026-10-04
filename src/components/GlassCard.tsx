// src/components/GlassCard.tsx
// The one card system (DESIGN.md §6). Every card surface in the portal is a
// GlassCard variant; there are no other card classes.
//
//   default   Level 1 glass, neutral border, gold corner arcs, 24 padding.
//   elevated  Level 2 glass, strong neutral border, gold corner arcs, 32 padding.
//   metric    Level 1 glass, for MetricTile (label, value, detail), 24 padding.
//   danger    Level 1 glass on the error surface, red border, no corner arcs.
//
// Hover moves the border from default to strong. `selected` gives the gold
// border, which is kept for selected, focused and governor-only surfaces.
// The four gold corner arcs are IJIDI's signature and the only decorative gold.
//
// The circuit background shows through the glass, so the text stays strong:
// brighter text colours, a dark text halo, and a heavier weight on small grey labels.
// Entrance: fade, scale from 0.96, rise, and unblur, staggered by `index`.
// Skipped entirely when the visitor prefers reduced motion.
import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useVisualState } from "@/lib/visual-state";

export type GlassCardVariant = "default" | "elevated" | "metric" | "danger";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  /** Gold border: the selected item or a governor-only surface. */
  selected?: boolean;
  /** Position in a group of cards; sets the stagger delay (max 8 steps). */
  index?: number;
}

// Full class names so Tailwind can see them.
const VARIANTS: Record<GlassCardVariant, string> = {
  default:
    "border-border bg-[rgba(11,15,23,0.34)] p-6 shadow-[var(--shadow-card),var(--highlight-top)] hover:border-border-strong",
  metric:
    "border-border bg-[rgba(11,15,23,0.34)] p-6 shadow-[var(--shadow-card),var(--highlight-top)] hover:border-border-strong",
  elevated:
    "border-border-strong bg-[rgba(18,24,38,0.5)] p-8 shadow-[var(--shadow-lift),var(--highlight-top)]",
  danger:
    "border-[rgba(229,103,122,0.35)] bg-[rgba(11,15,23,0.34)] bg-[image:linear-gradient(var(--error-surface),var(--error-surface))] p-6 shadow-[var(--shadow-card),var(--highlight-top)]",
};

const CORNERS = [
  "left-0 top-0 rounded-tl-xl border-l border-t",
  "right-0 top-0 rounded-tr-xl border-r border-t",
  "bottom-0 left-0 rounded-bl-xl border-b border-l",
  "bottom-0 right-0 rounded-br-xl border-b border-r",
];

export function GlassCard({
  variant = "default",
  selected = false,
  index = 0,
  className,
  children,
  ...rest
}: GlassCardProps) {
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
      data-variant={variant}
      className={cn(
        "relative rounded-xl border backdrop-blur-[10px] backdrop-saturate-150 transition-colors",
        VARIANTS[variant],
        selected && "border-border-gold hover:border-border-gold",
        // Strong text: cream base colour and a dark halo that lifts it off the lines.
        "text-[#F5F1E8] [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.6)]",
        "[&_.text-foreground]:text-[#FBF8F1]",
        "[&_[class*=text-muted-foreground]]:font-medium [&_[class*=text-muted-foreground]]:text-[#D8DCE8]",
        className
      )}
      {...rest}
    >
      {variant !== "danger" &&
        CORNERS.map((corner) => (
          <span
            key={corner}
            aria-hidden="true"
            className={cn("pointer-events-none absolute h-4 w-4 border-gold/70", corner)}
          />
        ))}
      {children}
    </div>
  );
}
