# @vantageos/mosaic

Fleet-wide MCP UI design system. Zod-validated, taxonomy-organized (6 categories: progress, input, display, artifacts, confirmation, media), streaming-ready, **cross-runtime React 19 + Preact 10**. Built for MCP Apps (SEP-1865 extension).

## Install

```sh
# React 19
npm install @vantageos/mosaic@^0.2.0 @vantageos/mosaic-tokens@^0.2.0 react react-dom

# Preact 10
npm install @vantageos/mosaic@^0.2.0 @vantageos/mosaic-tokens@^0.2.0 preact
```

All runtime peers are marked optional via `peerDependenciesMeta` — install only what your runtime needs.

## Surface

| Subpath | Runtime | Use case |
|---|---|---|
| `@vantageos/mosaic` | React 19 (back-compat) | v0.1.x consumers (Sigma VP, Theta CRM) |
| `@vantageos/mosaic/<cat>` | React 19 (back-compat) | Tree-shakable category imports v0.1.x style |
| `@vantageos/mosaic/react` | React 19 | New v0.2.0+ React consumers — explicit runtime opt-in |
| `@vantageos/mosaic/react/<cat>` | React 19 | Tree-shakable category imports under explicit react/ prefix |
| `@vantageos/mosaic/preact` | Preact 10 | Mu vantage-bridge iframe, Chi gptpowerups (LLM-host target) |
| `@vantageos/mosaic/preact/<cat>` | Preact 10 | Tree-shakable category imports under preact/ prefix |
| `@vantageos/mosaic/tokens` | runtime-free | Re-export of `@vantageos/mosaic-tokens` |
| `@vantageos/mosaic/server` | Node | `createMosaicResource()` MCP UI builder (runtime-agnostic) |

`<cat>` = `progress` | `input` | `display` | `artifacts` | `confirmation` | `media`.

## Quick start

```tsx
// React 19 — preferred v0.2.0+ surface
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

## Forms (v0.3.0-alpha.1)

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

Field primitives (Input, Textarea, Select, Checkbox, MultiSelect, RadioGroup, FieldArray) land in T11-T20 — see `docs/v0.3.0-plan.md` §7.

## Server (MCP UI)

```ts
import { createMosaicResource } from "@vantageos/mosaic/server";

const resource = createMosaicResource({
  componentId: "ProgressBar",
  props: { value: 42, label: "Loading…", locale: "en" },
});
// returns a SEP-1865-compliant MCP UI resource with text/html;profile=mcp-app MIME
```

## Doctrine

- **Pattern 1 (Zod runtime validation)** — every component validates props at the MCP host boundary; invalid props render an a11y fallback (`role="alert"`), never white-screen.
- **Pattern 2 (6-category taxonomy)** — components live under exactly one category. Bilingual `category.meta.json` per category.
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

## Bundle sizes (v0.2.0)

| Surface | gz |
|---|---|
| `@vantageos/mosaic-tokens/dist/index.js` | 649 B (87% under the 5 KB gate) |
| `@vantageos/mosaic-tokens/src/tokens.css` | 560 B (81% under the 3 KB gate) |
| Per-component subpath (React) | tree-shakeable, see size-limit.json |

## License

MIT. © VantageOS / ElPi Corp.

## Changelog

See repo root [`CHANGELOG.md`](../../CHANGELOG.md).
