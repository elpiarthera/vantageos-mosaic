# ProgressBar

**Category:** progress · **a11y:** WCAG-AA · **sizeLimit:** 20 KB

## Purpose

Linear progress indicator for budget, quota, license-usage and similar
percentage-based signals. Cross-BU CORE component (Sigma + Theta).

## Props

See `ProgressBar.schema.ts` (`ProgressBarPropsSchema`):

| Key            | Type                                    | Default     | Notes                          |
| -------------- | --------------------------------------- | ----------- | ------------------------------ |
| `value`        | `number` (0–100)                        | —           | Required, clamped              |
| `label`        | `string` (≥1)                           | —           | Required, used as `aria-label` |
| `locale`       | `'en' \| 'fr'`                          | `'en'`      | Mosaic locale                  |
| `colorVariant` | `'default' \| 'warning' \| 'danger'`    | `'default'` | Visual emphasis                |

## Usage

```tsx
import { ProgressBar } from "@vantageos/mosaic";

<ProgressBar value={75} label="Budget" locale="fr" colorVariant="warning" />;
```

## Accessibility

- `role="progressbar"` with `aria-valuenow / aria-valuemin / aria-valuemax`.
- Focusable (`tabIndex={0}`) so the label is reachable via keyboard.
- Error fallback uses `role="alert"`.

## i18n keys

Defined in `ProgressBar.i18n.json` (mirrors `@vantageos/mosaic-i18n` locales):

- `ProgressBar.aria.label`
- `ProgressBar.error.invalidProps`

## Eval cases

`eval-corpus.json` covers happy, edge (0/100), and failure (Zod-rejected) inputs.
