# Changelog

All notable changes to `@vantageos/mosaic` are documented here.

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
