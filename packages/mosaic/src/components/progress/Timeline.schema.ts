import { z } from "zod";

// i18nKeys: Timeline.title, Timeline.status.done, Timeline.status.current, Timeline.status.pending, Timeline.status.blocked, Timeline.completed, Timeline.more, Timeline.empty.message, Timeline.loading, Timeline.error.invalidProps
// RED stub schema.
export const TimelinePropsSchema = z.object({}).passthrough();
export type TimelineProps = Record<string, unknown>;
export type TimelinePropsOutput = Record<string, unknown>;
export function validateTimelineProps(raw: unknown): TimelinePropsOutput {
  return TimelinePropsSchema.parse(raw);
}
