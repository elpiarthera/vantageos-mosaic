# GA Release — `@vantageos/mosaic` v0.3.1

> **EN** — Canonical GA release document for `@vantageos/mosaic@0.3.1`, the clean GA of the
> Wave 1 + Wave 2 component surface. Version 0.3.0 was published then superseded same-day
> (2026-06-13) due to a `workspace:*` manifest leak; 0.3.1 is the durable fix. All consumers
> **must** use `>=0.3.1`.
>
> **FR** — Document de publication GA canonique pour `@vantageos/mosaic@0.3.1`, le GA propre de
> la surface composants Wave 1 + Wave 2. La version 0.3.0 a été publiée puis remplacée le jour même
> (2026-06-13) suite à une fuite de `workspace:*` dans le manifest ; 0.3.1 est le correctif durable.
> Tous les consommateurs **doivent** utiliser `>=0.3.1`.

| Field / Champ | Value / Valeur |
|---|---|
| Package | `@vantageos/mosaic` |
| GA version | **`0.3.1`** |
| dist-tag | `latest` |
| Published / Publié | 2026-06-13 @ 21:21 UTC |
| Supersedes / Remplace | `0.3.0` (withdrawn — workspace:* leak) |
| Mission | `k57b6d1bzc318pc4gqmhe4tapx88jqbd` |
| Task (D-PR3) | `k57d5sdasg7btynea9tnqqrsy985kf1z` |
| Orchestrator | Gamma — VantageOS Team |
| Worktree base | `origin/main` @ `239b093` |

---

## 1. Release Summary / Résumé de publication

### EN

`@vantageos/mosaic@0.3.1` is the GA release for the Wave 1 + Wave 2 component surface. It
introduces a complete cross-runtime architecture (`react` and `preact` runtime-prefixed subpath
exports), 7 component categories (`forms`, `progress`, `artifacts`, `confirmation`, `display`,
`input`, `media`), extracted design tokens (`@vantageos/mosaic-tokens`), and full WCAG-AA
accessibility coverage.

**0.3.0 was superseded same-day.** On 2026-06-13, `0.3.0` was published at 19:09 UTC and
immediately found to have a `workspace:*` protocol reference in the packed manifest for the
`@vantageos/mosaic-tokens` dependency. This caused `ETARGET` errors for every external consumer
attempting `npm install @vantageos/mosaic@0.3.0`. The version was superseded (not yanked) and
`0.3.1` was published at 21:21 UTC with the durable fix in place.

**Consumers must use `>=0.3.1`.** The `latest` dist-tag points to `0.3.1`.

### FR

`@vantageos/mosaic@0.3.1` est la publication GA de la surface composants Wave 1 + Wave 2. Elle
introduit une architecture cross-runtime complète (exports de sous-chemins préfixés par runtime
`react` et `preact`), 7 catégories de composants (`forms`, `progress`, `artifacts`, `confirmation`,
`display`, `input`, `media`), des design tokens extraits (`@vantageos/mosaic-tokens`), et une
couverture d'accessibilité WCAG-AA complète.

**0.3.0 a été remplacée le même jour.** Le 2026-06-13, `0.3.0` a été publiée à 19h09 UTC et une
référence `workspace:*` a été immédiatement détectée dans le manifest packagé pour la dépendance
`@vantageos/mosaic-tokens`. Cela provoquait des erreurs `ETARGET` pour tout consommateur externe
tentant `npm install @vantageos/mosaic@0.3.0`. La version a été supplantée (sans dépublication) et
`0.3.1` a été publiée à 21h21 UTC avec le correctif durable en place.

**Les consommateurs doivent utiliser `>=0.3.1`.** Le dist-tag `latest` pointe sur `0.3.1`.

---

## 2. Release Procedure / Procédure de publication

### EN

The following pipeline gates must all be green before any `npm publish` is executed.

#### 2.1 CI gates (job-level)

