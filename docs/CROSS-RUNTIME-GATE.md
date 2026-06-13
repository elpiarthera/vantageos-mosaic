# Cross-Runtime Subpath Coverage Gate (CI Gate 4)

> Bilingual doc — English first, French below. / Doc bilingue — anglais d'abord, français ensuite.

## EN — What this gate enforces

Every **bare component category** declared in `packages/mosaic/package.json`
`exports` (e.g. `./forms`, `./progress`, `./display`, `./artifacts`,
`./confirmation`, `./media`, `./input`) MUST also be exported under **both**
runtimes:

- `./react/<category>` → a non-empty `dist/react/<category>.js`
- `./preact/<category>` → a non-empty `dist/preact/<category>.js`

"Non-empty" means the built dist artifact exists and is at least `--min-bytes`
bytes (default 50). The gate inspects the real `dist/` files named by the
`exports` map — not just the presence of the export key — so an empty stub or a
build that silently dropped a runtime pass is caught.

Categories excluded from the check (they are not component categories):
`.`, `./react`, `./preact`, `./tokens`, `./server`, `./registry.yaml`.

When PyYAML is available the gate also runs an optional **registry
cross-check** (Step 5): every `category` declared in
`packages/mosaic/registry.yaml` must have its bare + `/react` + `/preact`
export keys present. PyYAML is **not** required — the gate degrades gracefully
(prints a WARNING, skips Step 5) and the package.json-exports coverage check
still runs and still gates.

## EN — Why (the v0.3.0 GA blocker)

The original v0.3.0 GA blocker was **6 foundation components present as bare
exports but missing from `/react` + `/preact`** — they shipped as silent empty
stubs. Type-check, lint, unit tests, and even `size-limit` (which only reads a
couple of fixed entry files) all passed. Consumers importing
`@vantageos/mosaic/react/<category>` got nothing.

This gate is the fail-fast that would have caught that: it walks **every** bare
category and asserts a non-empty dist artifact under both runtimes. No silent
empty-stub ship.

## EN — How it runs in CI

