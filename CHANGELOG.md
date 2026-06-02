# Changelog

All notable changes to `@vantageos/mosaic` are documented here.

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
