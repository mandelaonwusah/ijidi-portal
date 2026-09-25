// src/components/TickerBar.tsx
// The activity ticker at the top of every governor page.
// Reads the real activity_log (same query as the data-link status in the shell).
// Each entry's text cycles through the portal's gold / white / blue / white
// palette word by word, rather than one solid colour per entry.
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/portal-queries";
import { TICKER_PX_PER_SEC, useUiPrefs } from "@/lib/ui-prefs";

const CYCLE_COLORS = ["#C6A15B", "#EAF1FF", "#6BA4F7", "#EAF1FF"]; // gold, white, blue, white

function MulticolorText({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} style={{ color: CYCLE_COLORS[i % CYCLE_COLORS.length] }}>
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

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
    <div className="sticky top-0 z-50 h-6 overflow-hidden border-b border-gold/20 bg-black/25 backdrop-blur-[3px]">
      <div
        className="ticker-track flex h-6 items-center hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-5 flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[9.5px] font-normal uppercase tracking-[0.12em]"
          >
            <span style={{ color: "#C6A15B" }}>◆</span> <MulticolorText text={item.text} />
          </span>
        ))}
      </div>
    </div>
  );
}
