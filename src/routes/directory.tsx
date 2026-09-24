import { createFileRoute, redirect } from "@tanstack/react-router";

// The Directory now lives inside Ecosystem & Directory. Old links and bookmarks still work.
export const Route = createFileRoute("/directory")({
  beforeLoad: () => {
    throw redirect({ to: "/ecosystem" });
  },
});
