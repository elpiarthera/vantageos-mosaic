"use client";

import { useEffect, useId, useRef } from "react";
import type { FieldValues, Path } from "react-hook-form";
import {
  resolveAriaChecked,
  resolveDescribedBy,
} from "../../../../components/forms/Checkbox.logic.js";
import { ErrorDisplay } from "./ErrorDisplay.js";
import { FormField } from "./FormField.js";

export interface CheckboxProps<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  label: string;
  disabled?: boolean;
  indeterminate?: boolean;
  description?: string;
  className?: string;
  /** Optional i18n map passed through to `ErrorDisplay` for error type → message. */
  errorMessageMap?: Record<string, string>;
}

/**
 * Boolean checkbox form primitive with indeterminate state support.
 *
 * Wraps `FormField` (RHF Controller) and renders a native `<input type="checkbox">` with:
 * - `indeterminate` prop — sets DOM `.indeterminate = true` via ref + `aria-checked="mixed"`.
 * - `description` — rendered in a `<span>` and wired via `aria-describedby`.
 * - `aria-invalid` toggled when the field has a validation error.
 * - `aria-describedby` includes the error ID when an error exists.
 * - Bilingual-ready: `label`, `description`, and `errorMessageMap` are caller-supplied.
 */
export function Checkbox<TValues extends FieldValues = FieldValues>(props: CheckboxProps<TValues>) {
  const { name, label, disabled, indeterminate, description, className, errorMessageMap } = props;
  const reactId = useId();
  const fieldId = `mosaic-checkbox-${reactId}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <FormField<TValues> name={name}>
      {({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);
        return (
          <CheckboxInner
            id={fieldId}
            errorId={errorId}
            descriptionId={descriptionId}
            label={label}
            checked={(field.value as boolean | undefined) ?? false}
            onChange={(next) => field.onChange(next)}
            onBlur={field.onBlur}
            disabled={disabled}
            indeterminate={indeterminate}
            description={description}
            hasError={hasError}
            className={className}
          >
            <ErrorDisplay
              error={
                fieldState.error
                  ? {
                      type: fieldState.error.type ?? "validation",
                      message: fieldState.error.message,
                    }
                  : undefined
              }
              messageMap={errorMessageMap}
              className="mosaic-forms-error"
            />
          </CheckboxInner>
        );
      }}
    </FormField>
  );
}

interface CheckboxInnerProps {
  id: string;
  errorId: string;
  descriptionId: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  onBlur: () => void;
  disabled: boolean | undefined;
  indeterminate: boolean | undefined;
  description: string | undefined;
  hasError: boolean;
  className: string | undefined;
  children: React.ReactNode;
}

function CheckboxInner(props: CheckboxInnerProps) {
  const {
    id,
    errorId,
    descriptionId,
    label,
    checked,
    onChange,
    onBlur,
    disabled,
    indeterminate,
    description,
    hasError,
    className,
    children,
  } = props;
  const ref = useRef<HTMLInputElement | null>(null);

  // DOM .indeterminate is not a declarative HTML attribute — must be set via ref.
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  const ariaChecked = resolveAriaChecked(checked, indeterminate);
  const describedBy = resolveDescribedBy(descriptionId, description, hasError, errorId);

  return (
    <div className={className ?? "mosaic-forms-checkbox"}>
      <label htmlFor={id} className="mosaic-forms-checkbox-label">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          aria-checked={ariaChecked}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
        />
        {label}
      </label>
      {description ? (
        <span id={descriptionId} className="mosaic-forms-checkbox-description">
          {description}
        </span>
      ) : null}
      <div id={errorId}>{children}</div>
    </div>
  );
}
