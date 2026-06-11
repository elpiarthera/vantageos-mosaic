import { z } from "zod";

// i18nKeys: RadioGroup.error.invalidProps

/**
 * RadioGroup — mutually exclusive single-choice form primitive.
 *
 * - `name`         RHF field name (must match `<FormField name="…">` parent).
 * - `options`      Ordered list of radio descriptors. Each carries a stable
 *                  `value` (the form value when selected), a visible `label`,
 *                  and an optional `description` exposed via aria-describedby.
 * - `orientation`  Visual layout — vertical (default) or horizontal. Controls
 *                  Arrow key mapping (Up/Down vs Left/Right per WAI-ARIA).
 * - `disabled`     Disables the whole group; individual options can also be
 *                  disabled via `options[i].disabled`.
 * - `label`        Visible group label rendered above the radios; wired to
 *                  `role="radiogroup"` via `aria-labelledby`.
 *
 * WCAG-AA contract is asserted by the runtime layer:
 *   - container has `role="radiogroup"` + `aria-labelledby` + `aria-orientation`.
 *   - each radio has `role="radio"` + `aria-checked` + `tabIndex` roving.
 *   - Arrow keys move focus AND selection (WAI-ARIA radiogroup pattern §3.10).
 *   - Space/Enter activates the currently focused radio.
 *   - Disabled radios are skipped during keyboard navigation.
 */
export const RadioGroupOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  disabled: z.boolean().optional().default(false),
});

export type RadioGroupOption = z.infer<typeof RadioGroupOptionSchema>;

export const RadioGroupPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  options: z.array(RadioGroupOptionSchema).min(1),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  disabled: z.boolean().optional().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type RadioGroupPropsValidated = z.infer<typeof RadioGroupPropsSchema>;

/** Runtime props — RHF Controller field+fieldState are not serialisable so live outside the Zod schema. */
export type RadioGroupProps = RadioGroupPropsValidated;

export function validateRadioGroupProps(raw: unknown): RadioGroupPropsValidated {
  return RadioGroupPropsSchema.parse(raw);
}
