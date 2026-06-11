# Changelog

All notable changes to `@vantageos/mosaic` and `@vantageos/mosaic-tokens` are documented here.

## v0.3.0-alpha.1 — 2026-06-11

### Added — `forms` category (NEW 7th top-level category, Wave 2 T10)
- **New category** `forms` introduced as the 7th top-level taxonomy bucket per `docs/v0.3.0-plan.md` §4 + mosaic-architecture-standard-v1.x amendment (forthcoming v1.2). Sits alongside `progress | input | display | artifacts | confirmation | media`.
- **5 scaffold primitives** wrapping `react-hook-form` + `@hookform/resolvers/zod`:
  - `useMosaicForm({ schema, defaultValues, mode? })` — cross-runtime hook. Returns RHF `UseFormReturn` extended with `mosaicSchema` + `mosaicMode` metadata. FieldArray-compatible (T16).
  - `FormProvider` — wraps RHF's native `FormProvider` AND a Mosaic-specific context exposing the extended return. `useMosaicFormContext()` throws if used outside.
  - `FormField` — render-prop wrapper around RHF's `Controller`. Reads `control` from the surrounding `FormProvider`.
  - `ErrorDisplay` — single-field error formatter. Renders nothing when no error. Priority: explicit `error.message` → `messageMap[type]` → generic fallback ("Invalid value"). Emits `role="alert"`.
  - `SubmitButton` — bound to the surrounding `FormProvider`. Disabled while `formState.isValid` is false OR `formState.isSubmitting` is true. Loading label swaps in during submit. `aria-busy` toggles.
- **Validation timing**: default `mode = "onBlur"` (Chi co-validated decision, Day 102 DM `jn72twbrdx67ajbqk6vgrrx8jn88ff3g`). Consumers may override to `"onChange"` or `"onSubmit"`.
- **Cross-runtime parity**: identical JSX shipped for React 19 (`@vantageos/mosaic/react/forms`) and Preact 10 (`@vantageos/mosaic/preact/forms`). Preact pass aliases `react`/`react-dom` to `preact/compat` at tsup build time per Standard §18.2.
- **Back-compat root subpath**: `@vantageos/mosaic/forms` re-exports the React surface for v0.1.x-style category imports.
- **Shared schema + logic layer** (`src/components/forms/`): `useMosaicForm.schema.ts`, `useMosaicForm.logic.ts`, `FormProvider.schema.ts`, `FormProvider.logic.ts`, `FormField.schema.ts`, `FormField.logic.ts`, `ErrorDisplay.schema.ts`, `ErrorDisplay.logic.ts`, `SubmitButton.schema.ts`, `SubmitButton.logic.ts`. Runtime-agnostic Zod schemas + pure functions (validation timing mapping, error formatting, submit button state machine).

### Added — `package.json` peer dependencies
- `react-hook-form: ^7.54.0` (optional per `peerDependenciesMeta`).
- `@hookform/resolvers: ^3.10.0` (optional per `peerDependenciesMeta`).
- Both externalised in `tsup.config.ts` react + preact passes — never bundled.

### Added — `registry.yaml` entries
- 5 new entries under category `forms`: `useMosaicForm`, `FormProvider`, `FormField`, `ErrorDisplay`, `SubmitButton`. Size limits per entry.

### Added — exports surface
- `./forms` (root, back-compat) + `./react/forms` + `./preact/forms` subpaths. Types-first export ordering applied across the entire `exports` field (fixes esbuild WARN about condition order).

### Added — Storybook
- 5 story files under `src/components/forms/*.stories.tsx` documenting each primitive with at least one canonical state. `Forms/useMosaicForm`, `Forms/FormProvider`, `Forms/FormField`, `Forms/ErrorDisplay`, `Forms/SubmitButton`.

### Added — tests (TDD RED→GREEN)
- 5 React test files under `src/components/forms/__tests__/` covering Zod schema parsing, hook integration with zodResolver, FormProvider context, FormField render-prop + onBlur timing assertion (validation does NOT fire on keystroke, FIRES on blur), ErrorDisplay priority logic, SubmitButton state machine. Real Zod schemas in tests, not mocked.
- 5 Preact parity smoke tests under `src/runtimes/preact/components/forms/__tests__/` verifying module-import shape parity with the React runtime. JSX runs via React testing library because vitest does not apply the preact/compat alias (alias is build-time-only). State-machine + formatter logic shared by reference across both runtimes via the `src/components/forms/*.logic.ts` files.

