import { z } from "zod";

/**
 * Validation timing modes. Mosaic default is "onBlur" — Chi co-validated decision
 * (Day 102 DM). RHF's full Mode union supports more values; we narrow to the three
 * timings that are safe and predictable for cross-runtime consumers.
 */
export const MosaicFormModeSchema = z.enum(["onBlur", "onChange", "onSubmit"]);
export type MosaicFormMode = z.infer<typeof MosaicFormModeSchema>;

/**
 * Options accepted by `useMosaicForm`. The Zod schema for the form payload is
 * passed separately (not parsed inside this schema) because it carries runtime
 * type information that the consumer's TSchema generic propagates through.
 */
export const UseMosaicFormOptionsSchema = z.object({
  mode: MosaicFormModeSchema.default("onBlur"),
});

export type UseMosaicFormOptions = z.infer<typeof UseMosaicFormOptionsSchema>;

export function validateOptions(raw: unknown): UseMosaicFormOptions {
  return UseMosaicFormOptionsSchema.parse(raw);
}
