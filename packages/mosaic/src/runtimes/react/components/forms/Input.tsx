"use client";

import { useId } from "react";
import {
  Controller,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { formatErrorMessage } from "../../../../components/forms/ErrorDisplay.logic.js";
import {
  buildErrorDescribedBy,
  resolveHtmlType,
} from "../../../../components/forms/Input.logic.js";
import type { InputType } from "../../../../components/forms/Input.schema.js";
import { useMosaicFormContext } from "./FormProvider.js";

export interface InputProps<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  /** HTML input type. Defaults to `"text"`. */
  type?: InputType;
  /** Consumer-driven i18n label. Wired via `<label htmlFor>` to the input. */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  /** Optional consumer override for the wrapping element id. */
  id?: string;
  /** Optional error code → message map for i18n. */
  messageMap?: Record<string, string>;
  className?: string;
  inputClassName?: string;
  errorClassName?: string;
}

/**
 * Cross-runtime Input primitive (forms category, T11). Binds an `<input>` to
 * the surrounding `<FormProvider>` via `react-hook-form`'s `Controller`.
 *
 * - Consumer-driven i18n: every user-visible string flows in as a prop.
 * - a11y: `<label htmlFor>` pair, `aria-invalid` toggled by validation state,
 *   `aria-describedby` linking the error element when present.
 * - Validation timing inherits the form's `mode` (default `"onBlur"`, Day 102 DM).
 */
export function Input<TValues extends FieldValues = FieldValues>({
  name,
  type,
  label,
  placeholder,
  disabled,
  autoComplete,
  id,
  messageMap,
  className,
  inputClassName,
  errorClassName,
}: InputProps<TValues>) {
  const form = useMosaicFormContext() as unknown as { control: unknown };
  const reactId = useId();
  const inputId = id ?? `mosaic-input-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-${String(name)}`;
  const htmlType = resolveHtmlType(type);

  return (
    <Controller
      // biome-ignore lint/suspicious/noExplicitAny: bridging FormProvider's erased generic to Controller
      control={form.control as any}
      name={name as never}
      render={({ field, fieldState }) => {
        const f = field as unknown as ControllerRenderProps<TValues>;
        const hasError = Boolean(fieldState.error);
        const describedBy = buildErrorDescribedBy(inputId, hasError);
        const message = formatErrorMessage(
          fieldState.error
            ? { type: fieldState.error.type, message: fieldState.error.message }
            : undefined,
          messageMap,
        );
        const value = (f.value as string | number | undefined) ?? "";
        return (
          <div className={className ?? "mosaic-forms-input"}>
            <label htmlFor={inputId}>{label}</label>
            <input
              id={inputId}
              name={f.name}
              type={htmlType}
              value={value}
              onChange={f.onChange}
              onBlur={f.onBlur}
              ref={f.ref}
              placeholder={placeholder}
              disabled={disabled ?? false}
              autoComplete={autoComplete}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              className={inputClassName}
            />
            {hasError && message ? (
              <span
                id={`${inputId}-error`}
                role="alert"
                className={errorClassName ?? "mosaic-forms-error"}
              >
                {message}
              </span>
            ) : null}
          </div>
        );
      }}
    />
  );
}
