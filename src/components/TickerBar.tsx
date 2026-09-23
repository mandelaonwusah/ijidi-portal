// src/components/TickerBar.tsx
// The activity ticker at the top of every governor page.
// Reads the real activity_log (same query as the data-link status in the shell).
// Entry colours rotate through the portal's palette: gold, teal, soft blue,
// warm amber, and soft white — each keyed to a different entry type.
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/portal-queries";
import { TICKER_PX_PER_SEC, useUiPrefs } from "@/lib/ui-prefs";

type Tone = "gold" | "teal" | "blue" | "amber" | "white";

const TONE_TEXT: Record<Tone, string> = {
  gold: "text-[#C6A15B]",
  teal: "text-[#5BB89C]",
  blue: "text-[#6BA4F7]",
  amber: "text-[#E3B567]",
  white: "text-[#EAF1FF]/80",
};

const TONE_MARKER: Record<Tone, string> = {
  gold: "text-[#C6A15B]",
  teal: "text-[#5BB89C]",
  blue: "text-[#6BA4F7]",
  amber: "text-[#E3B567]",
  white: "text-[#EAF1FF]/50",
};

const TONE_SYMBOL: Record<Tone, string> = {
  gold: "◆",
  teal: "▲",
  blue: "●",
  amber: "◇",
  white: "○",
};

function toneForEntry(actor: string | undefined, action: string | undefined): Tone {
  const text = `${actor ?? ""} ${action ?? ""}`.toUpperCase();
  if (text.includes("GOVERN") || text.includes("SESSION") || text.includes("PROPOSAL")) {
    return "gold";
  }
  if (text.includes("SESSION") || text.includes("STARTED")) {
    return "amber";
  }
  if (text.includes("IGX") || text.includes("AI")) {
    return "blue";
  }
  if (text.includes("SYSTEM") || text.includes("DATA") || text.includes("SYNC") || text.includes("QUERY")) {
    return "teal";
  }
  return "white";
}

export function TickerBar() {
  const { tickerSpeed } = useUiPrefs();
  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: getActivity,
    refetchInterval: 5000,
  });

  const rawItems = isLoading
    ? [{ actor: undefined, action: "LOADING ACTIVITY LOG…", tone: "white" as Tone }]
    : isError || !activity
    ? [{ actor: undefined, action: "ACTIVITY LOG UNAVAILABLE", tone: "white" as Tone }]
    : activity.length > 0
    ? activity.map((a) => ({
        actor: a.actor,
        action: a.action,
        tone: toneForEntry(a.actor, a.action),
      }))
    : [{ actor: undefined, action: "NO VERIFIED ENTRIES", tone: "white" as Tone }];

  const items = rawItems.map((a) => ({
    text: `${a.actor?.toUpperCase() ?? "SYSTEM"} · ${a.action}`,
    tone: a.tone,
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
            className={`mx-5 flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[9.5px] font-normal uppercase tracking-[0.12em] ${TONE_TEXT[item.tone]}`}
          >
            <span className={TONE_MARKER[item.tone]}>{TONE_SYMBOL[item.tone]}</span> {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
