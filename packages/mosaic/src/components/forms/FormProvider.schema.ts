import { z } from "zod";

/**
 * FormProvider props that need runtime validation are minimal — the `form`
 * object comes from `useMosaicForm()` and carries its own typed contract,
 * while `children` are framework JSX. This schema exists for future-proofing
 * (e.g. optional `name` for nested form contexts).
 */
export const FormProviderPropsSchema = z.object({
  name: z.string().optional(),
});

export type FormProviderPropsValidated = z.infer<typeof FormProviderPropsSchema>;
