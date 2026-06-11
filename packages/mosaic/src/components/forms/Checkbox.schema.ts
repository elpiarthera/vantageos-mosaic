import { z } from "zod";

/**
 * Checkbox — boolean form primitive with indeterminate state support.
 *
 * Props contract (Zod-validated at boundary, mirrors React/Preact runtime types).
 *
 * - `name` — required, non-empty. Selects a property on the surrounding form values.
 * - `label` — required, non-empty. Rendered adjacent to the checkbox (bilingual-ready).
 * - `disabled` — optional boolean. Maps to native `disabled` attribute.
 * - `indeterminate` — optional boolean. When true, sets DOM `.indeterminate = true`
 *   via ref and aria-checked="mixed". Controlled externally — the component does not
 *   manage this state internally.
 * - `description` — optional string. Wired via `aria-describedby` for screen readers.
 */
export const CheckboxPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  disabled: z.boolean().optional(),
  indeterminate: z.boolean().optional(),
  description: z.string().optional(),
});

export type CheckboxPropsValidated = z.infer<typeof CheckboxPropsSchema>;

export function validateCheckboxProps(raw: unknown): CheckboxPropsValidated {
  return CheckboxPropsSchema.parse(raw);
}
