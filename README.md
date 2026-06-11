# vantage-mosaic

Fleet-wide MCP UI design system for VantageOS. Zod-validated, taxonomy-organized (6 categories: progress, input, display, artifacts, confirmation, media), registry-gated, streaming-hydration ready, **cross-runtime React 19 + Preact 10**. Bilingual FR+EN by design. Built for MCP Apps (SEP-1865 extension) and consumed across ElPi Corp BUs (Sigma, Theta, Mu, Chi, Athena, Hermes, Demeter).

## CI gates (v0.3.x pre-ship)

Three gates enforce the v0.2.0 architecture:
- **Gate 1** Cross-runtime build parity — `scripts/verify-build-parity.sh`
- **Gate 2** PeerDeps optionality smoke — `e2e/peer-resolution/run-smoke.sh`
- **Gate 3** Coherence dedicated — `pnpm --filter @vantageos/mosaic-tokens test`

See [Standard v1.2 §20](https://github.com/elpiarthera/ElPi-Corp/blob/main/resources/references/mosaic-architecture-standard-v1.md#20-ci-gates-v03x-pre-ship-infrastructure).

## Packages

| Package | Latest | Surface |
|---|---|---|
| [`@vantageos/mosaic`](https://www.npmjs.com/package/@vantageos/mosaic) | `0.2.0` | Components + server + subpath exports per runtime |
| [`@vantageos/mosaic-tokens`](https://www.npmjs.com/package/@vantageos/mosaic-tokens) | `0.2.0` | Framework-free design tokens (CSS + JS + Tailwind v4 plugin) |

## Install

```sh
# React 19 consumers
npm install @vantageos/mosaic@^0.2.0 @vantageos/mosaic-tokens@^0.2.0 react react-dom

# Preact 10 consumers (Mu vantage-bridge iframe, Chi gptpowerups)
npm install @vantageos/mosaic@^0.2.0 @vantageos/mosaic-tokens@^0.2.0 preact
```

## Usage

```ts
// React 19 — explicit runtime opt-in (recommended v0.2.0+)
import { ProgressBar } from "@vantageos/mosaic/react/progress";

// Preact 10 — same components, preact/compat alias at build time
import { ProgressBar } from "@vantageos/mosaic/preact/progress";

// Design tokens — CSS surface
import "@vantageos/mosaic-tokens/css";

// Design tokens — JS surface
import { tokens, colors, spacing } from "@vantageos/mosaic-tokens";

// Tailwind v4 plugin
import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind";
```

Back-compat: v0.1.x root subpaths (`@vantageos/mosaic/progress`, `/input`, `/display`, `/artifacts`, `/confirmation`, `/media`) are preserved verbatim through v0.x.

## Architecture

See [Cross-Runtime Support standard §18](https://github.com/elpiarthera/ElPi-Corp/blob/main/resources/references/mosaic-architecture-standard-v1.md#18-cross-runtime-support-v020-amendment) for the A1 architecture documenting:
- Single source-of-truth schemas + logic (`.schema.ts`, `.logic.ts`)
- Runtime-specific JSX layers (`runtimes/{react,preact}/components/<cat>/`)
- tsup three sibling configs (react pass + preact pass with `preact/compat` esbuild alias + tokens re-export)
- PeerDependencies all optional via `peerDependenciesMeta`

## Layout

Monorepo: pnpm workspace + turbo.

- `packages/mosaic` — components + server + runtime subpaths
- `packages/mosaic-tokens` — framework-free design tokens

## Status

`v0.2.0` LIVE on npm — cross-runtime React + Preact + tokens shipped. Mission `k574hnee3vj2vg6hhchgmahwx587wsth` complete.

Next: `v0.3.0` populates runtime trees with full component matrix per consumer demand scan + adds `forms` subpath (Wrapper around react-hook-form + zodResolver).

## Brief memory

- VP memory: `j579e74vxv566a10readet4zch87xxv9`
- Standard: `resources/references/mosaic-architecture-standard-v1.md` (v1.1)
