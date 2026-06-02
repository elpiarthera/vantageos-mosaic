# StatusBadge

**Category:** media · **a11y:** WCAG-AA · **sizeLimit:** 15 KB

## Purpose

Inline status pill (success / warning / danger / info / neutral). Used by 12+
tables across Sigma + Theta — status rendering is a universal fleet concern.

## Props

See `StatusBadge.schema.ts` (`StatusBadgePropsSchema`):

| Key       | Type                                                            | Default     | Notes               |
| --------- | --------------------------------------------------------------- | ----------- | ------------------- |
| `status`  | `string`                                                        | —           | Status key / text   |
| `variant` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'`     | `'neutral'` | Visual variant      |
| `label`   | `string` (optional)                                             | `status`    | Display + aria text |
| `locale`  | `'en' \| 'fr'`                                                  | —           | Required            |

## Usage

```tsx
<StatusBadge status="active" variant="success" label="Active" locale="en" />;
```

## Accessibility

- Renders as `<output>` (implicit `role="status"`), live-region friendly.
- `aria-label` falls back to `status` when `label` is omitted.
- `lang={locale}` set on the element.
- Validation failure → `<span role="alert">`.

## i18n keys

Defined in `StatusBadge.i18n.json`:

- `StatusBadge.aria.status`
- `StatusBadge.error.invalidProps`

## Eval cases

`eval-corpus.json` covers happy (success variant), edge (neutral + custom FR
label), failure (invalid variant → role=alert).
