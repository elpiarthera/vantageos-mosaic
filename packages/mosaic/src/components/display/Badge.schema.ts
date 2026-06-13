import { z } from "zod";

export const BadgePropsSchema = z.object({
  label: z.string(),
  variant: z
    .enum(["default", "primary", "success", "warning", "danger", "info", "neutral"])
    .default("default"),
  dot: z.boolean().optional(),
  count: z.number().int().nonnegative().optional(),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type BadgeProps = z.infer<typeof BadgePropsSchema>;

export function validateBadgeProps(raw: unknown): BadgeProps {
  return BadgePropsSchema.parse(raw);
}
