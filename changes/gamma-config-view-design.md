# Release fragment — gamma/config-view-design

**Packages**:
- `@vantageos/mosaic` — `0.8.0` -> `0.9.0` (minor)

**Branch**: `gamma/config-view-design`
**Date**: 2026-11-01

## What changed

The config view takes the host's locale before the server's echoed one, applies the host's theme, and draws its table from the mosaic tokens. Full list in `packages/mosaic/CHANGELOG.md` section 0.9.0.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest` `0.8.0`.
- `prepublishOnly` runs build, tests and size-limit; also run `pnpm --filter @vantageos/mosaic run check:config-view`.
- Publication is proven by the dist-tag read back from the registry, never by the publish output.

## No publish
Branch only. Publish is gated behind the Eta review and the Pi token.
