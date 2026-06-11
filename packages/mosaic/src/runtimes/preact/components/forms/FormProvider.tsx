"use client";

import { type ReactNode, createContext, useContext } from "react";
import { type FieldValues, FormProvider as RhfFormProvider } from "react-hook-form";
import { FORM_PROVIDER_CONTEXT_MISSING } from "../../../../components/forms/FormProvider.logic.js";
import type { UseMosaicFormReturn } from "./useMosaicForm.js";

// The context value is erased to the default `FieldValues` generic — callers
// of `useMosaicFormContext()` cast back to their narrow form shape when needed.
// This avoids the invariance pitfall of trying to store a typed-narrow form
// in a global context typed at the loose default.
const MosaicFormContext = createContext<UseMosaicFormReturn | null>(null);

export interface FormProviderProps<TValues extends FieldValues = FieldValues> {
  form: UseMosaicFormReturn<TValues>;
  children: ReactNode;
}

/**
 * Wraps `react-hook-form`'s native `<FormProvider>` AND a Mosaic-specific
 * context that carries the extended metadata (`mosaicSchema`, `mosaicMode`).
 * Consumer components read either context — Mosaic's own for metadata,
 * RHF's for register/control/handleSubmit access.
 */
export function FormProvider<TValues extends FieldValues = FieldValues>({
  form,
  children,
}: FormProviderProps<TValues>) {
  return (
    <MosaicFormContext.Provider value={form as unknown as UseMosaicFormReturn}>
      <RhfFormProvider {...form}>{children}</RhfFormProvider>
    </MosaicFormContext.Provider>
  );
}

/**
 * Read the Mosaic-extended form context. Throws if called outside a
 * `<FormProvider>` so consumer bugs surface immediately.
 *
 * Generic `TValues` lets callers narrow back to their original form shape.
 */
export function useMosaicFormContext<
  TValues extends FieldValues = FieldValues,
>(): UseMosaicFormReturn<TValues> {
  const ctx = useContext(MosaicFormContext);
  if (!ctx) {
    throw new Error(FORM_PROVIDER_CONTEXT_MISSING);
  }
  return ctx as unknown as UseMosaicFormReturn<TValues>;
}