| Job | Gates inside | Fail-closes publish |
|---|---|---|
| `ci` | Lint (Biome) · Type check (tsc) · Unit tests (Vitest 854) · A11y (Playwright-axe 29) · Size-limit · Registry-drift · Storybook-test (103) | Yes — `npm-publish` needs `ci` |
| `build-parity-cross-runtime` (Gate 1) | `dist/react/<cat>` × 3 extensions + `dist/preact/<cat>` × 2 extensions for all 7 categories | Yes — must be green before Gate 4 |
| `peerDeps-optionality` (Gate 2) | Smoke fixtures (react-only + preact-only isolated install) both exit 0 | Yes |
| `coherence` (Gate 3, ship-blocker) | `@vantageos/mosaic-tokens` coherence suite (10 tests) | Yes |
| `cross-runtime-subpath-coverage` (Gate 4) | `cross-runtime-subpath-coverage-check.py --ga-mode` — 0 missing `react/<cat>` + `preact/<cat>` entries | Yes — needs Gate 1 |

**Rule:** `npm-publish` CI job runs only when all five gate jobs above are green. This is
enforced at the `needs:` level in `.github/workflows/ci.yml`.

#### 2.2 Eta approval gate

The `prepublishOnly` hook runs `scripts/check-eta-gate.js`, which fails with exit 1 if the
environment variable `ETA_APPROVED_TASK_ID` is not set. This is a fail-closed human-approval guard:

```
ETA_APPROVED_TASK_ID not set. Eta approval required before npm publish.
npm error code 1
```

Before running `npm publish`, the operator must:
1. Obtain Eta review approval and record the VantagePeers task ID.
2. Set `ETA_APPROVED_TASK_ID=<task-id>` in the publish environment.
3. Run `npm publish` — `prepublishOnly` will then proceed past the gate.

#### 2.3 prepublishOnly workspace-rewrite pattern (durable fix for the 0.3.0 leak)

`npm publish` (unlike `pnpm publish`) does **not** auto-rewrite `workspace:*` specifiers. The
publish pipeline uses a two-hook pattern:

- **`prepublishOnly`**: runs `node scripts/rewrite-workspace-deps.mjs` which reads `package.json`,
  finds every `workspace:*` / `workspace:^` / `workspace:~` reference in all dep sections, resolves
  the concrete sibling package version from the monorepo, and overwrites `package.json` in-place
  with concrete `^<version>` semver strings — only for the duration of the pack+publish step.

- **`postpublish`**: runs `git checkout -- package.json` to revert `package.json` to the source
  workspace protocol, preserving monorepo dev linking.

This guarantees the packed tarball carries resolved semver (e.g. `@vantageos/mosaic-tokens@^0.2.0`)
while the source file always shows `workspace:*` for local development.

### FR

Les gates de pipeline suivants doivent tous être verts avant tout `npm publish`.

#### 2.1 Gates CI (niveau job)

| Job | Gates inclus | Bloque la publication |
|---|---|---|
| `ci` | Lint (Biome) · Type check (tsc) · Tests unitaires (Vitest 854) · A11y (Playwright-axe 29) · Size-limit · Registry-drift · Storybook-test (103) | Oui — `npm-publish` nécessite `ci` |
| `build-parity-cross-runtime` (Gate 1) | `dist/react/<cat>` × 3 extensions + `dist/preact/<cat>` × 2 extensions pour 7 catégories | Oui — doit être vert avant Gate 4 |
| `peerDeps-optionality` (Gate 2) | Fixtures smoke (react-only + preact-only install isolé) toutes en exit 0 | Oui |
| `coherence` (Gate 3, ship-blocker) | Suite de cohérence `@vantageos/mosaic-tokens` (10 tests) | Oui |
| `cross-runtime-subpath-coverage` (Gate 4) | `cross-runtime-subpath-coverage-check.py --ga-mode` — 0 entrées `react/<cat>` + `preact/<cat>` manquantes | Oui — nécessite Gate 1 |

#### 2.2 Gate d'approbation Eta

Le hook `prepublishOnly` exécute `scripts/check-eta-gate.js`, qui échoue avec exit 1 si la variable
d'environnement `ETA_APPROVED_TASK_ID` n'est pas définie. C'est un garde d'approbation humaine
fail-closed. Avant tout `npm publish`, l'opérateur doit obtenir l'approbation Eta, noter l'ID de
tâche VantagePeers et le définir via `ETA_APPROVED_TASK_ID=<task-id>`.

#### 2.3 Pattern prepublishOnly workspace-rewrite (correctif durable pour la fuite 0.3.0)

`npm publish` (contrairement à `pnpm publish`) ne réécrit **pas** automatiquement les spécificateurs
`workspace:*`. Le pipeline utilise un pattern à deux hooks :

