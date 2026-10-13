# vantage-mosaic

Fleet-wide MCP UI design system for VantageOS. Zod-validated, taxonomy-organized (6 categories: progress, input, display, artifacts, confirmation, media), registry-gated, streaming-hydration ready, **cross-runtime React 19 + Preact 10**. Bilingual FR+EN by design. Built for MCP Apps (SEP-1865 extension) and consumed across ElPi Corp BUs (Sigma, Theta, Mu, Chi, Athena, Hermes, Demeter).

## CI gates (v0.3.x pre-ship)

Five gates enforce the v0.2.0 architecture, each a job in `.github/workflows/ci.yml`:
- **Gate 1** Cross-runtime build parity — `scripts/verify-build-parity.sh`
- **Gate 2** PeerDeps optionality smoke — `e2e/peer-resolution/run-smoke.sh`
- **Gate 3** Coherence dedicated — `pnpm --filter @vantageos/mosaic-tokens test`
- **Gate 4** Cross-runtime subpath coverage — `packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py --ga-mode`
- **Gate 5** Tarball-cited paths — `packages/mosaic-tokens/scripts/tarball-cited-paths-guard.mjs`

The `ci` job also carries inline gates that have no script file of their own: `tsc --noEmit` over the whole workspace (`pnpm -r exec tsc --noEmit`), whole-repo `biome check --error-on-warnings .`, the `@vantageos/mosaic` Vitest suite with coverage thresholds, the `size-limit` budget, `packages/mosaic/scripts/mosaic-registry-drift-check.mjs`, the Playwright + axe a11y specs (`tests/a11y/`), and the Storybook test-runner (`test-storybook` against a served static build).

**GitHub Actions is off on this repository**, so none of the above runs on its own. `pnpm gate:local` runs them all: it reads `.github/workflows/ci.yml` at run time and executes its `run:` steps in order, per job (list derived from the YAML, never retyped). See [Delivering a PR with Actions off](#delivering-a-pr-with-actions-off).

See [Standard v1.2 §20](https://github.com/elpiarthera/ElPi-Corp/blob/main/resources/references/mosaic-architecture-standard-v1.md#20-ci-gates-v03x-pre-ship-infrastructure).

## Delivering a PR with Actions off

Actions is off, so no check runs on a push and no PR can show "CI green". The formal gate is the **author's full local run** plus the **reviewer's rerun on a fresh clone**.

**Author, before requesting review:**

1. `pnpm install --frozen-lockfile`, then `pnpm gate:local`. Steps that cannot run locally are **skipped with a printed reason**, never silently. The rules live in one place, `SKIP_RULES` / `JOB_SKIP_RULES` in `scripts/gate-local.mjs`:
   - `uses:` actions (checkout, pnpm/setup, setup-node) — runner provisioning;
   - the whole `npm-publish` job (publish, and the Eta gate that needs `secrets.*`) — it runs on a release tag only;
   - the Playwright install step (`--with-deps` needs root), and the two steps that drive Chromium (`playwright-axe`, `storybook-test`). Pass `--install-browsers` to run all three: the install then runs *without* `--with-deps`, so the OS libraries Chromium needs must already be on the host.
2. Exit code: `0` = every step that ran passed; `1` = a step that ran failed; `2` = the workflow holds a construct the runner cannot interpret (an unknown key, a multi-value matrix, a non-bash shell, an `if:` it cannot evaluate), named in the message.
3. Paste the summary line in the PR body, with the skipped list and any named failure:

   ```
   gate:local — N run / M total, K skipped, F failed
   ```

   Other options: `--list` prints the plan and runs nothing; `--workflow <file>` uses another workflow file; `--base <ref>` sets the base for event emulation (default `origin/main`).

**Reviewer, on a fresh clone of the PR head:** rerun `pnpm install --frozen-lockfile` and `pnpm gate:local` (with `--install-browsers` when the a11y and Storybook gates matter to the diff). The author's pasted output is a claim; the reviewer's rerun is the gate.

**"CI green" is never claimed while Actions is off.** Say "`gate:local` N run / M total, F failed" and name what was skipped.

A run executes the steps for real, including the builds and the Storybook build, and writes the same files CI would (`dist/`, `storybook-static/`): run it on a clean worktree. The runner is proven by `bash scripts/tests/probe-gate-local.sh` (a failing step, each kind of uninterpretable construct, a step appended to a copy of `ci.yml`, the skip rules).

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
