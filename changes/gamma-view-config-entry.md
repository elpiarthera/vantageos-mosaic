# Release fragment — gamma/view-config-entry

**Packages**:
- `@vantageos/mosaic` — `0.11.2` -> `0.12.0` (minor: new export path)

**Branch**: `gamma/view-config-entry`
**Date**: 2026-11-20

## What changed

New entry `@vantageos/mosaic/view-config`: the view-config parser without a UI runtime, so an MCP server can validate its view config without react installed. `@vantageos/mosaic/display` is unchanged and still exports the parser. Full entry in `packages/mosaic/CHANGELOG.md` section 0.12.0.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest`.
- `prepublishOnly` runs build, tests and size-limit; also run `pnpm --filter @vantageos/mosaic run check:config-view`.
- Publication is proven by the dist-tag read back from the registry, never by the publish output.
- Consumer proof: install the tarball without react (`--legacy-peer-deps`) and import `@vantageos/mosaic/view-config`.

## No publish
Branch only. Publish is gated behind the review and the Pi token.
