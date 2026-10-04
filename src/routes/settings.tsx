import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, Gauge, Loader2, Palette, RotateCcw, ShieldCheck } from "lucide-react";
import { Eyebrow, SectionHeader, StatusBadge } from "@/components/portal-ui";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import {
  brandFor,
  brandSrc,
  hasBrandOverride,
  loadBrandOverrides,
  resetBrandImage,
  uploadBrandImage,
  useBrandVersion,
} from "@/lib/brand-assets";
import {
  CIRCUIT_BACKGROUND_HEX,
  CIRCUIT_BACKGROUND_LABELS,
  CIRCUIT_MOTION_LABELS,
  CIRCUIT_PALETTE_LABELS,
  CIRCUIT_PALETTE_PREVIEW,
  TICKER_PX_PER_SEC,
  resetCircuitStudio,
  resolveCircuitBackground,
  setUiPref,
  useUiPrefs,
  type CircuitBackground,
  type CircuitMotion,
  type CircuitPalette,
  type TickerSpeed,
} from "@/lib/ui-prefs";
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

const BACKGROUND_OPTIONS = Object.keys(CIRCUIT_BACKGROUND_LABELS) as CircuitBackground[];
const PALETTE_OPTIONS = Object.keys(CIRCUIT_PALETTE_LABELS) as CircuitPalette[];
const MOTION_OPTIONS = Object.keys(CIRCUIT_MOTION_LABELS) as CircuitMotion[];

type Identity = {
  email: string | null;
  lastSignIn: string | null;
  profile: { display_name?: string | null; handle?: string | null; access_tier?: string | null } | null;
};

