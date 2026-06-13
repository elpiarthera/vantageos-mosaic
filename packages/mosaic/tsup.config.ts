import { type Options, defineConfig } from "tsup";

// esbuild's `Plugin` type, derived from tsup's own `Options` so we don't need
// `esbuild` as a direct devDependency (it is only a transitive dep of tsup and
// is therefore not type-resolvable from this config under `tsc --noEmit`).
type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

/**
 * esbuild plugin — rewrite EVERY `react*` specifier to its preact equivalent
 * for the preact runtime pass, and mark the result external.
 *
 * Why a plugin and not `esbuildOptions.alias`:
 * tsup auto-externalises all `dependencies` + `peerDependencies` BEFORE the
 * alias map is consulted. `react`, `react-dom` and (critically) the automatic
 * JSX runtime import `react/jsx-runtime` are peerDeps, so esbuild externalised
 * them verbatim and the alias never fired. The preact bundles that re-export a
 * shared React implementation (progress/input/confirmation/forms) therefore
 * shipped `import … from "react/jsx-runtime"` + `import … from "react"`.
 *
 * Consequence (Gate 2 peerDeps-optionality bug): a react-only consumer HAS
 * react installed, so `@vantageos/mosaic/preact/*` resolved successfully even
 * though preact was absent — optionality broken. An `onResolve` hook runs
 * regardless of auto-externalisation, so it deterministically maps:
 *   react                 → preact/compat
 *   react-dom             → preact/compat
 *   react-dom/client      → preact/compat/client
 *   react/jsx-runtime     → preact/jsx-runtime
 *   react/jsx-dev-runtime → preact/jsx-runtime   (preact has no dev runtime)
 * and keeps them external so the preact bundles import ONLY preact specifiers.
 * Result: a react-only consumer (no preact) can no longer resolve any
 * /preact/* subpath, and symmetrically the react pass never references preact.
 */
const reactToPreact: EsbuildPlugin = {
  name: "mosaic-react-to-preact",
  setup(build) {
    const map: Record<string, string> = {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react-dom/client": "preact/compat/client",
      "react/jsx-runtime": "preact/jsx-runtime",
      "react/jsx-dev-runtime": "preact/jsx-runtime",
    };
    // Match the react family exactly (including the jsx runtimes) so nothing
    // slips through. Anchored regex avoids rewriting e.g. `react-i18next`.
    build.onResolve(
      { filter: /^react(-dom)?(\/(client|jsx-runtime|jsx-dev-runtime))?$/ },
      (args) => {
        const replacement = map[args.path];
        if (!replacement) return undefined;
        return { path: replacement, external: true };
      },
    );
  },
};

/**
 * Multi-runtime tsup configuration (v0.2.0 — T3-A).
 *
 * Strategy: three sibling configs returned as an array (tsup runs them
 * sequentially, each with its own output rules).
 *
 *   1. **Legacy / React pass** — preserves v0.1.2 root entries (back-compat)
 *      AND adds the new `runtimes/react/<cat>` subpath entries. ESM + CJS.
 *      `react`, `react-dom` and friends are externalised (consumer-provided).
 *
 *   2. **Preact pass** — `runtimes/preact/<cat>` entries only, ESM-only.
 *      `esbuildOptions.alias` rewrites `react` → `preact/compat` and
 *      `react-dom` → `preact/compat` at build time. This lets shared
 *      .schema.ts / .logic.ts files (no JSX) ship verbatim, while any
 *      JSX in the preact runtime tree resolves hook imports through compat.
 *      Per spec §1.4 + §18.1.
 *
 *   3. **Tokens re-export pass** — convenience `dist/tokens.js` shim that
 *      re-exports from `@vantageos/mosaic-tokens` so consumers can
 *      `import { tokens } from "@vantageos/mosaic/tokens"`. Skeleton only
 *      until T3-B implements the upstream tokens package.
 *
 * Empty runtime barrels (`export {}`) compile to empty bundles cleanly.
 * Drift gate walks `src/components/**` only — runtime tree is invisible to it.
 */

