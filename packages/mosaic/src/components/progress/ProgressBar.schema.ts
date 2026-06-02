import { z } from "zod";

export const ProgressBarPropsSchema = z.object({
  value: z.number().min(0).max(100),
  label: z.string().min(1),
  locale: z.enum(["en", "fr"]).default("en"),
  colorVariant: z.enum(["default", "warning", "danger"]).default("default"),
});

export type ProgressBarProps = z.infer<typeof ProgressBarPropsSchema>;

export function validateProps(raw: unknown): ProgressBarProps {
  return ProgressBarPropsSchema.parse(raw);
}