### Added — vitest config
- `testTimeout: 15_000` raised from default 5s. Forms tests pay a 1-2s RHF/zodResolver boot cost on the first test of each file inside the slow jsdom + transform pipeline.

### Added — tsup config
- Forms entries in both react + preact passes. `REACT_EXTERNAL` and `PREACT_EXTERNAL` arrays now include `react-hook-form` + `@hookform/resolvers` + `@hookform/resolvers/zod`.

### Added — `Checkbox` field primitive (T14)
- **`Checkbox`** (`src/components/forms/Checkbox.{schema,logic}.ts` + `runtimes/{react,preact}/components/forms/Checkbox.tsx`) — boolean checkbox primitive with indeterminate state:
  - `indeterminate=true` → sets DOM `.indeterminate = true` via `useRef` + `useEffect` AND `aria-checked="mixed"`. Controlled externally.
  - `description` prop — rendered in a `<span>` and wired to `aria-describedby` alongside the error ID when both are present.
  - `aria-invalid` + `aria-describedby` (error ID) emitted when field has a validation error (onBlur timing per Mosaic doctrine).
  - Shared pure logic: `resolveAriaChecked(checked, indeterminate)` + `resolveDescribedBy(descriptionId, description, hasError, errorId)` in `Checkbox.logic.ts` — no DOM, no framework imports, identical contract for both runtimes.
  - React runtime at `@vantageos/mosaic/react/forms`, Preact runtime at `@vantageos/mosaic/preact/forms`.
  - Back-compat root re-export at `@vantageos/mosaic/forms`.
  - `Checkbox.stories.tsx` — 4 stories: Unchecked, Checked, Indeterminate, WithDescription.
  - `registry.yaml` — Checkbox entry added under `forms` category (`sizeLimit: "10KB"`, `a11yLevel: WCAG-AA`).
  - TDD: schema + logic + runtime tests in `__tests__/Checkbox.test.tsx` (React) and `runtimes/preact/.../forms/__tests__/Checkbox.test.tsx` (parity smoke).
- **Mission**: Wave 2 T14 — task ID `k17f4ym72rzm2y4n003n5rp39n88f7qh` (mission `k57aavem8ye9k1ndkkpzrh52cn87w6kp`).

### Why minor-alpha bump
Strict additive: introduces a new top-level subpath and an optional peer set. No breaking change to v0.2.x consumers (root + react + preact existing subpaths untouched). Pre-release tag `alpha.1` while T11-T20 field primitives are produced.

### Mission
Wave 2 T10 — task ID `k1728w4hs4y69zzt05sb9815jh88fh52` (mission `k57aavem8ye9k1ndkkpzrh52cn87w6kp`). DOCTRINE 4 RULES NON-NEGOTIABLE applied (TDD, docs, no bypass, task-structure).

---

## v0.2.2 — 2026-06-11

### Fixed (CRITICAL — §18.5 type surface contract)
- `tsup.config.ts` react pass — change `clean: true` → `clean: false`. The three sibling tsup configs (react / preact / tokens re-export) run their DTS phases in parallel; the react DTS pass finishes last (~35s on cold cache) and previously wiped `dist/preact/*.d.ts` and `dist/tokens.d.ts` written earlier by the sibling passes. Result on v0.2.0+v0.2.1: tsup log claimed all DTS files emitted, but only the react pass output persisted on disk — every other DTS file was silently deleted.
- `package.json` — add `prebuild` script (`node -e "fs.rmSync('dist',{recursive:true,force:true})"`) so a clean dist is guaranteed before tsup runs, replacing the racy in-pass clean.
- **Result**: `dist/preact/{index,progress,input,display,artifacts,confirmation,media}.d.ts` and `dist/tokens.d.ts` now persist on disk. Preact consumers regain typed `@vantageos/mosaic/preact/*` imports (IntelliSense + compile-time validation). `@vantageos/mosaic/tokens` is typed. Includes the v0.2.1 `onRowClick` prop in the typed surface.

