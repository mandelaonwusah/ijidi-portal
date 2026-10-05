// Command palette (Ctrl/⌘ + K), DESIGN.md §6. Four groups, in order:
//   Navigate  the pages in navItems
//   Actions   new IGX AI chat, review proposals, open settings, sign out (with confirm)
//   Entities  one row per entity_status row; "—" and NOT CONNECTED if the query fails
//   Recent    pages visited this session (the route trail in __root.tsx; no new storage)
// Each row: icon · label · muted detail · keycap hint at the right. Keycap hints
// show only shortcuts that really exist.
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Cog, FileCheck2, LogOut, MessageSquarePlus, Network } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd, ModCombo, declaredLabel } from "@/components/portal-ui";
import { navItems } from "@/lib/portal-data";
import { sounds } from "@/lib/sound-engine";
import { supabase } from "@/lib/supabase";

/** Fired after opening IGX AI from the palette; the IGX AI page starts a new chat. */
export const IGX_NEW_CHAT_EVENT = "igx:new-chat";

type EntityRow = { entity_name: string | null; current_state: string | null };

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function Row({
  icon,
  label,
  detail,
  hint,
}: {
  icon: ReactNode;
  label: string;
  detail?: string | undefined;
  hint?: ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border font-mono text-xs text-muted-foreground"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
      {detail && (
        <span className="hidden truncate font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground sm:inline">
          {detail}
        </span>
      )}
      {hint && <span className="ml-2 shrink-0">{hint}</span>}
    </>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  recentPaths,
  pathLabel,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Most recent first, current page excluded. */
  recentPaths: string[];
  pathLabel: (path: string) => string;
  /** Opens the sign-out confirm; the palette never signs out directly. */
  onSignOut: () => void;
}) {
  const navigate = useNavigate();

  const entities = useQuery({
    queryKey: ["palette-entity-status"],
    enabled: open,
    retry: 1,
    staleTime: 60_000,
    queryFn: async (): Promise<EntityRow[]> => {
      const { data, error } = await supabase.from("entity_status").select("entity_name, current_state");
      if (error) throw error;
      return (data ?? []) as EntityRow[];
    },
  });

  const run = (action: () => void) => {
    sounds.playClick();
    onOpenChange(false);
    action();
  };
  const go = (to: string) => run(() => void navigate({ to }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-2xl border-border-strong bg-[rgba(18,24,38,0.92)] p-0 text-foreground shadow-[var(--shadow-lift)] backdrop-blur-[10px] sm:rounded-2xl">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search pages, actions, entities and recent pages.
        </DialogDescription>
        <Command className="bg-transparent [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input-wrapper]]:border-border [&_[cmdk-input]]:h-12 [&_[cmdk-input]]:text-base [&_[cmdk-item]]:gap-3 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item][data-selected=true]]:bg-white/[0.06]">
          <CommandInput placeholder="Search pages, actions and entities…" />
          <CommandList className="max-h-[min(440px,60vh)] px-1 pb-2">
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              Nothing matches.
            </CommandEmpty>

            <CommandGroup heading="Navigate">
              {navItems.map((item) => (
                <CommandItem key={item.to} value={`navigate ${item.label}`} onSelect={() => go(item.to)}>
                  <Row
                    icon={item.icon}
                    label={item.label}
                    detail={titleCase(item.group)}
                    hint={item.to === "/igx-ai" ? <ModCombo k="J" /> : undefined}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Actions">
              <CommandItem
                value="action new igx ai chat"
                onSelect={() =>
                  run(() => {
                    void navigate({ to: "/igx-ai" }).then(() =>
                      window.dispatchEvent(new Event(IGX_NEW_CHAT_EVENT)),
                    );
                  })
                }
              >
                <Row icon={<MessageSquarePlus className="h-3.5 w-3.5" />} label="New IGX AI chat" />
              </CommandItem>
              <CommandItem value="action review proposals" onSelect={() => go("/proposals")}>
                <Row icon={<FileCheck2 className="h-3.5 w-3.5" />} label="Review proposals" />
              </CommandItem>
              <CommandItem value="action open settings identity" onSelect={() => go("/settings")}>
                <Row icon={<Cog className="h-3.5 w-3.5" />} label="Open settings" />
              </CommandItem>
              <CommandItem value="action sign out" onSelect={() => run(onSignOut)}>
                <Row icon={<LogOut className="h-3.5 w-3.5" />} label="Sign out" detail="Asks first" />
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Entities">
              {entities.isLoading ? (
                <CommandItem value="entities checking" disabled>
                  <Row icon={<Network className="h-3.5 w-3.5" />} label="Checking…" />
                </CommandItem>
              ) : entities.isError ? (
                <CommandItem value="entities not connected" disabled>
                  <Row icon={<Network className="h-3.5 w-3.5" />} label="—" detail="Not connected" />
                </CommandItem>
              ) : (entities.data ?? []).length === 0 ? (
                <CommandItem value="entities none recorded" disabled>
                  <Row icon={<Network className="h-3.5 w-3.5" />} label="No entities recorded yet." />
                </CommandItem>
              ) : (
                (entities.data ?? []).map((row, i) => {
                  const name = row.entity_name?.trim() || "Unnamed entity";
                  const state = row.current_state?.trim();
                  return (
                    <CommandItem
                      key={`${name}-${i}`}
                      value={`entity ${name}`}
                      onSelect={() => go("/ecosystem")}
                    >
                      <Row
                        icon={<Network className="h-3.5 w-3.5" />}
                        label={name}
                        detail={state ? declaredLabel(state) : "Not tracked"}
                      />
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>

            {recentPaths.length > 0 && (
              <CommandGroup heading="Recent">
                {recentPaths.map((path) => (
                  <CommandItem key={path} value={`recent ${pathLabel(path)} ${path}`} onSelect={() => go(path)}>
                    <Row icon={<Clock className="h-3.5 w-3.5" />} label={pathLabel(path)} detail={path} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 font-mono text-xs text-muted-foreground">
            <span>Enter to open · Esc to close</span>
            <span className="inline-flex items-center gap-1.5">
              Shortcuts <Kbd>?</Kbd>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
