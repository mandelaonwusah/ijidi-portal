// src/components/TickerBar.tsx
// The activity ticker at the top of every governor page.
// Reads the real activity_log (same query as the data-link status in the shell).
// Each entry gets its own lead dot colour, cycling gold / blue / violet / sky / amber.
// The entry's text stays one consistent, readable colour.
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/portal-queries";
import { TICKER_PX_PER_SEC, useUiPrefs } from "@/lib/ui-prefs";

const DOT_COLORS = ["#C6A15B", "#6BA4F7", "#9B8FE0", "#5EC8E0", "#D9A441"]; // gold, blue, violet, sky, amber
const TEXT_COLOR = "#EAF1FF"; // ice-white, constant

export function TickerBar() {
  const { tickerSpeed } = useUiPrefs();
  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

  const rawItems = isLoading
    ? [{ actor: undefined, action: "LOADING ACTIVITY LOG…" }]
    : isError || !activity
    ? [{ actor: undefined, action: "ACTIVITY LOG UNAVAILABLE" }]
    : activity.length > 0
    ? activity.map((a) => ({ actor: a.actor, action: a.action }))
    : [{ actor: undefined, action: "NO VERIFIED ENTRIES" }];

  const items = rawItems.map((a) => ({
    text: `${a.actor?.toUpperCase() ?? "SYSTEM"} · ${a.action}`,
  }));

  const loop = [...items, ...items];

  const passWidth = items.reduce((sum, item) => sum + item.text.length * 7 + 64, 0);
  const durationSeconds = Math.max(
    20,
    Math.round(passWidth / TICKER_PX_PER_SEC[tickerSpeed])
  );

  return (
    <div className="sticky top-0 z-50 h-6 overflow-hidden border-b border-border bg-black/25 backdrop-blur-[3px]">
      <div
        className="ticker-track flex h-6 items-center hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-5 flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-xs font-normal uppercase tracking-[0.12em]"
          >
            <span style={{ color: DOT_COLORS[i % DOT_COLORS.length] }}>◆</span>{" "}
            <span style={{ color: TEXT_COLOR }}>{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
