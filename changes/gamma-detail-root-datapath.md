# Release fragment — gamma/detail-root-datapath

**Packages**:
- `@vantageos/mosaic` — `0.7.0` -> `0.8.0` (additive minor)

**Branch**: `gamma/detail-root-datapath`
**Date**: 2026-10-29

## What changed

A Detail view config may set `dataPath: "$"` to read the whole payload; a List config with `"$"` is refused at validation. Full list in `packages/mosaic/CHANGELOG.md` section 0.8.0.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest` `0.7.0`.
- `prepublishOnly` runs build, tests and size-limit; also run `pnpm --filter @vantageos/mosaic run check:config-view`.
- Publication is proven by the dist-tag read back from the registry, never by the publish output.

## No publish
Branch only. Publish is gated behind the Eta review and the Pi token.
