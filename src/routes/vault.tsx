import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { FileLock2, KeyRound, LockKeyhole } from "lucide-react";
import { vaultItems } from "@/lib/portal-data";
import {
  Eyebrow,
  RestrictedMark,
  SectionHeader,
  StatusBadge,
  declaredLabel,
} from "@/components/portal-ui";
export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [ 
      { title: "The Vault · IJIDI Portal" },
      {
        name: "description",
        content: "Restricted IJIDI Portal document vault and identity manifest.",
      },
      { property: "og:title", content: "The Vault · IJIDI Portal" },
      { property: "og:description", content: "Restricted IJIDI Portal document vault." },
    ],
  }),
  component: Vault,
});
function Vault() {
  return (
    <div>
      <SectionHeader
        eyebrow="05 / THE VAULT"
        title="The record stays protected."
        detail="Encrypted document surfaces for the material that governs the system."
        action={<RestrictedMark />}
      />
      <div className="mb-6 flex items-center gap-3 border border-teal/20 bg-teal/5 p-4">
        <KeyRound className="h-5 w-5 shrink-0 text-teal" />
        <div>
          <div className="font-mono text-xs font-medium uppercase tracking-widest text-teal">
            Vault encryption / nominal
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Access is scoped to your current root session.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {vaultItems.map((item) => (
          <GlassCard
            key={item.title}
            className="group relative overflow-hidden"
          >
            <div className="absolute right-4 top-4 text-muted-foreground/50">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <div className="flex h-10 w-10 items-center justify-center border border-border bg-white/[0.04] text-muted-foreground">
              <FileLock2 className="h-4 w-4" />
            </div>
            <Eyebrow className="mt-6 text-teal">{item.type}</Eyebrow>
            <h2 className="mt-2 font-display text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              {item.state === "Available" ? (
                <StatusBadge state="pending" label={declaredLabel(item.state)} />
              ) : (
                <StatusBadge state="not-connected" label={item.state} />
              )}
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {item.access} ACCESS
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
