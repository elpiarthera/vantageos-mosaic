/**
 * Theme as data. The parser lives in `@vantageos/mosaic-tokens` (zero runtime dependencies), so a
 * server can validate a theme without depending on this package; this module re-exports it under
 * the names mosaic has always exposed (`@vantageos/mosaic/server/config-view` re-exports from here).
 */
export {
  THEME_TOKEN_NAMES,
  ThemeError,
  parseThemeDocument,
  themeToCss,
} from "@vantageos/mosaic-tokens";
export type { ThemeDocument, ThemeIssue } from "@vantageos/mosaic-tokens";
