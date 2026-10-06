// Sign-in page top bar and "The IJIDI Ecosystem" grid (DESIGN.md §6 "Sign-in page").
// The sign-in card itself lives in src/routes/login.tsx and is not changed here.
//
// Rules: live links only for the three public sites; Atelier and Media read
// "Coming soon" with no link; IGX AI reads "Governor access" with no link. No
// status badges and no apps list. Descriptions come only from approved wording:
// the taglines in brand-assets.ts, or the lines the Governor supplied below.
import { ChevronDown, ExternalLink, Menu } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brandById, brandSrc } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

// Top bar: Home goes to the Group site; "What we do" scrolls to the Ecosystem
// tiles on this page.
const HOME_URL = "https://www.ijidigroup.com";

/** Scroll to whichever Ecosystem block is visible at this width. */
function scrollToEcosystem() {
  const target = [...document.querySelectorAll<HTMLElement>("[data-ecosystem]")].find(
    (el) => el.offsetParent !== null,
  );
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
}

// There is no public sign-up: "Sign up" opens an email to this address to ask
// for an account, and the Governor creates accounts.
export const ACCESS_EMAIL = "ijidigroup@gmail.com";
export const SIGN_UP_HREF = `mailto:${ACCESS_EMAIL}?subject=${encodeURIComponent("IJIDI Portal account request")}`;

type EcosystemEntry = {
  /** Id in brand-assets.ts, for the approved logo and tagline. */
  brandId: string;
  name: string;
  /** Only the three public sites have a link. */
  href: string | null;
  /** Shown instead of a link. */
  note: "Coming soon" | "Governor access" | null;
  /** One-line description supplied by the Governor; else the brand tagline. */
  description?: string;
};

const ECOSYSTEM: EcosystemEntry[] = [
  { brandId: "group", name: "IJIDI Group", href: "https://www.ijidigroup.com", note: null },
  { brandId: "foundation", name: "IJIDI Foundation", href: "https://www.ijidi.org", note: null },
  { brandId: "atelier", name: "IJIDI Atelier", href: null, note: "Coming soon" },
  { brandId: "media", name: "IJIDI Media", href: null, note: "Coming soon", description: "Original by Design." },
  {
    brandId: "igx",
    name: "IGX AI",
    href: null,
    note: "Governor access",
    description: "The executive intelligence layer of the IJIDI ecosystem.",
  },
  {
    brandId: "mandela",
    name: "Mandela Onwusah",
    href: "https://www.mandelaonwusah.com",
    note: null,
    description: "Founder and governor of the IJIDI ecosystem.",
  },
];

// The top-bar dropdown lists the entities and Mandela; IGX AI is a tile only.
const DROPDOWN = ECOSYSTEM.filter((entry) => entry.brandId !== "igx");

const NAV_LINK =
  "inline-flex h-11 items-center rounded-lg px-3 font-mono text-xs uppercase tracking-[0.12em] text-foreground/85 transition-colors hover:text-foreground";

