import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Blocks, CircleDot, Database, ShieldCheck } from "lucide-react";
import { metricTiles, modules } from "@/lib/portal-data";
import { getActivity } from "@/lib/portal-queries";
import {
  ActionLabel,
  Eyebrow,
  MetricTile,
  SectionHeader,
  Signal,
  StatusBadge,
} from "@/components/portal-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center · IJIDI Portal" },
      {
        name: "description",
        content:
          "IJIDI Portal's grounded operating overview for ecosystem and intelligence operations.",
      },
      { property: "og:title", content: "Command Center · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Portal's grounded operating overview." },
    ],
  }),
  component: CommandCenter,
});

type ActivityRow = {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entity_id: string | null;
};

type ActivityItem = {
  time: string;
  tone: "teal" | "gold";
  tag: string;
  text: string;
};

function formatTimeAgo(timestamp: string) {
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

function mapRowToActivityItem(row: ActivityRow): ActivityItem {
  const isHuman = row.actor === "Mandela";
  return {
    time: formatTimeAgo(row.timestamp),
    tone: isHuman ? "gold" : "teal",
    tag: row.entity_id ?? row.actor,
    text: row.action,
  };
}

function CommandCenter() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityState, setActivityState] = useState<"loading" | "ready" | "error">("loading");
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivity()
      .then((rows) => {
        if (cancelled) return;
        setActivity((rows as ActivityRow[]).map(mapRowToActivityItem));
        setActivityState("ready");
      })
      .catch((err) => {
        console.error("Failed to load activity_log:", err);
        if (cancelled) return;
        setActivityState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid-scan -m-4 min-h-[calc(100vh-108px)] p-4 sm:-m-6 sm:p-6 xl:-m-8 xl:p-8">
      <style>{`
        @keyframes lineFlow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.9; }
        }
        .flow-line { animation: lineFlow 2.4s ease-in-out infinite; }
        .flow-line-delay-1 { animation-delay: 0.3s; }
        .flow-line-delay-2 { animation-delay: 0.6s; }
      `}</style>
      <SectionHeader
        eyebrow="01 / COMMAND CENTER"
        title="The operating picture."
        detail="A single view of what exists, what is forming, and what still needs to be tracked."
        action={<Signal>Live session / root access</Signal>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricTiles.map((metric) => (
          <MetricTile key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="panel-bracket p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Eyebrow className="text-teal">Ecosystem overview</Eyebrow>
              <h2 className="mt-2 font-display text-lg font-semibold">Root access / three arms</h2>
            </div>
            <Link to="/ecosystem" className="group">
              <ActionLabel>Open map</ActionLabel>
            </Link>
          </div>
          <div className="relative min-h-[210px] overflow-hidden border border-border bg-background/40 p-5">
            <div className="absolute left-1/2 top-5 flex -translate-x-1/2 flex-col items-center">
              <div className="hex-badge flex h-14 w-14 items-center justify-center border border-gold bg-gold/10 font-mono text-[9px] text-gold transition-transform duration-300 hover:scale-110">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="mt-2 font-mono text-[9px] uppercase tracking-widest text-gold">
                IJIDI ROOT
              </span>
            </div>
            <div className="flow-line absolute left-[17%] right-[17%] top-[112px] h-px bg-gold/60" />
            <div className="flow-line flow-line-delay-1 absolute left-1/2 top-[71px] h-[42px] w-px bg-gold/60" />
            {modules.map((module, index) => (
              <Link
                key={module.code}
                to={module.to}
                onMouseEnter={() => setHoveredModule(module.code)}
                onMouseLeave={() => setHoveredModule(null)}
                className="group absolute top-[128px] flex w-[30%] -translate-x-1/2 cursor-pointer flex-col items-center text-center"
                style={{ left: `${index * 34 + 16}%` }}
              >
                <div
                  className={`flow-line flow-line-delay-2 h-px w-6 -translate-y-3 ${
                    hoveredModule === module.code ? "bg-gold" : "bg-gold/40"
                  }`}
                />
                <div className="relative flex h-2 w-2 items-center justify-center">
                  {module.state === "ready" && (
                    <span className="absolute h-2 w-2 animate-ping rounded-full bg-teal/60" />
                  )}
                  <div
                    className={`relative h-2 w-2 rounded-full border transition-all duration-200 ${
                      hoveredModule === module.code
                        ? "scale-150 border-gold bg-gold/50"
                        : "border-teal bg-teal/30 group-hover:scale-125"
                    }`}
                  />
                </div>
                <Eyebrow
                  className={`mt-3 text-[8px] transition-colors ${
                    hoveredModule === module.code ? "text-gold" : "text-foreground"
                  }`}
                >
                  {module.name}
                </Eyebrow>
                <span className="mt-1 font-mono text-[8px] text-muted-foreground">
                  {module.state}
                </span>
                <div
                  className={`pointer-events-none absolute -top-14 z-10 w-40 rounded border border-border bg-background px-3 py-2 text-left shadow-lg transition-all duration-150 ${
                    hoveredModule === module.code
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-1 opacity-0"
                  }`}
                >
                  <p className="font-mono text-[8px] uppercase tracking-widest text-gold">
                    {module.code}
                  </p>
                  <p className="mt-1 text-[10px] text-foreground">{module.detail}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="panel-bracket p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Eyebrow className="text-gold">System activity</Eyebrow>
              <h2 className="mt-2 font-display text-lg font-semibold">Recent signals</h2>
            </div>
            <CircleDot className="h-4 w-4 animate-pulse text-teal" />
          </div>
          <div className="space-y-1">
            {activityState === "loading" && (
              <div className="space-y-3 py-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse space-y-2 border-b border-border py-3 last:border-0">
                    <div className="h-2 w-16 rounded bg-muted-foreground/20" />
                    <div className="h-3 w-full rounded bg-muted-foreground/10" />
                  </div>
                ))}
              </div>
            )}
            {activityState === "error" && (
              <p className="py-4 font-mono text-[10px] text-muted-foreground">
                Unable to load activity right now.
              </p>
            )}
            {activityState === "ready" && activity.length === 0 && (
              <p className="py-4 font-mono text-[10px] text-muted-foreground">
                No signals recorded yet.
              </p>
            )}
            {activityState === "ready" &&
              activity.map((item, i) => (
                <div
                  key={i}
                  className="border-b border-border py-4 transition-colors last:border-0 hover:bg-background/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] text-muted-foreground">{item.time}</span>
                    <StatusBadge
                      status={item.tone === "teal" ? "active" : "not-tracked"}
                      label={item.tag}
                    />
                  </div>
                  <p className="mt-2 text-sm text-foreground">{item.text}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.code}
            to={module.to}
            className="panel-bracket group p-4 transition-all duration-200 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center border border-teal/30 bg-teal/10 font-mono text-xs text-teal transition-transform duration-200 group-hover:scale-110">
                {module.code.slice(0, 2)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold" />
            </div>
            <h3 className="mt-5 font-display font-semibold">{module.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{module.detail}</p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <Database className="h-3 w-3" />
              {module.state === "ready" ? "Ready" : "Awaiting records"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