- **`prepublishOnly`** : exécute `node scripts/rewrite-workspace-deps.mjs` qui réécrit les
  références `workspace:*` en semver concret (ex. `^0.2.0`) directement dans `package.json`.
- **`postpublish`** : exécute `git checkout -- package.json` pour revenir au protocole workspace et
  préserver le lien de développement monorepo.

---

## 3. The 0.3.0 → 0.3.1 Incident & Lesson / L'incident 0.3.0 → 0.3.1 et la leçon

### EN

#### Root cause

`@vantageos/mosaic@0.3.0` was published on 2026-06-13 at 19:09 UTC. The `package.json` `dependencies`
section contained `"@vantageos/mosaic-tokens": "workspace:*"`. The npm publish path at the time did
not include the `prepublishOnly` workspace-rewrite hook, so `workspace:*` was packed as-is into the
tarball. External consumers attempting:

```
npm install @vantageos/mosaic@0.3.0
```

received:

```
npm error code ETARGET
npm error notarget No matching version found for @vantageos/mosaic-tokens@workspace:*
```

The package was **not yanked** (it remains queryable) but the `latest` dist-tag was immediately
moved to `0.3.1`. All automation and new installs pick up `0.3.1`.

#### Fix applied in 0.3.1

PR #59 (`hotfix(0.3.1): workspace:* leak in published 0.3.0 manifest blocks external npm install`)
introduced:

1. `scripts/rewrite-workspace-deps.mjs` — the prepublish rewriter.
2. `prepublishOnly` → `node scripts/rewrite-workspace-deps.mjs && <existing gates>`.
3. `postpublish` → `git checkout -- package.json`.

The `0.3.1` tarball contains `"@vantageos/mosaic-tokens": "^0.2.0"` — registry-resolvable.

#### Lesson for the fleet

A green CI job does **not** guarantee a registry-installable package. The CI pipeline validates
the build, tests, types, and accessibility — none of these steps execute an external `npm install`
of the packed tarball.

**Recommended pre-publish manifest-lint gate (add to `prepublishOnly`):**

```bash
# Assert no workspace:/link:/file: protocols survived into packed deps
node -e "
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8'));
  const sections = ['dependencies','peerDependencies','optionalDependencies'];
  const bad = [];
  for (const s of sections) for (const [k,v] of Object.entries(pkg[s]||{}))
    if (/^(workspace|link|file):/.test(v)) bad.push(k+'='+v);
  if (bad.length) { console.error('MANIFEST LEAK:', bad); process.exit(1); }
  console.log('manifest lint: clean');
"
```

**Recommended clean-room install check (post-publish smoke):**

```bash
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
npm install @vantageos/mosaic@<new-version> --legacy-peer-deps
echo "INSTALL_EXIT=$?"
```

Both checks should be wired into CI or added to the publish runbook before every release.

### FR

#### Cause racine

`@vantageos/mosaic@0.3.0` a été publiée le 2026-06-13 à 19h09 UTC. La section `dependencies` de
`package.json` contenait `"@vantageos/mosaic-tokens": "workspace:*"`. Le chemin de publication npm
ne comportait pas encore le hook `prepublishOnly` de réécriture workspace, donc `workspace:*` a été
packagé tel quel dans le tarball. Les consommateurs externes recevaient :

```
npm error code ETARGET
npm error notarget No matching version found for @vantageos/mosaic-tokens@workspace:*
```

Le package n'a **pas été dépublié** (il reste interrogeable) mais le dist-tag `latest` a été
immédiatement déplacé vers `0.3.1`.

#### Correctif appliqué dans 0.3.1

PR #59 a introduit le script `scripts/rewrite-workspace-deps.mjs` + les hooks `prepublishOnly` et
`postpublish`. Le tarball `0.3.1` contient `"@vantageos/mosaic-tokens": "^0.2.0"` — résolvable
depuis le registry.

#### Leçon pour la flotte

Un job CI vert ne garantit **pas** un package installable depuis le registry. Il est recommandé
d'ajouter un gate de lint de manifest pré-publication (vérifie l'absence de `workspace:/link:/file:`
dans les deps packagées) et un check d'installation en salle propre post-publication.

---

## 4. Cross-Runtime Architecture / Architecture cross-runtime

### EN

`@vantageos/mosaic@0.3.1` uses a **runtime-prefixed subpath export** architecture (Path A). A single
package ships two complete runtime builds under distinct subpath prefixes.