function hostOf(href: string) {
  return href.replace(/^https?:\/\//, "");
}

/** Approved tagline from brand-assets.ts, or nothing. */
function taglineOf(brandId: string): string | undefined {
  return brandById(brandId)?.tagline;
}

function EcosystemMenuItems() {
  return (
    <>
      {DROPDOWN.map((entry) =>
        entry.href ? (
          <DropdownMenuItem key={entry.brandId} asChild>
            <a href={entry.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3">
              <span>{entry.name}</span>
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem key={entry.brandId} disabled className="flex items-center justify-between gap-3">
            <span>{entry.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{entry.note}</span>
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}

const MENU_SURFACE =
  "z-[200] min-w-[240px] rounded-2xl border-border-strong bg-[rgba(18,24,38,0.92)] p-1.5 text-foreground shadow-[var(--shadow-lift)] backdrop-blur-[10px]";

export function LoginTopBar({ onSignIn }: { onSignIn: () => void }) {
  return (
    <nav
      aria-label="IJIDI"
      className="absolute right-5 top-5 z-[3] flex h-[52px] items-center sm:right-10 sm:top-8 sm:h-[68px]"
    >
      {/* Desktop: the full bar */}
      <div className="hidden items-center gap-1 lg:flex">
        <a href={HOME_URL} className={NAV_LINK}>
          Home
        </a>
        <button type="button" onClick={scrollToEcosystem} className={NAV_LINK}>
          What we do
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(NAV_LINK, "gap-1.5")}>
            Ecosystem <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={MENU_SURFACE}>
            <EcosystemMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" onClick={onSignIn} className={NAV_LINK}>
          Sign in
        </button>
        <a
          href={SIGN_UP_HREF}
          title={`Ask for an account by email (${ACCESS_EMAIL})`}
          className="ml-2 inline-flex h-11 items-center rounded-lg border border-border bg-black/25 px-4 font-mono text-xs uppercase tracking-[0.12em] text-foreground transition-colors hover:border-border-strong"
        >
          Sign up
        </a>
      </div>

      {/* Mobile and tablet: one menu button with the same items */}
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-black/25 text-foreground transition-colors hover:border-border-strong"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={MENU_SURFACE}>
            <DropdownMenuItem asChild>
              <a href={HOME_URL}>Home</a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={scrollToEcosystem}>What we do</DropdownMenuItem>
            <DropdownMenuItem onSelect={onSignIn}>Sign in</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={SIGN_UP_HREF}>Sign up (by email)</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Ecosystem
            </DropdownMenuLabel>
            <EcosystemMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

function TileBody({ entry }: { entry: EcosystemEntry }) {
  const src = brandSrc(entry.brandId);
  const tagline = entry.description ?? taglineOf(entry.brandId);
  const muted = entry.note === "Coming soon";
  return (
    <div className={cn("flex items-start gap-3", muted && "opacity-60")}>
      {src && (
        <img
          src={src}
          alt=""
          width={40}
          height={40}
          className={cn("h-10 w-10 shrink-0 rounded-full object-cover", muted && "grayscale")}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">{entry.name}</h3>
          {entry.href && (
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>
        {tagline && <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>}
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
          {entry.href ? hostOf(entry.href) : entry.note}
        </p>
      </div>
    </div>
  );
}

// Left and right columns beside the centred card; on narrower screens the
// combined grid sits under the card instead.
const LEFT = ["group", "atelier", "igx"];
const RIGHT = ["foundation", "media", "mandela"];

function Tile({ entry, index }: { entry: EcosystemEntry; index: number }) {
  return entry.href ? (
    <a
      href={entry.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-xl"
      aria-label={`${entry.name}, opens ${hostOf(entry.href)} in a new tab`}
    >
      <GlassCard index={index} className="h-full">
        <TileBody entry={entry} />
      </GlassCard>
    </a>
  ) : (
    <GlassCard index={index} className="h-full hover:border-border">
      <TileBody entry={entry} />
    </GlassCard>
  );
}

export function EcosystemColumn({ side, className }: { side: "left" | "right"; className?: string }) {
  const ids = side === "left" ? LEFT : RIGHT;
  const entries = ids.map((id) => ECOSYSTEM.find((e) => e.brandId === id)).filter((e): e is EcosystemEntry => !!e);
  return (
    <ul
      aria-label={side === "left" ? "The IJIDI Ecosystem" : undefined}
      data-ecosystem={side === "left" ? "" : undefined}
      className={cn("flex w-full flex-col gap-3", className)}
    >
      {entries.map((entry, i) => (
        <li key={entry.brandId}>
          <Tile entry={entry} index={i + (side === "right" ? 3 : 0)} />
        </li>
      ))}
    </ul>
  );
}

export function EcosystemGrid({ className }: { className?: string }) {
  return (
    <section aria-labelledby="ijidi-ecosystem-heading" data-ecosystem="" className={cn("w-full max-w-[520px]", className)}>
      <h2
        id="ijidi-ecosystem-heading"
        className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
      >
        The IJIDI Ecosystem
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ECOSYSTEM.map((entry, i) => (
          <li key={entry.brandId}>
            <Tile entry={entry} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
