#!/usr/bin/env bash
# Gate 2 — driver: install + run both peer-resolution fixtures
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

for fixture in react-only preact-only; do
  echo "=== Gate 2 fixture: $fixture ==="
  pushd "$ROOT/e2e/peer-resolution/$fixture" > /dev/null
  rm -rf node_modules
  npm install --no-package-lock --silent
  node index.mjs
  popd > /dev/null
done

echo "PASS: Gate 2 peerDeps optionality smoke — both fixtures green"
