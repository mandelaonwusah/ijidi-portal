import { createFileRoute, redirect } from "@tanstack/react-router";

// /console has been folded into the Command Center. Old links and bookmarks
// land on "/" instead of a separate full-screen page.
export const Route = createFileRoute("/console")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
