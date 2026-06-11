"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldValues, type UseFormReturn, useForm } from "react-hook-form";
import type { ZodSchema, ZodType } from "zod";
import { toRhfMode } from "../../../../components/forms/useMosaicForm.logic.js";
import {
  type MosaicFormMode,
  validateOptions,
} from "../../../../components/forms/useMosaicForm.schema.js";

/**
 * Public options to {@link useMosaicForm}. The Zod `schema` is the runtime
 * validator (and the source of truth for the form payload type). `mode`
 * defaults to `"onBlur"` per Chi co-validated decision (Day 102).
 */
export interface UseMosaicFormOptions<TSchema extends ZodType> {
  schema: TSchema;
  defaultValues: Partial<ReturnType<TSchema["parse"]>> | ReturnType<TSchema["parse"]>;
  mode?: MosaicFormMode;
}

/**
 * Return type — the standard RHF `UseFormReturn` extended with two Mosaic
 * metadata fields so consumers (FormField, SubmitButton, FormProvider) can
 * inspect the active schema + timing without re-deriving them.
 */
export type UseMosaicFormReturn<TFieldValues extends FieldValues = FieldValues> =
  UseFormReturn<TFieldValues> & {
    mosaicSchema: ZodSchema;
    mosaicMode: MosaicFormMode;
  };

/**
 * Cross-runtime wrapper around `react-hook-form` + `@hookform/resolvers/zod`.
 *
 * - Validates options through Zod (`UseMosaicFormOptionsSchema`) so an invalid
 *   `mode` fails loudly at hook-call time rather than silently degrading.
 * - Attaches the schema + mode to the return object as `mosaicSchema` and
 *   `mosaicMode` for downstream Mosaic consumers (FieldArray will read these).
 *
 * Compatible with FieldArray (T16) — the return shape extends RHF's, so
 * `useFieldArray({ control: form.control, name: ... })` works verbatim.
 */
export function useMosaicForm<TSchema extends ZodType>(
  options: UseMosaicFormOptions<TSchema>,
): UseMosaicFormReturn<ReturnType<TSchema["parse"]> & FieldValues> {
  const parsedOptions = validateOptions({ mode: options.mode });
  type TValues = ReturnType<TSchema["parse"]> & FieldValues;

  const form = useForm<TValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver's generic shape forces a cast at this boundary
    resolver: zodResolver(options.schema as any),
    defaultValues: options.defaultValues as TValues,
    mode: toRhfMode(parsedOptions.mode),
  });

  const extended = form as UseMosaicFormReturn<TValues>;
  extended.mosaicSchema = options.schema as ZodSchema;
  extended.mosaicMode = parsedOptions.mode;
  return extended;
}
