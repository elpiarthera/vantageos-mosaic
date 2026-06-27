/**
 * @vantageos/mosaic-tokens/tailwind — Tailwind v4 plugin (anydebate design language).
 *
 * Extends Tailwind theme with all mosaic-* tokens. Consumers wire this plugin
 * via `import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind"` and
 * spread it into their Tailwind config.
 *
 * v0.3.0: adds fontFamily surface for anydebate Inter/Geist Mono tokens.
 */
import { tokens } from "./tokens";

export interface MosaicTailwindPlugin {
  readonly theme: {
    readonly extend: {
      readonly colors: Readonly<Record<string, string>>;
      readonly spacing: Readonly<Record<string, string>>;
      readonly fontSize: Readonly<Record<string, string>>;
      readonly fontFamily: Readonly<Record<string, string>>;
      readonly boxShadow: Readonly<Record<string, string>>;
      readonly borderRadius: Readonly<Record<string, string>>;
      readonly transitionDuration: Readonly<Record<string, string>>;
    };
  };
}

// Separate font-family keys from size/lh/weight for Tailwind mapping
const {
  "font-sans": fontSans,
  "font-mono": fontMono,
  ...typographyWithoutFonts
} = tokens.typography;

export const mosaicPlugin: MosaicTailwindPlugin = Object.freeze({
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontSize: typographyWithoutFonts,
      fontFamily: {
        sans: fontSans ?? "Inter, ui-sans-serif, system-ui, sans-serif",
        mono: fontMono ?? "ui-monospace, monospace",
      },
      boxShadow: tokens.shadows,
      borderRadius: tokens.radii,
      transitionDuration: tokens.motion,
    },
  },
});

export default mosaicPlugin;