function IdentityPicture({ name, canEdit }: { name: string; canEdit: boolean }) {
  useBrandVersion();
  const assetId = brandFor(name)?.id ?? null;
  const src = assetId ? brandSrc(assetId) : null;
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const pick = async (file: File | undefined) => {
    if (!file || !assetId) return;
    setBusy(true);
    setMessage(null);
    const result = await uploadBrandImage(assetId, file);
    setBusy(false);
    setMessage(result.ok ? { tone: "ok", text: "Picture updated." } : { tone: "error", text: result.error });
    if (fileRef.current) fileRef.current.value = "";
  };

  const useDefault = async () => {
    if (!assetId) return;
    setBusy(true);
    setMessage(null);
    const result = await resetBrandImage(assetId);
    setBusy(false);
    setMessage(result.ok ? { tone: "ok", text: "Back to the default picture." } : { tone: "error", text: result.error });
  };

  const pillClass =
    "inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 disabled:opacity-50";

  return (
    <div className="flex flex-col items-center">
      {/* Large governor portrait: gold-to-blue ring with a soft glow */}
      <span className="rounded-full bg-gradient-to-br from-[#E3C27A] via-[#C6A15B] to-[#4F86F7] p-[3px] shadow-[0_0_44px_rgba(198,161,91,0.28)]">
        <span className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-[#0a0d14] font-display text-6xl font-semibold text-gold sm:h-48 sm:w-48">
          {src && !failed ? (
            <img
              src={src}
              alt={name}
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
      </span>

      {canEdit && assetId && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Choose a picture"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={pillClass}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Change picture
          </button>
          {hasBrandOverride(assetId) && (
            <button type="button" disabled={busy} onClick={useDefault} className={pillClass}>
              <RotateCcw className="h-3.5 w-3.5" /> Use default
            </button>
          )}
        </div>
      )}
      {message && (
        <p
          role="status"
          className={cn(
            "mt-2 text-center font-mono text-[10.5px]",
            message.tone === "ok" ? "text-gold" : "text-destructive"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

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

function CircuitStudioCard() {
  const prefs = useUiPrefs();
  const activeBg = resolveCircuitBackground(prefs);

  const pillClass = (active: boolean) =>
    cn(
      "rounded-md px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
      active
        ? "bg-gold font-semibold text-primary-foreground"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    );

  return (
    <GlassCard index={4}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Palette className="h-4 w-4 text-gold" />
          <Eyebrow>Circuit background studio</Eyebrow>
        </div>
        <button
          type="button"
          onClick={resetCircuitStudio}
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
        >
          <RotateCcw className="h-3 w-3" /> Reset to default
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Tunes the live circuit board behind the whole Portal. Everything below starts on the
        board's original look — nothing changes until you pick something else, and every change
        is saved to this browser.
      </p>

      {/* Background colour */}
      <div className="mt-6">
        <div className="text-sm">Background colour</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {BACKGROUND_OPTIONS.filter((key) => key !== "custom").map((key) => {
            const active = prefs.circuitBackground === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setUiPref("circuitBackground", key)}
                title={CIRCUIT_BACKGROUND_LABELS[key]}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-transform",
                  active ? "scale-110 border-gold shadow-[0_0_12px_rgba(198,161,91,0.5)]" : "border-white/15 hover:scale-105"
                )}
                style={{ background: CIRCUIT_BACKGROUND_HEX[key] }}
              />
            );
          })}
          <label
            title="Custom"
            className={cn(
              "flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-transform",
              prefs.circuitBackground === "custom"
                ? "scale-110 border-gold shadow-[0_0_12px_rgba(198,161,91,0.5)]"
                : "border-white/15 hover:scale-105"
            )}
            style={{ background: prefs.circuitBackgroundCustom }}
          >
            <input
              type="color"
              className="h-12 w-12 -translate-x-0.5 -translate-y-0.5 cursor-pointer opacity-0"
              value={prefs.circuitBackgroundCustom}
              onChange={(e) => {
                setUiPref("circuitBackgroundCustom", e.target.value);
                setUiPref("circuitBackground", "custom");
              }}
            />
          </label>
        </div>
        <div className="mt-1.5 text-[10.5px] uppercase tracking-widest text-muted-foreground">
          {CIRCUIT_BACKGROUND_LABELS[prefs.circuitBackground]} · {activeBg}
        </div>
      </div>

      {/* Line palette */}
      <div className="mt-6">
        <div className="text-sm">Line palette</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PALETTE_OPTIONS.map((key) => {
            const active = prefs.circuitPalette === key;
            const [c1, c2] = CIRCUIT_PALETTE_PREVIEW[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setUiPref("circuitPalette", key)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                  active ? "border-gold bg-gold/10" : "border-white/15 hover:border-white/30"
                )}
              >
                <span className="flex h-4 w-4 overflow-hidden rounded-full ring-1 ring-black/40">
                  <span className="h-full w-1/2" style={{ background: c1 }} />
                  <span className="h-full w-1/2" style={{ background: c2 }} />
                </span>
                <span
                  className={cn(
                    "font-mono text-[10.5px] uppercase tracking-[0.1em]",
                    active ? "text-gold" : "text-muted-foreground"
                  )}
                >
                  {CIRCUIT_PALETTE_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Motion */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm">Motion</div>
          <div className="mt-1 text-xs text-muted-foreground">
            How dense and fast the pulses run — eases in smoothly either way
          </div>
        </div>
        <div role="group" aria-label="Circuit motion" className="inline-flex rounded-lg border border-border bg-black/25 p-1">
          {MOTION_OPTIONS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={prefs.circuitMotion === key}
              onClick={() => setUiPref("circuitMotion", key)}
              className={pillClass(prefs.circuitMotion === key)}
            >
              {CIRCUIT_MOTION_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Dimming */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm">Dimming</div>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">
            {prefs.circuitDimming === 0.5 ? "Default" : prefs.circuitDimming < 0.5 ? "Darker" : "Brighter"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={prefs.circuitDimming}
          onChange={(e) => setUiPref("circuitDimming", Number(e.target.value))}
          className="mt-3 w-full accent-[#C6A15B]"
          aria-label="Background dimming"
        />
        <div className="mt-1 flex justify-between font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground">
          <span>Darker</span>
          <span>Brighter</span>
        </div>
      </div>
    </GlassCard>
  );
}

function Settings() {
  const { tickerSpeed } = useUiPrefs();

  // Pick up any pictures changed from inside the portal.
  useEffect(() => {
    void loadBrandOverrides();
  }, []);

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
        <GlassCard index={1}>
          <div className="flex flex-col items-center text-center">
            <IdentityPicture name={name} canEdit={isGovernor} />
            <div className="mt-5 min-w-0">
              <Eyebrow className="text-gold">{isGovernor ? "Governor" : "Signed-in identity"}</Eyebrow>
              <h2 className="mt-2 break-words font-display text-2xl font-semibold">
                {isLoading ? "Loading…" : name}
              </h2>
              <p className="mt-1 break-all font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {handle ?? identity?.email ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-black/20 p-3">
              <Eyebrow>Access tier</Eyebrow>
              <div className="mt-3 font-mono text-sm text-gold">
                {isLoading ? "…" : tier ?? "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-black/20 p-3">
              <Eyebrow>Session</Eyebrow>
              <div className="mt-3 font-mono text-sm text-teal">
                {isLoading ? "…" : isError ? "Unavailable" : "Signed in"}
              </div>
            </div>
          </div>

          <dl className="mt-6 space-y-2 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-widest">
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
          <GlassCard index={2}>
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

          <GlassCard index={3}>
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
                className="inline-flex rounded-lg border border-border bg-black/25 p-1"
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

          <CircuitStudioCard />
        </section>
      </div>
    </div>
  );
}
