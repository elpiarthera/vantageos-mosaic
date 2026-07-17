#!/usr/bin/env bash
# Bipolar + refuse probe for scripts/tarball-cited-paths-guard.mjs.
#
# One MUST_BLOCK case per citation FORM this guard was derived to cover
# (guard-formulation-census): Form A (import specifier, resolved through
# `exports`) and Form B (bare in-package relative path). A synthetic
# fixture package is built per case so the mutation lands on a COPY, never
# on the real tree — restoration is then a `rm -rf` of the fixture plus a
# `git diff` check on the real package, asserted at the end.
#
# Exit codes captured via `cmd > log 2>&1; rc=$?` throughout — never a pipe.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GUARD="${PKG_DIR}/scripts/tarball-cited-paths-guard.mjs"
WORK="$(mktemp -d /tmp/mosaic-tokens-guard-probe.XXXXXX)"

# Snapshot the real README.md/CHANGELOG.md BEFORE any probe mutation. All
# mutations below happen on fixture COPIES under ${WORK}; the real files are
# never touched. This snapshot is compared byte-for-byte at the end — it
# proves that claim, independent of whatever the surrounding feature branch
# legitimately changed in these files before the probe ran.
cp "${PKG_DIR}/README.md" "${WORK}/README.md.snapshot"
cp "${PKG_DIR}/CHANGELOG.md" "${WORK}/CHANGELOG.md.snapshot"

PASS=0
FAIL=0
FALSE_POSITIVES=0

report() {
  local label="$1" expect_rc="$2" got_rc="$3" note="$4"
  if [ "$expect_rc" = "$got_rc" ]; then
    echo "  OK   ${label} (rc=${got_rc}) — ${note}"
    PASS=$((PASS + 1))
  else
    echo "  FAIL ${label} expected rc=${expect_rc} got rc=${got_rc} — ${note}"
    FAIL=$((FAIL + 1))
    FALSE_POSITIVES=$((FALSE_POSITIVES + 1))
  fi
}

# --- Build one fixture copy of the package (real files, then mutated). ---
make_fixture() {
  local name="$1"
  local dst="${WORK}/${name}"
  mkdir -p "${dst}"
  cp -a "${PKG_DIR}/README.md" "${PKG_DIR}/CHANGELOG.md" "${PKG_DIR}/package.json" "${dst}/"
  cp -a "${PKG_DIR}/scripts" "${dst}/"
  cp -a "${PKG_DIR}/src" "${dst}/"
  [ -d "${PKG_DIR}/examples" ] && cp -a "${PKG_DIR}/examples" "${dst}/"
  [ -d "${PKG_DIR}/LICENSE" ] || cp -a "${PKG_DIR}/LICENSE" "${dst}/" 2>/dev/null
  # dist/ is expensive to rebuild per-fixture and irrelevant to the Form A/B
  # cases below (neither mutation touches a dist/* citation) — reuse the
  # already-built dist from the real package if present, else the guard's
  # own build-on-demand step (tested separately by MUST_PASS) covers it.
  [ -d "${PKG_DIR}/dist" ] && cp -a "${PKG_DIR}/dist" "${dst}/"
  ln -s "${PKG_DIR}/node_modules" "${dst}/node_modules"
  echo "${dst}"
}

echo "=== MUST_BLOCK — Form A (import specifier resolved via exports, target not shipped) ==="
FIXTURE_A="$(make_fixture form-a-block)"
python3 - "$FIXTURE_A/package.json" <<'PYEOF'
import json, sys
p = sys.argv[1]
with open(p) as f:
    d = json.load(f)
d["exports"]["./does-not-exist.css"] = "./does-not-exist.css"
with open(p, "w") as f:
    json.dump(d, f, indent=2)
PYEOF
echo '

## Probe injection (Form A)

Import `@vantageos/mosaic-tokens/does-not-exist.css` for a synthetic case.' >> "${FIXTURE_A}/CHANGELOG.md"
grep -q "does-not-exist.css" "${FIXTURE_A}/CHANGELOG.md" || { echo "  SETUP FAILED: Form A injection did not land"; FAIL=$((FAIL + 1)); }
( cd "${FIXTURE_A}" && node "${FIXTURE_A}/scripts/tarball-cited-paths-guard.mjs" > "${WORK}/form-a-block.log" 2>&1 )
rc=$?
grep -q "does-not-exist.css" "${WORK}/form-a-block.log"
named=$?
if [ "$rc" = "1" ] && [ "$named" = "0" ]; then
  report "Form A MUST_BLOCK" 1 "$rc" "guard named the unshipped path"
else
  report "Form A MUST_BLOCK" 1 "$rc" "$(tail -3 "${WORK}/form-a-block.log")"
fi

echo "=== MUST_BLOCK — Form B (bare in-package relative path, not shipped) ==="
FIXTURE_B="$(make_fixture form-b-block)"
echo '

## Probe injection (Form B)

