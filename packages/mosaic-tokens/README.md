# @vantageos/mosaic-tokens

Framework-free design tokens (colors, spacing, typography, shadows, radii, motion) for `@vantageos/mosaic`. Zero runtime dependencies. Consumable as CSS custom properties, typed JS exports, or a Tailwind v4 plugin.

## Install

```sh
npm install @vantageos/mosaic-tokens@^0.2.0
```

## Surfaces

```ts
// CSS — declares --mosaic-* vars on :root globally
import "@vantageos/mosaic-tokens/css";

// JS — typed runtime access
import { tokens, colors, spacing, typography, shadows, radii, motion } from "@vantageos/mosaic-tokens";

// Tailwind v4 plugin — extends theme.extend.{colors,spacing,fontSize,boxShadow,borderRadius,transitionDuration}
import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind";
```

## Token tables (v0.2.0)

58 tokens total across 6 categories:

| Category | Count | Examples |
|---|---|---|
| colors | 15 | 5 semantic statuses (success / warning / danger / info / neutral) × 3 shades (50 / 500 / 700), OKLCH |
| spacing | 8 | 4 → 64 px (`--mosaic-space-1` through `--mosaic-space-16`) |
| typography | 14 | 1.25x font-size scale (xs 12 → 3xl 38) + 3 line-heights + 4 weights |
| shadows | 6 | Elevation 0 → 5, OKLCH neutral tint, monotonic blur radius |
| radii | 7 | none / xs / sm / md / lg / xl / full, strictly ascending |
| motion | 8 | 3 durations + 5 easing curves |

Naming convention: `--mosaic-<category>-<key>`. JS exports mirror via `mapTypographyKey()` / `mapMotionKey()` bridges (text / lh / fw / duration / easing prefixes).

## Coherence

JS ↔ CSS parity + scale ordering invariants are enforced by `coherence.test.ts` (10 tests, runs in ~13 ms):
- Every JS export key has a matching `--mosaic-<prefix>-<key>` CSS var
- Spacing / typography / radii strictly ascending
- 5 status × 3 shade color triplets all `oklch()`-formatted

## Bundle gates

| Surface | Limit gz | v0.2.0 actual |
|---|---|---|
| `dist/index.js` | 5 KB | 649 B (87% under) |
| `src/tokens.css` | 3 KB | 560 B (81% under) |

Enforced via [`size-limit`](https://github.com/ai/size-limit) — see `.size-limit.json`.

## Tailwind v4 example

```ts
// tailwind.config.ts
import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind";

export default {
  content: ["./src/**/*.{tsx,html}"],
  ...mosaicPlugin, // merges theme.extend
};
```

```html
<!-- consumer JSX -->
<div class="bg-mosaic-color-success-500 p-mosaic-space-4 rounded-mosaic-radius-md shadow-mosaic-shadow-2">
  Success
</div>
```

## License

MIT. © VantageOS / ElPi Corp.
