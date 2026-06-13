#!/usr/bin/env bash
# Gate 2 — driver: install + run both peer-resolution fixtures.
#
# FAITHFUL-INSTALL CONTRACT (v0.3.0 — peerDeps optionality fix):
# Earlier versions installed the fixtures with `npm install file:../../../packages/mosaic`,
# which npm resolves as a SYMLINK into the monorepo source tree. Node then resolves
# the bundle's `preact/*` / `react/*` imports by climbing out of the fixture and into
# the monorepo root node_modules — where BOTH preact and react are hoisted (devDeps).
# That made `@vantageos/mosaic/preact/progress` resolve from a react-only fixture even
# though preact was not a fixture dependency: a FALSE PASS that hid the real packaging
# contract.
#
# A real npm consumer installs `@vantageos/mosaic` as an ISOLATED, non-symlinked package
# under its own node_modules with NO monorepo parent to climb into. We reproduce that
# faithfully here: `pnpm pack` both packages (which rewrites the `workspace:*` tokens
# dep to a concrete version), then install the tarballs into a throwaway consumer dir
# created OUTSIDE the repo tree (mktemp -d), alongside ONLY the peer the fixture declares.
# The fixture assertions (index.mjs) are untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MOSAIC_PKG="$ROOT/packages/mosaic"
TOKENS_PKG="$ROOT/packages/mosaic-tokens"

# --- Pack both packages (pnpm rewrites workspace: protocol to real versions) ---
echo "=== Gate 2: packing @vantageos/mosaic + @vantageos/mosaic-tokens ==="
TARBALL_DIR="$(mktemp -d)"
TOKENS_TGZ="$TARBALL_DIR/$(cd "$TOKENS_PKG" && pnpm pack --pack-destination "$TARBALL_DIR" | tail -1 | xargs basename)"
MOSAIC_TGZ="$TARBALL_DIR/$(cd "$MOSAIC_PKG" && pnpm pack --pack-destination "$TARBALL_DIR" | tail -1 | xargs basename)"
echo "tokens tarball: $TOKENS_TGZ"
echo "mosaic tarball: $MOSAIC_TGZ"

# Peers each fixture is allowed to install (and ONLY those).
declare -A FIXTURE_PEERS=(
  ["react-only"]="react@^19.1.0 react-dom@^19.1.0"
  ["preact-only"]="preact@^10.25.0"
)

CONSUMERS=()
cleanup() {
  rm -rf "$TARBALL_DIR" "${CONSUMERS[@]}" 2>/dev/null || true
}
trap cleanup EXIT

for fixture in react-only preact-only; do
  echo "=== Gate 2 fixture: $fixture ==="
  CONSUMER="$(mktemp -d)"
  CONSUMERS+=("$CONSUMER")

  # Isolated consumer manifest — no monorepo parent, no extra deps.
  cat > "$CONSUMER/package.json" <<EOF
{ "name": "mosaic-peer-resolution-$fixture-consumer", "version": "0.0.0", "private": true, "type": "module" }
EOF
  cp "$ROOT/e2e/peer-resolution/$fixture/index.mjs" "$CONSUMER/index.mjs"

  # Install the packed tarballs + ONLY the peer this fixture declares.
  # --no-save / --no-package-lock keep the install ephemeral and deterministic.
  # --legacy-peer-deps is REQUIRED for a faithful optionality test: npm 7+ auto-
  # installs the *transitive* peer deps of mosaic's own dependencies (e.g.
  # @tanstack/react-virtual peers react/react-dom). Without this flag a preact-only
  # consumer would silently acquire react in node_modules, letting react/* subpaths
  # resolve and producing a FALSE FAIL. A consumer that has deliberately chosen one
  # runtime does not want the other auto-pulled — this flag models that choice. The
  # fixture assertions themselves are untouched.
  ( cd "$CONSUMER" && npm install --no-package-lock --no-save --no-audit --no-fund \
      --legacy-peer-deps --silent \
      "$MOSAIC_TGZ" "$TOKENS_TGZ" ${FIXTURE_PEERS[$fixture]} )

  ( cd "$CONSUMER" && node index.mjs )
done

echo "PASS: Gate 2 peerDeps optionality smoke — both fixtures green"
