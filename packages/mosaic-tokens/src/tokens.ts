/**
 * @vantageos/mosaic-tokens — design tokens (T3-B implementation).
 *
 * Framework-free, OKLCH-based, mirror of the CSS custom properties in
 * tokens.css. Consumers can opt for either the CSS surface (Tailwind v4
 * + @theme inline) or the JS surface (typed runtime access in JSX styles,
 * Storybook stories, Playwright assertions, snapshot tests).
 *
 * Size targets (.size-limit.json): JS bundle ≤5 KB gz, CSS ≤3 KB gz.
 *
 * Schema invariants (enforced by mosaic-tokens-coherence-test in T3-C):
 *   - Every CSS var has a JS counterpart (and vice versa).
 *   - Color shades 50 < 500 < 700 monotonic luminance.
 *   - Spacing scale ascending, ratio 1.5x average (4 → 64 px).
 *   - Typography scale uses 1.25x ratio (12 → 38 px).
 *   - Shadow elevation 0 < 1 < 2 < 3 < 4 < 5 monotonic blur radius.
 *   - Radii strictly ascending (none → full).
 */

export interface MosaicTokens {
  readonly colors: Readonly<Record<string, string>>;
  readonly spacing: Readonly<Record<string, string>>;
  readonly typography: Readonly<Record<string, string>>;
  readonly shadows: Readonly<Record<string, string>>;
  readonly radii: Readonly<Record<string, string>>;
  readonly motion: Readonly<Record<string, string>>;
}

// Colors — semantic statuses × 3 shades (50/500/700), OKLCH.
// 50 = surface tint, 500 = brand body, 700 = accessible contrast on light bg.
export const colors: MosaicTokens["colors"] = Object.freeze({
  "success-50": "oklch(0.965 0.040 145)",
  "success-500": "oklch(0.660 0.180 145)",
  "success-700": "oklch(0.470 0.140 145)",
  "warning-50": "oklch(0.975 0.045 85)",
  "warning-500": "oklch(0.770 0.170 85)",
  "warning-700": "oklch(0.560 0.145 65)",
  "danger-50": "oklch(0.965 0.035 25)",
  "danger-500": "oklch(0.640 0.205 25)",
  "danger-700": "oklch(0.460 0.180 25)",
  "info-50": "oklch(0.970 0.035 250)",
  "info-500": "oklch(0.650 0.170 250)",
  "info-700": "oklch(0.460 0.150 250)",
  "neutral-50": "oklch(0.980 0.005 250)",
  "neutral-500": "oklch(0.580 0.012 250)",
  "neutral-700": "oklch(0.380 0.010 250)",
});

// Spacing — 4 → 64 px scale.
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

// Typography — 1.25x font-size scale + line-height + weight.
export const typography: MosaicTokens["typography"] = Object.freeze({
  "size-xs": "12px",
  "size-sm": "14px",
  "size-base": "16px",
  "size-lg": "20px",
  "size-xl": "24px",
  "size-2xl": "30px",
  "size-3xl": "38px",
  "lh-tight": "1.2",
  "lh-normal": "1.5",
  "lh-relaxed": "1.6",
  "weight-regular": "400",
  "weight-medium": "500",
  "weight-semibold": "600",
  "weight-bold": "700",
});

// Shadows — 6 elevation steps, OKLCH neutral tint.
export const shadows: MosaicTokens["shadows"] = Object.freeze({
  "0": "none",
  "1": "0 1px 2px 0 oklch(0.200 0.010 250 / 0.05)",
  "2": "0 2px 4px -1px oklch(0.200 0.010 250 / 0.08), 0 1px 2px -1px oklch(0.200 0.010 250 / 0.06)",
  "3": "0 4px 8px -2px oklch(0.200 0.010 250 / 0.10), 0 2px 4px -2px oklch(0.200 0.010 250 / 0.06)",
  "4": "0 8px 16px -4px oklch(0.200 0.010 250 / 0.12), 0 4px 8px -4px oklch(0.200 0.010 250 / 0.08)",
  "5": "0 16px 32px -8px oklch(0.200 0.010 250 / 0.16), 0 8px 16px -8px oklch(0.200 0.010 250 / 0.10)",
});

// Radii — strictly ascending (none → full).
export const radii: MosaicTokens["radii"] = Object.freeze({
  none: "0px",
  xs: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  full: "9999px",
});

// Motion — durations + easing curves.
export const motion: MosaicTokens["motion"] = Object.freeze({
  "duration-fast": "75ms",
  "duration-base": "150ms",
  "duration-slow": "300ms",
  "easing-linear": "linear",
  "easing-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
  "easing-in": "cubic-bezier(0.4, 0, 1, 1)",
  "easing-out": "cubic-bezier(0, 0, 0.2, 1)",
  "easing-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
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
