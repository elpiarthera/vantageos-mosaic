/**
 * @vantageos/mosaic-tokens — design tokens (anydebate design language, v0.3.0).
 *
 * Design language: anydebate — bright/clean light mode + sophisticated dark
 * mode with blue accent (oklch(0.7 0.15 240)).
 * Source: elpiarthera/any-debate-ai@dev · app/globals.css (2026-06-27).
 *
 * Framework-free, OKLCH-based, mirror of the CSS custom properties in
 * tokens.css. Consumers can opt for either the CSS surface (Tailwind v4
 * + @theme inline) or the JS surface (typed runtime access in JSX styles,
 * Storybook stories, Playwright assertions, snapshot tests).
 *
 * Size targets (.size-limit.json): JS bundle ≤5 KB gz, CSS ≤3 KB gz.
 *
 * Schema invariants (enforced by mosaic-tokens-coherence-test):
 *   - Every CSS var has a JS counterpart (and vice versa).
 *   - Color shades 50 < 500 < 700 monotonic luminance (light mode).
 *   - Spacing scale ascending, ratio 1.5x average (4 → 64 px).
 *   - Typography scale uses 1.25x ratio (12 → 38 px).
 *   - Shadow elevation 0 < 1 < 2 < 3 < 4 < 5 monotonic blur radius.
 *   - Radii strictly ascending (none → full).
 *
 * KEY COMPATIBILITY: all keys present in 0.2.1 are preserved unchanged.
 * New additive keys in 0.3.0:
 *   colors: background, foreground, card, card-foreground, popover,
 *           popover-foreground, primary, primary-foreground, secondary,
 *           secondary-foreground, muted, muted-foreground, accent,
 *           accent-foreground, destructive, destructive-foreground,
 *           border, input, ring (semantic UI slots from anydebate)
 *   typography: font-sans, font-mono (font-family tokens)
 *   motion: duration-slower (500ms entrance animation)
 */

