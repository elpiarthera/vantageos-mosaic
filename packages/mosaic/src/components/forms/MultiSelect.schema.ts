import { z } from "zod";

/**
 * MultiSelect props — multi-value dropdown with removable chip rendering for
 * the currently selected items. The schema validates static, serializable
 * props only. Runtime callbacks (RHF `field.onChange`, `field.onBlur`) are
 * threaded by `FormField` and live on the React/Preact interface.
 */
export const MultiSelectOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const MultiSelectPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  options: z.array(MultiSelectOptionSchema).min(1),
  placeholder: z.string().optional(),
  disabled: z.boolean().optional(),
  searchable: z.boolean().optional(),
  maxItems: z.number().int().positive().optional(),
});

export type MultiSelectOption = z.infer<typeof MultiSelectOptionSchema>;
export type MultiSelectPropsValidated = z.infer<typeof MultiSelectPropsSchema>;