See `examples/does-not-exist.css` for a synthetic case.' >> "${FIXTURE_B}/CHANGELOG.md"
grep -q "does-not-exist.css" "${FIXTURE_B}/CHANGELOG.md" || { echo "  SETUP FAILED: Form B injection did not land"; FAIL=$((FAIL + 1)); }
( cd "${FIXTURE_B}" && node "${FIXTURE_B}/scripts/tarball-cited-paths-guard.mjs" > "${WORK}/form-b-block.log" 2>&1 )
rc=$?
grep -q "does-not-exist.css" "${WORK}/form-b-block.log"
named=$?
if [ "$rc" = "1" ] && [ "$named" = "0" ]; then
  report "Form B MUST_BLOCK" 1 "$rc" "guard named the unshipped path"
else
  report "Form B MUST_BLOCK" 1 "$rc" "$(tail -3 "${WORK}/form-b-block.log")"
fi

echo "=== MUST_BLOCK — real historical 0.5.0 defect (files+exports both lacked the subpath) ==="
FIXTURE_REAL="$(make_fixture real-defect)"
python3 - "$FIXTURE_REAL/package.json" <<'PYEOF'
import json, sys
p = sys.argv[1]
with open(p) as f:
    d = json.load(f)
d["exports"].pop("./examples/anydebate-override.css", None)
d["files"] = [x for x in d["files"] if x != "examples"]
with open(p, "w") as f:
    json.dump(d, f, indent=2)
PYEOF
( cd "${FIXTURE_REAL}" && node "${FIXTURE_REAL}/scripts/tarball-cited-paths-guard.mjs" > "${WORK}/real-defect.log" 2>&1 )
rc=$?
grep -q "anydebate-override.css" "${WORK}/real-defect.log"
named=$?
# The real 0.5.0 defect removed the subpath from BOTH exports and files.
# "Absent from exports" is a MEASURED verdict, not an inability to measure:
# the guard CAN read the exports map, sees no matching key, and that means
# the cited path does not ship — full stop. Coordinator correction (this
# session): the guard must BLOCK (exit 1) here, not REFUSE (exit 2).
# REFUSE is reserved strictly for unreadable INPUTS (see MUST_REFUSE case
# below), never for "the guard measured a violation".
if [ "$rc" = "1" ] && [ "$named" = "0" ]; then
  report "Real 0.5.0 defect MUST_BLOCK" 1 "$rc" "guard named the unshipped/unexported path"
else
  report "Real 0.5.0 defect MUST_BLOCK" 1 "$rc" "$(tail -3 "${WORK}/real-defect.log")"
fi

echo "=== MUST_PASS — real fixed tree ==="
( cd "${PKG_DIR}" && node "${GUARD}" > "${WORK}/must-pass.log" 2>&1 )
rc=$?
report "MUST_PASS (real fixed tree)" 0 "$rc" "$(tail -1 "${WORK}/must-pass.log")"

echo "=== MUST_REFUSE — manifest source removed ==="
FIXTURE_REFUSE="$(make_fixture must-refuse)"
rm -f "${FIXTURE_REFUSE}/CHANGELOG.md"
( cd "${FIXTURE_REFUSE}" && node "${FIXTURE_REFUSE}/scripts/tarball-cited-paths-guard.mjs" > "${WORK}/must-refuse.log" 2>&1 )
rc=$?
grep -q "CHANGELOG.md not found" "${WORK}/must-refuse.log"
named=$?
if [ "$rc" = "2" ] && [ "$named" = "0" ]; then
  report "MUST_REFUSE (missing CHANGELOG.md)" 2 "$rc" "guard named the missing source"
else
  report "MUST_REFUSE (missing CHANGELOG.md)" 2 "$rc" "$(tail -3 "${WORK}/must-refuse.log")"
fi

echo
echo "=== SUMMARY ==="
echo "MUST_BLOCK 3/3 real form coverage attempted (Form A, Form B, real historical defect)"
echo "PASS=${PASS} FAIL=${FAIL} false_positives=${FALSE_POSITIVES}"

# --- Restoration proof: the real package tree must be untouched by the
# probe itself. Compared against the pre-probe snapshot (not `git diff`),
# because the surrounding feature branch may legitimately have its own
# committed-but-uncommitted changes to these files independent of this probe.
cmp -s "${PKG_DIR}/README.md" "${WORK}/README.md.snapshot"
readme_restore_rc=$?
cmp -s "${PKG_DIR}/CHANGELOG.md" "${WORK}/CHANGELOG.md.snapshot"
changelog_restore_rc=$?
if [ "$readme_restore_rc" != "0" ] || [ "$changelog_restore_rc" != "0" ]; then
  echo "RESTORATION FAILED: real README.md/CHANGELOG.md were mutated by the probe — this must never happen"
  FAIL=$((FAIL + 1))
fi

rm -rf "${WORK}"

if [ "$FAIL" = "0" ]; then
  echo "PROBE PASS: all cases green, 0 false positives"
  exit 0
else
  echo "PROBE FAIL: ${FAIL} case(s) did not match expectation"
  exit 1
fi
