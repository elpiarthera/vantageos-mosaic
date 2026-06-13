# Mosaic Architecture Standard v1

**Status** : v1.1 DRAFT — 2026-06-02 (Day 90 AM) — awaiting Gamma review (added Section 4 Core-First Doctrine post-Laurent validation)
**Owner** : BU gamma (bu-mcp)
**Canonical source** : `vantageos-mosaic/docs/mosaic-architecture-standard-v1.md` (post-repo creation)
**Mirror** : `ElPi-Corp/resources/references/mosaic-architecture-standard-v1.md` (this file)
**VantageRegistry** : standard `mosaic-architecture-standard-v1` (upserted by Omega post-approval)
**Stakeholders** : gamma · sigma · theta · eta · omega · phi · argus · mu · athena · hermes · demeter · chi

Reference brief canonique mission `library-ui-mcp-build-v1` v2 : VP memory `j579e74vxv566a10readet4zch87xxv9` (supersedes v1 `j578y5xtbgp735aaktyyhvtnpx87t8n4`).

---

## 1. Vision & Positioning

### 1.1 What is Mosaic?

`@vantageos/mosaic` is the **MCP UI design system** for the VantageOS fleet — a comprehensive, opinionated React component library that generates SEP-1865 compliant `ui://` resources for any MCP server.

The metaphor : composants individuels (tesselles) qui se composent pour former des vues cohérentes — exactement ce que fait un MCP UI consumer.

### 1.2 Differentiator (top du top, non-négociable)

Aucune library du marché (vérifié sur 17 alternatives auditées Day 90 AM : 4 sources Laurent + 3 sources extension + 10 landscape) ne combine simultanément :