### Note on `peer/compat` externalization (§18.4)
- The `PREACT_EXTERNAL` array on `main` already includes `preact`, `preact/compat`, `preact/hooks`, `preact/compat/client`. No change required to externals — peerDependenciesMeta optionality contract was already structurally honored at the config level. The Gate 2 failure on PR #13 was a downstream effect of the missing DTS files (no `.d.ts` → consumer fixtures could not type-check imports correctly, which the smoke harness conflated with bundling). Gate 2 should re-run green once v0.2.2 is published.

### Why patch (not minor)
Fixes documented type surface contract (§18.5) without changing API. Strict additive: existing consumers get typed Preact + typed tokens shim with zero code changes on their side.

### Discovery
Bug caught by PR #13 CI Gate 1 (build parity) running retro on `main` post-v0.2.0 publish. Doctrine fix-pattern candidate `ci-gates-as-discovery-tool-not-just-enforcement` capitalized via Pi friction harvest. Root cause (parallel-pass DTS race vs in-config `clean: true`) only became visible by inspecting on-disk dist vs tsup log output — log alone showed all files "emitted".

### Mission
- Day 102 fast-patch per Laurent direct GO Option A. Pi blanket `laurent-direct-go-merge-2026-06-11`. Built on top of v0.2.1 (onRowClick) — rebased post-PR #12 merge per Eta REVISE doctrine `PR-staleness-true-conflict-vs-trailing-diff-illusion`.

---

## v0.2.1 — 2026-06-11

### Added — `@vantageos/mosaic`
- `TableView.onRowClick(row, index)` + `StreamingTableView.onRowClick` — when provided, rows render with `role="button"`, `tabIndex={0}`, and Enter/Space keyboard handlers for full a11y compliance. Fixes 5-BU ABSOLUTE blocker (Phi + Chi + Theta + Hermes + Demeter).

### Mission
- Day 102 fast-patch per Laurent direct GO. Pi blanket `laurent-direct-go-merge-2026-06-11`.

### Back-compat
- 100% back-compat with v0.2.0: when `onRowClick` is undefined, row rendering is byte-identical to v0.2.0 (no role, no tabIndex, no handlers).

---

## v0.2.0 — 2026-06-02

### Added — `@vantageos/mosaic`
- **Cross-runtime subpaths** — `@vantageos/mosaic/react/<cat>` (React 19) and `@vantageos/mosaic/preact/<cat>` (Preact 10) for all 6 categories (progress, input, display, artifacts, confirmation, media). Path A architecture (single package, multi-runtime subpaths) replaces forked maintenance.
- **`@vantageos/mosaic/tokens` subpath** — convenience re-export of `@vantageos/mosaic-tokens` for single-import-surface convenience.
- **tsup three sibling configs** — react pass (legacy v0.1.2 entries + new `react/<cat>`), preact pass (`preact/<cat>` ESM-only with esbuild `alias` mapping `react` → `preact/compat` and `react-dom` → `preact/compat`), tokens re-export shim.
- **PeerDependencies all optional** — `react`, `react-dom`, `preact`, `react-i18next`, `@mcp-ui/client`, `rxjs` all marked `optional` via `peerDependenciesMeta`. Consumers install only what their runtime needs.
- **`preact ^10.25.0`** added to peerDependencies.

### Added — `@vantageos/mosaic-tokens` (NEW package)
- Framework-free design tokens — 58 tokens across 6 categories: 15 colors (OKLCH × 3 shades × 5 statuses), 8 spacing values, 14 typography vars, 6 shadows, 7 radii, 8 motion.
- Three surfaces — `import "@vantageos/mosaic-tokens/css"` (CSS custom properties on `:root`), typed JS exports (`tokens`, `colors`, etc.), and Tailwind v4 plugin (`@vantageos/mosaic-tokens/tailwind`).
- Coherence test — 10 vitest tests enforcing JS ↔ CSS parity + scale invariants (spacing / typography / radii strictly ascending, OKLCH color triplet completeness).
- Bundle gates — JS ≤ 5 KB gz (actual 649 B), CSS ≤ 3 KB gz (actual 560 B).

