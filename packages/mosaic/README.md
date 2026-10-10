# @vantageos/mosaic

Fleet-wide MCP UI design system. Zod-validated, taxonomy-organized (7 categories: artifacts, confirmation, display, forms, input, media, progress), streaming-ready, **cross-runtime React 19 + Preact 10**. Built for MCP Apps (SEP-1865 extension).

## Install

```sh
# React 19
npm install @vantageos/mosaic@^0.4.0 @vantageos/mosaic-tokens@^0.7.0 react react-dom

# Preact 10
npm install @vantageos/mosaic@^0.4.0 @vantageos/mosaic-tokens@^0.7.0 preact
```

All runtime peers are marked optional via `peerDependenciesMeta` — install only what your runtime needs.

## Build

```sh
pnpm --filter @vantageos/mosaic build
```

The `build` script prefixes `NODE_OPTIONS=--max-old-space-size=8192` automatically — no manual env export required.

**Why 8 GB heap?** tsup runs multiple parallel DTS (declaration emit) configs for cross-runtime outputs (React 19, Preact 10, server, tokens). Each TypeScript compiler worker holds the full type graph in memory. The combined peak exceeds Node's default 2 GB V8 limit, causing OOM crashes (`FATAL ERROR: Reached heap limit Allocation failed`). 8 GB gives adequate headroom on a standard CI runner (ubuntu-latest provides 16 GB RAM).

This constraint is codified locally via the `build` script (the `NODE_OPTIONS` prefix above), so it applies anywhere the script runs — including CI. Wiring it as an explicit job-level `env: NODE_OPTIONS` in `.github/workflows/ci.yml` for the build-bearing jobs (`build-parity-cross-runtime`, `peer-resolution-smoke`, `npm-publish`) is planned but not yet present.

## Surface

| Subpath | Runtime | Use case |
|---|---|---|
| `@vantageos/mosaic` | React 19 (back-compat) | v0.1.x consumers (Sigma VP, Theta CRM) |
| `@vantageos/mosaic/<cat>` | React 19 (back-compat) | Tree-shakable category imports v0.1.x style |
| `@vantageos/mosaic/react` | React 19 | React consumers — explicit runtime opt-in (the preferred surface since v0.2.0) |
| `@vantageos/mosaic/react/<cat>` | React 19 | Tree-shakable category imports under explicit react/ prefix |
| `@vantageos/mosaic/preact` | Preact 10 | Mu vantage-bridge iframe, Chi gptpowerups (LLM-host target) |
| `@vantageos/mosaic/preact/<cat>` | Preact 10 | Tree-shakable category imports under preact/ prefix |
| `@vantageos/mosaic/tokens` | runtime-free | Re-export of `@vantageos/mosaic-tokens` |
| `@vantageos/mosaic/server` | Node | `createMosaicResource()` MCP UI builder (runtime-agnostic) |
| `@vantageos/mosaic/server/resource` | Node | `buildMcpAppResource()` MCP Apps `_meta` helper (pure, no React, no DOM) |
| `@vantageos/mosaic/host` | runtime-free | Host-context core (theme, display mode, locale, model context) |
| `@vantageos/mosaic/react/host` · `/preact/host` | React 19 · Preact 10 | Hooks over the host-context core |

`<cat>` = `progress` | `input` | `display` | `artifacts` | `confirmation` | `media`.

## Quick start

```tsx
// React 19 — the preferred runtime-explicit surface
import { ProgressBar } from "@vantageos/mosaic/react/progress";
import { ConfirmDialog } from "@vantageos/mosaic/react/confirmation";
import "@vantageos/mosaic-tokens/css"; // declares --mosaic-* vars on :root

export function MyComponent({ progress, label }: { progress: number; label: string }) {
  return <ProgressBar value={progress} label={label} locale="en" />;
}
```

```tsx
// Preact 10 — same components, preact/compat alias at build time
import { ProgressBar } from "@vantageos/mosaic/preact/progress";
import "@vantageos/mosaic-tokens/css";

export function MyComponent({ progress, label }: { progress: number; label: string }) {
  return <ProgressBar value={progress} label={label} locale="en" />;
}
```

## Forms

`@vantageos/mosaic/{react,preact}/forms` — composite form primitives wrapping `react-hook-form` + `@hookform/resolvers/zod`. Default validation mode is `onBlur` (Chi co-validated, Day 102 DM). Cross-runtime: same imports, React 19 path or Preact 10 path.

### Install peers

```sh
npm install react-hook-form@^7.54.0 @hookform/resolvers@^3.10.0
```

Both peers are declared optional in `peerDependenciesMeta` — only install them if you use the forms surface.

### Quick start

