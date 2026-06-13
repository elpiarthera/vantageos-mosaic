/**
 * @vantageos/mosaic/react/progress — React 19 runtime subpath barrel.
 *
 * Exports the runtime ProgressBar wrapper + schema types so consumers can
 * import component and types from a single subpath entry.
 *
 * @example
 * ```ts
 * import { ProgressBar } from "@vantageos/mosaic/react/progress";
 * import type { ProgressBarProps } from "@vantageos/mosaic/react/progress";
 * ```
 */
export { ProgressBar } from "./ProgressBar.js";
export type { ProgressBarProps } from "../../../../components/progress/ProgressBar.schema.js";
export {
  ProgressBarPropsSchema,
  validateProps,
} from "../../../../components/progress/ProgressBar.schema.js";