### Doctrine — Standard v1.1 §18
- New section §18 "Cross-Runtime Support (v0.2.0 amendment)" in [`mosaic-architecture-standard-v1.md`](https://github.com/elpiarthera/ElPi-Corp/blob/main/resources/references/mosaic-architecture-standard-v1.md) documenting A1 architecture, exports surface table, peerDependenciesMeta model, bundle targets, new CI gates, compatibility commitments, per-BU migration guide.

### Back-compat
- v0.1.2 root subpaths (`./progress`, `./input`, `./display`, `./artifacts`, `./confirmation`, `./media`) preserved verbatim — Sigma + Theta consumers unaffected.

### Mission
- `k574hnee3vj2vg6hhchgmahwx587wsth` (mosaic v0.2.0 cross-runtime)
- 6 PRs merged: #4 (scaffold) + #5 (TS2344 hotfix) + #6 (T3-B tokens) + #8 (T3-C coherence test) + #9 (biome safe-fix) + ElPi-Corp #29 (standard amendment)
- ETA_APPROVED_TASK_ID `k176y2tf50cy60f7tk4z2h5c0987w2eg`

### Unblocks
- Mu S3 vantage-bridge can pivot DealsIframe to `@vantageos/mosaic/preact/display`
- Chi Phase 3 can lift-and-shift 9 components from gptpowerups to `@vantageos/mosaic/preact/<cat>`
- Athena / Hermes / Demeter / Sigma / Theta / Kappa cross-runtime UI surface available on npm

---

## v0.1.2 — 2026-06-02

### Fixed (CRITICAL fleet-blocker)
- Remove `recharts` from dependencies (was unused in v0.1.0 — 6 components ship zero charts; will re-add as peer optional when Chart component lands in v0.2.0+)
- Move `rxjs` from dependencies → peerDependencies optional (consumers using streaming MUST install rxjs ^7.8.0)
- Per-component subpath exports added: `@vantageos/mosaic/progress`, `/input`, `/display`, `/artifacts`, `/confirmation`, `/media`, `/server`

### Added
- `TableView` static rows array overload (Theta Tier-2 request) — primary export now accepts `rows: Row[]` for already-fetched data; streaming variant available as named export `StreamingTableView` with `rows$: Observable`

### Why
Mu vantage-bridge MV3 POC measured 7.88 KB gz → 126.08 KB gz (+1500%) on 3-component naive import. Root cause: recharts (5.4 MB) + rxjs (12 MB) as direct deps + single tsup bundle (no tree-shaking via subpaths). v0.1.2 brings 3-component import to targeted KB range, unblocks Chi+Athena+Hermes+Demeter+Mu adoption.

### Migration from v0.1.1
- If you used `import { Foo } from '@vantageos/mosaic'`, still works (root export preserved)
- For optimal tree-shaking, switch to subpath: `import { ProgressBar } from '@vantageos/mosaic/progress'`
- If you used streaming `<TableView rows$={obs}>`, rename to `<StreamingTableView rows$={obs}>` and ensure rxjs is in your project deps
- If you used static data, use `<TableView rows={array}>` directly (no Observable wrapper needed)

---

## v0.1.1 — 2026-06-02

### Added
- vitest AST scan test `no-hardcode-strings.test.ts` enforcing zero raw JSX text children with alphabetic content (Eta axis 6 CONDITION fix path)
- Whitelist mechanisms: same-line `// allow-hardcode-i18n: <reason>` + file-level `// allow-hardcode-i18n-file: <reason>`
- Auto-exempt `.test.tsx` / `.spec.tsx` / `.stories.tsx` files

### Why
Standard v1.1 consumer-driven i18n contract was empirically clean at v0.1.0 (Eta verified 0 hits) but had ZERO enforcement infrastructure. v0.1.1 closes the gap: future hardcoded JSX literals are blocked by the vitest gate (`pnpm run test` fails).

---

## v0.1.0 — 2026-05-28

Initial release — 6 consumer-driven MCP UI components: MarkdownRenderer, TokenDisplayOnceModal, TableView, ConfirmDialog, StatusBadge, ProgressBar.
