/**
 * `@vantageos/mosaic/view-config` — the view-config parser with no UI runtime.
 *
 * A server validates the `view-config/1` document it serves without rendering it, so this entry
 * re-exports the parser only: its runtime imports reach `zod` and nothing else (no react,
 * react-dom or preact). `@vantageos/mosaic/display` keeps exporting the same objects.
 */
export {
  ViewConfigError,
  ViewConfigSchema,
  assertViewConfig,
  parseViewConfig,
} from "./view-config.js";
export type {
  ConfigToolResult,
  ConfigViewBridge,
  DetailViewConfig,
  ListViewConfig,
  ViewConfig,
  ViewConfigRowAction,
  ViewConfigSection,
} from "./view-config.js";
