# Release fragment — gamma/config-view-server-locale-authority

**Packages**:
- `@vantageos/mosaic` — `0.9.0` -> `0.10.0` (minor)

**Branch**: `gamma/config-view-server-locale-authority`
**Date**: 2026-11-17

## What changed

Opt-in server locale authority for the config view: `_meta.localeAuthority: "server"` makes the tool result's `_meta.locale` win over the host's locale. Default (host first) is unchanged. Full list in `packages/mosaic/CHANGELOG.md` section 0.10.0.

## Release checks (before any publish)

- Branch version must be strictly greater than the live version read from the registry (cache-busted): `curl -s -H 'Cache-Control: no-cache' https://registry.npmjs.org/@vantageos%2fmosaic` -> `dist-tags.latest`.
- `prepublishOnly` runs build, tests and size-limit; also run `pnpm --filter @vantageos/mosaic run check:config-view`.
- Publication is proven by the dist-tag read back from the registry, never by the publish output.

## No publish
Branch only. Publish is gated behind the Eta review and the Pi token.
