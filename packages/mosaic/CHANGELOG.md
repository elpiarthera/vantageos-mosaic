# Changelog

All notable changes to `@vantageos/mosaic` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.5.0] — 2026-10-11 — MCP App kit for ChatGPT and Claude (D0)

### Added
- **Behaviour change — declared secrets never reach `content[]`.** `createMosaicResource` (published `./server`) now strips every field declared in `MOSAIC_NEVER_SERIALISE` from the embedded props BY DEFAULT; pass `includeSecrets: true` to keep the previous behaviour. `createMosaicToolResult` carries a declared secret only in `_meta["mosaic/secrets"]` and throws `MosaicSecretLeakError` (naming the field, never the value) if one appears in `content[]`, or if a declared field does not exist on the view. A `TableView` column flagged `sensitive` is masked in markdown and stripped from the embedded props. `TokenDisplayOnceModal`'s fallback carries label, scope, expiry and an issuer-supplied fingerprint, never the token.
- **Behaviour notes for the #75 fallbacks.** `openLink` now hands the host the PARSED href, so `https://x.example` is sent as `https://x.example/` (trailing slash; a raw string with an embedded newline can no longer reach the host). The TransactionPreview markdown fallback joins the swap route with `→` instead of `>` (`USDC → WFUSE → FUSE`), because `>` is escaped as markdown. The secret guard in `createMosaicToolResult` compares case-folded and NFKC-normalised text on both sides.
- **Gate 4 script fail-closed** (`scripts/cross-runtime-subpath-coverage-check.py`): exit 2 naming the input for any unreadable input (package root, `package.json`, registry, built entry, empty category set, a registry that yields no categories or has no `components` list, or the PyYAML and built-in readers disagreeing) and exit 1 only for a real coverage gap; the default `--package-root` is the package the script lives in, not the working directory; the registry cross-check no longer skips without PyYAML (built-in reader) or with a missing registry (`--skip-registry-check` is the explicit opt-out).
- **MCP Apps views and host layer, delivery 2 (task k17ehg71z31ec50fkh95p3xxr58fjm98; Eta corrections k178bt8enj99wv1gtc8h3315kx8g0w13).**
  - **Views** (React + Preact barrels, FR+EN, Zod, Skeleton loading, `{}` parses as an empty state, A-1 markdown): `StatCard` (R08) and `BalanceCard` (R09, Fuse balance, exact decimal strings) in `display`; `MessageFeed` (R03, read-only, plain text, safe links) and `PipelineBoard` (R06, read-only, fullscreen board / inline summary, stage filter chips) in `display`; `Timeline` (R02) in `progress`; `TransactionPreview` (R11, prepare-only, swap-quote variant, **no sign / send / approve control**, "NOT SIGNED - preparation only") in `confirmation`.
  - **`TableView` extended** (R01 / R10, every new prop optional): sortable columns with `aria-sort`, `single` / `multiple` selection (`onSelectionChange` rows + keys), sticky header, compact density, column `align` / `width`, `amount` (exact decimal string compare) and `icon` cell kinds, `loading` Skeleton, serialisable `rows` in the schema.
  - **`RadioGroup` / `MultiSelect`** (R25): `appearance` `segmented` | `chips` (RadioGroup) and `chips` (MultiSelect: visible toggle buttons, `aria-pressed`, no dropdown).
  - **Host layer** (`./host`, `./react/host`, `./preact/host`): safe-area insets (H01), host style variables bridged onto mosaic-tokens + host fonts + transparent background (H02), `sendMessage` / `openLink` helpers that refuse what the host cannot honour (H04, H18), typed model-context blocks + `openai/modelContext` read + `selectionModelContext` (H03), hooks `useMosaicHostLayout`, `useSendMessage`, `useOpenLink`.
  - **Server**: `buildMcpAppResource({ visibility, hostFonts })` (H05); `createMosaicToolResult` returning `content: [text, ui:// resource]` (A-1) and a `<name>ToMarkdown` for all 12 components (H17). `createMosaicResource` now supports 12 components, honours its `uri` and `markdownFallback` options, and `_meta.ui.fallback` (kept: published contract) carries the data instead of a title and note.
  - **Adapter**: `startSizeReporting` / `postSizeChanged` send `ui/notifications/size-changed` from the raw adapter (H15).
