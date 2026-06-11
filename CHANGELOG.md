# Changelog

All notable changes to `@vantageos/mosaic` and `@vantageos/mosaic-tokens` are documented here.

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