#### Export map (verified against `npm view @vantageos/mosaic@0.3.1 exports`)

**React runtime** — dual format (`import` ESM + `require` CJS), React 19 build:

| Subpath | ESM | CJS | DTS |
|---|---|---|---|
| `@vantageos/mosaic/react/forms` | `dist/react/forms.js` | `dist/react/forms.cjs` | `dist/react/forms.d.ts` |
| `@vantageos/mosaic/react/progress` | `dist/react/progress.js` | `dist/react/progress.cjs` | `dist/react/progress.d.ts` |
| `@vantageos/mosaic/react/artifacts` | `dist/react/artifacts.js` | `dist/react/artifacts.cjs` | `dist/react/artifacts.d.ts` |
| `@vantageos/mosaic/react/confirmation` | `dist/react/confirmation.js` | `dist/react/confirmation.cjs` | `dist/react/confirmation.d.ts` |
| `@vantageos/mosaic/react/display` | `dist/react/display.js` | `dist/react/display.cjs` | `dist/react/display.d.ts` |
| `@vantageos/mosaic/react/input` | `dist/react/input.js` | `dist/react/input.cjs` | `dist/react/input.d.ts` |
| `@vantageos/mosaic/react/media` | `dist/react/media.js` | `dist/react/media.cjs` | `dist/react/media.d.ts` |

**Preact runtime** — ESM-only (`import` only, no `require`), Preact 10 build:

| Subpath | ESM | DTS |
|---|---|---|
| `@vantageos/mosaic/preact/forms` | `dist/preact/forms.js` | `dist/preact/forms.d.ts` |
| `@vantageos/mosaic/preact/progress` | `dist/preact/progress.js` | `dist/preact/progress.d.ts` |
| `@vantageos/mosaic/preact/artifacts` | `dist/preact/artifacts.js` | `dist/preact/artifacts.d.ts` |
| `@vantageos/mosaic/preact/confirmation` | `dist/preact/confirmation.js` | `dist/preact/confirmation.d.ts` |
| `@vantageos/mosaic/preact/display` | `dist/preact/display.js` | `dist/preact/display.d.ts` |
| `@vantageos/mosaic/preact/input` | `dist/preact/input.js` | `dist/preact/input.d.ts` |
| `@vantageos/mosaic/preact/media` | `dist/preact/media.js` | `dist/preact/media.d.ts` |

**Why preact is ESM-only:** The Preact build uses an esbuild `onResolve` plugin
(`mosaic-react-to-preact`) that rewrites the full React family (`react`, `react-dom`,
`react/jsx-runtime`, `react/jsx-dev-runtime`, `react-dom/client`) to their Preact equivalents at
bundle time. CJS bundling of this rewrite introduces edge cases with CommonJS interop that are
out of scope for the current ship; Preact consumers in 2025+ are exclusively ESM-capable bundlers
(Vite, esbuild, webpack 5). A future release may add a Preact CJS build if BU demand warrants it.

**PeerDeps optionality:** All peer dependencies are marked `optional: true` in
`peerDependenciesMeta`. A react-only consumer does not need `preact` installed; a preact-only
consumer does not need `react` or `react-dom`. Consumers must provide at least the peer matching
their chosen runtime subpath.

#### Additional subpaths

- `@vantageos/mosaic/tokens` — convenience re-export of `@vantageos/mosaic-tokens`
- `@vantageos/mosaic/server` — server-side utilities
- `@vantageos/mosaic/registry.yaml` — component catalogue
- Legacy bare subpaths (`@vantageos/mosaic/progress`, `/input`, etc.) — preserved for back-compat

### FR

`@vantageos/mosaic@0.3.1` utilise une architecture d'exports de sous-chemins **préfixés par
runtime** (Path A). Un seul package embarque deux builds runtime complets sous des préfixes distincts.

**Runtime React** — dual format (`import` ESM + `require` CJS), build React 19. Chaque catégorie
expose `dist/react/<cat>.js` + `.cjs` + `.d.ts`.

**Runtime Preact** — ESM uniquement (`import` seulement, pas de `require`), build Preact 10. Chaque
catégorie expose `dist/preact/<cat>.js` + `.d.ts`.