- **Fix — host-context dispatcher** (Eta #74 re-gate): a foreign handler that overwrites `app.onhostcontextchanged` while subscribers are live is adopted as `previous` and the dispatcher reinstalled on the next subscribe; resubscribe-after-full-unsubscribe is pinned by a test that goes RED when `dispatchers.delete(app)` is removed.
- **MCP Apps host layer for ChatGPT and Claude (task k17ehg71z31ec50fkh95p3xxr58fjm98, items 1-2).** New subpaths `./host` (framework-agnostic core: host theme/display mode/locale/container dimensions, `openai/deepLink` when present, `requestDisplayMode` limited to inline | fullscreen with a typed AND runtime refusal of `pip` for a ChatGPT host, `updateModelContext` over `ui/update-model-context`, host theme mapped onto mosaic-tokens `data-theme`), `./react/host` and `./preact/host` (hooks over the core) and `./server/resource` (`buildMcpAppResource`: pure, no React/DOM; `_meta.ui` standard keys first with the four csp arrays explicit, `domain` derived from `servedUrl` for Claude, `openai/*` keys only when passed: `_meta["openai/ui"]` display modes on the resource, `openai/outputTemplate` and `openai/ui` entrypoints on the tool; deepLink typed as `{ url }`; ChatGPT detected from `openai/*` keys, no user-agent sniffing). Composes with ext-apps `registerAppResource`/`registerAppTool`, which pass `_meta` through. No new dependency: the ext-apps `App` is typed structurally.
- **Fix — `react/media` and `preact/media` were empty barrels; Gate 4 passed anyway.** Both now re-export `StatusBadge` (+ props type, schema, validator) from the existing `display` components (display exports kept, no new component), and Gate 4 now fails any runtime subpath entry whose built `.js` or `.d.ts` exports zero symbols, naming the entry (`exports-zero-symbols`).

---

## [0.4.0] — 2026-10-04

### Added
- **Badge primitive, cross-runtime.** `Badge` is exported from `./display`, `./react/display` and
  `./preact/display`, with its schema, stories, i18n strings and a 205-line React test. Landed on
  `main` in #61 against `target 0.3.2` and unpublished until this release, so no consumer could
  import it.
- **`docs/GA-RELEASE-V0.3.1.md`** — the canonical release procedure (bilingual EN+FR): the five
  fail-closed CI gate jobs, the `ETA_APPROVED_TASK_ID` approval hook, the
  `prepublishOnly`/`postpublish` workspace-rewrite pattern, the 0.3.0 → 0.3.1 incident and its
  lesson, the cross-runtime architecture and the migration guide. Written for 0.3.1 and itself
  unpublished until now, which is why this release follows it rather than a recalled procedure.

### Documentation
- **The package README was frozen at 0.3.1 and is rewritten against the built artifact.**
  It told a consumer to `npm install @vantageos/mosaic@^0.2.0 @vantageos/mosaic-tokens@^0.2.0`,
  neither of which is what ships. Corrected to the versions actually published.
- **Six sentences claiming form primitives were still unshipped are deleted.** Each had
  been appended as a primitive landed and never removed, so each sat directly above a
  table row documenting the very primitive it called missing. All of Input, Textarea,
  Select, Checkbox, MultiSelect, RadioGroup and FieldArray are exported — read from
  `dist/react/forms.d.ts`, not from the prose.
- **A derived per-subpath export inventory replaces a partial list that read as complete.**
  It records that `media` exports no components although it is one of the seven categories
  gated for cross-runtime parity.
- **Bundle sizes are the `size-limit` output with their gates**, replacing figures for
  surfaces the gate no longer measures.
- **The changelog link pointed at the repo root**, which is not the file the tarball
  carries; it now points at this one.
- **The README stated MIT while `package.json` carried no `license` field** and `files`
  shipped no LICENSE, so every version up to 0.3.1 reached consumers with no licence terms
  at all.

### Added — licence
- **`FSL-1.1-Apache-2.0` is now declared and shipped.** `package.json` carries the
  `license` field, `LICENSE` is in `files`, and the file is byte-identical to the one every
  sibling `@vantageos` package ships
  (sha256 `3d458972e6e84e5d2361a886ef64b07aefdc38dd8955e281ea8c2ae8849646a4`). Verified
  against what the registry serves for `mosaic-blocks`, `mosaic-tokens` and `mcp-doctor` —
  this package was the only one of the four publishing `license: NONE`. Nothing about the
  terms is new; they were simply never attached to this package.

### Changed
- **`@vantageos/mosaic-tokens` moves from `^0.2.0` to `^0.7.0`** in the published manifest. This is
  why the release is `0.4.0` and not the `0.3.2` the source commit targeted: `^0.2.0` does **not**
  satisfy `0.7.0` (a caret on a `0.x` range pins the minor), so a consumer upgrading receives a
  five-minor jump in a runtime dependency. On a `0.x` package the minor is the only available
  signal for that, and a patch number would have understated it.

  The range was never edited by hand — the manifest carries `workspace:*` and `prepublishOnly`
  resolves it to whatever the sibling package is at, which is now `0.7.0`. That is correct
  behaviour and it is precisely why the published version has to be derived from the packed
  tarball rather than from the commit that said `target 0.3.2`.

### Note on this release
Nothing else changed in the source. `latest` served `0.3.1` from 2026-06-13 until this version, so
the items above are the entire delta a consumer receives — derived by locating the commit that set
the version to `0.3.1` and listing what touched `packages/mosaic` after it, not by reading a date
window (a date window includes the release commits themselves and reported 19).


### Recorded late — shipped by 0.4.0 at the latest, never listed in a release section

These entries sat under `[Unreleased]` after their code had shipped. Each one's commit is an ancestor of the 0.4.0 release commit `12475a6` (`git merge-base --is-ancestor <sha> 12475a6`).

- **D-PR1 — Pre-publish dry-run evidence for v0.3.0 GA.** New doc `docs/D-PR1-PRE-PUBLISH-DRY-RUN-V0.3.0.md` (bilingual EN+FR) capturing the hard-evidence pre-publish gate run in a fresh sandbox worktree off `origin/main` @ `7ae5450`: sandbox build-pass (RULE #19, `SANDBOX_BUILD_PASS_ID=7ae5450`, build exit 0), Gate 1 build-parity (exit 0), `npm pack --dry-run` (150 files / 511.8 kB / unpacked 3.0 MB / version 0.3.0 / sha `31caed2f`, CHANGELOG + README + package.json + registry.yaml + full `dist/` surface present — **no real publish**), corrected vendored cross-runtime subpath coverage gate (`--ga-mode`, exit 0, 0 missing), and the full gate set re-run green (tsc, biome, vitest 854, playwright-axe 29, size-limit, registry-drift, storybook-test 103, Gate 2 peer-resolution, Gate 3 coherence 10). Documents the **D-T1 blocker**: the canonical B-PR1 skill / B-PR2 publish hook carry a category-prefixed layout defect (`./forms/react`) vs Mosaic's runtime-prefixed layout (`./react/forms`) and **false-block** the real publish — must be fixed before `tag v0.3.0` (Sigma task `k176e5rpz`); plus `ETA_APPROVED_TASK_ID` must be set after Eta approval. Mission `k57b6d1b` · task `k177e1wr`. No source/build/gate code changed — docs-only.
- **CI Gate 4 — Cross-runtime subpath coverage (B-PR3).** New fail-fast CI gate asserting that **every bare component category** in `packages/mosaic/package.json` `exports` (`./forms`, `./progress`, `./display`, `./artifacts`, `./confirmation`, `./media`, `./input`) also exports a **non-empty** `dist` artifact under **both** `./react/<cat>` and `./preact/<cat>`. This is the gate that would have caught the original v0.3.0 GA blocker (foundation components present as bare exports but missing/empty under `/react` + `/preact`).
  - New vendored script `packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py` — vendored from the canonical B-PR1 skill `mosaic-cross-runtime-subpath-coverage-check` (VantageRegistry; PR #20). Stdlib-only, with an optional PyYAML registry cross-check that degrades gracefully when PyYAML is absent (no Python dependency added to CI). Carries one documented deviation: a `RUNTIME_PREFIXED` toggle adapting the canonical category-prefixed layout (`./forms/react`) to this repo's runtime-prefixed layout (`./react/forms`).
  - New job `cross-runtime-subpath-coverage` (`needs: build-parity-cross-runtime`) builds tokens + mosaic so `dist/` exists, then runs `python3 .../cross-runtime-subpath-coverage-check.py --package-root packages/mosaic --ga-mode` (exit 1 fails CI with a `component × runtime` diagnostic). CI-side equivalent of the B-PR2 npm-publish hook.
  - New doc `docs/CROSS-RUNTIME-GATE.md` (bilingual EN+FR). Additive change — no existing gate (Gate 1 build-parity, Gate 2 peerDeps smoke, Gate 3 coherence, `ci` job) weakened or replaced. Mission `k57b6d1b` · task `k176pzsszyy4v3f505khwg33gx88j36n`.

#### Fixed
- CI Gate 2 (PeerDeps optionality smoke) now runs GREEN (unblocks v0.3.0 GA publish gate). Two layered bugs, both packaging-scope:
  - **Build (tsup):** the preact runtime bundles that re-export the shared React implementation (`preact/progress`, `preact/input`, `preact/confirmation`, `preact/forms`) shipped `import … from "react/jsx-runtime"` and `import … from "react"`. `esbuildOptions.alias` (`react → preact/compat`) never fired because tsup auto-externalises peerDeps (`react`, `react/jsx-runtime`) *before* alias resolution, so the alias was a no-op for those specifiers. A react-only consumer (which has react) could therefore resolve `@vantageos/mosaic/preact/*` even with preact absent — optionality broken in both directions. Fix: replaced the alias with an esbuild `onResolve` plugin (`mosaic-react-to-preact`) that deterministically rewrites the whole react family (`react`, `react-dom`, `react-dom/client`, `react/jsx-runtime`, `react/jsx-dev-runtime`) to their preact equivalents and marks them external; paired with `noExternal: [/^react…/]` on the preact pass so tsup's own external plugin returns undefined for the react family and lets the rewrite run. Added `preact/jsx-runtime` to `PREACT_EXTERNAL`. Preact bundles now import only preact specifiers; react bundles unchanged.
  - **Smoke fixture (run-smoke.sh):** the fixtures installed mosaic via `npm install file:../../../packages/mosaic`, which npm symlinks into the monorepo source tree; Node then resolved the bundle's runtime imports by climbing out of the fixture into the monorepo root `node_modules` (where both react and preact are hoisted devDeps), producing a false PASS. Rewrote the driver to model a real npm consumer faithfully: `pnpm pack` both packages (rewriting the `workspace:*` tokens dep to a concrete version) and install the tarballs into an isolated `mktemp -d` consumer outside the repo tree, with `--legacy-peer-deps` so npm does not auto-install the *transitive* peer react pulled by `@tanstack/react-virtual` into a preact-only consumer. Fixture assertions (`index.mjs`) untouched. Smoke now PASSES: react-only resolves `react/*` and fails `preact/*`; preact-only resolves `preact/*` and fails `react/*`.
- CI `biome check --error-on-warnings` now exits 0 on `main` (unblocks v0.3.0 GA publish gate): suppressed 6 `noNonNullAssertion` lint errors in VirtualList tests (React + Preact) with justified `biome-ignore` comments matching repo convention, plus format/organizeImports auto-fixes across 7 files.
- `forms/Select.tsx` (React + Preact) biome a11y gate: replaced the blanket `biome.json` per-file rule override with scoped, justified `biome-ignore` comments on exactly the 6 flagged ARIA roles per runtime (`useSemanticElements` on the `combobox`/`listbox`/`option` roles, `noNoninteractiveElementToInteractiveRole` on `ul`→`listbox` + `li`→`option`, `useFocusableInteractive` on the `li`). These are biome heuristic false-positives on the WAI-ARIA APG combobox + listbox pattern (options managed via `aria-activedescendant`, intentionally not in the tab order). Comments mirror the existing `noAutofocus` APG-pattern suppression; no JSX/logic changed. Added `tests/a11y/Select.spec.ts` (axe-core) proving 0 violations on the pattern.
- CI `playwright-axe` step now runs GREEN (unblocks v0.3.0 GA `npm-publish` gate, which is `needs: ci`). Root cause from real CI logs: the runner ships no browsers, so every a11y spec died at `browserType.launch` ("Executable doesn't exist"). Fixes: (1) added a `playwright install --with-deps chromium` step before `playwright-axe` in `.github/workflows/ci.yml`; (2) normalized the stale `/storybook/?story=` spec URLs (StatusBadge, MarkdownRenderer, ConfirmDialog, TokenDisplayOnceModal, ProgressBar) to the working `/iframe.html?id=` convention used by `Select.spec.ts`, corrected three wrong story-id slugs (`media-statusbadge--error-state`, `artifacts-markdownrenderer--error-state`, `progress-progressbar--default`), and scoped axe to `#storybook-root` so the Storybook iframe shell's page-level best-practice rules no longer mask component results; (3) `TableView.spec.ts` now waits via `getByRole("table")` (matches the native `<table>` implicit role; the CSS `[role="table"]` selector never matched) and scopes axe to `#storybook-root`.
- `display/TableView.tsx`: fixed a real axe violation (`scrollable-region-focusable`, WCAG 2.1.1 / 2.1.3, serious) — the virtualized scroll viewport is scrollable but was not keyboard-operable. Added `tabIndex={0}` + `role="region"` + `aria-label` (justified `biome-ignore` comments matching repo convention). Full `tests/a11y/` suite now passes 29/29 with axe 0 violations under `CI=true` against the Playwright `webServer`.

---

---

## [0.3.1] — 2026-06-13 — hotfix: workspace:* leak in published 0.3.0 manifest (Path B — root-cause fix)

### Fixed
- **External npm install of `@vantageos/mosaic@0.3.0` was broken**: the published manifest carried `"@vantageos/mosaic-tokens": "workspace:*"` as a runtime dependency. The `workspace:*` protocol is a bun/pnpm/yarn monorepo specifier that the npm registry cannot resolve to a real version, so any external `npm install @vantageos/mosaic` failed with `ETARGET No matching version found for @vantageos/mosaic-tokens@workspace:*`. Gamma flag via Pi msg `jn77k1v2414far8z5b7abxgjqn88jq9b`. Task `k1769bhq5f7z56yyfs143jsw5588k7j6` (mission `k57b6d1bzc318pc4gqmhe4tapx88jqbd`).

### Path B — root-cause fix (Gamma defect-owner recommendation, msg `jn7fjf62mnzrwfhe2p9vfwymxn88ks67`)

The first iteration of this PR rewrote `packages/mosaic/package.json` source from `workspace:*` → `^0.2.0`, but this approach:
- broke CI (`ERR_PNPM_OUTDATED_LOCKFILE` — pnpm frozen-lockfile no longer matched the manifest), AND
- severed the monorepo workspace link (sibling `mosaic-tokens` would resolve from npm, not the local package), AND
- re-leaks on every future release unless the spec is permanently pinned (which breaks dev linking).

Path B keeps the source `workspace:*` reference (lockfile stays valid → CI green) and **rewrites at publish-time only**:

- **NEW** `packages/mosaic/scripts/rewrite-workspace-deps.mjs` — Node stdlib-only script. Walks `dependencies` / `peerDependencies` / `devDependencies` / `optionalDependencies`; for every `workspace:*` (or `workspace:^` / `workspace:~`) ref, reads the sibling package's `package.json` `version` field from `packages/<bare-name>/package.json` and rewrites the spec to `^<version>`. Mutates `packages/mosaic/package.json` in place for the duration of the publish step.
- **MODIFIED** `prepublishOnly` script now runs the rewrite FIRST: `node scripts/rewrite-workspace-deps.mjs && pnpm run build && pnpm run test && pnpm run size-limit && node scripts/check-eta-gate.js`.
- **NEW** `postpublish` script reverts the mutation via `git checkout HEAD -- package.json`, leaving the source repo in its workspace-linked state for monorepo dev.

This preserves monorepo dev (`workspace:*` resolves to the local sibling) AND ships a registry-resolvable manifest (`^<version>` in the published tarball). The rewrite happens during `npm publish` (which invokes `prepublishOnly` automatically), and the postpublish revert ensures no source drift.

### Verify post-publish
- `npm view @vantageos/mosaic@0.3.1 dependencies` — `@vantageos/mosaic-tokens` shows `^0.2.0`, no `workspace:*` anywhere.
- Clean install: `mkdir /tmp/smoke && cd /tmp/smoke && npm init -y && npm install @vantageos/mosaic@0.3.1` — exits 0, pulls `@vantageos/mosaic-tokens@0.2.0` from registry.
- `git diff HEAD -- packages/mosaic/package.json` post-publish — clean (postpublish reverted).

### F-list track
- Tracked in F-list `k173e0bwvfpmngwrrtcqh3zzj988fnaq` priority MAX. The rewrite script is fleet-wide reusable for any other `@vantageos/*` monorepo package that publishes via `npm publish` (vs `pnpm publish` which auto-rewrites).

---

## [0.3.0] — GA — 2026-06-13

### Added
- All Wave 1 + Wave 2 components promoted from `0.3.0-alpha.1` with no breaking API changes.
- `forms` category becomes stable (7th top-level taxonomy bucket).

---

## [0.3.0-alpha.1] — 2026-06-11

### Added
- **`RadioGroup`** (Wave 2 T17) — WCAG-AA mutually exclusive single-choice form primitive. Cross-runtime: `@vantageos/mosaic/react/forms` + `@vantageos/mosaic/preact/forms`. Roving tabindex (WAI-ARIA §3.10), Arrow/Home/End keyboard navigation, `aria-orientation`, group-level and per-option disabled.
- **`Select`** (Wave 2 T13) — single-select dropdown implementing the ARIA combobox+listbox pattern (APG 2024). Optional in-popup search. ArrowUp/Down/Home/End/Enter/Escape/type-ahead keyboard navigation. Shared pure logic (`Select.logic.ts`) referenced by both runtimes.
- **`MultiSelect`** (Wave 2 T15) — multi-value dropdown with removable chips. `aria-multiselectable`, per-chip `aria-label="Remove {label}"`, `maxItems` gate, searchable filter, Backspace removes last chip.
- **`Textarea`** (Wave 2 T12) — multi-line text input with optional `autoResize` (grow-to-fit) and `maxLength` clamping enforced at the `onChange` boundary before RHF receives the value.
- **`Input`** (Wave 2 T11) — first field primitive of the `forms` category. Five HTML input types (`text | email | password | number | url`). `aria-invalid` + `aria-describedby` wired automatically.
- **`Checkbox`** (Wave 2 T14) — boolean checkbox with `indeterminate` state (DOM `.indeterminate = true` + `aria-checked="mixed"`), optional `description` wired to `aria-describedby`.
- **`FieldArray`** (Wave 2 T16) — render-prop wrapper around RHF `useFieldArray`. Keys rows by stable `field.id` (not array index). Provides `append / remove / move / swap / insert / prepend / replace / update`. WCAG-AA `role="list"` + `role="listitem"` container.
- **`ConfirmModal`** alias (Wave 1 T9-v2) — thin re-export of `ConfirmDialog` on `@vantageos/mosaic/react/confirmation` and `@vantageos/mosaic/preact/confirmation`. Referential identity invariant (`ConfirmModal === ConfirmDialog`) enforced by tests.
- **`VirtualList<T>`** (Wave 1 T2) — generic virtualized list using `@tanstack/react-virtual` v3. API: `items`, `itemHeight`, `estimateSize`, `renderItem`, `onRowClick`, `overscan`, `className`, `locale`. WCAG-AA when `onRowClick` present (`role="button"`, `tabIndex={0}`, Enter/Space handlers). Bilingual empty state (EN/FR).
- **`forms` category** (Wave 2 T10 scaffold) — 7th top-level taxonomy bucket. Five scaffold primitives: `useMosaicForm`, `FormProvider`, `FormField`, `ErrorDisplay`, `SubmitButton`. Default validation mode `"onBlur"`. Subpaths: `@vantageos/mosaic/react/forms`, `@vantageos/mosaic/preact/forms`, `@vantageos/mosaic/forms` (back-compat root).
- `react-hook-form ^7.54.0` and `@hookform/resolvers ^3.10.0` added as optional peer dependencies.
- `./forms`, `./react/forms`, `./preact/forms` subpath exports added.

### Fixed
- Cascade-merge build break (hotfix 2026-06-11): restored JSDoc openers, deduped barrel re-exports, dropped phantom `Badge` refs, added missing `Skeleton` i18n strings.

### Wave 1 additions (also shipping in 0.3.0-alpha.1 codebase)
- **`Tabs`** (T5) — cross-runtime React 19 + Preact 10, WCAG-AA.
- **`Alert`** (T8) — persistent inline banner (React 19 + Preact 10).
- **`Toast`** (T3) — ephemeral notification (confirmation category, Chi+Hermes convergence).
- **`Skeleton`** (T6) — loading placeholder (React 19 + Preact 10).
- **`EmptyState`** (T7) — empty list / zero-data state (display category, Hermes+Chi convergence).
- Three new CI gate jobs wired into `ci.yml` per Standard v1.2 §20.

---

## [0.2.2] — 2026-06-11

### Fixed
- **Critical — §18.5 type surface contract**: `tsup.config.ts` react pass changed from `clean: true` to `clean: false`. The three sibling tsup configs (react / preact / tokens re-export) ran their DTS phases in parallel; the react DTS pass finished last and previously wiped `dist/preact/*.d.ts` and `dist/tokens.d.ts` written by the sibling passes. All DTS files now persist on disk.
- Added `prebuild` script (`node -e "fs.rmSync('dist',{recursive:true,force:true})"`) to guarantee a clean `dist` before tsup runs, replacing the racy in-pass `clean: true`.

---

## [0.2.1] — 2026-06-11 (YANKED — superseded by 0.2.2)

### Added
- `TableView.onRowClick(row, index)` and `StreamingTableView.onRowClick` — when provided, rows render with `role="button"`, `tabIndex={0}`, and Enter/Space keyboard handlers. Fixes 5-BU ABSOLUTE blocker (Phi + Chi + Theta + Hermes + Demeter).

### Notes
- 100% back-compat with v0.2.0: when `onRowClick` is undefined, row rendering is byte-identical to v0.2.0.

---

## [0.2.0] — 2026-06-02

### Added
- **Cross-runtime subpaths** — `@vantageos/mosaic/react/<cat>` (React 19) and `@vantageos/mosaic/preact/<cat>` (Preact 10) for all 6 categories (`progress`, `input`, `display`, `artifacts`, `confirmation`, `media`). Path A architecture (single package, multi-runtime subpaths) replaces forked maintenance.
- **`@vantageos/mosaic/tokens` subpath** — convenience re-export of `@vantageos/mosaic-tokens`.
- **tsup three sibling configs** — react pass (legacy v0.1.2 entries + new `react/<cat>`), preact pass (`preact/<cat>` ESM-only with esbuild `alias` mapping `react` → `preact/compat`), tokens re-export shim.
- **`preact ^10.25.0`** added to peerDependencies. All peer deps (`react`, `react-dom`, `preact`, `react-i18next`, `@mcp-ui/client`, `rxjs`) marked optional via `peerDependenciesMeta`.
- **`@vantageos/mosaic-tokens`** (new sibling package) — 58 framework-free design tokens across 6 categories: 15 colors (OKLCH × 3 shades × 5 statuses), 8 spacing values, 14 typography vars, 6 shadows, 7 radii, 8 motion. Three surfaces: CSS custom properties, typed JS exports, Tailwind v4 plugin.

### Changed
- Standard §18 "Cross-Runtime Support (v0.2.0 amendment)" published to `mosaic-architecture-standard-v1.md` documenting the A1 architecture, exports surface table, peerDependenciesMeta model, bundle targets, new CI gates, compatibility commitments, and per-BU migration guide.

---

## [0.1.2] — 2026-06-02

### Added
- Per-component subpath exports: `@vantageos/mosaic/progress`, `/input`, `/display`, `/artifacts`, `/confirmation`, `/media`, `/server`.
- `TableView` static rows array overload — accepts `rows: Row[]` for already-fetched data. Streaming variant renamed to `StreamingTableView` with `rows$: Observable`.

### Fixed
- Removed `recharts` from dependencies (unused in v0.1.0 — will re-add as optional peer when Chart component lands).
- Moved `rxjs` from dependencies → optional peerDependencies.

### Migration from 0.1.1
- Root imports (`import { Foo } from '@vantageos/mosaic'`) still work — root export preserved.
- For optimal tree-shaking, switch to subpath: `import { ProgressBar } from '@vantageos/mosaic/progress'`.
- Streaming usage: rename `<TableView rows$={obs}>` to `<StreamingTableView rows$={obs}>` and ensure `rxjs` is in your project deps.

---

## [0.1.1] — 2026-06-02

### Added
- `no-hardcode-strings.test.ts` — vitest AST scan enforcing zero raw JSX text children with alphabetic content (Eta axis 6 CONDITION fix path).
- Whitelist mechanisms: same-line `// allow-hardcode-i18n: <reason>` comment and file-level `// allow-hardcode-i18n-file: <reason>` comment.
- Auto-exempt: `.test.tsx`, `.spec.tsx`, `.stories.tsx` files.

---

## [0.1.0] — 2026-05-28

### Added
- Initial release — 6 consumer-driven MCP UI components: `MarkdownRenderer`, `TokenDisplayOnceModal`, `TableView`, `ConfirmDialog`, `StatusBadge`, `ProgressBar`.
- Monorepo scaffold: pnpm + turbo + 4 pattern infrastructure + CI gate.
- Zod runtime validation on all component props.
- `registry.yaml` with component catalogue.
- i18n consumer-driven model (zero hardcoded JSX text).

---

[Unreleased]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.2...v0.3.0
[0.3.0-alpha.1]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.2...v0.3.0-alpha.1
[0.2.2]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/elpiarthera/vantageos-mosaic/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/elpiarthera/vantageos-mosaic/releases/tag/v0.1.0
