import { createFileRoute } from "@tanstack/react-router";
import { AtSign, ExternalLink, Globe2 } from "lucide-react";
import { modules, personalBrand } from "@/lib/portal-data";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";

export const Route = createFileRoute("/directory")({
  head: () => ({ 
    meta: [
      { title: "Directory · IJIDI Portal" },
      {
        name: "description",
        content: "Entities, handles, and live sites across the IJIDI ecosystem.",
      },
      { property: "og:title", content: "Directory · IJIDI Portal" },
      { property: "og:description", content: "Entities, handles, and live sites." },
    ],
  }),
  component: Directory,
});

type Entry = {
  name: string;
  code: string;
  detail: string;
  state?: string;
  handle?: string;
  siteUrl?: string;
};

function Directory() {
  const entries: Entry[] = [...modules, personalBrand];

  return (
    <div>
      <SectionHeader
        eyebrow="11 / DIRECTORY"
        title="Entities, handles, and live sites."
        detail="Pulled from the real module registry. Nothing here is invented — unconfirmed fields read as not tracked."
        action={<StatusBadge status="active" label="3 SITES LIVE" />}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <div key={entry.code} className="panel-bracket p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>{entry.code}</Eyebrow>
              {entry.state && <StatusBadge status={entry.state} />}
            </div>

            <h3 className="mt-3 font-display text-lg font-semibold">{entry.name}</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">{entry.detail}</p>

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <AtSign className="h-3 w-3 text-teal" />
                {entry.handle ? (
                  <span className="text-foreground">{entry.handle}</span>
                ) : (
                  <span className="text-muted-foreground">Not tracked</span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Globe2 className="h-3 w-3 text-gold" />
                {entry.siteUrl ? (
                  
                    href={entry.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-gold underline-offset-4 hover:underline"
                  >
                    {entry.siteUrl.replace("https://", "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not deployed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
