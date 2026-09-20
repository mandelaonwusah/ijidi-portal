// src/components/GlassCard.tsx
// Transparent glass card. The circuit background shows through the glass;
// the text stays strong: brighter text colours, a heavier dark text halo, and
// a slightly heavier weight on the small grey labels.
// Four gold corner arcs follow the card's rounded corners.
// Entrance: fade, scale from 0.96, rise, and unblur, staggered by `index`.
// Skipped entirely when the visitor prefers reduced motion.
import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useVisualState } from "@/lib/visual-state";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Position in a group of cards; sets the stagger delay (max 8 steps). */
  index?: number;
}

// Full class names so Tailwind can see them.
const CORNERS = [
  "left-0 top-0 rounded-tl-xl border-l border-t",
  "right-0 top-0 rounded-tr-xl border-r border-t",
  "bottom-0 left-0 rounded-bl-xl border-b border-l",
  "bottom-0 right-0 rounded-br-xl border-b border-r",
];

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
        "relative rounded-xl border border-gold/25 shadow-lg shadow-black/25",
        // Glass: barely tinted, lightly blurred, so the board stays visible.
        "bg-[image:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.12)_45%,rgba(0,0,0,0.26))]",
        "backdrop-blur-[6px] backdrop-saturate-150",
        // Strong text: cream base colour and a dark halo that lifts it off the lines.
        "text-[#F5F1E8] [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.6)]",
        "[&_.text-foreground]:text-[#FBF8F1]",
        "[&_[class*=text-muted-foreground]]:font-medium [&_[class*=text-muted-foreground]]:text-[#D8DCE8]",
        "transition-colors hover:border-gold/45",
        className
      )}
      {...rest}
    >
      {CORNERS.map((corner) => (
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
