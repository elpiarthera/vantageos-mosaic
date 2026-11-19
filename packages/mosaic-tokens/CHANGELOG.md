# @vantageos/mosaic-tokens — Changelog

## Unreleased

- **Added**: the theme-document parser, moved here from `@vantageos/mosaic` so a server can validate a
  per-deployment theme with this package alone. Exports `parseThemeDocument`, `ThemeError` (with
  `issues[]` listing every problem), `themeToCss`, `THEME_TOKEN_NAMES` (derived from
  `naming-contract.json`) and the types `ThemeDocument` and `ThemeIssue`. The validation is
  hand-written: `dependencies` stays empty. Same accept/refuse behaviour and same messages as the
  parser previously shipped in `@vantageos/mosaic`, except that a `"__proto__"` key inside `light` or
  `dark`, previously dropped silently, is now refused as `unknown token __proto__`.
  / Le parseur de thème rejoint ce paquet (sans dépendance) ; mêmes règles et mêmes messages, et une
  clé `"__proto__"` dans un bloc est désormais refusée au lieu d'être ignorée.

## 0.5.1

- **Fix**: `examples/` is now listed in `package.json` `files`, and
  `./examples/anydebate-override.css` is now a declared `exports` subpath.
  0.5.0's CHANGELOG told consumers to `import
  "@vantageos/mosaic-tokens/examples/anydebate-override.css"` to restore the
  prior any-debate-ai look, but that file was never shipped in the published
  tarball — a dangling promise (`npm pack --dry-run` on 0.5.0 omits
  `examples/` entirely). No other file moved or changed.
- Adds `scripts/tarball-cited-paths-guard.mjs` + CI Gate 5: every path cited
  in README.md/CHANGELOG.md via an import specifier or a bare in-package
  relative path is now verified against what `npm pack` would actually ship,
  so this class of drift fails CI before publish instead of surfacing to
  consumers after.

## 0.5.0

- **Realigned the 23 semantic UI color slots** (`background`, `foreground`, `card`,
  `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`,
  `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`,
  `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`,
  `ring`, `sidebar`, `sidebar-foreground`, `sidebar-accent`, `sidebar-border`), in
  both `:root` (light) and `[data-theme="dark"]`, from the any-debate-ai brand
  values (dark accent `oklch(0.7 0.15 240)` blue) to the generic neutral
  shadcn-grayscale defaults shipped by `@vantageos/mosaic-blocks`
  (`src/styles.css`). One consumer's brand no longer lives in the shared
  canonical package (doctrine `no-hardcoded-business-knowledge`).
- No name, export, or alias changed — only the 46 value lines (23 slots × 2
  themes) were touched. `src/aliases.css` and `package.json` `exports` are
  unchanged.
- Consumers who want the previous any-debate-ai look (blue accent, near-black
  dark background) can restore it by importing
  `@vantageos/mosaic-tokens/examples/anydebate-override.css` **after** the
  canonical `tokens.css` import — see that file for the exact prior values.
- Status triads (`success/warning/danger/info/neutral`), chart series,
  spacing, typography, shadows, radii, and easing tokens are unchanged by this
  release.

## 0.4.0

- Prior release. See git history for details.
