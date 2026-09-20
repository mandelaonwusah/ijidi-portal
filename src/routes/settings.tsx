import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Palette, ShieldCheck } from "lucide-react";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import { TICKER_PX_PER_SEC, setUiPref, useUiPrefs, type TickerSpeed } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Identity & Settings · IJIDI Portal" },
      {
        name: "description",
        content: "IJIDI Portal identity, access tier, and interface settings.",
      },
      { property: "og:title", content: "Identity & Settings · IJIDI Portal" },
      { property: "og:description", content: "IJIDI Portal identity and access settings." },
    ],
  }),
  component: Settings,
});

const SPEED_OPTIONS: { value: TickerSpeed; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

type Identity = {
  email: string | null;
  lastSignIn: string | null;
  profile: { display_name?: string | null; handle?: string | null; access_tier?: string | null } | null;
};

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function Settings() {
  const { tickerSpeed } = useUiPrefs();

  // Real identity: the signed-in user and their profiles row. Nothing here is hardcoded.
  const {
    data: identity,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["settings-identity"],
    retry: 1,
    queryFn: async (): Promise<Identity> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("No signed-in user");
      const user = userData.user;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, handle, access_tier")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return {
        email: user.email ?? null,
        lastSignIn: user.last_sign_in_at ?? null,
        profile: (data as Identity["profile"]) ?? null,
      };
    },
  });

  const profile = identity?.profile ?? null;
  const name = profile?.display_name || identity?.email || "—";
  const handle = profile?.handle
    ? profile.handle.startsWith("@")
      ? profile.handle
      : `@${profile.handle}`
    : null;
  const tier = profile?.access_tier ?? null;
  const isGovernor = tier === "SOVEREIGN";

  const badge = isLoading ? (
    <StatusBadge status="forming" label="CHECKING" />
  ) : isError ? (
    <StatusBadge status="error" label="UNAVAILABLE" />
  ) : isGovernor ? (
    <StatusBadge status="active" label="GOVERNOR SESSION" />
  ) : (
    <StatusBadge status="ready" label={tier ?? "SIGNED IN"} />
  );

  return (
    <div className="space-y-6">
      <GlassCard className="px-5 py-4 sm:px-6">
        <SectionHeader
          eyebrow="08 / IDENTITY"
          title="The person behind the access."
          detail="A clear identity panel keeps authority visible and scoped."
          action={badge}
        />
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Identity */}
        <GlassCard index={1} className="p-6">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 font-display text-2xl font-semibold text-gold">
              {name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <Eyebrow className="text-teal">{isGovernor ? "Governor" : "Signed-in identity"}</Eyebrow>
              <h2 className="mt-2 break-words font-display text-2xl font-semibold">
                {isLoading ? "Loading…" : name}
              </h2>
              <p className="mt-1 break-all font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {handle ?? identity?.email ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gold/20 bg-black/20 p-3">
              <Eyebrow>Access tier</Eyebrow>
              <div className="mt-3 font-mono text-sm text-gold">
                {isLoading ? "…" : tier ?? "—"}
              </div>
            </div>
            <div className="rounded-lg border border-gold/20 bg-black/20 p-3">
              <Eyebrow>Session</Eyebrow>
              <div className="mt-3 font-mono text-sm text-teal">
                {isLoading ? "…" : isError ? "Unavailable" : "Signed in"}
              </div>
            </div>
          </div>

          <dl className="mt-6 space-y-2 border-t border-gold/20 pt-5 font-mono text-[10px] uppercase tracking-widest">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all text-right normal-case tracking-normal text-foreground">
                {identity?.email ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd className="text-right text-foreground">{formatWhen(identity?.lastSignIn)}</dd>
            </div>
          </dl>
        </GlassCard>

        <section className="space-y-6">
          {/* Access */}
          <GlassCard index={2} className="p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <Eyebrow>Access</Eyebrow>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {isLoading ? (
                <StatusBadge status="forming" label="CHECKING" />
              ) : isError ? (
                <StatusBadge status="error" label="UNAVAILABLE" />
              ) : (
                <StatusBadge status={isGovernor ? "active" : "ready"} label={tier ?? "NO TIER"} />
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Your tier is read from your profile. The database enforces it; this page only shows it.
            </p>
          </GlassCard>

          {/* Interface controls */}
          <GlassCard index={3} className="p-5">
            <div className="flex items-center gap-3">
              <Gauge className="h-4 w-4 text-teal" />
              <Eyebrow>Interface controls</Eyebrow>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm">Ticker speed</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  How fast the activity ticker at the top scrolls · about{" "}
                  {TICKER_PX_PER_SEC[tickerSpeed]} px per second · saved in this browser
                </div>
              </div>
              <div
                role="group"
                aria-label="Ticker speed"
                className="inline-flex rounded-lg border border-gold/25 bg-black/25 p-1"
              >
                {SPEED_OPTIONS.map((option) => {
                  const active = tickerSpeed === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setUiPref("tickerSpeed", option.value)}
                      className={cn(
                        "rounded-md px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
                        active
                          ? "bg-gold font-semibold text-primary-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* Background studio: not built yet, said plainly */}
          <GlassCard index={4} className="border-dashed p-5">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-gold" />
              <Eyebrow>Circuit background studio</Eyebrow>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Colours, line palette, density and speed for the circuit board will live here. Not
              built yet.
            </p>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
