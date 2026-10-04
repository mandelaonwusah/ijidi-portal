// Toasts replace alert() everywhere (DESIGN.md §6 "Feedback: toasts, not alerts").
// Mounted once in __root.tsx. Overlay surface (DESIGN.md §5 level 4); error toasts
// use the error state and say what failed and why, in plain words.
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-border-strong group-[.toaster]:bg-[rgba(18,24,38,0.92)] group-[.toaster]:text-foreground group-[.toaster]:shadow-[var(--shadow-lift)] group-[.toaster]:font-sans group-[.toaster]:text-sm",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          error:
            "group-[.toaster]:border-[rgba(229,103,122,0.35)] group-[.toaster]:[&_[data-icon]]:text-destructive group-[.toaster]:[&_[data-title]]:text-destructive",
          success: "group-[.toaster]:[&_[data-icon]]:text-blue-light",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
