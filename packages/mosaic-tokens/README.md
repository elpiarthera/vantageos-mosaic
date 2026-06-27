# @vantageos/mosaic-tokens

[![npm version](https://img.shields.io/npm/v/@vantageos/mosaic-tokens)](https://www.npmjs.com/package/@vantageos/mosaic-tokens)
[![License: FSL-1.1-Apache-2.0](https://img.shields.io/badge/license-FSL--1.1--Apache--2.0-blue)](LICENSE)

**Framework-free OKLCH design tokens for `@vantageos/mosaic`.** 80 semantic tokens — colors (status + semantic UI slots), spacing, typography (incl. font families), shadows, radii, motion — consumable as CSS custom properties, typed JS exports, or a Tailwind v4 plugin. Zero runtime dependencies. Design language: **anydebate** (bright/clean light + sophisticated dark with blue accent).

---

## 1. Hero & Positioning

`@vantageos/mosaic-tokens` is the **design token layer** of the VantageOS Mosaic design system. It defines the visual language shared across all mosaic packages:

- **anydebate design language**: bright/clean light mode + sophisticated dark mode with blue accent `oklch(0.7 0.15 240)`
- 5 semantic color categories × 3 shades + 19 semantic UI slots (background/foreground/card/primary/etc.) in **OKLCH** — perceptually uniform, full dark-mode `.dark` overrides
- Spacing scale (4 → 64 px), typography scale (xs → 3xl), font families (Inter + Geist Mono), 3 line-heights, 4 weights
- 6 elevation shadows (OKLCH near-black tint), 7 border radii (anydebate 0.75rem base), 9 motion tokens (4 durations + 5 easings)
- Three consumption surfaces: CSS custom props, typed JS exports, Tailwind v4 plugin
- Enforced by coherence tests (JS ↔ CSS parity, scale monotonicity, anydebate palette snapshots)
- Bundle gates: `dist/index.js` ≤ 5 KB gz, `src/tokens.css` ≤ 3 KB gz

For the full component library that consumes these tokens, see [`@vantageos/mosaic-blocks`](https://www.npmjs.com/package/@vantageos/mosaic-blocks).

---

## 2. Why This Package (vs custom CSS variables / Tailwind theme)

| | mosaic-tokens | Raw CSS vars | Tailwind theme extend | Style Dictionary |
|---|---|---|---|---|
| OKLCH perceptual uniformity | Yes | Manual | Manual | Depends |
| JS + CSS parity enforced by tests | Yes | No | No | No |
| Scale monotonicity tested | Yes | No | No | No |
| Tailwind v4 plugin ready | Yes | No | Partial | No |
| 0 runtime deps | Yes | N/A | N/A | No |
| Bundle-gated (size-limit) | Yes | No | No | No |
| Works without Tailwind | Yes | Yes | No | Depends |

OKLCH gives you perceptual uniformity: `oklch(0.66 0.18 145)` for success-500 looks the same relative brightness across hues, avoiding the muddy grays you get with hex-converted palettes. Dark mode is a token swap — no component changes needed.

---

## 3. Install

```bash
pnpm add @vantageos/mosaic-tokens
```

### Peer dependencies

| Package | Version | Required |
|---|---|---|
| `tailwindcss` | `^4.1.0` | Only for Tailwind plugin surface |

`tailwindcss` is optional — the CSS and JS surfaces work without it.

---

## 4. Quick Start (30 seconds)

```css
/* app/globals.css — declare all --mosaic-* vars on :root */
@import "@vantageos/mosaic-tokens/css";
```

Done. All `--mosaic-color-*`, `--mosaic-space-*`, `--mosaic-text-*`, `--mosaic-shadow-*`, `--mosaic-radius-*`, `--mosaic-duration-*` CSS variables are now available globally.

---

## 5. Configuration

### Three consumption surfaces

```ts
// 1. CSS — declares --mosaic-* vars on :root globally
import "@vantageos/mosaic-tokens/css";

// 2. JS — typed runtime access to all token values
import { tokens, colors, spacing, typography, shadows, radii, motion } from "@vantageos/mosaic-tokens";

// 3. Tailwind v4 plugin — extends theme with mosaic-* utilities
import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind";
```

### With @vantageos/mosaic-blocks

```css
/* app/globals.css */
@import "tailwindcss";
@source "../node_modules/@vantageos/mosaic-blocks/dist";

/* Tokens first — establishes CSS vars */
@import "@vantageos/mosaic-tokens/css";

/* mosaic-blocks styles map tokens to Tailwind utilities */
@import "@vantageos/mosaic-blocks/styles.css";
```

### Dark mode token override

`@vantageos/mosaic-tokens` ships a full `[data-theme="dark"]` block — the same selector convention used by `@vantageos/mosaic-blocks`. Set `data-theme="dark"` on your `<html>` element to activate dark mode across both packages with a single toggle.

```css
/* tokens.css already ships this block — no extra CSS needed */
[data-theme="dark"] {
  --mosaic-color-background: oklch(0.04 0 0);
  --mosaic-color-primary: oklch(0.7 0.15 240);
  /* ... all other dark overrides */
}
```

```html
<!-- Toggle dark mode — works for both mosaic-tokens and mosaic-blocks -->
<html data-theme="dark">
```

Custom overrides follow the same selector:

```css
[data-theme="dark"] {
  --mosaic-color-neutral-50: oklch(0.08 0 0);
}
```

---

## 6. Component Catalogue Summary

80 design tokens across 6 categories (anydebate design language, v0.3.0). This is not a component library — for components that consume these tokens, see [`@vantageos/mosaic-blocks` → docs/components-catalog.md](https://github.com/vantageos-agency/mosaic-blocks/blob/main/docs/components-catalog.md).

| Category | Count | CSS prefix | JS export |
|---|---|---|---|
| Colors (status × 3 shades) | 15 | `--mosaic-color-` | `colors` |
| Colors (semantic UI slots) | 19 | `--mosaic-color-` | `colors` |
| Spacing | 8 | `--mosaic-space-` | `spacing` |
| Typography (sizes + lh + weights) | 14 | `--mosaic-text-`, `--mosaic-lh-`, `--mosaic-fw-` | `typography` |
| Typography (font families) | 2 | `--mosaic-font-` | `typography` |
| Shadows | 6 | `--mosaic-shadow-` | `shadows` |
| Radii | 7 | `--mosaic-radius-` | `radii` |
| Motion | 9 | `--mosaic-duration-`, `--mosaic-easing-` | `motion` |

---

## 7. Auth Integration

Not applicable for this package directly — `@vantageos/mosaic-tokens` has no auth components.

Auth UI components in `@vantageos/mosaic-blocks` (sign-in card, org panel, role badges) consume these tokens for their visual styling. The semantic status colors (`--mosaic-color-success-*`, `--mosaic-color-danger-*`) are used for role indicators and validation states. See [`@vantageos/mosaic-blocks` → docs/auth.md](https://github.com/vantageos-agency/mosaic-blocks/blob/main/docs/auth.md).

---

## 8. Mobile-First

Not applicable for this package directly — `@vantageos/mosaic-tokens` defines visual tokens, not responsive layout logic.

Token values are intentionally static (no breakpoint-conditional values). Responsive behavior is the responsibility of consuming components. For the mobile-first adaptive system, see [`@vantageos/mosaic-blocks` → docs/mobile-first.md](https://github.com/vantageos-agency/mosaic-blocks/blob/main/docs/mobile-first.md).

Spacing tokens (`--mosaic-space-1` through `--mosaic-space-16`) map to 4 → 64 px, suitable for both mobile (tighter) and desktop (more generous) consumption at consumer discretion.

---

## 9. i18n

Not applicable for this package — design tokens are language-independent.

For FR+EN locale strings used by `@vantageos/mosaic` components, see [`@vantageos/mosaic-i18n`](https://www.npmjs.com/package/@vantageos/mosaic-i18n).

---

## 10. Theming — Design language: anydebate

This package IS the theming layer. Token reference (v0.3.0 — anydebate design language).

**Source**: `elpiarthera/any-debate-ai@dev` · `app/globals.css` absorbed 2026-06-27.

**anydebate identity**: bright/clean monochromatic light mode + sophisticated dark mode. The dark mode primary accent is blue (`oklch(0.7 0.15 240)`). All neutrals are pure chroma-zero OKLCH (no hue tint). Radius base is `0.75rem` (12 px).

### Colors — status palette (15 tokens)

5 semantic statuses × 3 shades — all OKLCH:

| Token | Value (light) | Usage |
|---|---|---|
| `--mosaic-color-success-50` | `oklch(0.965 0.04 145)` | Success backgrounds, badges |
| `--mosaic-color-success-500` | `oklch(0.66 0.18 145)` | Success foreground, icons |
| `--mosaic-color-success-700` | `oklch(0.47 0.14 145)` | Success text on light bg |
| `--mosaic-color-warning-500` | `oklch(0.77 0.17 85)` | Warning indicators |
| `--mosaic-color-danger-500` | `oklch(0.577 0.245 27)` | Error states, destructive (anydebate exact) |
| `--mosaic-color-info-500` | `oklch(0.700 0.150 240)` | Blue accent, informational UI |
| `--mosaic-color-neutral-50` | `oklch(0.98 0 0)` | Page backgrounds |
| `--mosaic-color-neutral-500` | `oklch(0.45 0 0)` | Secondary text |
| `--mosaic-color-neutral-700` | `oklch(0.15 0 0)` | Primary text |

### Colors — semantic UI slots (19 additive tokens, light + dark)

`--mosaic-color-background` / `foreground` / `card` / `card-foreground` / `popover` / `popover-foreground` / `primary` / `primary-foreground` / `secondary` / `secondary-foreground` / `muted` / `muted-foreground` / `accent` / `accent-foreground` / `destructive` / `destructive-foreground` / `border` / `input` / `ring`

These mirror anydebate's semantic CSS custom property layer. Override with `[data-theme="dark"] { --mosaic-color-primary: oklch(0.7 0.15 240); }`.

### Dark mode

All color tokens have `[data-theme="dark"]` overrides in `tokens.css` — the same selector used by `@vantageos/mosaic-blocks`. Import `@vantageos/mosaic-tokens/css` then set `data-theme="dark"` on your HTML element. A single toggle activates dark mode for both packages.

```css
/* Dark mode — anydebate blue primary (auto-applied via @import) */
[data-theme="dark"] {
  --mosaic-color-background: oklch(0.04 0 0);
  --mosaic-color-primary: oklch(0.7 0.15 240);
  /* ... all other slots auto-applied via @import */
}
```

### Spacing (8 tokens)

`--mosaic-space-1` (4 px) through `--mosaic-space-16` (64 px). Strictly ascending, 4 px base unit.

### Typography (16 tokens)

Font families: `--mosaic-font-sans` (Inter), `--mosaic-font-mono` (Geist Mono). Additive in v0.3.0.
Font sizes: `--mosaic-text-xs` (12 px) through `--mosaic-text-3xl` (38 px), 1.25x scale.
Line heights: `--mosaic-lh-tight`, `--mosaic-lh-normal`, `--mosaic-lh-relaxed`.
Weights: `--mosaic-fw-regular`, `--mosaic-fw-medium`, `--mosaic-fw-semibold`, `--mosaic-fw-bold`.

### Shadows (6 tokens)

`--mosaic-shadow-0` (none) through `--mosaic-shadow-5` (large elevation). OKLCH near-black tint `oklch(0.04 0 0)` — matches anydebate dark background.

### Radii (7 tokens)

`--mosaic-radius-none` (0) → `xs` (4 px) → `sm` (8 px) → `md` (10 px) → `lg` (12 px, anydebate base) → `xl` (16 px) → `full` (9999 px). Strictly ascending.

### Motion (9 tokens)

Durations: `--mosaic-duration-fast` (100 ms), `--mosaic-duration-base` (200 ms), `--mosaic-duration-slow` (300 ms), `--mosaic-duration-slower` (500 ms, additive in v0.3.0).
Easings: `--mosaic-easing-linear`, `--mosaic-easing-ease`, `--mosaic-easing-in`, `--mosaic-easing-out`, `--mosaic-easing-in-out`.

---

## 11. TypeScript

`@vantageos/mosaic-tokens` ships full TypeScript declarations:

```ts
import { tokens, colors, spacing, typography, shadows, radii, motion } from "@vantageos/mosaic-tokens";

// Fully typed — no 'any', no magic strings
const successColor: string = colors["success-500"];
const baseSpace: number = spacing["space-1"]; // 4 (px value)
const normalDuration: string = motion["duration-normal"]; // "200ms"
```

---

## 12. Examples

### Example 1 — CSS custom properties in component

```css
/* my-component.css */
.status-badge {
  background-color: var(--mosaic-color-success-50);
  color: var(--mosaic-color-success-700);
  border-radius: var(--mosaic-radius-md);
  padding: var(--mosaic-space-1) var(--mosaic-space-2);
  font-size: var(--mosaic-text-xs);
  font-weight: var(--mosaic-fw-medium);
}
```

### Example 2 — Tailwind v4 plugin

```ts
// tailwind.config.ts
import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind";

export default {
  content: ["./src/**/*.{tsx,html}"],
  ...mosaicPlugin, // merges theme.extend with mosaic-* utilities
};
```

```html
<!-- JSX using Tailwind utilities from the plugin -->
<div class="bg-mosaic-color-success-500 p-mosaic-space-4 rounded-mosaic-radius-md shadow-mosaic-shadow-2">
  Success state
</div>
```

### Example 3 — JS tokens for runtime use (canvas, charts, animations)

```ts
import { colors, motion } from "@vantageos/mosaic-tokens";

// Use in canvas rendering or charting libraries
const ctx = canvas.getContext("2d");
ctx.fillStyle = colors["danger-500"]; // "oklch(0.64 0.205 25)"

// Use in Web Animations API
element.animate(
  [{ opacity: 0 }, { opacity: 1 }],
  {
    duration: Number.parseInt(motion["duration-normal"]), // 200
    easing: motion["easing-ease-out"],
  },
);
```

---

## 13. Browser Support

OKLCH requires modern browsers:

| Browser | Min version |
|---|---|
| Chrome / Edge | 111+ |
| Firefox | 113+ |
| Safari | 15.4+ |
| Mobile Safari | iOS 15.4+ |

For older browser support, provide fallback `rgb()` values in your CSS:

```css
:root {
  /* Fallback for Safari < 15.4 */
  --mosaic-color-success-500: #4ade80;
  /* Modern override */
  --mosaic-color-success-500: oklch(0.66 0.18 145);
}
```

The JS exports return the raw OKLCH strings — canvas/chart consumers should test browser support independently.

---

## 14. Versioning & Changelog

| Version | Notes |
|---|---|
| `0.3.0` | Current — anydebate design language absorbed. 80 tokens: 19 semantic UI color slots + font families + duration-slower + `.dark` mode overrides. Non-breaking key contract. |
| `0.2.1` | FSL license, README complete, keywords, LICENSE in files array |
| `0.2.0` | 58 tokens stable — coherence tests, size-limit gates, Tailwind v4 plugin |
| `0.1.x` | Initial token set |

Bundle gate limits (both green in v0.3.0):

| Surface | Limit gz |
|---|---|
| `dist/index.js` | 5 KB |
| `src/tokens.css` | 3 KB |

Full changelog: [CHANGELOG.md](../../CHANGELOG.md) at monorepo root.

---

## 15. Contributing

This package lives in `packages/mosaic-tokens/` in the [vantageos-mosaic monorepo](https://github.com/elpiarthura/vantageos-mosaic).

Token addition workflow:

1. Add the CSS var to `src/tokens.css` in the correct `:root` block
2. Add the matching JS export in `src/tokens.ts` with the same key naming
3. Run `pnpm test` — coherence tests verify JS ↔ CSS parity and scale ordering automatically
4. Run `pnpm size-limit` — verify bundle gates remain green
5. Update the token count in this README (Section 6)
6. Open a PR with rationale for the new token

Do NOT add arbitrary one-off values. New tokens must belong to an existing category or justify a new category via ADR.

---

## 16. License

`@vantageos/mosaic-tokens` is licensed under the **Functional Source License, Version 1.1, Apache 2.0 Future License** (`FSL-1.1-Apache-2.0`).

- Free for non-production use, research, and evaluation
- Commercial use requires a valid VantageOS license
- Converts to Apache 2.0 after 2 years from each release

Full license: [LICENSE](LICENSE)

---

## 17. Credits

`@vantageos/mosaic-tokens` is part of the VantageOS Mosaic design system:

- [`@vantageos/mosaic-blocks`](https://www.npmjs.com/package/@vantageos/mosaic-blocks) — React composed UI blocks (primary consumer of these tokens)
- [`@vantageos/mosaic-i18n`](https://www.npmjs.com/package/@vantageos/mosaic-i18n) — FR+EN locale resources

The anydebate design language is sourced from `elpiarthera/any-debate-ai@dev` (2026-06-27). The OKLCH color choices draw from [OKLCH color picker](https://oklch.com/) by Evil Martians and the [Tailwind v4 color system](https://tailwindcss.com/docs/colors) design principles.

Token coherence test pattern adapted from [token validation best practices](https://tr.designtokens.org/format/).

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-27*