**Pourquoi Preact est ESM-only :** Le build Preact utilise un plugin esbuild (`mosaic-react-to-preact`)
qui réécrit toute la famille React vers ses équivalents Preact au moment du bundle. Le bundling CJS
de cette réécriture introduit des cas limites d'interop qui sont hors périmètre pour cette version ;
les consommateurs Preact sont exclusivement des bundlers ESM-capable (Vite, esbuild, webpack 5).

**Optionnalité des peerDeps :** Tous les peerDependencies sont marqués `optional: true`. Un
consommateur react-only n'a pas besoin de `preact` ; un consommateur preact-only n'a pas besoin de
`react` / `react-dom`. Chaque consommateur doit fournir au minimum le peer correspondant à son
runtime choisi.

---

## 5. Migration Guide / Guide de migration

### EN

#### From v0.1.x → 0.3.1

**Import paths changed** — v0.1.x used root or bare subpath imports. v0.2.0 introduced
runtime-prefixed subpaths; 0.3.1 continues that architecture. The legacy bare subpaths still work
for back-compat but are not tree-shake-optimal.

```ts
// v0.1.x (root import — still works, non-optimal)
import { ProgressBar } from '@vantageos/mosaic';

// v0.1.x (bare subpath — still works, non-optimal)
import { ProgressBar } from '@vantageos/mosaic/progress';

// v0.3.1 (runtime-prefixed — recommended for React consumers)
import { ProgressBar } from '@vantageos/mosaic/react/progress';

// v0.3.1 (runtime-prefixed — recommended for Preact consumers)
import { ProgressBar } from '@vantageos/mosaic/preact/progress';
```

**Design tokens** — In v0.1.x, tokens were bundled inside `@vantageos/mosaic`. In v0.3.1, they are
extracted to a separate package:

```ts
// v0.1.x (tokens bundled)
import { colorPrimary } from '@vantageos/mosaic';

// v0.3.1 (tokens in dedicated package — must install separately)
import { colorPrimary } from '@vantageos/mosaic-tokens';
// or via convenience re-export:
import { colorPrimary } from '@vantageos/mosaic/tokens';
```

**Install:**

```bash
npm install @vantageos/mosaic@^0.3.1 @vantageos/mosaic-tokens@^0.2.0
```

#### From v0.2.x → 0.3.1

The cross-runtime architecture is identical. The only change is the addition of the `forms`
category:

```ts
// New in 0.3.x — forms category
import { useMosaicForm, FormField, ErrorDisplay, SubmitButton } from '@vantageos/mosaic/react/forms';
import { Input, Textarea, Select, MultiSelect, Checkbox, RadioGroup, FieldArray } from '@vantageos/mosaic/react/forms';
```

Wave 1 additions (`Tabs`, `Alert`, `Toast`, `Skeleton`, `EmptyState`) also ship in 0.3.1 and are
imported from their respective categories:

```ts
import { Tabs } from '@vantageos/mosaic/react/display';
import { Alert } from '@vantageos/mosaic/react/display';
import { Toast } from '@vantageos/mosaic/react/confirmation';
import { Skeleton } from '@vantageos/mosaic/react/display';
import { EmptyState } from '@vantageos/mosaic/react/display';
```

No breaking API changes from 0.3.0-alpha.1 or 0.3.0 to 0.3.1.

### FR

#### De v0.1.x → 0.3.1

**Chemins d'import modifiés** — v0.1.x utilisait des imports racine ou des sous-chemins nus. La
v0.2.0 a introduit les sous-chemins préfixés par runtime ; 0.3.1 continue cette architecture. Les
sous-chemins nus historiques fonctionnent toujours pour la rétrocompatibilité mais ne sont pas
optimaux pour le tree-shaking.

```ts
// v0.1.x (import racine — toujours fonctionnel, non optimal)
import { ProgressBar } from '@vantageos/mosaic';

// v0.3.1 (préfixé runtime — recommandé pour consommateurs React)
import { ProgressBar } from '@vantageos/mosaic/react/progress';

// v0.3.1 (préfixé runtime — recommandé pour consommateurs Preact)
import { ProgressBar } from '@vantageos/mosaic/preact/progress';
```

**Design tokens** — En v0.1.x, les tokens étaient bundlés dans `@vantageos/mosaic`. En v0.3.1, ils
sont extraits dans un package séparé `@vantageos/mosaic-tokens` (à installer séparément).

#### De v0.2.x → 0.3.1

