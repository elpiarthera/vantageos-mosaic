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
/* app/globals.css */
@import "tailwindcss";

/* 1. Declare all --mosaic-* vars on :root */
@import "@vantageos/mosaic-tokens/css";

/* 2. Native Tailwind v4 @theme surface — turns --mosaic-* vars into real
      utility classes (bg-danger-500, p-4, rounded-lg, ...). No bridge to
      hand-write: this file IS the bridge, generated, and every entry is a
      var() reference to the vars imported above. */
@import "@vantageos/mosaic-tokens/theme.css";
```

Done. `bg-success-500`, `text-danger-700`, `p-4`, `rounded-lg`, `shadow-2`, `ease-out`, `leading-normal`, `font-bold`, `font-sans`, and every other utility Tailwind v4 derives from `--color-*`/`--spacing-*`/`--text-*`/`--leading-*`/`--font-weight-*`/`--font-*`/`--shadow-*`/`--radius-*`/`--ease-*` now resolve straight through to the mosaic token values — zero hand-written bridge CSS.

**Without step 2**, `@vantageos/mosaic-tokens/css` alone still works for consumers who read the raw `--mosaic-*` custom properties directly (JS, non-Tailwind CSS) — but Tailwind v4 will NOT derive utility classes from it, because it declares its properties in an ordinary `:root` block, not an `@theme` block.

---

## 5. Configuration

### Four consumption surfaces

```ts
// 1. CSS — declares --mosaic-* vars on :root globally
import "@vantageos/mosaic-tokens/css";

// 2. Tailwind v4 @theme surface — generated bridge, turns --mosaic-* vars
//    into real utility classes. Import THIS (after "tailwindcss" and after
//    surface 1) for a CSS-first Tailwind v4 config. See scripts/derive-
//    tailwind-theme.mjs for the full category -> namespace mapping and the
//    loud-fallback rationale for tokens that get removed later.
import "@vantageos/mosaic-tokens/theme.css";

// 3. JS — typed runtime access to all token values
import { tokens, colors, spacing, typography, shadows, radii, motion } from "@vantageos/mosaic-tokens";

// 4. Tailwind v4 plugin — a v3-shaped theme.extend object (src/tailwind-
//    plugin.ts) for projects on a plugin-based tailwind.config.ts instead of
//    a CSS-first @theme config. Utilities are prefixed with the JS token key
//    (bg-mosaic-color-success-500), NOT the bare names surface 2 produces
//    (bg-success-500) — the two surfaces are not interchangeable, pick one.
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

### Tailwind v4 theme surface (`@vantageos/mosaic-tokens/theme.css`)

Tailwind v4 derives utility classes only from custom properties declared inside an `@theme` block — never from an ordinary `:root` block, which is all `src/tokens.css` provides. Without a generated bridge, every consumer had to hand-write one (`--color-mosaic-x: var(--mosaic-color-x);`), and a hand-written bridge eventually gets a value RETYPED instead of referenced. `src/theme.css` is that bridge, generated by `scripts/derive-tailwind-theme.mjs` from `src/tokens.css`, and every entry in it is a `var()` reference — never a duplicated literal.

**Category -> Tailwind v4 namespace mapping** (verified empirically by compiling `tailwindcss@4.1.8` against probe fixtures for each namespace — see the generator script docstring for the full method):

| mosaic category | Tailwind v4 `@theme` namespace | utility example |
|---|---|---|
| `color` | `--color-*` | `bg-danger-500`, `text-success-700` |
| `space` | `--spacing-*` | `p-4`, `gap-2` |
| `text` | `--text-*` | `text-base` (font size) |
| `lh` | `--leading-*` | `leading-normal` |
| `fw` | `--font-weight-*` | `font-bold` |
| `font` | `--font-*` | `font-sans` (font family) |
| `shadow` | `--shadow-*` | `shadow-2` |
| `radius` | `--radius-*` | `rounded-lg` |
| `easing` | `--ease-*` | `ease-out` |
| `duration` | **none** — declared divergence, see below | — |

