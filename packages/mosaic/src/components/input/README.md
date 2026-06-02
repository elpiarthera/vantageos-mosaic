# ConfirmDialog

**Category:** input · **a11y:** WCAG-AA · **sizeLimit:** 30 KB

## Purpose

Modal confirmation prompt for irreversible actions (delete flows across all 21
CRM tables, 26 VP tables, etc.). Cross-BU CORE — purest generic pattern.

## Props

See `ConfirmDialog.schema.ts` (`ConfirmDialogPropsSchema` + runtime callbacks):

| Key            | Type                       | Default     | Notes                  |
| -------------- | -------------------------- | ----------- | ---------------------- |
| `title`        | `string` (≥1)              | —           | Dialog heading         |
| `message`      | `string` (≥1)              | —           | Body copy              |
| `confirmLabel` | `string` (≥1)              | —           | CTA button label       |
| `cancelLabel`  | `string` (≥1)              | —           | Cancel button label    |
| `variant`      | `'default' \| 'danger'`    | `'default'` | Red theme on `danger`  |
| `locale`       | `'en' \| 'fr'`             | `'en'`      | Mosaic locale          |
| `onConfirm`    | `() => void`               | —           | Runtime callback       |
| `onCancel`     | `() => void`               | —           | Runtime callback       |

## Usage

```tsx
<ConfirmDialog
  title="Delete record?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={handleClose}
/>;
```

## Accessibility

- Native `<dialog>` with `showModal()` (full focus trap, ESC closes).
- `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
- Backdrop click invokes `onCancel`.

## i18n keys

Defined in `ConfirmDialog.i18n.json`:

- `ConfirmDialog.button.confirm`
- `ConfirmDialog.button.cancel`
- `ConfirmDialog.aria.dialog`

## Eval cases

`eval-corpus.json` covers happy (danger variant), edge (default variant), and
failure (missing required fields → renders null).
