import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Build of the single-file config view -> dist/config-view.html (App standard A-2: HTML + JS +
 * CSS in ONE file, no network). The shared components are cross-runtime; this bundle runs them on
 * Preact 10 (react / react-dom aliased to preact/compat) to stay far below the 250 KB gz budget.
 * `pnpm run build` runs it after tsup; `scripts/check-config-view-bundle.mjs` measures the result.
 */
const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "package.json"), "utf8")) as {
  version: string;
};

export default defineConfig({
  root: resolve(import.meta.dirname, "src/config-view"),
  plugins: [viteSingleFile()],
  resolve: {
    alias: [
      { find: /^react-dom\/client$/, replacement: "preact/compat/client" },
      { find: /^react-dom$/, replacement: "preact/compat" },
      { find: /^react\/jsx-(dev-)?runtime$/, replacement: "preact/jsx-runtime" },
      { find: /^react$/, replacement: "preact/compat" },
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    __MOSAIC_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    // tsup owns dist/ and cleans it first (`prebuild`); this build only adds its one file.
    emptyOutDir: false,
    target: "es2022",
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rollupOptions: { input: resolve(import.meta.dirname, "src/config-view/config-view.html") },
  },
});
