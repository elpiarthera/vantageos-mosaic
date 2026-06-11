#!/usr/bin/env bash
# Gate 1: verify-build-parity.sh
# Standard §20.1 — every tsup pass must produce its full ESM/CJS/DTS surface.
# Fails CI with explicit diagnostic if any expected dist artifact is missing or empty.

set -euo pipefail

DIST="packages/mosaic/dist"
FAIL=0

# React pass: ESM + CJS + DTS for 7 entries
REACT_ENTRIES=(react/index react/progress react/input react/display react/artifacts react/confirmation react/media)
for entry in "${REACT_ENTRIES[@]}"; do
  for ext in js cjs d.ts; do
    f="$DIST/$entry.$ext"
    if [[ ! -s "$f" ]]; then
      echo "FAIL: missing or empty react pass artifact $f"
      FAIL=1
    fi
  done
done

# Preact pass: ESM + DTS only (no CJS)
PREACT_ENTRIES=(preact/index preact/progress preact/input preact/display preact/artifacts preact/confirmation preact/media)
for entry in "${PREACT_ENTRIES[@]}"; do
  for ext in js d.ts; do
    f="$DIST/$entry.$ext"
    if [[ ! -s "$f" ]]; then
      echo "FAIL: missing or empty preact pass artifact $f"
      FAIL=1
    fi
  done
done

# Tokens re-export shim
for ext in js cjs d.ts; do
  f="$DIST/tokens.$ext"
  if [[ ! -s "$f" ]]; then
    echo "FAIL: missing or empty tokens re-export artifact $f"
    FAIL=1
  fi
done

if [[ $FAIL -eq 0 ]]; then
  echo "PASS: cross-runtime build parity green (react 7 entries × 3 ext + preact 7 entries × 2 ext + tokens × 3 ext)"
fi

exit $FAIL
