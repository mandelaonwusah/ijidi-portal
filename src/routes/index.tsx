import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Blocks, CircleDot, Database, ShieldCheck } from "lucide-react";
import { activity, metricTiles, modules } from "@/lib/portal-data";
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
function CommandCenter() {
  return (
    <div className="grid-scan -m-4 min-h-[calc(100vh-108px)] p-4 sm:-m-6 sm:p-6 xl:-m-8 xl:p-8">
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
              <div className="hex-badge flex h-14 w-14 items-center justify-center border border-gold bg-gold/10 font-mono text-[9px] text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="mt-2 font-mono text-[9px] uppercase tracking-widest text-gold">
                IJIDI ROOT
              </span>
            </div>
            <div className="absolute left-[17%] right-[17%] top-[112px] h-px bg-border" />
            <div className="absolute left-1/2 top-[71px] h-[42px] w-px bg-border" />
            {modules.map((module, index) => (
              <div
                key={module.code}
                className="absolute top-[128px] flex w-[30%] -translate-x-1/2 flex-col items-center text-center"
                style={{ left: `${index * 34 + 16}%` }}
              >
                <div className="h-2 w-2 rounded-full border border-teal bg-teal/30" />
                <Eyebrow className="mt-3 text-[8px] text-foreground">{module.name}</Eyebrow>
                <span className="mt-1 font-mono text-[8px] text-muted-foreground">
                  {module.state}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel-bracket p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Eyebrow className="text-gold">System activity</Eyebrow>
              <h2 className="mt-2 font-display text-lg font-semibold">Recent signals</h2>
            </div>
            <CircleDot className="h-4 w-4 text-teal" />
          </div>
          <div className="space-y-1">
            {activity.map((item) => (
              <div key={item.text} className="border-b border-border py-4 last:border-0">
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
            className="panel-bracket group p-4 transition-colors hover:border-gold/50"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center border border-teal/30 bg-teal/10 font-mono text-xs text-teal">
                {module.code.slice(0, 2)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold" />
            </div>
            <h3 className="mt-5 font-display font-semibold">{module.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{module.detail}</p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <Database className="h-3 w-3" />
              {module.state === "ready" ? "Ready" : "Awaiting records"}
            </div>}import { createFileRoute } from '@tanstack/react-router'
           >import PortalComplete from './portal-final'
          >export const Route = createFileRoute('/')({
           >component: PortalComplete,
            })
          </Link>
        ))}
      </div>
    </div>
  
