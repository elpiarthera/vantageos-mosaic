import { z } from "zod";

/**
 * ErrorDisplay accepts an RHF-shaped field error plus an optional consumer
 * message map for i18n. The structure mirrors RHF `FieldError`:
 * `{ type: string, message?: string }`.
 */
export const FieldErrorShapeSchema = z.object({
  type: z.string(),
  message: z.string().optional(),
});

export const ErrorDisplayPropsSchema = z.object({
  error: FieldErrorShapeSchema.optional(),
  messageMap: z.record(z.string(), z.string()).optional(),
});

export type ErrorDisplayPropsValidated = z.infer<typeof ErrorDisplayPropsSchema>;
export type FieldErrorShape = z.infer<typeof FieldErrorShapeSchema>;
