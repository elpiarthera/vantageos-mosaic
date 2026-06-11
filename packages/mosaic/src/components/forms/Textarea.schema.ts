import { z } from "zod";

/**
 * Textarea — multi-line text input form primitive.
 *
 * Props contract (Zod-validated at boundary, mirrors React/Preact runtime types).
 *
 * - `name` — required, non-empty. Selects a property on the surrounding form values.
 * - `rows` — default 3, integer ≥ 1. Maps to native textarea `rows` attribute.
 * - `maxLength` — optional, integer ≥ 1. Caller-controlled length cap. Enforced by
 *   pure logic helpers so React and Preact runtimes share gating semantics.
 * - `autoResize` — default false. When true, runtime grows the textarea to fit
 *   content (capped by CSS `max-height` if set by consumer).
 * - `placeholder` — optional string.
 * - `disabled` — optional boolean.
 * - `label` — optional string (rendered above the textarea, bilingual-ready).
 */
export const TextareaPropsSchema = z.object({
  name: z.string().min(1),
  rows: z.number().int().min(1).default(3),
  maxLength: z.number().int().min(1).optional(),
  autoResize: z.boolean().default(false),
  placeholder: z.string().optional(),
  disabled: z.boolean().optional(),
  label: z.string().optional(),
});

export type TextareaPropsValidated = z.infer<typeof TextareaPropsSchema>;

export function validateTextareaProps(raw: unknown): TextareaPropsValidated {
  return TextareaPropsSchema.parse(raw);
}
