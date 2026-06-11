import { z } from "zod";

/**
 * FormField props — the field `name` selects a property on the form values.
 * Children are a render-prop receiving `field`, `fieldState`, `formState`
 * from RHF Controller; that contract is enforced at the TypeScript layer.
 */
export const FormFieldPropsSchema = z.object({
  name: z.string().min(1),
});

export type FormFieldPropsValidated = z.infer<typeof FormFieldPropsSchema>;
