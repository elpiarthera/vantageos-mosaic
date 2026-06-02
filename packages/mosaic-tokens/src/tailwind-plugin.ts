/**
 * @vantageos/mosaic-tokens/tailwind — Tailwind v4 plugin (skeleton).
 *
 * Full mapping (theme.extend.colors / spacing / etc → mosaic-* CSS vars)
 * lands in T3-B. This skeleton fixes the export shape so consumers can
 * already wire `import mosaicPlugin from "@vantageos/mosaic-tokens/tailwind"`.
 */
import { tokens } from "./tokens";

export interface MosaicTailwindPlugin {
  readonly theme: {
    readonly extend: {
      readonly colors: Readonly<Record<string, string>>;
      readonly spacing: Readonly<Record<string, string>>;
      readonly fontSize: Readonly<Record<string, string>>;
      readonly boxShadow: Readonly<Record<string, string>>;
      readonly borderRadius: Readonly<Record<string, string>>;
      readonly transitionDuration: Readonly<Record<string, string>>;
    };
  };
}

export const mosaicPlugin: MosaicTailwindPlugin = Object.freeze({
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontSize: tokens.typography,
      boxShadow: tokens.shadows,
      borderRadius: tokens.radii,
      transitionDuration: tokens.motion,
    },
  },
});

export default mosaicPlugin;