export interface MosaicTokens {
  readonly colors: Readonly<Record<string, string>>;
  readonly spacing: Readonly<Record<string, string>>;
  readonly typography: Readonly<Record<string, string>>;
  readonly shadows: Readonly<Record<string, string>>;
  readonly radii: Readonly<Record<string, string>>;
  readonly motion: Readonly<Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Colors — semantic statuses × 3 shades (50/500/700) OKLCH + semantic UI slots.
// 50 = surface tint, 500 = brand body, 700 = accessible contrast on light bg.
//
// anydebate palette mapping:
//   danger    → destructive (oklch(0.577 0.245 27.325))
//   info      → primary blue accent dark (oklch(0.7 0.15 240))
//   neutral   → monochromatic: bg=oklch(0.98 0 0) / fg=oklch(0.15 0 0)
//
// Additive semantic UI keys mirror anydebate's CSS custom property names
// (background, foreground, card, etc.) for drop-in compatibility with
// consumers that wire anydebate components into mosaic.
// ---------------------------------------------------------------------------
export const colors: MosaicTokens["colors"] = Object.freeze({
  // Status palette (preserved keys, anydebate-updated values)
  "success-50": "oklch(0.965 0.040 145)",
  "success-500": "oklch(0.660 0.180 145)",
  "success-700": "oklch(0.470 0.140 145)",
  "warning-50": "oklch(0.975 0.045 85)",
  "warning-500": "oklch(0.770 0.170 85)",
  "warning-700": "oklch(0.560 0.145 65)",
  // anydebate destructive: oklch(0.577 0.245 27.325)
  "danger-50": "oklch(0.965 0.035 27)",
  "danger-500": "oklch(0.577 0.245 27)",
  "danger-700": "oklch(0.400 0.180 27)",
  // anydebate info/primary accent (dark mode blue): oklch(0.7 0.15 240)
  "info-50": "oklch(0.970 0.030 240)",
  "info-500": "oklch(0.700 0.150 240)",
  "info-700": "oklch(0.500 0.130 240)",
  // anydebate neutral axis — light: bg oklch(0.98 0 0), fg oklch(0.15 0 0)
  "neutral-50": "oklch(0.980 0 0)",
  "neutral-500": "oklch(0.450 0 0)",
  "neutral-700": "oklch(0.150 0 0)",

  // Additive semantic UI slots (anydebate light-mode defaults)
  background: "oklch(0.980 0 0)",
  foreground: "oklch(0.150 0 0)",
  card: "oklch(0.950 0 0)",
  "card-foreground": "oklch(0.150 0 0)",
  popover: "oklch(0.980 0 0)",
  "popover-foreground": "oklch(0.150 0 0)",
  primary: "oklch(0.150 0 0)",
  "primary-foreground": "oklch(0.980 0 0)",
  secondary: "oklch(0.920 0 0)",
  "secondary-foreground": "oklch(0.150 0 0)",
  muted: "oklch(0.920 0 0)",
  "muted-foreground": "oklch(0.450 0 0)",
  accent: "oklch(0.880 0 0)",
  "accent-foreground": "oklch(0.150 0 0)",
  destructive: "oklch(0.577 0.245 27)",
  "destructive-foreground": "oklch(0.980 0 0)",
  border: "oklch(0.880 0 0)",
  input: "oklch(0.920 0 0)",
  ring: "oklch(0.600 0 0)",

  // Sidebar (v0.3.1) — EXACTLY 4 keys, derived from real consumption on the
  // one real consumer (mosaic-blocks). See tokens.css for the derivation
  // command and the declared-divergence rationale for NOT shipping the
  // other 4 of the shadcn 8-var convention.
  sidebar: "oklch(0.950 0 0)",
  "sidebar-foreground": "oklch(0.150 0 0)",
  "sidebar-accent": "oklch(0.880 0 0)",
  "sidebar-border": "oklch(0.880 0 0)",

  // Chart series (v0.3.1) — declared divergence: added on request, not on
  // measured consumer demand. See tokens.css for rationale. NO alias.
  "chart-1": "oklch(0.650 0.200 240)",
  "chart-2": "oklch(0.650 0.180 145)",
  "chart-3": "oklch(0.700 0.170 85)",
  "chart-4": "oklch(0.600 0.220 27)",
  "chart-5": "oklch(0.550 0.180 300)",
});

// ---------------------------------------------------------------------------
// Spacing — 4 → 64 px scale (unchanged from 0.2.1).
// ---------------------------------------------------------------------------
export const spacing: MosaicTokens["spacing"] = Object.freeze({
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "6": "24px",
  "8": "32px",
  "12": "48px",
  "16": "64px",
});

// ---------------------------------------------------------------------------
// Typography — 1.25x font-size scale + line-height + weight + font families.
// anydebate uses Inter (primary) and Geist Mono for code.
// New additive keys: font-sans, font-mono.
// ---------------------------------------------------------------------------
export const typography: MosaicTokens["typography"] = Object.freeze({
  // Font families (additive)
  "font-sans": "Inter, ui-sans-serif, system-ui, sans-serif",
  "font-mono": 'ui-monospace, "Geist Mono", "Cascadia Code", monospace',
  // Size scale (preserved keys, values unchanged — scale invariant maintained)
  "size-xs": "12px",
  "size-sm": "14px",
  "size-base": "16px",
  "size-lg": "20px",
  "size-xl": "24px",
  "size-2xl": "30px",
  "size-3xl": "38px",
  // Line heights (preserved)
  "lh-tight": "1.2",
  "lh-normal": "1.5",
  "lh-relaxed": "1.6",
  // Weights (preserved)
  "weight-regular": "400",
  "weight-medium": "500",
  "weight-semibold": "600",
  "weight-bold": "700",
});

// ---------------------------------------------------------------------------
// Shadows — 6 elevation steps, anydebate near-black tint (oklch(0.04 0 0)).
// ---------------------------------------------------------------------------
export const shadows: MosaicTokens["shadows"] = Object.freeze({
  "0": "none",
  "1": "0 1px 2px 0 oklch(0.040 0 0 / 0.05)",
  "2": "0 2px 4px -1px oklch(0.040 0 0 / 0.08), 0 1px 2px -1px oklch(0.040 0 0 / 0.06)",
  "3": "0 4px 8px -2px oklch(0.040 0 0 / 0.10), 0 2px 4px -2px oklch(0.040 0 0 / 0.06)",
  "4": "0 8px 16px -4px oklch(0.040 0 0 / 0.12), 0 4px 8px -4px oklch(0.040 0 0 / 0.08)",
  "5": "0 16px 32px -8px oklch(0.040 0 0 / 0.16), 0 8px 16px -8px oklch(0.040 0 0 / 0.10)",
});

// ---------------------------------------------------------------------------
// Radii — anydebate base 0.75rem (12px), strictly ascending.
// Source: --radius: 0.75rem + calc-derived scale in app/globals.css.
// sm = 12px - 4px = 8px, md = 12px - 2px = 10px, lg = 12px, xl = 12px + 4px = 16px.
// ---------------------------------------------------------------------------
export const radii: MosaicTokens["radii"] = Object.freeze({
  none: "0px",
  xs: "4px",
  sm: "8px",
  md: "10px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
});

// ---------------------------------------------------------------------------
// Motion — durations + easing curves.
// anydebate uses tw-animate-css; durations tuned to Tailwind defaults.
// New additive key: duration-slower (500ms) for entrance animations.
// ---------------------------------------------------------------------------
export const motion: MosaicTokens["motion"] = Object.freeze({
  "duration-fast": "100ms",
  "duration-base": "200ms",
  "duration-slow": "300ms",
  "duration-slower": "500ms",
  "easing-linear": "linear",
  "easing-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
  "easing-in": "cubic-bezier(0.4, 0, 1, 1)",
  "easing-out": "cubic-bezier(0, 0, 0.2, 1)",
  "easing-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  // Declared divergence (v0.3.1): no proven consumer, added per Pi
  // arbitration. NO alias — see tokens.css for rationale.
  "easing-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
});

export const tokens: MosaicTokens = Object.freeze({
  colors,
  spacing,
  typography,
  shadows,
  radii,
  motion,
});

export default tokens;
