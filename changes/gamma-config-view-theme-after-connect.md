# Release fragment — gamma/config-view-theme-after-connect

**Packages**:
- `@vantageos/mosaic` — `0.11.1` -> `0.11.2` (patch)

**Branch**: `gamma/config-view-theme-after-connect`
**Date**: 2026-11-20

## What changed

Config view: the host colour scheme is read again once `connect()` resolves, so a dark host renders the view dark from the first frame instead of falling back to `prefers-color-scheme`. Full entry in `packages/mosaic/CHANGELOG.md` section 0.11.2.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest`.
- `prepublishOnly` runs build, tests and size-limit; also run `pnpm --filter @vantageos/mosaic run check:config-view`.
- Publication is proven by the dist-tag read back from the registry, never by the publish output.

## No publish
Branch only. Publish is gated behind the review and the Pi token.
