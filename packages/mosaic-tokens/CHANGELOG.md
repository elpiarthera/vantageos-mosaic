# @vantageos/mosaic-tokens — Changelog

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