L'architecture cross-runtime est identique. Le seul ajout est la catégorie `forms`. Aucun
changement d'API non rétrocompatible de 0.3.0-alpha.1 ou 0.3.0 vers 0.3.1.

---

## 6. Consumer Integration Examples / Exemples d'intégration

### EN

#### React — Next.js (App Router)

```bash
npm install @vantageos/mosaic@^0.3.1 @vantageos/mosaic-tokens@^0.2.0
# Peer deps for react consumers (react + react-dom already in your project):
# No extra peer required — preact is optional.
```

```tsx
// app/dashboard/page.tsx (Server Component — import works at module level)
import { TableView } from '@vantageos/mosaic/react/display';
import { ProgressBar } from '@vantageos/mosaic/react/progress';
import { StatusBadge } from '@vantageos/mosaic/react/media';
import { Toast } from '@vantageos/mosaic/react/confirmation';
import { Tabs } from '@vantageos/mosaic/react/display';
import { Alert } from '@vantageos/mosaic/react/display';

// Forms (requires react-hook-form + @hookform/resolvers peers)
import { useMosaicForm, FormField, SubmitButton } from '@vantageos/mosaic/react/forms';
import { Input, Select, Checkbox } from '@vantageos/mosaic/react/forms';
```

#### React — Vite

```bash
npm install @vantageos/mosaic@^0.3.1 @vantageos/mosaic-tokens@^0.2.0
```

```tsx
// src/components/MyForm.tsx
import { useMosaicForm, FormField, ErrorDisplay, SubmitButton } from '@vantageos/mosaic/react/forms';
import { Input, Textarea, MultiSelect } from '@vantageos/mosaic/react/forms';
import { ProgressBar } from '@vantageos/mosaic/react/progress';

export function MyForm() {
  const { form, handleSubmit } = useMosaicForm({ defaultValues: { name: '' } });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <FormField name="name" label="Name" form={form}>
        <Input type="text" />
      </FormField>
      <SubmitButton form={form}>Submit</SubmitButton>
    </form>
  );
}
```

#### Preact — Vite (ESM-only, no CJS)

```bash
npm install @vantageos/mosaic@^0.3.1 @vantageos/mosaic-tokens@^0.2.0 preact@^10.25.0
# Do NOT install react or react-dom — preact peer is sufficient.
```

```tsx
// src/components/MyDisplay.tsx
import { TableView } from '@vantageos/mosaic/preact/display';
import { ProgressBar } from '@vantageos/mosaic/preact/progress';
import { StatusBadge } from '@vantageos/mosaic/preact/media';
import { Toast } from '@vantageos/mosaic/preact/confirmation';

// Preact consumers: only ESM imports work.
// CommonJS require('@vantageos/mosaic/preact/...') is not supported.
export function MyDisplay({ rows }) {
  return (
    <div>
      <ProgressBar value={42} max={100} />
      <TableView columns={[{ key: 'id', label: 'ID' }]} rows={rows} />
    </div>
  );
}
```

#### pnpm consumers — minimumReleaseAge note

`@vantageos/mosaic@0.3.1` was published on 2026-06-13. pnpm workspaces using
`updateConfig.minimumReleaseAge` (e.g. `"3 days"`) will not auto-update to 0.3.1 until the
package ages past the configured window.

To consume 0.3.1 immediately, add to your `pnpm-workspace.yaml`:

```yaml
updateConfig:
  minimumReleaseAgeExclude:
    - "@vantageos/mosaic"
```

Remove this exclusion once the package has aged past your `minimumReleaseAge` window.

### FR

#### React — Next.js (App Router)

```bash
npm install @vantageos/mosaic@^0.3.1 @vantageos/mosaic-tokens@^0.2.0
```

```tsx
// Imports depuis les sous-chemins préfixés runtime (React)
import { TableView, Tabs, Alert, Skeleton, EmptyState } from '@vantageos/mosaic/react/display';
import { ProgressBar } from '@vantageos/mosaic/react/progress';
import { StatusBadge } from '@vantageos/mosaic/react/media';
import { Toast, ConfirmDialog } from '@vantageos/mosaic/react/confirmation';
import { Input, Select, Checkbox, RadioGroup } from '@vantageos/mosaic/react/forms';
```

#### Preact — Vite (ESM uniquement)

