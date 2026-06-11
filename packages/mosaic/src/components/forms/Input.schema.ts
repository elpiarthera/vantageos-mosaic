import { z } from "zod";

/**
 * Input primitive props — bound to the surrounding `FormProvider` by `name`.
 *
 * - `name` selects a property on the form values (RHF path).
 * - `type` covers the 5 baseline text-like HTML input types (T11 scope).
 * - `placeholder` / `disabled` / `autoComplete` are passthrough DOM props.
 * - `label` is consumer-driven i18n: the caller supplies the localized string,
 *   the component never renders raw alphabetic text as JSXText children.
 *
 * Field primitives outside this 5-type baseline (checkbox/radio/file/etc.)
 * land in dedicated T12-T20 components per `docs/v0.3.0-plan.md` §7.
 */
export const InputTypeSchema = z.enum(["text", "email", "password", "number", "url"]);

export const InputPropsSchema = z.object({
  name: z.string().min(1),
  type: InputTypeSchema.default("text").optional(),
  placeholder: z.string().optional(),
  disabled: z.boolean().optional(),
  autoComplete: z.string().optional(),
  label: z.string().min(1),
});

export type InputType = z.infer<typeof InputTypeSchema>;
export type InputPropsValidated = z.infer<typeof InputPropsSchema>;
