import { z } from "zod";

// i18nKeys: Timeline.title, Timeline.status.done, Timeline.status.current, Timeline.status.pending, Timeline.status.blocked, Timeline.completed, Timeline.more, Timeline.empty.message, Timeline.loading, Timeline.error.invalidProps

export const TimelineStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  status: z.enum(["done", "current", "pending", "blocked"]),
  description: z.string().optional(),
  /** ISO 8601. */
  timestamp: z.string().optional(),
});

export type TimelineStep = z.infer<typeof TimelineStepSchema>;

/**
 * Timeline (R02): missions as status steps — vertical or horizontal. `compact` is the Claude
 * inline form (current + next step); fullscreen shows all. `{}` parses (ChatGPT entrypoint
 * default).
 */
export const TimelinePropsSchema = z.object({
  steps: z.array(TimelineStepSchema).default([]),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  compact: z.boolean().default(false),
  /** IANA timezone for timestamps (e.g. `hostContext.timeZone`). Default: the viewer's. */
  timeZone: z.string().optional(),
  loading: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type TimelineProps = z.input<typeof TimelinePropsSchema>;
export type TimelinePropsOutput = z.output<typeof TimelinePropsSchema>;

export function validateTimelineProps(raw: unknown): TimelinePropsOutput {
  return TimelinePropsSchema.parse(raw);
}
