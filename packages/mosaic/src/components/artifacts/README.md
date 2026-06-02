# MarkdownRenderer

**Category:** artifacts · **a11y:** WCAG-AA · **sizeLimit:** 60 KB

## Purpose

Renders Markdown content as sanitised HTML (DOMPurify) for chat artifacts,
audit-log bodies, Sigma table descriptions, Theta activity entries. CORE —
content rendering is a protocol-level concern.

## Props

See `MarkdownRenderer.schema.ts` (`MarkdownRendererPropsSchema`):

| Key         | Type            | Default | Notes                          |
| ----------- | --------------- | ------- | ------------------------------ |
| `content`   | `string`        | —       | Markdown source                |
| `locale`    | `'en' \| 'fr'`  | —       | Required (drives error msgs)   |
| `maxLength` | `number > 0`    | `50000` | Above → `tooLong` alert        |
| `allowHtml` | `boolean`       | `false` | Strips raw HTML before parsing |

## Usage

```tsx
<MarkdownRenderer content="# Title\n**bold**" locale="fr" />;
```

## Accessibility

- `<article>` with localised `aria-label`.
- `lang={locale}` propagates to AT.
- All HTML output sanitised by DOMPurify.
- Validation failure / oversize → `role="alert"`.

## i18n keys

Defined in `MarkdownRenderer.i18n.json`:

- `MarkdownRenderer.aria.content`
- `MarkdownRenderer.error.invalidProps`
- `MarkdownRenderer.error.tooLong`

## Eval cases

`eval-corpus.json` covers happy (markdown → HTML), edge (empty string), and
failure (missing required fields → role=alert).
