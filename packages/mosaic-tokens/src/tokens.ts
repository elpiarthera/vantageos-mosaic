/**
 * @vantageos/mosaic-tokens — design tokens (skeleton).
 *
 * Full token tables (colors, spacing, typography, shadows, radii, motion) are
 * implemented in T3-B. This skeleton fixes the public surface so dependent
 * packages can already wire types and imports.
 */

export interface MosaicTokens {
  readonly colors: Readonly<Record<string, string>>;
  readonly spacing: Readonly<Record<string, string>>;
  readonly typography: Readonly<Record<string, string>>;
  readonly shadows: Readonly<Record<string, string>>;
  readonly radii: Readonly<Record<string, string>>;
  readonly motion: Readonly<Record<string, string>>;
}

export const colors: MosaicTokens["colors"] = Object.freeze({});
export const spacing: MosaicTokens["spacing"] = Object.freeze({});
export const typography: MosaicTokens["typography"] = Object.freeze({});
export const shadows: MosaicTokens["shadows"] = Object.freeze({});
export const radii: MosaicTokens["radii"] = Object.freeze({});
export const motion: MosaicTokens["motion"] = Object.freeze({});

export const tokens: MosaicTokens = Object.freeze({
  colors,
  spacing,
  typography,
  shadows,
  radii,
  motion,
});

export default tokens;
