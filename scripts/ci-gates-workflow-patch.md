# CI gates workflow patch — hand-apply required

The GitHub OAuth token used by this branch lacks the `workflow` scope,
so `.github/workflows/ci.yml` could not be updated via push. Pi (or
anyone with a token that has `workflow` scope) must hand-apply the
patch below before the 3 new gates become enforced in CI.

## Patch — insert these three jobs into `.github/workflows/ci.yml` immediately BEFORE the existing `npm-publish:` job.

```yaml
  build-parity-cross-runtime:
    name: Gate 1 — Cross-runtime build parity
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: "22.x"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @vantageos/mosaic-tokens build
      - run: pnpm --filter @vantageos/mosaic build
      - name: Gate 1 — verify-build-parity
        run: bash scripts/verify-build-parity.sh

  peer-resolution-smoke:
    name: Gate 2 — PeerDeps optionality smoke
    needs: build-parity-cross-runtime
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: "22.x"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @vantageos/mosaic-tokens build
      - run: pnpm --filter @vantageos/mosaic build
      - name: Gate 2 — peer-resolution smoke
        run: bash e2e/peer-resolution/run-smoke.sh

  coherence-test-mosaic-tokens:
    name: Gate 3 — Coherence dedicated (ship-blocker)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: "22.x"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Gate 3 — coherence dedicated (ship-blocker, no override)
        run: pnpm --filter @vantageos/mosaic-tokens test --reporter=verbose --bail=1
```

## Apply procedure

```sh
gh auth refresh -h github.com -s workflow   # interactive — adds workflow scope
# then edit .github/workflows/ci.yml hand-applying the snippet above
git add .github/workflows/ci.yml
git commit -m "ci(mosaic): wire 3 new gate jobs into ci.yml (workflow-scope push)"
git push
```

## Notes

- Gate 3 uses `--bail=1` (vitest 3.x requires explicit numeric value).
- Gate 1 and Gate 2 are expected to RED on first run against v0.2.0 dist —
  this is the intended diagnostic per Standard v1.2 §20 (no green-CI-illusion).
- Remediation (tsup preact DTS pass + tokens DTS shim + peer optionality
  enforcement) is a v0.3.0 T1 task — not in scope for this PR.
