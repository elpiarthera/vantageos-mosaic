# mosaic-tokens 0.3.0 — anydebate design language

**Type**: minor (non-breaking key contract — values changed, no keys removed)
**Source**: `elpiarthera/any-debate-ai@dev` · `app/globals.css` (canonical, 2026-06-27)

---

## Design language absorbed

**anydebate** — bright/clean light mode + sophisticated dark mode with blue accent.

- Light mode: near-white background `oklch(0.98 0 0)`, near-black foreground `oklch(0.15 0 0)`, monochromatic neutrals
- Dark mode: very dark BG `oklch(0.04 0 0)`, near-white text `oklch(0.95 0 0)`, blue primary accent `oklch(0.7 0.15 240)`
- Destructive: `oklch(0.577 0.245 27.325)` (source-exact)
- Base radius: `0.75rem` (12 px) with calc-derived scale
- Font: Inter (primary) / Geist Mono (code)

---

## Token key diff

### Keys PRESERVED from 0.2.1 (consumer compat guaranteed)

All 58 original keys kept with updated values:

| Category | Keys (unchanged) |
|---|---|
| colors (status) | `success-50/500/700`, `warning-50/500/700`, `danger-50/500/700`, `info-50/500/700`, `neutral-50/500/700` |
| spacing | `1`, `2`, `3`, `4`, `6`, `8`, `12`, `16` |
| typography | `size-xs/sm/base/lg/xl/2xl/3xl`, `lh-tight/normal/relaxed`, `weight-regular/medium/semibold/bold` |
| shadows | `0`, `1`, `2`, `3`, `4`, `5` |
| radii | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `full` |
| motion | `duration-fast/base/slow`, `easing-linear/ease/in/out/in-out` |

### Value changes (category summary)

**Colors — status palette**
- `danger-500`: `oklch(0.64 0.205 25)` → `oklch(0.577 0.245 27)` (matches anydebate `--destructive` exactly)
- `info-500`: `oklch(0.65 0.17 250)` → `oklch(0.700 0.150 240)` (anydebate dark-mode primary blue)
- `neutral-50`: `oklch(0.98 0.005 250)` → `oklch(0.980 0 0)` (anydebate bg, zero chroma)
- `neutral-500`: `oklch(0.58 0.012 250)` → `oklch(0.450 0 0)` (anydebate mid-gray)
- `neutral-700`: `oklch(0.38 0.01 250)` → `oklch(0.150 0 0)` (anydebate foreground)

**Shadows** — tint color from `oklch(0.2 0.01 250)` → `oklch(0.04 0 0)` (anydebate near-black bg)

**Radii** — anydebate `0.75rem` scale:
- `xs`: 2px → 4px
- `sm`: 4px → 8px
- `md`: 6px → 10px
- `lg`: 8px → 12px
- `xl`: 12px → 16px

**Motion durations** — tuned to Tailwind defaults:
- `duration-fast`: 75ms → 100ms
- `duration-base`: 150ms → 200ms
- `duration-slow`: 300ms → 300ms (unchanged)

### NEW additive keys in 0.3.0

**colors** (19 semantic UI slots from anydebate, light + dark):
`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`,
`primary`, `primary-foreground`, `secondary`, `secondary-foreground`,
`muted`, `muted-foreground`, `accent`, `accent-foreground`,
`destructive`, `destructive-foreground`, `border`, `input`, `ring`

**typography** (2 font-family tokens):
`font-sans` (`Inter, ui-sans-serif, system-ui, sans-serif`),
`font-mono` (`ui-monospace, "Geist Mono", "Cascadia Code", monospace`)

**motion** (1 entrance animation duration):
`duration-slower` (`500ms`)

**CSS** — new `.dark` block with dark-mode overrides for all color tokens.

---

## Verification

- Build: `pnpm --filter @vantageos/mosaic-tokens build` — green
- Tests: 20/20 passed (coherence + scale invariants + anydebate snapshot suite)
- Lint: biome 0 errors
- TypeScript: tsc --noEmit 0 errors
- npm pack: ships LICENSE + README + dist + src/tokens.css, no leak
- LICENSE sha256: `3d458972e6e84e5d2361a886ef64b07aefdc38dd8955e281ea8c2ae8849646a4` — unchanged

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-27*
