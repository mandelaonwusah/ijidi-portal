// Shortcuts sheet, opened with "?" when focus is not in a text field (DESIGN.md §6).
// Lists every keyboard shortcut that actually exists in the portal.
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Kbd, ModCombo } from "@/components/portal-ui";

const ROWS: { keys: ReactNode; label: string; where: string }[] = [
  { keys: <ModCombo k="K" />, label: "Open the command palette", where: "Everywhere" },
  { keys: <ModCombo k="J" />, label: "Open IGX AI", where: "Everywhere" },
  { keys: <Kbd>?</Kbd>, label: "Show this list", where: "Outside text fields" },
  { keys: <Kbd>Esc</Kbd>, label: "Close a dialog, the palette or the menu", where: "Everywhere" },
  { keys: <Kbd>Enter</Kbd>, label: "Send the instruction", where: "IGX AI chat" },
  {
    keys: (
      <span className="inline-flex items-center gap-1">
        <Kbd>Shift</Kbd>
        <Kbd>Enter</Kbd>
      </span>
    ),
    label: "New line",
    where: "IGX AI chat",
  },
];

export function ShortcutsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-border-strong bg-[rgba(18,24,38,0.92)] text-foreground shadow-[var(--shadow-lift)] backdrop-blur-[10px] sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="font-sans text-lg font-semibold text-foreground">Keyboard shortcuts</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Every shortcut the portal has today.
          </SheetDescription>
        </SheetHeader>
        <dl className="mt-6 divide-y divide-border">
          {ROWS.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <dt className="text-sm text-foreground">{row.label}</dt>
                <dd className="font-mono text-xs text-muted-foreground">{row.where}</dd>
              </div>
              <div className="shrink-0">{row.keys}</div>
            </div>
          ))}
        </dl>
      </SheetContent>
    </Sheet>
  );
}