Defined in `.github/workflows/ci.yml` as the job
**`cross-runtime-subpath-coverage`** ("Gate 4 — Cross-runtime subpath
coverage"):

- `needs: build-parity-cross-runtime` (Gate 1) — runs after the build-parity
  gate so it does not duplicate earlier failures.
- Builds `@vantageos/mosaic-tokens` then `@vantageos/mosaic` so `dist/` exists
  (the check inspects dist files).
- Runs:
  ```bash
  python3 packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py \
    --package-root packages/mosaic --ga-mode
  ```
- Exit `0` = pass (all categories covered). Exit `1` = fail (CI red) with a
  diagnostic naming each missing `component × runtime` and the reason
  (`not-in-exports-map`, `file-not-found`, `file-empty`, …).

`--ga-mode` suppresses wildcard (`*`) export keys so only explicit subpaths are
graded. `python3` ships on `ubuntu-latest`; **no `pip install` is added** — the
script's graceful no-PyYAML fallback keeps the Python dependency surface at zero.

The gate is **additive**: it does not weaken or replace any existing gate
(Gate 1 build-parity, Gate 2 peerDeps smoke, Gate 3 coherence, or the `ci`
job). It is the CI-side equivalent of the B-PR2 npm-publish hook
(`enforce-cross-runtime-subpath-coverage.py`).

## EN — Override path

There is **no per-PR config override** in the workflow — the gate is
intentionally non-negotiable for GA, mirroring Gate 3 (coherence, ship-blocker,
no override). To legitimately change what the gate accepts:

1. If a category genuinely should not exist under a runtime, **remove its bare
   export** from `package.json` (then it is no longer a graded category), or
2. Adjust `--min-bytes` in the CI step if the non-empty threshold must change
   (rare; document the reason), or
3. For an emergency local bypass while iterating, run the check with `--json`
   to inspect the exact failing entries and fix the build — do not edit the
   gate to pass.

Any change to the **detection logic** must be made in the canonical skill first
(see next section), then re-vendored here.

## EN — Canonical source & vendoring

The detection logic is **canonical in the B-PR1 skill**
`mosaic-cross-runtime-subpath-coverage-check` (VantageRegistry,
`get_skill_content`; `scripts/check.py`). The file at
`packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py` is a
**vendored copy** for CI (CI cannot reach the skill at runtime).

**Keep in sync — do not edit logic in the vendored copy without updating the
skill.**

### Known deviation (must be reconciled upstream)

The canonical skill assumes a **category-prefixed** subpath layout
(`./forms/react`). `vantageos-mosaic` ships a **runtime-prefixed** layout
(`./react/forms`, with dist at `dist/react/forms.js`; see
`scripts/verify-build-parity.sh`). The vendored copy carries a single,
clearly-flagged adaptation — a `RUNTIME_PREFIXED` toggle that builds subpaths as
`./<runtime>/<cat>`. All other logic (discovery, exclusions, `--min-bytes`,
`--ga-mode`, `--json`, registry cross-check) is byte-for-byte the canonical
behaviour. Tracking item: the skill should gain a
`--layout {runtime-prefixed|category-prefixed}` flag so this vendored copy can
return to verbatim.

---

## FR — Ce que ce gate impose

Chaque **catégorie de composant « nue »** déclarée dans les `exports` de
`packages/mosaic/package.json` (ex. `./forms`, `./progress`, `./display`,
`./artifacts`, `./confirmation`, `./media`, `./input`) DOIT aussi être exportée
pour **les deux** runtimes :

- `./react/<catégorie>` → un `dist/react/<catégorie>.js` non vide
- `./preact/<catégorie>` → un `dist/preact/<catégorie>.js` non vide

« Non vide » signifie que l'artefact `dist/` construit existe et pèse au moins
`--min-bytes` octets (50 par défaut). Le gate inspecte les vrais fichiers
`dist/` nommés par la map `exports` — pas seulement la présence de la clé — donc
un stub vide ou une passe de build silencieusement perdue est détecté.

Catégories exclues (ce ne sont pas des catégories de composant) :
`.`, `./react`, `./preact`, `./tokens`, `./server`, `./registry.yaml`.

Si PyYAML est disponible, le gate exécute aussi un **contre-contrôle registry**
optionnel (Étape 5) : chaque `category` déclarée dans
`packages/mosaic/registry.yaml` doit avoir ses clés `nue` + `/react` +
`/preact`. PyYAML n'est **pas** requis — le gate se dégrade proprement (WARNING,
saute l'Étape 5) et la couverture package.json-exports continue de bloquer.

## FR — Pourquoi (le blocker GA v0.3.0)

Le blocker GA v0.3.0 d'origine : **6 composants fondation présents en export nu
mais absents de `/react` + `/preact`** — livrés en stubs vides silencieux. Le
type-check, le lint, les tests unitaires, et même `size-limit` (qui ne lit que
quelques fichiers d'entrée fixes) passaient tous. Les consommateurs important
`@vantageos/mosaic/react/<catégorie>` ne recevaient rien.

Ce gate est le fail-fast qui aurait attrapé ça : il parcourt **chaque**
catégorie nue et exige un artefact dist non vide pour les deux runtimes. Plus de
livraison de stub vide silencieux.

## FR — Comment il s'exécute en CI

Défini dans `.github/workflows/ci.yml` comme le job
**`cross-runtime-subpath-coverage`** (« Gate 4 — Cross-runtime subpath
coverage ») :

- `needs: build-parity-cross-runtime` (Gate 1).
- Construit `@vantageos/mosaic-tokens` puis `@vantageos/mosaic` pour que `dist/`
  existe.
- Exécute :
  ```bash
  python3 packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py \
    --package-root packages/mosaic --ga-mode
  ```
- Code `0` = succès. Code `1` = échec (CI rouge) avec un diagnostic nommant
  chaque `composant × runtime` manquant et la raison.

`--ga-mode` supprime les clés d'export joker (`*`). `python3` est présent sur
`ubuntu-latest` ; **aucun `pip install` ajouté** — le fallback sans PyYAML
maintient la surface de dépendance Python à zéro.

Le gate est **additif** : il n'affaiblit ni ne remplace aucun gate existant. Il
est l'équivalent côté CI du hook B-PR2 npm-publish
(`enforce-cross-runtime-subpath-coverage.py`).

## FR — Chemin d'override

Il n'y a **pas d'override de config par PR** — le gate est volontairement non
négociable pour la GA (comme le Gate 3 coherence). Pour changer
légitimement ce que le gate accepte : retirer l'export nu de la catégorie de
`package.json`, ou ajuster `--min-bytes` (rare, documenter), ou inspecter via
`--json` puis corriger le build — ne pas éditer le gate pour le faire passer.

Tout changement de la **logique de détection** doit d'abord se faire dans le
skill canonique, puis être re-vendorisé ici.

## FR — Source canonique & vendoring

La logique est **canonique dans le skill B-PR1**
`mosaic-cross-runtime-subpath-coverage-check` (VantageRegistry). Le fichier
`packages/mosaic/scripts/cross-runtime-subpath-coverage-check.py` est une
**copie vendorisée** pour la CI. **Garder synchronisé — ne pas éditer la logique
ici sans mettre à jour le skill.** Déviation connue : layout runtime-préfixé
(`./react/forms`) vs canonique catégorie-préfixé (`./forms/react`) — toggle
`RUNTIME_PREFIXED` documenté en tête de fichier, à réconcilier upstream via un
flag `--layout`.
