// src/components/TickerBar.tsx
// The activity ticker at the top of every governor page.
// Reads the real activity_log (same query as the data-link status in the shell).
// Every entry has the same neutral lead dot: the ticker is not a status, so its
// dots carry no colour meaning (DESIGN.md: gold only for selected, focus,
// governor-only and the corner arcs). The text stays one readable colour.
// 32 px tall (DESIGN.md §4 Shell); pauses while the pointer is over it.
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/portal-queries";
import { TICKER_PX_PER_SEC, useUiPrefs } from "@/lib/ui-prefs";

const DOT_COLOR = "#5c6476"; // neutral grey (--not-connected-dot)
const TEXT_COLOR = "#9aa3b5"; // muted grey (--muted-foreground): ambient, quieter than page text

export function TickerBar() {
  const { tickerSpeed } = useUiPrefs();
  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

  const rawItems = isLoading
    ? [{ actor: undefined, action: "Loading activity log…" }]
    : isError || !activity
    ? [{ actor: undefined, action: "Activity log unavailable" }]
    : activity.length > 0
    ? activity.map((a) => ({ actor: a.actor, action: a.action }))
    : [{ actor: undefined, action: "No verified entries" }];

  const items = rawItems.map((a) => ({
    text: `${a.actor ?? "System"} · ${a.action}`,
  }));

  const loop = [...items, ...items];

  const passWidth = items.reduce((sum, item) => sum + item.text.length * 7 + 64, 0);
  const durationSeconds = Math.max(
    20,
    Math.round(passWidth / TICKER_PX_PER_SEC[tickerSpeed])
  );

  return (
    <div className="sticky top-0 z-50 h-8 overflow-hidden border-b border-border bg-black/25 backdrop-blur-[3px]">
      <div
        className="ticker-track flex h-8 items-center hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-5 flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-xs font-normal tracking-[0.02em]"
          >
            <span aria-hidden="true" style={{ color: DOT_COLOR }}>◆</span>{" "}
            <span style={{ color: TEXT_COLOR }}>{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