```bash
npm install @vantageos/mosaic@^0.3.1 @vantageos/mosaic-tokens@^0.2.0 preact@^10.25.0
# Ne pas installer react/react-dom — le peer preact suffit.
```

```tsx
// src/components/MyDisplay.tsx
import { TableView } from '@vantageos/mosaic/preact/display';
import { ProgressBar } from '@vantageos/mosaic/preact/progress';
// Uniquement des imports ESM — require() non supporté pour le runtime preact.
```

#### Note pnpm — minimumReleaseAge

`@vantageos/mosaic@0.3.1` a été publiée le 2026-06-13. Les workspaces pnpm utilisant
`updateConfig.minimumReleaseAge` ne se mettront pas à jour automatiquement avant que le package
dépasse la fenêtre configurée. Ajoutez l'exclusion dans `pnpm-workspace.yaml` :

```yaml
updateConfig:
  minimumReleaseAgeExclude:
    - "@vantageos/mosaic"
```

---

## 7. GA Validation Evidence (D-PR2) / Preuves de validation GA (D-PR2)

### EN

The following evidence was produced in D-PR2 (cross-consumer smoke) before the `0.3.1` publish
gate was cleared.

#### 7.1 vantage-crm-extension (Preact consumer)

- **PR:** #14
- **Runtime:** Preact 10 (imports from `@vantageos/mosaic/preact/*`)
- **Playwright tests:** 7/7 passed
- **axe violations:** 0
- **Status:** green

#### 7.2 vantage-peers-dashboard (React consumer)

- **PR:** #11
- **Runtime:** React 19 (imports from `@vantageos/mosaic/react/*`)
- **Playwright tests:** 14/14 passed
- **axe violations:** 0
- **Status:** green

#### 7.3 Clean-room install

```bash
# Isolated temp dir, no monorepo node_modules on the resolution path
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
npm install @vantageos/mosaic@0.3.1 --legacy-peer-deps
echo "INSTALL_EXIT=$?"
```

Result:

```
+ @vantageos/mosaic@0.3.1
+ @vantageos/mosaic-tokens@0.2.0
INSTALL_EXIT=0
```

- **Exit code:** `0`
- **`@vantageos/mosaic-tokens` resolved from registry:** `0.2.0` (no `workspace:*` in manifest)
- **No overrides required**

#### Summary table

| Consumer | Runtime | Tests | axe | Install EXIT |
|---|---|---|---|---|
| vantage-crm-extension (PR #14) | Preact 10 | 7/7 | 0 | — |
| vantage-peers-dashboard (PR #11) | React 19 | 14/14 | 0 | — |
| clean-room npm install | n/a | n/a | n/a | **0** |

### FR

Les preuves suivantes ont été produites en D-PR2 (smoke cross-consommateurs) avant que le gate
de publication `0.3.1` soit validé.

#### 7.1 vantage-crm-extension (consommateur Preact)

- **PR :** #14
- **Runtime :** Preact 10 (imports depuis `@vantageos/mosaic/preact/*`)
- **Tests Playwright :** 7/7 passés
- **Violations axe :** 0
- **Statut :** vert

#### 7.2 vantage-peers-dashboard (consommateur React)

- **PR :** #11
- **Runtime :** React 19 (imports depuis `@vantageos/mosaic/react/*`)
- **Tests Playwright :** 14/14 passés
- **Violations axe :** 0
- **Statut :** vert

#### 7.3 Installation en salle propre

```bash
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
npm install @vantageos/mosaic@0.3.1 --legacy-peer-deps
echo "INSTALL_EXIT=$?"
```

Résultat :

```
+ @vantageos/mosaic@0.3.1
+ @vantageos/mosaic-tokens@0.2.0
INSTALL_EXIT=0
```

- **Code de sortie :** `0`
- **`@vantageos/mosaic-tokens` résolu depuis le registry :** `0.2.0` (aucun `workspace:*` dans le manifest)
- **Aucun override requis**

#### Tableau récapitulatif

| Consommateur | Runtime | Tests | axe | Install EXIT |
|---|---|---|---|---|
| vantage-crm-extension (PR #14) | Preact 10 | 7/7 | 0 | — |
| vantage-peers-dashboard (PR #11) | React 19 | 14/14 | 0 | — |
| Installation npm salle propre | n/a | n/a | n/a | **0** |

---

Orchestrator: Gamma — VantageOS Team | 2026-06-13
