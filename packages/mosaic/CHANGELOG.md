# Changelog

All notable changes to `@vantageos/mosaic` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Wave 3 components TBD (DatePicker, Avatar, FilterChip, Pagination — demand-driven T21+).

---

## [0.3.0] — GA — TBD

### Added
- All Wave 1 + Wave 2 components promoted from `0.3.0-alpha.1` with no breaking API changes.
- `forms` category becomes stable (7th top-level taxonomy bucket).

---

## [0.3.0-alpha.1] — 2026-06-11

### Added
- **`RadioGroup`** (Wave 2 T17) — WCAG-AA mutually exclusive single-choice form primitive. Cross-runtime: `@vantageos/mosaic/react/forms` + `@vantageos/mosaic/preact/forms`. Roving tabindex (WAI-ARIA §3.10), Arrow/Home/End keyboard navigation, `aria-orientation`, group-level and per-option disabled.
- **`Select`** (Wave 2 T13) — single-select dropdown implementing the ARIA combobox+listbox pattern (APG 2024). Optional in-popup search. ArrowUp/Down/Home/End/Enter/Escape/type-ahead keyboard navigation. Shared pure logic (`Select.logic.ts`) referenced by both runtimes.
- **`MultiSelect`** (Wave 2 T15) — multi-value dropdown with removable chips. `aria-multiselectable`, per-chip `aria-label="Remove {label}"`, `maxItems` gate, searchable filter, Backspace removes last chip.
- **`Textarea`** (Wave 2 T12) — multi-line text input with optional `autoResize` (grow-to-fit) and `maxLength` clamping enforced at the `onChange` boundary before RHF receives the value.
- **`Input`** (Wave 2 T11) — first field primitive of the `forms` category. Five HTML input types (`text | email | password | number | url`). `aria-invalid` + `aria-describedby` wired automatically.
- **`Checkbox`** (Wave 2 T14) — boolean checkbox with `indeterminate` state (DOM `.indeterminate = true` + `aria-checked="mixed"`), optional `description` wired to `aria-describedby`.
- **`FieldArray`** (Wave 2 T16) — render-prop wrapper around RHF `useFieldArray`. Keys rows by stable `field.id` (not array index). Provides `append / remove / move / swap / insert / prepend / replace / update`. WCAG-AA `role="list"` + `role="listitem"` container.
- **`ConfirmModal`** alias (Wave 1 T9-v2) — thin re-export of `ConfirmDialog` on `@vantageos/mosaic/react/confirmation` and `@vantageos/mosaic/preact/confirmation`. Referential identity invariant (`ConfirmModal === ConfirmDialog`) enforced by tests.
- **`VirtualList<T>`** (Wave 1 T2) — generic virtualized list using `@tanstack/react-virtual` v3. API: `items`, `itemHeight`, `estimateSize`, `renderItem`, `onRowClick`, `overscan`, `className`, `locale`. WCAG-AA when `onRowClick` present (`role="button"`, `tabIndex={0}`, Enter/Space handlers). Bilingual empty state (EN/FR).
- **`forms` category** (Wave 2 T10 scaffold) — 7th top-level taxonomy bucket. Five scaffold primitives: `useMosaicForm`, `FormProvider`, `FormField`, `ErrorDisplay`, `SubmitButton`. Default validation mode `"onBlur"`. Subpaths: `@vantageos/mosaic/react/forms`, `@vantageos/mosaic/preact/forms`, `@vantageos/mosaic/forms` (back-compat root).
- `react-hook-form ^7.54.0` and `@hookform/resolvers ^3.10.0` added as optional peer dependencies.
- `./forms`, `./react/forms`, `./preact/forms` subpath exports added.

### Fixed
- Cascade-merge build break (hotfix 2026-06-11): restored JSDoc openers, deduped barrel re-exports, dropped phantom `Badge` refs, added missing `Skeleton` i18n strings.

### Wave 1 additions (also shipping in 0.3.0-alpha.1 codebase)
- **`Tabs`** (T5) — cross-runtime React 19 + Preact 10, WCAG-AA.
- **`Alert`** (T8) — persistent inline banner (React 19 + Preact 10).
- **`Toast`** (T3) — ephemeral notification (confirmation category, Chi+Hermes convergence).
- **`Skeleton`** (T6) — loading placeholder (React 19 + Preact 10).
- **`EmptyState`** (T7) — empty list / zero-data state (display category, Hermes+Chi convergence).
- Three new CI gate jobs wired into `ci.yml` per Standard v1.2 §20.

---

## [0.2.2] — 2026-06-11

