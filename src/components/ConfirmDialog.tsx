// A confirm step before a destructive action (DESIGN.md §6 "Confirm step"):
// reject a proposal, revoke, sign out. Built on the existing AlertDialog.
// The overlay surface is DESIGN.md §5 level 4; the confirm button is the filled
// danger button, the cancel button is secondary.
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonKind } from "@/components/portal-ui";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
}: {
  /** The button that opens the dialog (rendered as-is). Leave out when opened from code. */
  trigger?: ReactNode;
  /** Controlled open state, for a dialog opened from code (e.g. the command palette). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog {...(open !== undefined ? { open } : {})} {...(onOpenChange ? { onOpenChange } : {})}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="rounded-2xl border-border-strong bg-[rgba(18,24,38,0.92)] text-foreground shadow-[var(--shadow-lift)] backdrop-blur-[10px] sm:rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-sans text-lg font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className={cn(buttonKind.secondary, "mt-0 h-auto")}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction className={cn(buttonKind.dangerSolid, "h-auto")} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