`duration` has no themable Tailwind v4 namespace (confirmed by compiling a `--duration-probe` theme entry: it produces zero generated utility, and it is absent from Tailwind's documented theme variable namespaces). This is not a silent gap: the generator prints a named warning on every run, and `src/theme.css`'s header comment states the omission.

**The loud fallback.** Every generated entry carries a `var()` fallback that is an unmistakable, out-of-scale sentinel — never a plausible design value:

```css
--color-danger-500: var(--mosaic-color-danger-500, oklch(0.75 0.35 320));
```

If `--mosaic-color-danger-500` is ever removed from `tokens.css` while `theme.css` still references it, `bg-danger-500` renders a jarring out-of-gamut magenta instead of silently resolving to transparent. A colour that disappears without noise is the failure this exists to prevent.

Regenerate after editing `tokens.css`:

```bash
pnpm --filter @vantageos/mosaic-tokens run tailwind-theme:build
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

### Example 2a — Tailwind v4 `@theme` surface (recommended for CSS-first configs)

```css
/* app/globals.css */
@import "tailwindcss";
@import "@vantageos/mosaic-tokens/css";
@import "@vantageos/mosaic-tokens/theme.css";
```

```html
<div class="bg-success-500 p-4 rounded-md shadow-2">
  Success state
</div>
```

### Example 2b — Tailwind v4 plugin (v3-shaped `theme.extend`, for `tailwind.config.ts` projects)

```ts
// tailwind.config.ts
import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind";

export default {
  content: ["./src/**/*.{tsx,html}"],
  ...mosaicPlugin, // merges theme.extend with mosaic-* utilities
};
```

```html
<!-- JSX using Tailwind utilities from the plugin — note the mosaic-* prefixed
     keys here, DIFFERENT from the bare names Example 2a produces. Pick one
     surface per project; they are not meant to be mixed. -->
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

## 13.5 Naming Contract (`--mosaic-<category>-<key>`)

Every custom property this package ships follows `--mosaic-<category>-<key>`
(categories: `color`, `space`, `text`, `lh`, `fw`, `font`, `shadow`, `radius`,
`duration`, `easing`). That convention is not just prose — it is a generated,
versioned artifact a downstream tool (e.g. a DTCG → CSS exporter) can pin
against and get a mechanical failure the moment it drifts.

Pin it from the installed package:

```js
import contract from "@vantageos/mosaic-tokens/naming-contract" with { type: "json" };

console.log(contract.contractVersion); // e.g. "1.0.0"
console.log(contract.surfaceDigest); // e.g. "ef6d9e4348ab32f7"
console.log(contract.pattern); // "--mosaic-<category>-<key>"
console.log(contract.categories); // ["color", "duration", "easing", ...]
console.log(contract.names); // every declared "--mosaic-*" property, sorted
```

A consumer pins BOTH values, for two different purposes:

- **`contractVersion`** — a semver, hand-set intent, INDEPENDENT of the
  package version. It signals compatibility intent but is NOT mechanically
  enforced to move with the naming surface.
- **`surfaceDigest`** — a sha256 (truncated to 16 hex chars) over the sorted
  `categories` and sorted `names` only. This is the ENFORCED value: it cannot
  go stale because nobody types it, and `naming-contract.test.ts` recomputes
  it independently from `tokens.css` and fails the build the moment it
  diverges. A rename that lands without a `contractVersion` bump still shows
  up as a changed `surfaceDigest`.

The artifact is generated, never hand-edited. To regenerate it after adding
or renaming tokens in `src/tokens.css`:

```bash
pnpm --filter @vantageos/mosaic-tokens naming-contract:build
```

`src/__tests__/naming-contract.test.ts` fails the build if the checked-in
`naming-contract.json` ever falls out of sync with `src/tokens.css`.

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
