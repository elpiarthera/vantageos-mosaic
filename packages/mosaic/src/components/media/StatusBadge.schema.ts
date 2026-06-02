import { z } from "zod";

export const StatusBadgeSchema = z.object({
  status: z.string(),
  variant: z.enum(["success", "warning", "danger", "info", "neutral"]).default("neutral"),
  label: z.string().optional(),
  locale: z.enum(["en", "fr"]),
});

export type StatusBadgeProps = z.infer<typeof StatusBadgeSchema>;

export function validateProps(raw: unknown): StatusBadgeProps {
  return StatusBadgeSchema.parse(raw);
}
