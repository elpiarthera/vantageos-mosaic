#!/usr/bin/env bash
# Gate 6 — React Server Components client boundary.
#
# Claim under test (packages/mosaic/docs/GA-RELEASE-V0.3.1.md section 6): a Next.js App Router
# Server Component can import mosaic's React components at module level. The built bundles carry
# no source directive (esbuild drops module-level directives), so the React entries must ship
# `"use client";` as their first line or a Server Component that renders them fails.
#
# Faithful install, as Gate 2: both packages are packed (workspace: refs rewritten) and installed
# as tarballs into a consumer created OUTSIDE the repository, so nothing resolves through the
# monorepo's hoisted node_modules. The consumer is a real Next.js app (app/page.jsx is a Server
# Component) built with `next build`, which prerenders the page.
#
# Requires: a built packages/mosaic/dist and packages/mosaic-tokens/dist.
set -euo pipefail

NEXT_VERSION="16.4.6"
REACT_VERSION="19.3.1"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURE="$ROOT/e2e/rsc-client-boundary"
MOSAIC_PKG="$ROOT/packages/mosaic"
TOKENS_PKG="$ROOT/packages/mosaic-tokens"

TARBALL_DIR="$(mktemp -d)"
CONSUMER="$(mktemp -d)"
cleanup() {
  rm -rf "$TARBALL_DIR" "$CONSUMER" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Gate 6: packing @vantageos/mosaic + @vantageos/mosaic-tokens ==="
TOKENS_TGZ="$TARBALL_DIR/$(cd "$TOKENS_PKG" && pnpm pack --pack-destination "$TARBALL_DIR" | tail -1 | xargs basename)"
MOSAIC_TGZ="$TARBALL_DIR/$(cd "$MOSAIC_PKG" && pnpm pack --pack-destination "$TARBALL_DIR" | tail -1 | xargs basename)"

cat > "$CONSUMER/package.json" <<JSON
{ "name": "mosaic-rsc-client-boundary-consumer", "version": "0.0.0", "private": true }
JSON
cp -R "$FIXTURE/app" "$CONSUMER/app"
cp "$FIXTURE/next.config.mjs" "$CONSUMER/next.config.mjs"

echo "=== Gate 6: installing next@$NEXT_VERSION react@$REACT_VERSION + the tarballs ==="
# The consumer is an npm project, as a real one would be (Gate 2 installs the same way).
# --legacy-peer-deps: same reason as Gate 2, the consumer installs only the peers it uses.
( cd "$CONSUMER" && npm install --no-package-lock --no-save --no-audit --no-fund \
    --legacy-peer-deps --silent \
    "next@$NEXT_VERSION" "react@$REACT_VERSION" "react-dom@$REACT_VERSION" \
    "$MOSAIC_TGZ" "$TOKENS_TGZ" )

echo "=== Gate 6: census self-test (PASS / VIOLATION / REFUSE poles, mutations of the installed package) ==="
MOSAIC_PKG_DIR="$CONSUMER/node_modules/@vantageos/mosaic" node --test "$FIXTURE/check-directives.test.mjs"

echo "=== Gate 6: next build (app/page.jsx is a Server Component) ==="
( cd "$CONSUMER" && NEXT_TELEMETRY_DISABLED=1 npx --no-install next build )

echo "=== Gate 6: directive census over the installed package ==="
node "$FIXTURE/check-directives.mjs" "$CONSUMER/node_modules/@vantageos/mosaic"

echo "PASS: Gate 6 RSC client boundary — Server Component build green, directives where expected"
