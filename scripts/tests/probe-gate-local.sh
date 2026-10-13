#!/usr/bin/env bash
# probe-gate-local.sh — proves scripts/gate-local.mjs BITES, in both directions.
#
# Self-contained: the repo root is derived from this file's own location; every
# fixture is written into a private mktemp dir; the runner is always called with
# `--base HEAD` so no remote ref is needed. Nothing is read from the caller's env.
#
# Domain of "what the runner refuses" (census, derived from the runner's own tables
# WORKFLOW_KEYS / JOB_KEYS / STEP_KEYS plus its shell / matrix / `if:` handling):
#   unknown workflow key · unknown job key · unknown step key · multi-value matrix
#   · non-bash shell · `if:` it cannot interpret
# One MUST_BLOCK mutation per form. Every mutation's landing is grep-asserted BEFORE
# the runner's verdict is read. A setup failure is a loud FAIL, never a pass.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNNER="$ROOT/scripts/gate-local.mjs"
REAL_CI="$ROOT/.github/workflows/ci.yml"
TMP="$(mktemp -d)"
case "$TMP" in /*/?*) ;; *) echo "PROBE SETUP FAILURE: bad mktemp dir '$TMP'" >&2; exit 1 ;; esac
trap 'rm -rf -- "$TMP"' EXIT

FAILS=0
PASSES=0
pass() { PASSES=$((PASSES + 1)); echo "PASS  $1"; }
fail() { FAILS=$((FAILS + 1)); echo "FAIL  $1" >&2; }

# run_gate <outfile> <args...> : runs the runner, stdout+stderr -> outfile, sets RC.
RC=0
run_gate() {
  local out="$1"; shift
  node "$RUNNER" "$@" >"$out" 2>&1
  RC=$?
}

# landed <file> <fixed-string> <label> : the mutation must be present in the fixture.
landed() {
  if grep -qF -- "$2" "$1"; then return 0; fi
  fail "SETUP: mutation '$3' did not land in $1 (looked for: $2)"
  return 1
}

echo "== preconditions =="
[ -f "$REAL_CI" ] && pass "real ci.yml present" || fail "SETUP: $REAL_CI missing"
[ -f "$RUNNER" ] && pass "runner present" || fail "SETUP: $RUNNER missing — nothing to probe"
if grep -qF '"gate:local": "node scripts/gate-local.mjs"' "$ROOT/package.json"; then
  pass "package.json wires gate:local"
else
  fail "package.json does not wire \"gate:local\": \"node scripts/gate-local.mjs\""
fi

HEAD_ARGS=(--base HEAD)

echo "== MUST_BLOCK (a): a failing run step => exit 1, step named =="
cat >"$TMP/fail.yml" <<'YML'
name: fixture
on: [push]
jobs:
  j:
    runs-on: ubuntu-latest
    steps:
      - name: fail-step-marker
        run: exit 3
YML
if landed "$TMP/fail.yml" "exit 3" "failing step"; then
  run_gate "$TMP/fail.out" --workflow "$TMP/fail.yml" "${HEAD_ARGS[@]}"
  [ "$RC" -eq 1 ] && pass "(a) exit code is 1" || fail "(a) expected exit 1, got $RC: $(head -c 400 "$TMP/fail.out")"
  grep -qF "FAILED:  j#1 fail-step-marker (exit 3)" "$TMP/fail.out" \
    && pass "(a) failing step named in the summary" \
    || fail "(a) summary does not name the failing step: $(head -c 400 "$TMP/fail.out")"
  grep -qF "gate:local — 1 run / 1 total, 0 skipped, 1 failed" "$TMP/fail.out" \
    && pass "(a) summary line exact" || fail "(a) summary line missing/wrong"
fi

echo "== MUST_BLOCK (b): constructs the runner cannot interpret => exit 2, named =="
# block_case <label> <needle-in-fixture> <name-the-runner-must-print> <yaml via stdin>
block_case() {
  local label="$1" needle="$2" named="$3" f="$TMP/b-$1.yml"
  cat >"$f"
  landed "$f" "$needle" "$label" || return 0
  run_gate "$TMP/b-$label.out" --workflow "$f" "${HEAD_ARGS[@]}"
  [ "$RC" -eq 2 ] && pass "(b/$label) exit code is 2" || fail "(b/$label) expected exit 2, got $RC: $(head -c 400 "$TMP/b-$label.out")"
  grep -qF -- "$named" "$TMP/b-$label.out" \
    && pass "(b/$label) names '$named'" \
    || fail "(b/$label) output does not name '$named': $(head -c 400 "$TMP/b-$label.out")"
}

block_case matrix-multi 'node: ["20.x", "22.x"]' 'matrix' <<'YML'
name: fixture
on: [push]
jobs:
  j:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: ["20.x", "22.x"]
    steps:
      - run: echo hi
YML
block_case workflow-key 'services:' 'services' <<'YML'
name: fixture
on: [push]
services:
  x: y
jobs:
  j:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
YML
block_case job-key 'container:' 'container' <<'YML'
name: fixture
on: [push]
jobs:
  j:
    runs-on: ubuntu-latest
    container: node:22
    steps:
      - run: echo hi
YML
block_case step-key 'continue-on-error:' 'continue-on-error' <<'YML'
name: fixture
on: [push]
jobs:
  j:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
        continue-on-error: true
YML
block_case shell 'shell: pwsh' 'pwsh' <<'YML'
name: fixture
on: [push]
jobs:
  j:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
        shell: pwsh
YML
block_case if-expr "if: contains(github.ref, 'x')" 'contains' <<'YML'
name: fixture
on: [push]
jobs:
  j:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
        if: contains(github.ref, 'x')
YML

echo "== MUST_PASS: --list on the real ci.yml; plan names every run: step =="
run_gate "$TMP/real.out" --list --workflow "$REAL_CI" "${HEAD_ARGS[@]}"
[ "$RC" -eq 0 ] && pass "--list on real ci.yml exits 0" || fail "--list on real ci.yml exited $RC: $(head -c 400 "$TMP/real.out")"

# Derived, never typed: the number of run: steps and uses: steps in ci.yml.
RUN_STEPS="$(grep -cE '^[[:space:]]*(-[[:space:]]+)?run:' "$REAL_CI")"
USES_STEPS="$(grep -cE '^[[:space:]]*(-[[:space:]]+)?uses:' "$REAL_CI")"
PLAN_LINES="$(grep -cE '^--- (WOULD RUN|SKIP) ' "$TMP/real.out")"
[ "$RUN_STEPS" -gt 0 ] && pass "derived run: step count from ci.yml = $RUN_STEPS (positive control: > 0)" \
  || fail "SETUP: derived 0 run: steps from ci.yml — the grep pattern is dead"
if [ "$PLAN_LINES" -eq $((RUN_STEPS + USES_STEPS)) ]; then
  pass "plan lists every step: $PLAN_LINES lines = $RUN_STEPS run: + $USES_STEPS uses:"
else
  fail "plan lists $PLAN_LINES steps, ci.yml has $RUN_STEPS run: + $USES_STEPS uses:"
fi
grep -qE '^gate:local — [0-9]+ run / [0-9]+ total, [0-9]+ skipped, 0 failed' "$TMP/real.out" \
  && pass "--list prints the summary line" || fail "--list summary line missing"

echo "== DERIVED, not typed: a step appended to a copy of ci.yml appears with no runner edit =="
awk '{ print } /tarball-cited-paths-guard\.mjs/ { print "      - name: zz-added"; print "        run: echo zz-added" }' \
  "$REAL_CI" >"$TMP/added.yml"
if landed "$TMP/added.yml" "run: echo zz-added" "appended step"; then
  run_gate "$TMP/added.out" --list --workflow "$TMP/added.yml" "${HEAD_ARGS[@]}"
  [ "$RC" -eq 0 ] && pass "--list on the mutated copy exits 0" || fail "--list on mutated copy exited $RC"
  grep -qE '^--- WOULD RUN .*zz-added' "$TMP/added.out" \
    && pass "zz-added is in the plan as a runnable step" \
    || fail "zz-added missing from the plan"
  ADDED_LINES="$(grep -cE '^--- (WOULD RUN|SKIP) ' "$TMP/added.out")"
  [ "$ADDED_LINES" -eq $((PLAN_LINES + 1)) ] && pass "plan grew by exactly one step" \
    || fail "plan went $PLAN_LINES -> $ADDED_LINES, expected +1"
fi

echo "== MUST_SKIP: a publishing job never runs, whatever form the publish command takes =="
# Forms of "publish" after a package manager: bare, with flags between, each manager.
# The job also holds `exit 3`: if the job were NOT skipped the run would fail (exit 1).
i=0
for cmd in "npm publish" "pnpm publish" "pnpm --filter @scope/pkg publish --access public" \
           "yarn publish" "bun publish"; do
  i=$((i + 1)); f="$TMP/pub-$i.yml"
  cat >"$f" <<YML
name: fixture
on: [push]
jobs:
  pub:
    runs-on: ubuntu-latest
    steps:
      - run: exit 3
      - run: $cmd
YML
  landed "$f" "run: $cmd" "publish form $i" || continue
  run_gate "$TMP/pub-$i.out" --workflow "$f" "${HEAD_ARGS[@]}"
  if [ "$RC" -eq 0 ] && grep -qF "gate:local — 0 run / 2 total, 2 skipped, 0 failed" "$TMP/pub-$i.out" \
     && grep -qF "publishes to the remote" "$TMP/pub-$i.out"; then
    pass "publish form '$cmd' => job skipped with a reason"
  else
    fail "publish form '$cmd' not skipped (exit $RC): $(head -c 400 "$TMP/pub-$i.out")"
  fi
done

echo "== browser steps: skipped with a reason by default, run with --install-browsers =="
cat >"$TMP/browser.yml" <<'YML'
name: fixture
on: [push]
jobs:
  b:
    runs-on: ubuntu-latest
    steps:
      - name: install-browser
        run: pnpm exec playwright install --with-deps chromium
      - name: drive-browser
        run: pnpm exec playwright test
YML
if landed "$TMP/browser.yml" "playwright test" "browser steps"; then
  run_gate "$TMP/browser-default.out" --list --workflow "$TMP/browser.yml" "${HEAD_ARGS[@]}"
  grep -qF "gate:local — 0 run / 2 total, 2 skipped, 0 failed" "$TMP/browser-default.out" \
    && pass "browser install + driver skipped by default" \
    || fail "browser steps not skipped by default: $(head -c 400 "$TMP/browser-default.out")"
  run_gate "$TMP/browser-on.out" --list --workflow "$TMP/browser.yml" "${HEAD_ARGS[@]}" --install-browsers
  grep -qF "gate:local — 2 run / 2 total, 0 skipped, 0 failed" "$TMP/browser-on.out" \
    && pass "--install-browsers un-skips both" \
    || fail "--install-browsers did not un-skip: $(head -c 400 "$TMP/browser-on.out")"
fi

echo
echo "probe-gate-local: $PASSES passed, $FAILS failed"
[ "$FAILS" -eq 0 ]
