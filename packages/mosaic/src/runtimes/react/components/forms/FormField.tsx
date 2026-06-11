"use client";

import type { ReactElement } from "react";
import {
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
  type UseFormStateReturn,
} from "react-hook-form";
import { useMosaicFormContext } from "./FormProvider.js";

export interface FormFieldRenderArgs<TValues extends FieldValues = FieldValues> {
  field: ControllerRenderProps<TValues>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TValues>;
}

export interface FormFieldProps<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  children: (args: FormFieldRenderArgs<TValues>) => ReactElement;
}

/**
 * Render-prop wrapper around RHF's `Controller`. Pulls `control` from the
 * surrounding `<FormProvider>` so consumers never thread it manually.
 */
export function FormField<TValues extends FieldValues = FieldValues>({
  name,
  children,
}: FormFieldProps<TValues>) {
  const form = useMosaicFormContext() as unknown as { control: unknown };
  return (
    <Controller
      // biome-ignore lint/suspicious/noExplicitAny: bridging FormProvider's erased generic to Controller
      control={form.control as any}
      name={name as never}
      render={({ field, fieldState, formState }) =>
        children({
          field: field as unknown as ControllerRenderProps<TValues>,
          fieldState,
          formState: formState as unknown as UseFormStateReturn<TValues>,
        })
      }
    />
  );
}