const REACT_EXTERNAL = [
  "react",
  "react-dom",
  "react-dom/client",
  "react-i18next",
  "react-hook-form",
  "@hookform/resolvers",
  "@hookform/resolvers/zod",
  "@mcp-ui/client",
  "rxjs",
];

const PREACT_EXTERNAL = [
  "preact",
  "preact/hooks",
  "preact/jsx-runtime",
  "preact/compat",
  "preact/compat/client",
  "react-i18next",
  "react-hook-form",
  "@hookform/resolvers",
  "@hookform/resolvers/zod",
  "@mcp-ui/client",
  "rxjs",
];

const reactPass: Options = {
  entry: {
    // v0.1.2 back-compat root entries — preserved verbatim
    index: "src/index.ts",
    progress: "src/components/progress/index.ts",
    input: "src/components/input/index.ts",
    display: "src/components/display/index.ts",
    artifacts: "src/components/artifacts/index.ts",
    confirmation: "src/components/confirmation/index.ts",
    media: "src/components/media/index.ts",
    forms: "src/components/forms/index.ts",
    server: "src/server/create-mosaic-resource.ts",
    // v0.2.0 react runtime subpaths
    "react/index": "src/runtimes/react/index.ts",
    "react/progress": "src/runtimes/react/components/progress/index.ts",
    "react/input": "src/runtimes/react/components/input/index.ts",
    "react/display": "src/runtimes/react/components/display/index.ts",
    "react/artifacts": "src/runtimes/react/components/artifacts/index.ts",
    "react/confirmation": "src/runtimes/react/components/confirmation/index.ts",
    "react/media": "src/runtimes/react/components/media/index.ts",
    "react/forms": "src/runtimes/react/components/forms/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // v0.2.2 fix: `clean: true` here races with sibling passes (preact + tokens)
  // when tsup runs them in parallel. The react DTS pass finishes last (~35s)
  // and previously wiped `dist/preact/*.d.ts` + `dist/tokens.d.ts` written
  // by the earlier passes. Pre-build cleaning is now handled by the
  // `prebuild` script in package.json (`rimraf dist`). See §18.5 contract.
  clean: false,
  treeshake: true,
  splitting: false,
  external: REACT_EXTERNAL,
};

const preactPass: Options = {
  entry: {
    "preact/index": "src/runtimes/preact/index.ts",
    "preact/progress": "src/runtimes/preact/components/progress/index.ts",
    "preact/input": "src/runtimes/preact/components/input/index.ts",
    "preact/display": "src/runtimes/preact/components/display/index.ts",
    "preact/artifacts": "src/runtimes/preact/components/artifacts/index.ts",
    "preact/confirmation": "src/runtimes/preact/components/confirmation/index.ts",
    "preact/media": "src/runtimes/preact/components/media/index.ts",
    "preact/forms": "src/runtimes/preact/components/forms/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  // Do NOT clean — would wipe the react pass output
  clean: false,
  treeshake: true,
  splitting: false,
  external: PREACT_EXTERNAL,
  // `noExternal` makes tsup's own `external` onResolve plugin RETURN UNDEFINED
  // for the react family (instead of externalising them verbatim), letting the
  // `reactToPreact` plugin below intercept and rewrite them to preact. Without
  // this, tsup externalises `react` / `react/jsx-runtime` first (peerDeps are
  // auto-external) and our rewrite never runs — that was the Gate 2 bug.
  noExternal: [/^react($|-dom|\/jsx-runtime|\/jsx-dev-runtime|-dom\/client)/],
  // onResolve plugin (not esbuildOptions.alias): runs AFTER tsup's external
  // plugin returns undefined for the react family, deterministically mapping
  // every react specifier to its preact equivalent + marking it external.
  esbuildPlugins: [reactToPreact],
};

const tokensReexportPass: Options = {
  entry: {
    tokens: "src/tokens-reexport.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  splitting: false,
  external: ["@vantageos/mosaic-tokens"],
};

export default defineConfig([reactPass, preactPass, tokensReexportPass]);
