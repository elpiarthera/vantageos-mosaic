# Release fragment — gamma/rxjs-optional-root

**Packages**:
- `@vantageos/mosaic` — `0.12.1` -> `0.13.0` (minor in 0.x: a symbol leaves the root entry)

**Branch**: `gamma/rxjs-optional-root`
**Date**: 2026-11-24

## What changed

The root entry no longer loads rxjs (an optional peer), so a React consumer without rxjs can import `@vantageos/mosaic`. `createPostMessageObservable` moved to the new entry `@vantageos/mosaic/streaming`, which loads rxjs. Full entry in `packages/mosaic/CHANGELOG.md` section 0.13.0.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest`.
- `prepublishOnly` runs build, tests and size-limit; also run Gate 2 `bash e2e/peer-resolution/run-smoke.sh` (react-only imports the root without rxjs; react-rxjs imports `/streaming` with rxjs).
- Publication is proven by the dist-tag read back from the registry, never by the publish output.

## No publish
Branch only. Publish is gated behind the review and the Pi token.
