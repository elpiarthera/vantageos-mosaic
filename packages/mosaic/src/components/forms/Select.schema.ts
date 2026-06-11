import { z } from "zod";

// i18nKeys: Select.placeholder, Select.search.placeholder, Select.empty

/**
 * Select primitive — single-select dropdown with optional search.
 *
 * Combobox-pattern (APG): a trigger button (role=combobox) opens a listbox
 * popup containing option rows. Optional in-popup search filters the visible
 * options client-side. Cross-runtime (React 19 + Preact 10).
 *
 * The `name` is the react-hook-form field name used by the surrounding
 * `<FormProvider>`. The render-prop wiring lives in FormField/Controller; this
 * component is rendered INSIDE a FormField render prop and consumes the
 * `field` callbacks directly (see Select.stories.tsx).
 */
export const SelectOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  disabled: z.boolean().optional().default(false),
});

export type SelectOption = z.infer<typeof SelectOptionSchema>;

export const SelectPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  options: z.array(SelectOptionSchema).min(1),
  placeholder: z.string().optional(),
  disabled: z.boolean().optional().default(false),
  searchable: z.boolean().optional().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type SelectPropsValidated = z.infer<typeof SelectPropsSchema>;

export function validateSelectProps(raw: unknown): SelectPropsValidated {
  return SelectPropsSchema.parse(raw);
}
