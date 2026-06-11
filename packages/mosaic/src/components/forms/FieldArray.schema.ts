import { z } from "zod";

/**
 * FieldArray props — `name` selects the array path on the form values.
 * `children` is a render-prop receiving `(field, index)` for each entry
 * AND a third arg with the controls `{ append, remove, move, swap, fields }`.
 * That contract is enforced at the TypeScript layer.
 */
export const FieldArrayPropsSchema = z.object({
  name: z.string().min(1),
});

export type FieldArrayPropsValidated = z.infer<typeof FieldArrayPropsSchema>;

/**
 * Options accepted by `useFieldArray` — thin re-export of the underlying
 * RHF shape. We validate `name` here for parity with FieldArray.
 */
export const UseFieldArrayOptionsSchema = z.object({
  name: z.string().min(1),
});

export type UseFieldArrayOptionsValidated = z.infer<typeof UseFieldArrayOptionsSchema>;