```tsx
import { z } from "zod";
import {
  useMosaicForm,
  FormProvider,
  FormField,
  ErrorDisplay,
  SubmitButton,
} from "@vantageos/mosaic/react/forms";

const schema = z.object({
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be 18+"),
});

export function SignupForm({ onSubmit }: { onSubmit: (data: z.infer<typeof schema>) => void }) {
  const form = useMosaicForm({
    schema,
    defaultValues: { email: "", age: 0 },
    // mode defaults to "onBlur" — Mosaic doctrine
  });

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="email">
          {({ field, fieldState }) => (
            <label>
              Email
              <input {...field} value={(field.value as string) ?? ""} />
              <ErrorDisplay error={fieldState.error} />
            </label>
          )}
        </FormField>
        <SubmitButton label="Sign up" />
      </form>
    </FormProvider>
  );
}
```

### Surface

| Export | Purpose |
|---|---|
| `useMosaicForm({ schema, defaultValues, mode? })` | Wrapper around `useForm` + `zodResolver`. Returns RHF's `UseFormReturn` extended with `mosaicSchema` + `mosaicMode`. |
| `<FormProvider form={...}>` | Wraps RHF's `FormProvider` AND a Mosaic-specific context. Use `useMosaicFormContext()` inside descendants. |
| `<FormField name="...">{({ field, fieldState, formState }) => ...}</FormField>` | Render-prop wrapper around RHF's `Controller`. |
| `<ErrorDisplay error={...} messageMap={...} />` | Single-field error formatter. Renders nothing when no error. Priority: `error.message` → `messageMap[type]` → generic fallback. |
| `<SubmitButton label="..." loadingLabel="..." />` | Bound to the surrounding `FormProvider`. Disabled while invalid OR submitting. |
| `<Input name="..." type="text\|email\|password\|number\|url" label="..." placeholder? disabled? autoComplete? />` | Single-field `<input>` bound to the surrounding `FormProvider`. `label` is required (consumer-driven i18n). Emits `aria-invalid` + `aria-describedby` on validation error. |

| `<Textarea name="..." rows? maxLength? autoResize? placeholder? disabled? label?  />` | Multi-line text input field primitive. `rows` default 3, `maxLength` enforced via shared logic gate, optional `autoResize` grows to content. `aria-invalid` + `aria-describedby` on error. |

| `useFieldArray({ name, control? })` | Thin wrapper around RHF's `useFieldArray`. Returns `{ fields, append, remove, move, swap }` + the rest of RHF's native return for advanced cases. Reads `control` from `FormProvider` when omitted. |
| `<FieldArray name="...">{({ field, index }, { append, remove, move, swap, fields }) => ...}</FieldArray>` | Render-prop wrapper around `useFieldArray`. Emits `role="list"` shell + `role="listitem"` per row, keyed by RHF's stable `field.id` (NOT array index). Powers PromptForm Add Variable, Hermes variable mappings, Demeter filter chips. |

| `<Checkbox name="..." label="..." indeterminate? description? disabled? />` | Boolean checkbox primitive. `indeterminate=true` → `aria-checked="mixed"` + DOM `.indeterminate=true` via ref. `description` wired via `aria-describedby`. `aria-invalid` + `aria-describedby` on error. |
| `<RadioGroup name="..." label="..." options={[...]} orientation? disabled? />` | WCAG-AA radiogroup. Roving tabIndex, Arrow key selection sync, Home/End, Space/Enter. |


### RadioGroup

Mutually exclusive single-choice field. Keyboard navigation follows WAI-ARIA radiogroup pattern (§3.10): Arrow keys move focus AND select simultaneously (roving tabindex). Disabled options are skipped during navigation.

```tsx
import { z } from "zod";
import {
  useMosaicForm,
  FormProvider,
  RadioGroup,
} from "@vantageos/mosaic/react/forms";

const schema = z.object({
  plan: z.string().min(1, "Please select a plan"),
});

export function PlanSelector() {
  const form = useMosaicForm({
    schema,
    defaultValues: { plan: "" },
  });

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(console.log)}>
        <RadioGroup
          name="plan"
          label="Select a plan"
          options={[
            { value: "free", label: "Free", description: "Up to 3 projects" },
            { value: "pro", label: "Pro", description: "Unlimited projects" },
            { value: "team", label: "Team", description: "Multi-user", disabled: false },
          ]}
          orientation="vertical"
        />
      </form>
    </FormProvider>
  );
}
```

**WCAG-AA contract:**
- `role="radiogroup"` + `aria-labelledby` on container
- `role="radio"` + `aria-checked` + roving `tabIndex` per option
- `aria-labelledby` per option → its visible label span
- `aria-describedby` per option → its description span (when present)
- `aria-disabled` on disabled options; disabled options skipped in arrow nav
- `aria-orientation` reflects `orientation` prop