- ✅ MCP Apps `ui://` SEP-1865 native (canonical PR #1865 merged 2026-01-28)
- ✅ shadcn-grade component design system (45-60+ composants prévus)
- ✅ i18n FR + EN by design + by default
- ✅ WCAG AA axe-core enforcement
- ✅ VantageRegistry catalog auto-sync
- ✅ Doctrine Flexibilité 5/5 (portabilité MCP-first + abstraction + migration-ready + composable + parallélisable)
- ✅ Strict TDD as engineering doctrine

Mosaic fills this unclaimed position.

### 1.3 Fleet adoption

Mosaic est consumée par **tous** les MCPs du fleet présents et futurs :

| BU | MCP | Adoption phase |
|---|---|---|
| sigma | vantage-peers-mcp | Phase 3 (consume + refacto 6 primitives + ship 8 missing) |
| theta | vantage-crm-mcp | Phase 3 (consume + ship 8-12 primitives nouveaux) |
| omega | vantage-registry-mcp, vantage-architect, vantage-frameworks, vantage-agent-composer | Phase 4 |
| mu | vantage-bridge | Phase 4 |
| athena | vantage-crm-extension | Phase 4 |
| hermes | vantage-peers-extension | Phase 4 |
| demeter | vantage-gmail-addon | Phase 4 |
| chi | gptpowerups-extension | Phase 4 (optionnel) |

---

## 2. Stack Final

### 2.1 Server-side resource generation

| Layer | Choice | Justif |
|---|---|---|
| Canonical resource helper | **`@mcp-ui/server` v6.1.0 Apache-2.0** | Adopté Postman + HuggingFace + Shopify en prod. `createUIResource()` officiel mcpui.dev. Reference implementation PR #1865 nested `_meta.ui.resourceUri` + MIME `text/html;profile=mcp-app` + markdown fallback. |
| Handshake | `ui/initialize` MANDATORY avant resources | Spec PR #1865 — server ne peut pas envoyer `ui://` resources avant client `ui/notifications/initialized`. |
| MCP SDK | `@modelcontextprotocol/sdk` ^1.29.0 | Compat @mcp-ui/server deps. |

### 2.2 Design system

| Layer | Choice | Justif |
|---|---|---|
| Framework UI | **React 19** | Server Components, suspense, transitions, async batching, latest concurrent rendering. |
| Styling | **Tailwind v4** | OKLCH color system, container queries native, CSS variables first-class, build perf. |
| Components primitives | **lit-ui** (ElPi Corp internal Web Components library) | Shadow DOM isolation par défaut (essential pour MCP iframe sandbox), Web Components standard, framework-agnostic (futur-proof). |
| Charts | **Recharts** | React-native, OKLCH compat, déclaratif, a11y-friendly, treeshakable. |
| a11y | **axe-core** | WCAG AA enforcement, runtime + CI. |
| Bundle | **vite-plugin-singlefile** | Single-file HTML embed pour ui:// resources. |
| State | (local React state) | Pas de Zustand/Redux nécessaire — composants isolés iframe sandbox postMessage. |

### 2.3 i18n

- **`@vantageos/mosaic-i18n`** : separate npm package
- API : `t(key, locale)` + `detectLocale(headers)` + `parityCheck(en, fr)`
- Bilingue FR + EN by default. Locale détection via host header / query param.

### 2.4 Validation

- **Zod** v4+ : schema runtime validation des props composants
- Chaque composant exporte `<Component>PropsSchema: z.ZodSchema`

---

## 3. 4 Patterns Différenciateurs

### 3.1 Zod validation runtime props agent-side

**Inspiré** : A2UI (Google 15k stars) + json-render (vercel-labs 14k stars top 1 landscape)

**Why** : un LLM peut halluciner des props invalides. Sans validation runtime, le composant crash ou affiche garbage. Mosaic refuse de rendre un composant si ses props ne satisfont pas son Zod schema → render error explicit + log structured + fallback markdown.

**Spec** :

```typescript
// src/components/display/table-view/schema.ts
import { z } from 'zod'

export const TableViewPropsSchema = z.object({
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    sortable: z.boolean().optional(),
    width: z.union([z.string(), z.number()]).optional(),
  })).min(1),
  rows: z.array(z.record(z.unknown())),
  totalCount: z.number().int().nonnegative().optional(),
  i18nKeys: z.object({
    empty: z.string().optional(),
    loading: z.string().optional(),
  }).optional(),
})

export type TableViewProps = z.infer<typeof TableViewPropsSchema>
```

```typescript
// src/components/display/table-view/index.tsx
import { TableViewPropsSchema, type TableViewProps } from './schema'
import { renderError } from '@vantageos/mosaic/core/render-error'

export function TableView(props: unknown) {
  const parsed = TableViewPropsSchema.safeParse(props)
  if (!parsed.success) {
    return renderError({
      component: 'table-view',
      errors: parsed.error.issues,
      fallbackMarkdown: '⚠ Invalid table-view props',
    })
  }
  const { columns, rows, totalCount, i18nKeys } = parsed.data
  // ... actual render
}
```

**Catalog enforcement** : VantageRegistry liste composants approuvés. MCP server tentant d'émettre un composant non-registered → render error catalog-rejected + log alert.

### 3.2 Taxonomie 6 catégories

**Inspirée** : assistant-ui (10k stars top 3 landscape) — leur 6-category model est devenu de-facto standard.

| Catégorie | Composants prévus v0.1.0 |
|---|---|
| **Progress** | `progress-bar`, `spinner`, `status-pill`, `percent-circle` |
| **Input** | `edit-form`, `search-box`, `filter-panel`, `datepicker`, `multiselect`, `richtext-editor` |
| **Display** | `table-view`, `detail-card`, `feed-list`, `kanban-board`, `timeline`, `calendar`, `tree-view` |
| **Artifacts** | `markdown-renderer`, `code-block`, `file-attachment`, `json-viewer`, `diff-viewer` |
| **Confirmation** | `confirm-dialog`, `alert-banner`, `toast-notification`, `inline-warning` |
| **Media** | `chart-line`, `chart-bar`, `chart-area`, `chart-pie`, `image-gallery`, `avatar-stack`, `gauge` |

**Bénéfices** :
- Structure docs lisible (navigation par catégorie)
- Imports prévisibles (`import { TableView } from '@vantageos/mosaic/display'`)
- Storybook navigation alignée
- Industry standard (assistant-ui pattern)

### 3.3 YAML-driven component registry + CI drift gate

**Inspiré** : PostHog implementation guide (mcpservers.org/agent-skills/posthog/implementing-mcp-ui-apps)

**Why** : sans single source of truth, le registry filesystem et la VR catalog dérivent silencieusement. La CI gate force l'alignment.

**Spec** : `packages/mosaic/registry.yaml` à la racine du package :

```yaml
version: 1
components:
  - key: table-view
    category: display
    path: src/components/display/table-view
    schema: src/components/display/table-view/schema.ts
    i18nKeys:
      - mosaic.tableView.empty
      - mosaic.tableView.loading
    sizeLimit: 8KB
    a11yLevel: WCAG-AA

  - key: detail-card
    category: display
    path: src/components/display/detail-card
    schema: src/components/display/detail-card/schema.ts
    i18nKeys:
      - mosaic.detailCard.actions.edit
      - mosaic.detailCard.actions.delete
    sizeLimit: 5KB
    a11yLevel: WCAG-AA
  # ... etc per component
```

**CI gate** : skill VR `mosaic-registry-drift-check` (à cataloger par Omega) compare `registry.yaml` vs filesystem `packages/mosaic/src/components/*` + bloque PR si :
- Composant filesystem absent de registry.yaml
- Composant registry.yaml absent du filesystem
- Schema file path divergent
- i18nKeys absentes des fichiers i18n FR ou EN
- Taille bundle composant > `sizeLimit` annoncé

**Génération auto** : script `scripts/generate-types.ts` génère `src/types/mosaic-keys.ts` exposant union type `MosaicComponentKey = 'table-view' | 'detail-card' | ...` depuis registry.yaml.

**VantageRegistry catalog auto-sync** : skill `mosaic-vr-sync` (Omega side) lit `registry.yaml` à chaque release npm + upsert via `mcp__vantage-registry__upsert_skill_content` / équivalent template.

### 3.4 Streaming renderer progressif

**Inspiré** : OpenUI (Thesys 6.5k stars top 1 sister)

**Why** : pour grands datasets (>1000 rows table-view, feed-list infinite scroll, kanban-board avec centaines de cards), attendre la réponse complète du tool MCP avant render = UX dégradée. Mosaic hydrate les composants incrémentalement depuis postMessage tool result.

**Spec** :

```typescript
// packages/mosaic/src/core/streaming-renderer.ts
import { z } from 'zod'

const StreamChunkSchema = z.object({
  type: z.literal('mosaic.stream.chunk'),
  componentKey: z.string(),
  chunkId: z.number().int(),
  data: z.record(z.unknown()),
  isLast: z.boolean(),
})

export function attachStreamingRenderer({
  componentKey,
  onChunk,
  onComplete,
}: {
  componentKey: string
  onChunk: (chunk: unknown, chunkId: number) => void
  onComplete: () => void
}) {
  window.addEventListener('message', (event) => {
    const parsed = StreamChunkSchema.safeParse(event.data)
    if (!parsed.success) return
    if (parsed.data.componentKey !== componentKey) return
    onChunk(parsed.data.data, parsed.data.chunkId)
    if (parsed.data.isLast) onComplete()
  })
}
```

**Composants streaming-aware** : `table-view`, `feed-list`, `kanban-board`, `markdown-renderer` (long form), `code-block` (long form). Tous autres composants restent batch-rendered.

**Perf cibles** :
- TTFP (Time To First Paint) < 100ms (même pour datasets 10k rows)
- Latency entre chunks < 16ms (60fps maintained)
- Memory : virtualization automatique au-delà de 200 items visibles

**Compat** : token-by-token output mode (OpenAI streaming, Anthropic streaming) supportée nativement.

---

## 4. Core-First Doctrine — Governance Rule (non-négociable)

**Toute extension BU-spécifique nouvelle DOIT déclencher analyse "Core abstraction possible ?" AVANT de coder le composant BU-specific.**

### 4.1 Rationale

Sans cette règle, chaque BU (sigma VP, theta CRM, mu vantage-bridge, athena/hermes/demeter extensions, chi gptpowerups, etc.) tend à réinventer des composants similaires en silo. Résultat :
- Library Core stagne à `~33 baseline 6 cat`
- BU-specific layer gonfle à `~50+ duplicates` partiellement
- Patterns transverses émergent sans capitalize → dette technique cumulative
- Net effect : ratio Core/BU-specific dégradant (vector négatif)

Core-First force l'inverse : Core grossit, BU-specific reste minimal et justifié.

### 4.2 Flow obligatoire (par composant BU-specific proposed)

1. **Proposal** : orchestrateur identifie besoin composant nouveau
2. **Step 0 audit via skill `mosaic-component-design`** qui pose 3 questions :
   - Ce composant peut-il être abstrait pour servir d'autres BUs ?
   - Quel niveau d'abstraction acceptable sans perdre la spécificité métier ?
   - Quels props/Zod schema permettent au Core de couvrir le besoin BU actuel + futurs besoins identifiables ?
3. **Décision documentée** dans `decisions/library-ui-mcp/core-vs-bu-<component-key>.md` :
   - **CORE** : abstraction faite → ajout `@vantageos/mosaic/<category>/<generic-name>` + le BU-specific devient composer/variant via props
   - **BU-SPECIFIC** : justification écrite expliquant pourquoi abstraction impossible/inutile → reste dans BU `mcp-server/src/ui-resources/` local **ET** registré dans `registry.yaml` avec flag `scope: bu-only` + pointer vers analysis doc
   - **HYBRID** : Core minimal + BU extension wrapper qui consume Core + ajoute spécificité

### 4.3 Enforcement (CI gates)

- **`mosaic-bu-specific-must-have-core-analysis`** : tout composant avec flag `scope: bu-only` dans `registry.yaml` DOIT pointer vers `decisions/library-ui-mcp/core-vs-bu-<component>.md` analysis doc qui existe et contient les 3 réponses du skill `mosaic-component-design`
- **`mosaic-core-bu-ratio-monitor`** : audit hebdo (skill VR) qui tracke le ratio Core composants / BU-specific composants → alert si BU-specific grandit > 20% plus vite que Core sur fenêtre 30 jours (pattern fragmentation détecté)
- **Override marker** : `// allow-bu-specific-without-core-analysis: <reason>` rare, ne doit pas dépasser 5% des composants. Audit override usage via fleet friction digest (RULE #15 AUTO-AMÉLIORATION)

### 4.4 Re-évaluation périodique

Audit hebdo via `friction-digest` skill (Sunday 22:30) : re-évaluer chaque composant `scope: bu-only` existant :
- Pattern émerge cross-BU ? (deux BUs ont composants similaires bu-only)
- Core abstraction maintenant possible ? (nouvelles props/Zod patterns identifiés)
- Si OUI → dispatch mission Core extraction (composant existant `bu-only` devient Core + refacto consumer)

### 4.5 Bénéfices

- Évite fragmentation library (chaque BU réinvente)
- Force abstraction maximale Core (Doctrine Flexibilité critère #2 — Abstraction fonctionnelle)
- Capitalize patterns transverses naturellement (RULE #15 AUTO-AMÉLIORATION applicable composants)
- Net effect : Core grossit vs BU-specific (vector positif vs ratio dégradant)
- Réutilisabilité maximale fleet-wide

### 4.6 Applicabilité

Tous orchestrateurs présents et futurs (gamma lead + sigma + theta + mu + athena + hermes + demeter + chi + omega + tous les futurs consumers `@vantageos/mosaic`). Pi enforce via Eta review chain + CI gates VR.

---

## 5. Folder Structure

### 4.1 Monorepo layout

```
vantageos-mosaic/
├── README.md
├── package.json
├── pnpm-workspace.yaml          # ou npm workspaces
├── turbo.json                   # build orchestration
├── .changeset/                  # release notes
├── docs/
│   ├── mosaic-architecture-standard-v1.md  # ← canonical source
│   ├── getting-started.md
│   ├── i18n.md
│   ├── streaming.md
│   ├── zod-validation.md
│   ├── ci-gates.md
│   └── migration-from-mcp-architect.md
├── packages/
│   ├── mosaic/                  # @vantageos/mosaic — design system
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── biome.json
│   │   ├── vitest.config.ts
│   │   ├── registry.yaml        # ← canonical component manifest
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── render-error.ts
│   │   │   │   ├── streaming-renderer.ts
│   │   │   │   ├── i18n-bridge.ts
│   │   │   │   └── types.ts
│   │   │   ├── components/
│   │   │   │   ├── progress/
│   │   │   │   │   ├── progress-bar/
│   │   │   │   │   │   ├── index.tsx
│   │   │   │   │   │   ├── schema.ts
│   │   │   │   │   │   ├── test.tsx
│   │   │   │   │   │   ├── stories.tsx
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   └── i18n.json
│   │   │   │   │   ├── spinner/...
│   │   │   │   │   └── ...
│   │   │   │   ├── input/...
│   │   │   │   ├── display/...
│   │   │   │   ├── artifacts/...
│   │   │   │   ├── confirmation/...
│   │   │   │   └── media/...
│   │   │   ├── types/
│   │   │   │   └── mosaic-keys.ts  # ← generated from registry.yaml
│   │   │   └── index.ts          # public API exports
│   │   ├── tests/
│   │   │   ├── a11y/             # axe-core Playwright
│   │   │   ├── visual/           # screenshot regression
│   │   │   └── integration/
│   │   └── scripts/
│   │       ├── registry-drift-check.ts
│   │       └── generate-types.ts
│   ├── mosaic-i18n/             # @vantageos/mosaic-i18n
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── core.ts          # t, detectLocale, parityCheck
│   │   │   ├── locales/
│   │   │   │   ├── en.json
│   │   │   │   └── fr.json
│   │   │   └── index.ts
│   │   └── tests/
│   ├── mosaic-charts/           # @vantageos/mosaic-charts (sub-package optionnel v0.2.0)
│   └── mosaic-themes/           # @vantageos/mosaic-themes (sub-package optionnel v0.2.0)
├── apps/
│   ├── storybook/               # Storybook static export → docs hosting
│   ├── playground/              # Vite app for live MCP UI testing
│   └── docs/                    # Docusaurus or Fumadocs site
└── .github/
    ├── workflows/
    │   ├── ci.yml               # tests + a11y + size-limit + drift-check
    │   ├── release.yml          # npm publish (Eta gate)
    │   └── storybook-deploy.yml
    └── PULL_REQUEST_TEMPLATE.md
```

### 4.2 Per-component structure (mandatory)

Chaque composant occupe son propre dossier :

```
src/components/<category>/<component-key>/
├── index.tsx       # React component (uses schema.ts for validation)
├── schema.ts       # Zod schema + TypeScript type export
├── test.tsx        # vitest unit tests (TDD: written BEFORE index.tsx)
├── stories.tsx     # Storybook stories (all states: default/loading/error/empty)
├── README.md       # component-specific docs
└── i18n.json       # component i18n keys (mirrored in packages/mosaic-i18n/src/locales)
```

---

## 6. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Package | `@vantageos/<name>` | `@vantageos/mosaic` |
| Component key (registry.yaml + import path) | kebab-case | `table-view`, `detail-card` |
| Component class (React export) | PascalCase | `TableView`, `DetailCard` |
| Props type | `<Component>Props` | `TableViewProps` |
| Zod schema | `<Component>PropsSchema` | `TableViewPropsSchema` |
| Test file | `test.tsx` (sibling) | — |
| Stories file | `stories.tsx` (sibling) | — |
| i18n key | `mosaic.<componentKeyCamel>.<key>` | `mosaic.tableView.empty` |
| Category folder | lowercase | `display/`, `input/` |
| Imports public | category subpath | `import { TableView } from '@vantageos/mosaic/display'` |

---

## 7. Strict TDD Specs (non-négociable, Rule #11 CLAUDE.md)

### 6.1 TDD discipline

Pour chaque nouveau composant :

1. **RED** : écrire `test.tsx` AVANT `index.tsx`. Run `npm test` → test fail (composant n'existe pas).
2. **GREEN** : écrire `index.tsx` minimal pour passer le test. Run `npm test` → test pass.
3. **REFACTOR** : optimiser sans casser les tests.

Pas de PR sans test prior. Pas de complete_task sans ratio test cité.

### 6.2 Coverage cibles (CI gate)

| Métrique | Cible | Tool |
|---|---|---|
| Lines coverage | ≥ 90% | vitest c8 |
| Branches coverage | 100% | vitest c8 |
| Zod schema cases | 100% (happy + edge + failure) | vitest |
| Functions coverage | ≥ 95% | vitest c8 |

### 6.3 Eval corpus (per component, mandatory)

`packages/mosaic/src/components/<cat>/<key>/test.tsx` doit contenir minimum 3 cases :

1. **Happy path** : props valides → render attendu
2. **Edge case** : empty data / null / extreme values → render gracieux
3. **Failure path** : props invalides Zod → render error explicit + fallback markdown

### 6.4 Visual + a11y tests

- **Storybook stories** : all states (default, loading, error, empty, hover si applicable)
- **Playwright a11y** : `tests/a11y/<component-key>.spec.ts` → axe-core 0 violations sur all stories
- **Visual regression** : `tests/visual/<component-key>.spec.ts` → screenshot baseline check

### 6.5 Type + lint gates

- `tsc --noEmit` → 0 errors
- Biome → 0 errors
- ESLint → 0 errors (si activé)
- Pas de `any` (use `unknown` + Zod narrow)
- Pas de `// @ts-ignore` (use `// @ts-expect-error` justifié)

---

## 8. i18n by Design

### 7.1 API canonical `@vantageos/mosaic-i18n`

```typescript
import { t, detectLocale, parityCheck } from '@vantageos/mosaic-i18n'

// detect locale from MCP context (host header, query param, MCP capability)
const locale = detectLocale({ headers: req.headers, default: 'en' })

// translate key
const label = t('mosaic.tableView.empty', locale) // → "No data" (en) or "Aucune donnée" (fr)
```

### 7.2 Parity gate

`parityCheck(en, fr)` retourne `{ missingInFr: [], missingInEn: [], extraKeys: [] }`.

**CI gate** : skill VR `mcp-app-i18n-parity` (déjà shipped PR #24) bloque PR si parity gap détecté.

### 7.3 Composant integration

Chaque composant déclare ses i18n keys dans :

```
src/components/<cat>/<key>/i18n.json
```

```json
{
  "mosaic.tableView.empty": {
    "en": "No data",
    "fr": "Aucune donnée"
  },
  "mosaic.tableView.loading": {
    "en": "Loading...",
    "fr": "Chargement..."
  }
}
```

Pre-commit hook + CI : agrège tous `i18n.json` filesystem → merge dans `packages/mosaic-i18n/src/locales/{en,fr}.json` + parity check.

### 7.4 Pas de hardcoded strings JSX

Banni : `<span>No data</span>`. Obligatoire : `<span>{t('mosaic.tableView.empty', locale)}</span>`.

CI gate ESLint custom rule `mosaic/no-hardcoded-strings`.

---

## 9. a11y WCAG AA

### 8.1 axe-core enforcement

- Runtime : `axe.run()` integrated dans Storybook addon
- CI : `tests/a11y/<component-key>.spec.ts` Playwright → axe-core check sur all stories
- Threshold : **0 violations WCAG AA** par composant

### 8.2 Patterns mandatory

- Semantic HTML (`<table>` pas `<div>`, `<button>` pas `<div onclick>`)
- ARIA labels (`aria-label`, `aria-labelledby`, `aria-describedby`)
- Keyboard navigation (Tab, Enter, Esc, Arrow keys per pattern)
- Focus management (visible focus ring, focus trap dans dialogs)
- Color contrast ≥ 4.5:1 (text) et 3:1 (UI elements)
- Reduced motion respect (`@media (prefers-reduced-motion)`)
- Screen reader testing (NVDA + VoiceOver minimum, manual)

### 8.3 Composants à risk a11y (extra audit)

- `kanban-board` (drag-drop keyboard alternative obligatoire)
- `richtext-editor` (ARIA contenteditable patterns)
- `datepicker` (calendar widget patterns)
- `multiselect` (combobox patterns)
- `chart-*` (texte alternatif obligatoire pour data visualisations)

---

## 10. Bundle & Performance

### 9.1 Size limits

- **Total bundle gzipped** : ≤ 250KB (single-file vite-plugin-singlefile)
- **Per-component max** : déclaré dans `registry.yaml` (`sizeLimit`), CI gate vérifie
- **Tree-shaking** : ESM exports purs, pas de side-effects

### 9.2 Performance cibles

| Métrique | Cible | Méthode mesure |
|---|---|---|
| TTFP (Time To First Paint) | < 100ms | Lighthouse + custom Performance API |
| Interaction latency | < 500ms | INP measure |
| Streaming chunk latency | < 16ms | per-chunk timer |
| Bundle parse + eval | < 50ms | requestIdleCallback wrapping |

### 9.3 CI gate

- `size-limit` (vite-bundle-visualizer + `@size-limit/preset-big-lib`)
- Lighthouse CI (PR-level perf budget)
- Custom skill VR `mosaic-perf-check`

---

## 11. npm Publishing

### 10.1 Versioning

- **SemVer strict** : MAJOR.MINOR.PATCH
- **Changesets** : `.changeset/*.md` per PR (release notes + version bump intent)
- **Auto-release** : Changesets bot post-merge main → tag + npm publish

### 10.2 Day 79 Eta gate (non-négociable)

Tout `npm publish` pour `@vantageos/*` requires **Eta APPROVED token** :

```bash
ETA_APPROVED_TASK_ID=k<taskId> npm publish
```

OU flag `--eta-approved-task=k<taskId>` OU comment `# eta-approved: k<taskId>` dans commit.

Référence : CLAUDE.md doctrine "NPM PUBLISH PROTOCOL".

### 10.3 Sub-packages release

`@vantageos/mosaic` + `@vantageos/mosaic-i18n` publiés ensemble en même version pour cohérence cross-package.

### 10.4 Public registry

- **npm public** (default)
- GitHub Packages mirror (optionnel post-v1.0)
- VantageRegistry catalog auto-upsert post-publish

### 10.5 Release checklist (mandatory pre-publish)

Before running `npm publish` for any `@vantageos/mosaic` release:

1. **CHANGELOG.md updated** — `packages/mosaic/CHANGELOG.md` must have a section for the new version following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Move entries from `[Unreleased]` to the versioned section.
2. **CHANGELOG.md in tarball** — verify with `npm pack --dry-run --json | jq '.[0].files[].path' | grep -i CHANGELOG`. Must match. The `package.json` `files` array must include `"CHANGELOG.md"`.
3. **Version bump** — `package.json` version matches the new section heading.
4. **Git tag** — tag `vX.Y.Z` created post-merge before publish.
5. **Eta gate** — `ETA_APPROVED_TASK_ID` present (§10.2).
6. **Build + test green** — `pnpm run build && pnpm run test && pnpm run size-limit` pass with 0 errors.

Athena Audit Axis 8 (2026-06-13): CHANGELOG absence from the tarball was identified as a gap. This checklist + the `files` amendment close it.

---

## 12. Storybook & Docs

### 11.1 Storybook

- Hébergé `https://mosaic.vantageos.agency` (Phi side hosting via Vercel ou Convex storage)
- Build : `apps/storybook/storybook-static/` → deploy par `release.yml`
- Stories : 1 fichier `stories.tsx` par composant avec all states

### 11.2 Docs site

- **Docusaurus** ou **Fumadocs** (à arbitrer Gamma)
- Hébergé `https://mosaic.vantageos.agency/docs/`
- Sections :
  - Getting Started (install + first component)
  - Architecture (this doc)
  - Components reference (auto-generated depuis registry.yaml)
  - i18n guide
  - Streaming guide
  - Zod validation guide
  - Migration depuis `@vantageos/mcp-architect` baseline
  - CI gates reference

### 11.3 Bilingue FR + EN

Storybook + docs bilingues (Locale toggle baked dans Storybook + Docusaurus i18n config).

---

## 13. CI Gates (PR blocking)

| Gate | Owner | Tool | Block PR si |
|---|---|---|---|
| TypeScript | gamma | `tsc --noEmit` | > 0 errors |
| Biome | gamma | `biome ci` | > 0 errors |
| Tests | gamma | vitest | < 100% PASS |
| Coverage | gamma | vitest c8 | < 90% lines OR < 100% branches |
| a11y | gamma + eta | Playwright axe-core | > 0 violations |
| Size limit | gamma | size-limit | bundle > 250KB gz |
| Registry drift | omega | `mosaic-registry-drift-check` | registry.yaml ≠ filesystem |
| i18n parity | sigma + omega | `mcp-app-i18n-parity` skill | en.json ≠ fr.json keys |
| Hardcoded strings | gamma | ESLint custom rule | hardcoded JSX strings detected |
| MCP spec compliance | gamma + eta | `mcp-app-review-checklist` skill | SEP-1865 violation |
| Eta review (eta opt-in pour PRs critiques) | eta | manual review | REVISE verdict |
| Pi review (npm publish) | pi | Day 79 token | ETA_APPROVED_TASK_ID absent |
| Core-First Doctrine | gamma + eta | `mosaic-bu-specific-must-have-core-analysis` skill VR | composant `scope: bu-only` sans analysis doc associée |
| Core/BU ratio monitor | omega | `mosaic-core-bu-ratio-monitor` skill VR audit hebdo | BU-specific grandit > 20% plus vite que Core sur 30 jours |

---

## 14. Override Marker Convention

Toute exception au standard requires inline override marker + justification.

| Override | Format | Use case |
|---|---|---|
| Skip a11y check (rare) | `// allow-a11y-skip: <reason>` | Decorative element sans interaction |
| Skip i18n (rare) | `// allow-no-i18n: <reason>` | Technical key (e.g. timestamp display) |
| Hardcoded string | `// allow-hardcoded-string: <reason>` | Brand name (e.g. "Mosaic") |
| Size over limit | `# allow-size-over: <reason>` dans registry.yaml | Composant complexe justifié (e.g. richtext-editor) |
| Test skip | `it.skip('...', ...)` + comment | Bug tracked dans VP issue |

Override usage logged dans `friction_observed` field + harvest hebdo via `/friction-digest` (Rule #15 AUTO-AMÉLIORATION).

Override récurrent > 1 fois sur même pattern → obligation de fixer root cause (modifier standard ou tooling).

---

## 15. Roadmap Phases

### Phase 1 — Critical Rule #1 fast-fix (Sigma, in flight)
- Task `k173t8tw9hvtp20t1ynrrpknk187xbdf`
- VP-side adopt @mcp-ui/server, fix SEP-1865 compliance gap
- Output : 6 VP primitives canonical PR #1865 nested shape + markdown fallback

### Phase 2 — Library `@vantageos/mosaic` v0.1.0 build (Gamma)
- Task `k178hg3wxx7e98k0cnjhnaz3ms87xcsb`
- DependsOn Phase 1
- Repo `elpiarthera/vantageos-mosaic` création
- Stack final + 4 patterns différenciateurs + strict TDD
- ≥ 20 composants livrés couvrant 6 catégories
- npm publish v0.1.0 (Eta gate)

### Phase 3 — Consume refacto (Sigma + Theta)
- VP : refacto 6 primitives existantes vers @vantageos/mosaic + ship 8 missing primitives
- VantageCRM : ship 8-12 primitives nouveaux via @vantageos/mosaic

### Phase 4 — Fleet rollout (Omega + Mu + Athena + Hermes + Demeter + Chi)
- Autres MCPs consomment selon priorité business
- Omega : VR catalog auto-sync continuous

---

## 16. Stakeholders & Contribution Roles

| Role | Orchestrateur | Phase active | Responsabilité |
|---|---|---|---|
| Lead architect | gamma | Phase 2 (lead) | Library build, 4 patterns, strict TDD, CI gates, npm publish |
| Server-side consumer #1 | sigma | Phase 1 + 3 | Fast-fix Critical Rule #1, then VP primitives consume + i18n co-lead |
| Server-side consumer #2 | theta | Phase 3 | VantageCRM primitives consume + UX feedback terrain |
| Quality reviewer | eta | Phase 2 + 3 (continu) | axe-core + i18n parity + size-limit + skill-standard-v2 review |
| Registry catalog | omega | Phase 2 + 3 + 4 | VR auto-sync + drift gate + skill mosaic-registry-drift-check |
| Docs + Storybook hosting | phi | Phase 2 fin + 3 | mosaic.vantageos.agency hosting (storybook + docs) |
| Extensions reviewer | argus | Phase 3 + 4 | PRs library côté usage extensions |
| Bridge consumer | mu | Phase 4 | vantage-bridge consume côté LLM hosts |
| Customer extensions consumers | athena, hermes, demeter | Phase 4 | vantage-crm-extension, vantage-peers-extension, vantage-gmail-addon |
| GPTPowerUps consumer (optionnel) | chi | Phase 4 (opt-in) | gptpowerups-extension consume |

---

## 17. Doctrine Alignment

Mosaic respecte intégralement les 15 Rules CLAUDE.md ElPi Corp :

- **Rule #1 SHIP 24/7 vs break-asking** : Mosaic dev cadence sans pause artificielle
- **Rule #9 SHIP 24/7 non-temporal defer** : Phases parallèles dès dependency unblock
- **Rule #11 réponse courte + strict TDD** : Tests AVANT code, completionNotes synthétiques
- **Rule #12 no self-imposed budget** : Scope étendu validé Laurent post-research, pas Pi-bound
- **Rule #14 TRUST THE SYSTEM** : Gamma orchestre sa décomposition, Pi délègue
- **Rule #15 AUTO-AMÉLIORATION** : Override markers harvest + fleet-wide friction digest weekly

Doctrine Flexibilité 5/5 (decisions/doctrine-flexibilite-2026-04-14.md) :

1. **Portabilité protocolaire MCP-first** : @mcp-ui/server consume (industry standard)
2. **Abstraction fonctionnelle** : Zod schema + i18n keys = intent decoupled from impl
3. **Migration-ready** : 2 alternatives documentées (assistant-ui taxonomie + json-render Zod patterns)
4. **VantagePeers-native composable** : registry.yaml → VR catalog auto-sync
5. **Parallélisable** : composants indépendants par catégorie, sub-packages tree-shakable

---

## 18. References

### Research (Day 90 AM)

- Sister 4 sources Laurent : `analysis/mcp-ui-libraries-comparative-2026-06-02.md` commit `688f7bd`
- Extension 3 sources + PR #1865 spec : `analysis/mcp-ui-libraries-comparative-2026-06-02-extension.md` commit `688f7bd`
- Landscape 10 alternatives : `analysis/mcp-ui-libraries-landscape-2026-06-02.md` commit `322af5d`

### BU audits

- Sigma VP tables : `decisions/library-ui-mcp/sigma-vp-tables-components-audit-2026-06-02.md` commit `84cf3d1`
- Theta CRM tables : `decisions/library-ui-mcp/theta-crm-tables-components-audit-2026-06-02.md` commit `dd220c4` (branch theta/library-ui-audit-crm-day90, to merge)

### Briefs canoniques

- Mission library-ui-mcp v2 : VP memory `j579e74vxv566a10readet4zch87xxv9` (supersedes `j578y5xtbgp735aaktyyhvtnpx87t8n4`)
- Skills VR cataloged : mcp-app-init, mcp-app-i18n-parity, mcp-app-a11y-check, mcp-app-size-limit, mcp-app-eval-corpus, mcp-app-publish, mcp-app-review-checklist, mcp-app-consume (8 skills PR #24 MERGED)

### External

- PR #1865 MCP UI Extension : https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865 (MERGED 2026-01-28)
- mcpui.dev (reference implementation) : https://mcpui.dev/
- @mcp-ui/server npm : https://www.npmjs.com/package/@mcp-ui/server (v6.1.0 Apache-2.0)
- PostHog implementation guide : https://mcpservers.org/agent-skills/posthog/implementing-mcp-ui-apps
- A2UI (Google) : https://github.com/google/A2UI
- OpenUI (Thesys) : https://github.com/thesysdev/openui
- assistant-ui : https://github.com/assistant-ui/assistant-ui
- json-render (Vercel Labs) : https://github.com/vercel-labs/json-render

### Standards ElPi Corp

- `resources/references/mcp-app-standard.md` (10 Critical Rules MCP Apps)
- `resources/references/mcp-standard.md` (10 Critical Rules MCP servers)
- `resources/references/skill-standard-v2.md` (skill quality standard)
- `decisions/doctrine-flexibilite-2026-04-14.md` (5 critères flexibilité)
- `CLAUDE.md` (15 absolute rules ElPi Corp)

---

**Doc version** : v1 DRAFT 2026-06-02
**Last update** : Pi orchestrator pi-chromebook
**Next review** : Gamma (lead architect) — verdict APPROVED / REVISE attendu
**Post-review** : Omega upsert VR standard `mosaic-architecture-standard-v1`, copy canonical to `vantageos-mosaic/docs/` post-repo création