### Fixed
- **Critical — §18.5 type surface contract**: `tsup.config.ts` react pass changed from `clean: true` to `clean: false`. The three sibling tsup configs (react / preact / tokens re-export) ran their DTS phases in parallel; the react DTS pass finished last and previously wiped `dist/preact/*.d.ts` and `dist/tokens.d.ts` written by the sibling passes. All DTS files now persist on disk.
- Added `prebuild` script (`node -e "fs.rmSync('dist',{recursive:true,force:true})"`) to guarantee a clean `dist` before tsup runs, replacing the racy in-pass `clean: true`.

---

## [0.2.1] — 2026-06-11 (YANKED — superseded by 0.2.2)

### Added
- `TableView.onRowClick(row, index)` and `StreamingTableView.onRowClick` — when provided, rows render with `role="button"`, `tabIndex={0}`, and Enter/Space keyboard handlers. Fixes 5-BU ABSOLUTE blocker (Phi + Chi + Theta + Hermes + Demeter).

### Notes
- 100% back-compat with v0.2.0: when `onRowClick` is undefined, row rendering is byte-identical to v0.2.0.

---

## [0.2.0] — 2026-06-02

### Added
- **Cross-runtime subpaths** — `@vantageos/mosaic/react/<cat>` (React 19) and `@vantageos/mosaic/preact/<cat>` (Preact 10) for all 6 categories (`progress`, `input`, `display`, `artifacts`, `confirmation`, `media`). Path A architecture (single package, multi-runtime subpaths) replaces forked maintenance.
- **`@vantageos/mosaic/tokens` subpath** — convenience re-export of `@vantageos/mosaic-tokens`.
- **tsup three sibling configs** — react pass (legacy v0.1.2 entries + new `react/<cat>`), preact pass (`preact/<cat>` ESM-only with esbuild `alias` mapping `react` → `preact/compat`), tokens re-export shim.
- **`preact ^10.25.0`** added to peerDependencies. All peer deps (`react`, `react-dom`, `preact`, `react-i18next`, `@mcp-ui/client`, `rxjs`) marked optional via `peerDependenciesMeta`.
- **`@vantageos/mosaic-tokens`** (new sibling package) — 58 framework-free design tokens across 6 categories: 15 colors (OKLCH × 3 shades × 5 statuses), 8 spacing values, 14 typography vars, 6 shadows, 7 radii, 8 motion. Three surfaces: CSS custom properties, typed JS exports, Tailwind v4 plugin.

### Changed
- Standard §18 "Cross-Runtime Support (v0.2.0 amendment)" published to `mosaic-architecture-standard-v1.md` documenting the A1 architecture, exports surface table, peerDependenciesMeta model, bundle targets, new CI gates, compatibility commitments, and per-BU migration guide.

---

## [0.1.2] — 2026-06-02

### Added
- Per-component subpath exports: `@vantageos/mosaic/progress`, `/input`, `/display`, `/artifacts`, `/confirmation`, `/media`, `/server`.
- `TableView` static rows array overload — accepts `rows: Row[]` for already-fetched data. Streaming variant renamed to `StreamingTableView` with `rows$: Observable`.

### Fixed
- Removed `recharts` from dependencies (unused in v0.1.0 — will re-add as optional peer when Chart component lands).
- Moved `rxjs` from dependencies → optional peerDependencies.

### Migration from 0.1.1
- Root imports (`import { Foo } from '@vantageos/mosaic'`) still work — root export preserved.
- For optimal tree-shaking, switch to subpath: `import { ProgressBar } from '@vantageos/mosaic/progress'`.
- Streaming usage: rename `<TableView rows$={obs}>` to `<StreamingTableView rows$={obs}>` and ensure `rxjs` is in your project deps.

---

## [0.1.1] — 2026-06-02

### Added
- `no-hardcode-strings.test.ts` — vitest AST scan enforcing zero raw JSX text children with alphabetic content (Eta axis 6 CONDITION fix path).
- Whitelist mechanisms: same-line `// allow-hardcode-i18n: <reason>` comment and file-level `// allow-hardcode-i18n-file: <reason>` comment.
- Auto-exempt: `.test.tsx`, `.spec.tsx`, `.stories.tsx` files.

---

## [0.1.0] — 2026-05-28

### Added
- Initial release — 6 consumer-driven MCP UI components: `MarkdownRenderer`, `TokenDisplayOnceModal`, `TableView`, `ConfirmDialog`, `StatusBadge`, `ProgressBar`.
- Monorepo scaffold: pnpm + turbo + 4 pattern infrastructure + CI gate.
- Zod runtime validation on all component props.
- `registry.yaml` with component catalogue.
- i18n consumer-driven model (zero hardcoded JSX text).

---

[Unreleased]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.2...v0.3.0
[0.3.0-alpha.1]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.2...v0.3.0-alpha.1
[0.2.2]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/elpiarthera/vantageos-mosaic/releases/tag/v0.1.0
