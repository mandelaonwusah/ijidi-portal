// Plain Vite config for the IJIDI Portal (TanStack Start + Nitro).
//
// This replaces @lovable.dev/vite-tanstack-config. It keeps everything that
// wrapper did outside the Lovable sandbox: Tailwind, tsconfig paths, TanStack
// Start (with the server-only import guard and our SSR entry), Nitro for the
// build (Vercel is detected automatically; Cloudflare is the fallback when no
// host is detected), React, the lightningcss CSS transformer, the @ alias,
// React/TanStack Query de-duplication, and the dev server on port 8080.
// VITE_* variables reach the app through Vite's own import.meta.env.
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// The real commit this build was made from, for the footer build tag
// (DESIGN.md §6). Vercel provides VERCEL_GIT_COMMIT_SHA at build time; a local
// build falls back to git. If neither is available the tag is left out, never faked.
function readBuildCommit(): string | null {
  const fromVercel = process.env["VERCEL_GIT_COMMIT_SHA"]?.trim();
  if (fromVercel) return fromVercel.slice(0, 7);
  try {
    const fromGit = execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return /^[0-9a-f]{7}$/.test(fromGit) ? fromGit : null;
  } catch {
    return null;
  }
}

export default defineConfig(({ command }) => {
  const buildCommit = readBuildCommit();
  if (command === "build") {
    console.log(`[ijidi] build tag: ${buildCommit ?? "not available"}`);
  }

  return {
    define: {
      __BUILD_COMMIT__: JSON.stringify(buildCommit),
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Files under a server/ folder, and the "server-only" package, must never
        // end up in the browser bundle.
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
        // Use src/server.ts (our SSR error wrapper) as the server entry; Nitro builds from it.
        server: { entry: "server" },
      }),
      ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
      viteReact(),
    ],
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: { host: "::", port: 8080 },
  };
});
