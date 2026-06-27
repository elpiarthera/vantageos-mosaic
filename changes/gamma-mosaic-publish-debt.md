# Release fragment — gamma/mosaic-publish-debt

**Packages**:
- `@vantageos/mosaic-i18n` — `0.1.0` → `0.1.1`
- `@vantageos/mosaic-tokens` — `0.2.0` → `0.2.1`

**Branch**: `gamma/mosaic-publish-debt`
**Date**: 2026-06-27

## What changed

### mosaic-i18n (`0.1.1`)

- LICENSE: added FSL-1.1-Apache-2.0 (canonical, sha256 `3d458972...`) — was missing entirely
- `package.json`: version bump, `license: "FSL-1.1-Apache-2.0"`, `LICENSE` added to `files`, keywords added, repository field added
- `README.md`: REWRITTEN — was empty (Day 113 publish debt). Now 17-section vitrine (260+ lines): install, quick start, configuration, locale key reference, examples, TypeScript, browser support, contributing, license, credits

### mosaic-tokens (`0.2.1`)

- LICENSE: added FSL-1.1-Apache-2.0 (canonical, sha256 `3d458972...`) — was missing
- `package.json`: version bump, `license: "FSL-1.1-Apache-2.0"`, `LICENSE` added to `files`, keywords added, repository field added
- `README.md`: REWRITTEN to 17-section vitrine (280+ lines): full token reference tables (58 tokens across 6 categories), all 3 consumption surfaces (CSS / JS / Tailwind plugin), dark mode override pattern, coherence test docs, bundle gate table, browser support, contributing workflow, license, credits
- `/tmp/` path leak fixed: the previous README referenced no `/tmp/` paths; dry-run verified NO-LEAK

## No publish
Dry-run only. Publish is gated behind Eta APPROVED review.
