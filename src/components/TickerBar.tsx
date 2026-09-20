// src/components/TickerBar.tsx
// The activity ticker at the top of every governor page.
// Reads the real activity_log (same query as the data-link status in the shell).
// Calm on purpose: small text, dim champagne colour, slow scroll. The speed is the
// governor's choice in Settings (Slow / Normal / Fast).
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/portal-queries";
import { TICKER_PX_PER_SEC, useUiPrefs } from "@/lib/ui-prefs";

export function TickerBar() {
  const { tickerSpeed } = useUiPrefs();
  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

  const items = isLoading
    ? ["LOADING ACTIVITY LOG…"]
    : isError || !activity
    ? ["ACTIVITY LOG UNAVAILABLE"]
    : activity.length > 0
    ? activity.map((a) => `${a.actor?.toUpperCase() ?? "SYSTEM"} · ${a.action}`)
    : ["NO VERIFIED ENTRIES"];

  const loop = [...items, ...items];

  // One pass = the items once. The duration follows their length, so the speed
  // stays the same however many entries there are.
  const passWidth = items.reduce((sum, text) => sum + text.length * 7 + 64, 0);
  const durationSeconds = Math.max(
    20,
    Math.round(passWidth / TICKER_PX_PER_SEC[tickerSpeed])
  );

  return (
    <div className="sticky top-0 z-50 h-6 overflow-hidden border-b border-gold/20 bg-black/25 backdrop-blur-[3px]">
      <div
        className="ticker-track flex h-6 items-center hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-5 flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[9.5px] font-normal uppercase tracking-[0.12em] text-[#D9C08A]/70"
          >
            <span className="text-[#5E9BFF]/60">◆</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}