| `<MultiSelect name="..." label="..." options={...} placeholder? disabled? searchable? maxItems? />` | Multi-value dropdown. RHF value is `string[]`. Selected items render as removable chips (Backspace/Delete on trigger removes last, per-chip × removes specific). WCAG-AA combobox (`role=combobox aria-multiselectable=true`), Arrow/Enter keyboard nav, optional case-insensitive search, optional `maxItems` cap. |

| `<Select name="..." label="..." options={[...]} />` | Single-select dropdown (combobox+listbox APG). Optional `searchable` prop enables in-popup filter. Full keyboard nav + type-ahead. WCAG-AA strict. |




## Server (MCP UI)

```ts
import { createMosaicResource } from "@vantageos/mosaic/server";

const resource = createMosaicResource({
  componentId: "ProgressBar",
  props: { value: 42, label: "Loading…", locale: "en" },
});
// returns a SEP-1865-compliant MCP UI resource with text/html;profile=mcp-app MIME
```


## MCP Apps host layer (ChatGPT and Claude)

Standard MCP Apps keys come first; `openai/*` keys are strictly additive. A view built
on this layer works with no `openai` key at all, and never requests `pip` for ChatGPT.
`@modelcontextprotocol/ext-apps` is **not** a dependency: the core types the `App`
structurally, so any `App` instance fits.

### Resource helper (server, pure)

```ts
import { buildMcpAppResource } from "@vantageos/mosaic/server/resource";

const { resource, toolMeta } = buildMcpAppResource({
  uri: "ui://mosaic/tasks",
  html,                                  // your bundled single-file view
  csp: { connectDomains: ["https://api.example.com"] }, // the 4 arrays are always emitted
  servedUrl: "https://example.com/mcp",  // Claude `ui.domain` is DERIVED from it, never typed
  prefersBorder: true,
  openai: { outputTemplate: "ui://mosaic/tasks", widgetDescription: "Tasks" }, // optional
});
// resource._meta = { ui: { csp, prefersBorder, domain }, "openai/widgetDescription"? }
// toolMeta       = { ui: { resourceUri }, "openai/outputTemplate"?, "openai/ui"? }
```

`domain` is `{sha256(servedUrl) first 32 hex}.claudemcpcontent.com` and is absent when
`servedUrl` is not given. `openai.preferredDisplayMode` accepts `inline` | `fullscreen`
only; `pip` throws.

### Host context (view)

```tsx
import { useMosaicHostTheme, useRequestDisplayMode, useUpdateModelContext } from "@vantageos/mosaic/react/host";
// Preact: the same names from "@vantageos/mosaic/preact/host"

const ctx = useMosaicHostTheme(app); // theme, displayMode, locale, containerDimensions, deepLink
const goFullscreen = useRequestDisplayMode(app);   // "inline" | "fullscreen"; pip refused for ChatGPT
const tellModel = useUpdateModelContext(app);      // ui/update-model-context
```

`ctx.theme` is mapped onto mosaic-tokens (`data-theme` light/dark, applied to `<html>`).
`ctx.deepLink` reads `hostContext["openai/deepLink"]` when present and is `undefined`
otherwise. Framework-free equivalents (`readHostContext`, `requestDisplayMode`,
`updateModelContext`, `subscribeHostContext`, `applyMosaicTheme`) live in
`@vantageos/mosaic/host`.

## Components

### What each subpath actually exports

Derived from the built type declarations, not maintained by hand:

```sh
# capitalised exports per subpath, excluding the
# Props/Schema/Validated/Option/Args/Return/Options/Shape/Mode/Type/Controls suffixes
node -e '...' # see the release PR for the exact script
```

| Subpath | Exports |
|---|---|
| `forms` | Checkbox, ErrorDisplay, FieldArray, FormField, FormProvider, Input, MultiSelect, RadioGroup, Select, SubmitButton, Textarea |
| `display` | Badge, EmptyState, Skeleton, StatusBadge, StreamingTableView, TableView, VirtualList |
| `progress` | ProgressBar |
| `input` | Tabs |
| `confirmation` | Alert, ConfirmDialog, ConfirmModal, TokenDisplayOnceModal |
| `artifacts` | MarkdownRenderer |
| `media` | *(none)* |

Two things this table says that prose would have hidden. **`media` exports no
components**, although it is one of the seven categories gated for cross-runtime
parity — the subpath exists and is empty of components. And the sections below
document only a few of these; the table is the inventory, the sections are
examples. Previously the sections WERE presented as the inventory, which is how
six separate sentences came to claim that form primitives were still unshipped
while a table row documenting each one sat directly beneath them.

The same list for `preact` is identical by construction — cross-runtime parity is
gated in CI (`scripts/verify-build-parity.sh`).

### Display

#### Badge

Static label primitive, cross-runtime. New in 0.4.0 — it was merged to `main` well
before and shipped in no published version until then.

