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
// Entrance: fade, scale from 0.96, rise, and unblur, staggered by `index`. It is a
// CSS animation (.glass-enter in styles.css), so it starts with the first paint
// of the server-rendered page and plays once: hydration keeps the same element
// and does not restart it. Off when the visitor prefers reduced motion.
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

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
  return (
    <div
      data-variant={variant}
      {...rest}
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms`, ...rest.style }}
      className={cn(
        "glass-enter relative rounded-xl border backdrop-blur-[10px] backdrop-saturate-150 transition-colors",
        VARIANTS[variant],
        selected && "border-border-gold hover:border-border-gold",
        // Strong text: cream base colour and a dark halo that lifts it off the lines.
        "text-[#F5F1E8] [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.6)]",
        "[&_.text-foreground]:text-[#FBF8F1]",
        "[&_[class*=text-muted-foreground]]:font-medium [&_[class*=text-muted-foreground]]:text-[#D8DCE8]",
        className
      )}
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
