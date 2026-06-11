import { z } from "zod";

export const SubmitButtonPropsSchema = z.object({
  label: z.string().min(1).default("Submit"),
  loadingLabel: z.string().min(1).default("Submitting…"),
});

export type SubmitButtonPropsValidated = z.infer<typeof SubmitButtonPropsSchema>;

export function validateSubmitButtonProps(raw: unknown): SubmitButtonPropsValidated {
  return SubmitButtonPropsSchema.parse(raw);
}