```tsx
import { Badge } from "@vantageos/mosaic/react/display";
// Preact: import { Badge } from "@vantageos/mosaic/preact/display";

<Badge variant="success">Active</Badge>
```

See `src/components/display/Badge.schema.ts` for the prop contract and
`Badge.stories.tsx` for the rendered variants — both ship in the repo, and the
schema is the authority on the props rather than this snippet.

#### VirtualList

Generic virtualized list for large datasets. Uses @tanstack/react-virtual v3 (already bundled via TableView). Cross-runtime: React 19 + Preact 10.

```tsx
import { VirtualList } from "@vantageos/mosaic/react/display";
// Preact: import { VirtualList } from "@vantageos/mosaic/preact/display";

type Task = { id: string; title: string; status: string };

<VirtualList<Task>
  items={tasks}
  itemHeight={56}               // fixed px height
  renderItem={(task, index) => (
    <div key={task.id}>
      <span>{task.title}</span>
      <span>{task.status}</span>
    </div>
  )}
  onRowClick={(task, index) => router.push('/tasks/' + task.id)}
  overscan={5}                  // rows outside viewport (default 5)
  className="task-list"
  locale="en"                   // "en" | "fr"
/>
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | required | Items to render |
| `itemHeight` | `number` | -- | Fixed row height px (mutually exclusive with `estimateSize`) |
| `estimateSize` | `(index) => number` | -- | Variable height estimator |
| `renderItem` | `(item: T, index: number) => ReactNode` | required | Row renderer |
| `onRowClick` | `(item: T, index: number) => void` | `undefined` | Click handler — triggers WCAG-AA a11y (role=button + tabIndex=0 + Enter/Space) |
| `overscan` | `number` | `5` | Rows outside visible area |
| `className` | `string` | `undefined` | CSS class on scroll container |
| `locale` | `"en" or "fr"` | `"en"` | Built-in string locale |

## Doctrine

- **Pattern 1 (Zod runtime validation)** — every component validates props at the MCP host boundary; invalid props render an a11y fallback (`role="alert"`), never white-screen.
- **Pattern 2 (category taxonomy)** — components live under exactly one category. Bilingual `category.meta.json` per category. The category list is the bare subpaths in the `exports` map, which is the authority; a count written here would be wrong at the next category added, as it was.
- **Pattern 3 (Registry-gated)** — `registry.yaml` declares every component; CI gate ensures parity between source and registry.
- **Pattern 4 (Streaming-hydration ready)** — components opt-in to MCP Apps streaming via `getStreamFor()` callbacks.

See [Mosaic Architecture Standard v1.1 §3](https://github.com/elpiarthera/ElPi-Corp/blob/main/resources/references/mosaic-architecture-standard-v1.md) for the 4 patterns détails.

## i18n

Consumer-driven i18n contract: components NEVER render raw alphabetic text as JSXText children. All user-visible strings flow in as props from the host app. Enforced by the `no-hardcode-strings.test.ts` vitest AST gate.

```tsx
// Good — caller provides the localized label
<ProgressBar value={50} label={t("upload.progress")} locale={i18n.language} />

// Bad — AST scan blocks this at CI
// <ProgressBar value={50} label="Uploading…" />
```

## Bundle sizes

Every figure below is the output of `pnpm --filter @vantageos/mosaic run size-limit`
against the built `dist/`, and the gates are the `limit` values in
`packages/mosaic/.size-limit.json`. Re-run the command rather than trusting this
table: a size written by hand is wrong at the next dependency bump.

| Surface | gz | gate |
|---|---|---|
| `dist/index.js` | 133.21 kB | 250 kB |
| `dist/react/forms.js` | 20.79 kB | 50 kB |
| `dist/preact/forms.js` | 20.79 kB | 50 kB |

Per-component subpaths are tree-shakeable; only the three surfaces above are gated.

## License

**FSL-1.1-Apache-2.0** — Functional Source License, Version 1.1, Apache 2.0 Future
License. © VantageOS / ElPi Corp.

The full text ships in the published tarball as [`LICENSE`](./LICENSE), and
`package.json` carries `"license": "FSL-1.1-Apache-2.0"`, so a consumer receives the
terms with the package rather than having to find them.

This is the same licence as every sibling `@vantageos` package — verified against
what the registry actually serves for `@vantageos/mosaic-blocks`,
`@vantageos/mosaic-tokens` and `@vantageos/mcp-doctor`, not against a convention
recalled from elsewhere, and the file is byte-identical to theirs
(sha256 `3d458972e6e84e5d2361a886ef64b07aefdc38dd8955e281ea8c2ae8849646a4`).

Versions up to and including 0.3.1 shipped with no licence field and no licence
file. From 0.4.0 they are present.

## Changelog

[`CHANGELOG.md`](./CHANGELOG.md), which ships inside the published tarball — the
repo-root file this used to point at is not what a consumer receives.
