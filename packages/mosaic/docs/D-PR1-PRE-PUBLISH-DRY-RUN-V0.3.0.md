# D-PR1 — Pre-Publish Dry-Run Evidence · `@vantageos/mosaic` v0.3.0 GA

> **EN** — Hard-evidence report for the v0.3.0 GA pre-publish gate. Every claim below is an
> actual command run in a fresh sandbox worktree off `origin/main` this session, with its real
> output. This is the gate **before** `tag v0.3.0` + D-T1 publish. **No real `npm publish` was run.**
>
> **FR** — Rapport de preuves dures pour le gate pré-publication v0.3.0 GA. Chaque affirmation
> ci-dessous correspond à une commande réellement exécutée dans un worktree sandbox neuf depuis
> `origin/main` lors de cette session, avec sa sortie réelle. C'est le gate **avant** `tag v0.3.0`
> + publish D-T1. **Aucun `npm publish` réel n'a été exécuté.**

| Field | Value |
|---|---|
| Mission | `k57b6d1bzc318pc4gqmhe4tapx88jqbd` |
| Task | `k177e1wrem6dzv4xwrpd7h380d88kmpp` (Mosaic D-PR1) |
| Orchestrator | Gamma — VantageOS Team |
| Date | 2026-06-13 |
| Sandbox worktree | `/tmp/wt-dpr1` (branch `gamma/v0.3.0-D-PR1-pre-publish-dry-run`) |
| Base | `origin/main` @ `7ae5450ac960aa4c3410b62b9dd35b41a579d942` |
| Package version | `0.3.0` |
| pnpm | 10.33.0 · Node 20.20.1 |

---

## 1. SANDBOX_BUILD_PASS_ID

```
SANDBOX_BUILD_PASS_ID = 7ae5450ac960aa4c3410b62b9dd35b41a579d942
```

