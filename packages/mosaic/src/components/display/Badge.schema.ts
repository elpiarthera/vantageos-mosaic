import { z } from "zod";

// i18nKeys: Badge.error.invalidProps

/**
 * Badge component props schema.
 *
 * Inline label/count tag — sister of StatusBadge (media category).
 * Consumer-driven i18n: caller passes already-localized `content` strings.
 *
 * variant  — controls visual style (default | primary | secondary | outline)
 * size     — controls padding + font size (sm | md | lg)
 * content  — string label OR numeric count (locale handled by consumer)
 * aria-label — required when content is a number (screen reader context)
 */
export const BadgePropsSchema = z.object({
  variant: z.enum(["default", "primary", "secondary", "outline"]).default("default"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  content: z.union([z.string().min(1), z.number().int()]),
  "aria-label": z.string().optional(),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type BadgeProps = z.infer<typeof BadgePropsSchema>;

export function validateBadgeProps(raw: unknown): BadgeProps {
  return BadgePropsSchema.parse(raw);
}
