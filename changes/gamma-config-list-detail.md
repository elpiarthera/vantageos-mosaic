# Release fragment — gamma/config-list-detail

**Packages**:
- `@vantageos/mosaic` — `0.6.0` -> `0.7.0` (additive minor)
- `@vantageos/mosaic-i18n` — locale files gain the `ConfigView.*`, `ConfigList.*`, `ConfigDetail.*`, `DetailView.*` keys; no version change (the package is not a dependency of `@vantageos/mosaic`, which inlines its own table; the repo has added keys the same way for earlier components)

**Branch**: `gamma/config-list-detail`
**Date**: 2026-10-29

## What changed

Generic, config-driven List and Detail MCP App views (`ConfigList`, `ConfigDetail`, `DetailView`), `ColumnDef` `path` + `format` (and `TableView` `rowKey`), `configToMarkdown`, the single-file `ui://mosaic/config-view` bundle and its server helpers. Full list in `packages/mosaic/CHANGELOG.md` section 0.7.0.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest` `0.6.0`.
- `prepublishOnly` runs build, tests and size-limit; also run `pnpm --filter @vantageos/mosaic run check:config-view`.
- Publication is proven by the dist-tag read back from the registry, never by the publish output.

## No publish
Branch only. Publish is gated behind the Eta review and the Pi token.