`git rev-parse HEAD` in the sandbox worktree after a clean install + clean build (the `build`
script sets `NODE_OPTIONS=--max-old-space-size=8192` and a `prebuild` step `rm -rf dist`). This SHA
is the build-pass identity (RULE #19 build-pass) for v0.3.0 GA.

```
$ pnpm install --frozen-lockfile
Scope: all 4 workspace projects
Lockfile is up to date, resolution step is skipped
Done in 4.5s using pnpm v10.33.0
INSTALL_EXIT=0
```

```
$ pnpm --filter @vantageos/mosaic run build
…(tsup: full ESM + CJS + DTS surface emitted)…
BUILD_EXIT=0
```

**Build exit code: `0`.**

---

## 2. Gate 1 — Cross-runtime build parity

```
$ bash scripts/verify-build-parity.sh
PASS: cross-runtime build parity green (react 7 entries × 3 ext + preact 7 entries × 2 ext + tokens × 3 ext)
GATE1_EXIT=0
```

dist surface confirmed: **react 7 entries** (ESM `.js` + CJS `.cjs` + DTS `.d.ts`/`.d.cts`),
**preact 7 entries** (ESM `.js` + DTS `.d.ts`), plus **tokens** (3 ext). **Gate 1 exit: `0`.**

---

## 3. NPM pack dry-run (no real publish)

```
$ cd packages/mosaic && npm pack --dry-run
npm notice 📦  @vantageos/mosaic@0.3.0
npm notice name: @vantageos/mosaic
npm notice version: 0.3.0
npm notice filename: vantageos-mosaic-0.3.0.tgz
npm notice package size: 511.8 kB
npm notice unpacked size: 3.0 MB
npm notice shasum: 31caed2f9cbee5163a431ea694aff74a71a704bc
npm notice total files: 150
NPMPACK_EXIT=0
```

Parsed tarball manifest (`npm pack --dry-run --json`):

| Field | Value |
|---|---|
| name | `@vantageos/mosaic` |
| version | **`0.3.0`** |
| filename | `vantageos-mosaic-0.3.0.tgz` |
| total files | **150** |
| packed size | **511.8 kB** |
| unpacked size | **3.0 MB** |
| shasum | `31caed2f9cbee5163a431ea694aff74a71a704bc` |
| `CHANGELOG.md` present | ✅ true |
| `README.md` present | ✅ true |
| `package.json` present | ✅ true |
| `registry.yaml` present | ✅ true |
| `dist/` files | 146 |
| `dist/react/*` subpath files | 48 |
| `dist/preact/*` subpath files | 24 |

**`npm pack --dry-run` exit: `0`.** CHANGELOG + README + package.json + registry.yaml + full
`dist/` surface present; version is `0.3.0`.

### 3b. `npm publish --dry-run` — Eta gate verification (expected non-zero)

```
$ npm publish --dry-run
…
ETA_APPROVED_TASK_ID not set. Eta approval required before npm publish.
npm error code 1
PUBLISH_DRYRUN_EXIT=1
```

This non-zero is **expected and correct**: `prepublishOnly`
(`build && test && size-limit && check-eta-gate.js`) fires on any publish path, and
`scripts/check-eta-gate.js` **blocks** because `ETA_APPROVED_TASK_ID` is unset. This proves the
human-approval publish guard is wired and will block an unapproved D-T1 publish. The authoritative
tarball-content evidence is `npm pack --dry-run` (§3, exit 0).

---

## 4. Cross-runtime subpath coverage gate (corrected, vendored B-PR3)

> Uses the **corrected VENDORED** gate on `main`
> (`scripts/cross-runtime-subpath-coverage-check.py`, `RUNTIME_PREFIXED`), **NOT** the canonical
> B-PR1 skill / B-PR2 hook (which carry a known layout defect — see §6).

```
$ python3 packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py --package-root packages/mosaic --ga-mode
Mosaic cross-runtime subpath coverage check
Package root : /tmp/wt-dpr1/packages/mosaic
Registry     : /tmp/wt-dpr1/packages/mosaic/registry.yaml
Categories   : 7 bare exports found

PASS (0 missing entries)

All 7 categories have non-empty /react and /preact counterparts.
CROSSRUNTIME_EXIT=0
```

**Cross-runtime gate exit: `0` · 0 missing entries.**

---

## 5. Full gate set (sandbox confidence — whole-pipeline doctrine)

All CI gates re-run locally in the sandbox to confirm the green state observed on `main` CI.

| # | Gate | Command | Result | Exit |
|---|---|---|---|---|
| — | tsc | `pnpm -r exec tsc --noEmit` | clean | **0** |
| — | biome | `pnpm exec biome check --error-on-warnings .` | Checked 242 files, no fixes | **0** |
| — | vitest | `pnpm --filter @vantageos/mosaic run test` | **854 passed** (59 files) | **0** |
| — | playwright-axe | `playwright test tests/a11y/` (vs running SB) | **29 passed**, axe 0 violations | **0** |
| — | size-limit | `pnpm --filter @vantageos/mosaic run size-limit` | index 133.19 kB ≤ 250 · react/forms 20.79 kB ≤ 50 · preact/forms 20.79 kB ≤ 50 | **0** |
| — | registry-drift | `node scripts/mosaic-registry-drift-check.mjs` | `OK (no mismatch)` | **0** |
| — | storybook-test | `test-storybook --url http://127.0.0.1:6006` | **103 passed** (26 suites) | **0** |
| Gate 1 | build-parity | `bash scripts/verify-build-parity.sh` | PASS | **0** |
| Gate 2 | peer-resolution smoke | `bash e2e/peer-resolution/run-smoke.sh` | both fixtures green (react-only + preact-only) | **0** |
| Gate 3 | coherence (tokens) | `pnpm --filter @vantageos/mosaic-tokens test --reporter=verbose --bail=1` | **10 passed** | **0** |
| Gate 4 | cross-runtime coverage | `cross-runtime-subpath-coverage-check.py … --ga-mode` | 0 missing | **0** |

**Sandbox note (playwright-axe + storybook-test):** the Playwright config's `webServer` launches
`storybook dev` (cold > 120 s in this sandbox → webServer timeout). Both browser gates were instead
run against a **static** Storybook (`pnpm … build-storybook` → served via `http-server@14` on
`:6006`) — identical to the CI `storybook-test` step's serving model and to Playwright's
`reuseExistingServer` path. The static-served runs are functionally equivalent to CI. Server was
killed and port `:6006` freed after the runs.

**All gates green in the sandbox.**

---

## 6. BLOCKER BEFORE D-T1 — canonical layout defect (must fix before `tag v0.3.0`)

> ⚠️ **EN** — The CANONICAL B-PR1 skill `check.py` and the B-PR2 npm-publish hook assume a
> **category-prefixed** layout (`./forms/react`). Mosaic is **runtime-prefixed**
> (`./react/forms`). The canonical artifacts therefore **false-FAIL** the coverage check on this
> repo. The corrected, vendored gate (§4, `RUNTIME_PREFIXED`) is what proves coverage green here.
> **Before tagging v0.3.0 or running D-T1 publish**, the canonical B-PR1 skill / B-PR2 publish hook
> MUST be fixed — otherwise the publish hook **false-blocks** the real publish. Flagged to Sigma
> (task **`k176e5rpz`**, fix pending).
>
> ⚠️ **FR** — Le skill CANONIQUE B-PR1 `check.py` et le hook npm-publish B-PR2 supposent une
> structure **préfixée par catégorie** (`./forms/react`). Mosaic est **préfixé par runtime**
> (`./react/forms`). Les artefacts canoniques produisent donc un **faux-ÉCHEC** sur ce repo. Le gate
> vendorisé corrigé (§4, `RUNTIME_PREFIXED`) est celui qui prouve la couverture verte ici. **Avant
> de tagger v0.3.0 ou de lancer le publish D-T1**, le skill B-PR1 / hook publish B-PR2 canoniques
> DOIVENT être corrigés — sinon le hook de publication **bloque à tort** la vraie publication.
> Signalé à Sigma (tâche **`k176e5rpz`**, correctif en attente).

Additionally, `prepublishOnly` requires `ETA_APPROVED_TASK_ID` (the Eta human-approval gate, §3b) —
this must be set at D-T1 publish time after Eta review approval.

---

## Verdict

✅ **GREEN — pre-publish dry-run passes.** Sandbox build-pass (`7ae5450`), Gate 1 build-parity,
`npm pack --dry-run` (150 files / 511.8 kB / v0.3.0, CHANGELOG + dist present), cross-runtime
coverage gate (0 missing), and the full gate set are all green in a fresh sandbox.

**Two preconditions for D-T1 publish:** (1) fix the canonical B-PR1/B-PR2 layout defect (Sigma
`k176e5rpz`) so the publish hook doesn't false-block; (2) set `ETA_APPROVED_TASK_ID` after Eta
review approval.

---

Orchestrator: Gamma — VantageOS Team | 2026-06-13
