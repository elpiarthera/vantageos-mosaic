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

/**
 * Timeline — shared cross-runtime implementation (the tsup preact pass aliases react -> preact/compat).
 */
export { Timeline } from "../../../../components/progress/Timeline.js";
export type {
  TimelineProps,
  TimelinePropsOutput,
  TimelineStep,
} from "../../../../components/progress/Timeline.schema.js";
export {
  TimelinePropsSchema,
  validateTimelineProps,
} from "../../../../components/progress/Timeline.schema.js";
