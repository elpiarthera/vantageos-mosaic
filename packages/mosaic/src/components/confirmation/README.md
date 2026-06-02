# TokenDisplayOnceModal

**Category:** confirmation · **a11y:** WCAG-AA · **sizeLimit:** 30 KB

## Purpose

Show-once secret display (API tokens, recovery keys). Security pattern shared
between VP `oauth_access_tokens` and Theta `token-display-once`. CORE — secrets
handling is cross-BU by definition.

## Props

See `TokenDisplayOnceModal.schema.ts` (`TokenDisplayOnceModalPropsSchema` +
runtime `onClose` callback):

| Key              | Type           | Default | Notes                                  |
| ---------------- | -------------- | ------- | -------------------------------------- |
| `token`          | `string` (≥1)  | —       | Held only in component state           |
| `title`          | `string` (≥1)  | —       | Dialog heading                         |
| `warningMessage` | `string` (≥1)  | —       | "Will only be shown once" copy         |
| `copyLabel`      | `string` (≥1)  | —       | Copy button label                      |
| `closeLabel`     | `string` (≥1)  | —       | Close button label                     |
| `locale`         | `'en' \| 'fr'` | `'en'`  | Drives ephemeral toast copy            |
| `onClose`        | `() => void`   | —       | Runtime callback                       |

## Usage

```tsx
<TokenDisplayOnceModal
  token={generatedToken}
  title="Your API Token"
  warningMessage="This token will only be shown once. Copy it now."
  copyLabel="Copy token"
  closeLabel="I have copied it"
  locale="en"
  onClose={dismiss}
/>;
```

## Accessibility

- Native `<dialog>` with `aria-modal="true"`, ESC closes, backdrop closes.
- Token is never logged, never serialised to `data-*`, never injected via
  `dangerouslySetInnerHTML`.
- Ephemeral "Copied" toast uses `<output aria-live="polite">` (no token text).

## i18n keys

Defined in `TokenDisplayOnceModal.i18n.json`:

- `TokenDisplayOnceModal.button.copy`, `TokenDisplayOnceModal.button.close`
- `TokenDisplayOnceModal.warning.once`
- `TokenDisplayOnceModal.copied`

## Eval cases

`eval-corpus.json` covers happy (long EN token), edge (single-char FR token),
failure (empty token → console.warn + null render).
