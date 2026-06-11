"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { FieldValues, Path } from "react-hook-form";
import {
  DEFAULT_TEXTAREA_ROWS,
  clampToMaxLength,
  computeAutoResizeHeight,
  resolveRows,
} from "../../../../components/forms/Textarea.logic.js";
import { ErrorDisplay } from "./ErrorDisplay.js";
import { FormField } from "./FormField.js";

export interface TextareaProps<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  /** Optional i18n map passed through to `ErrorDisplay` for error type → message. */
  errorMessageMap?: Record<string, string>;
}

/**
 * Multi-line text input form primitive.
 *
 * Wraps `FormField` (RHF Controller) and renders a native `<textarea>` with:
 * - `rows` default 3 (see `resolveRows`).
 * - `maxLength` enforcement at the onChange boundary via `clampToMaxLength`.
 * - Optional `autoResize` — grows the element to fit content on each input event.
 * - `aria-invalid` toggled when the field has a validation error.
 * - `aria-describedby` wired to the `ErrorDisplay` element when an error exists.
 * - Bilingual-ready: `label`, `placeholder`, and `errorMessageMap` are caller-supplied
 *   strings — Mosaic does not bake locale-specific copy into the component.
 */
export function Textarea<TValues extends FieldValues = FieldValues>(props: TextareaProps<TValues>) {
  const {
    name,
    rows,
    maxLength,
    autoResize = false,
    placeholder,
    disabled,
    label,
    className,
    errorMessageMap,
  } = props;
  const effectiveRows = resolveRows(rows);
  const reactId = useId();
  const fieldId = `mosaic-textarea-${reactId}`;
  const errorId = `${fieldId}-error`;

  return (
    <FormField<TValues> name={name}>
      {({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);
        return (
          <TextareaInner
            id={fieldId}
            errorId={errorId}
            label={label}
            value={(field.value as string | undefined) ?? ""}
            onChange={(next) => field.onChange(clampToMaxLength(next, maxLength))}
            onBlur={field.onBlur}
            rows={effectiveRows}
            maxLength={maxLength}
            autoResize={autoResize}
            placeholder={placeholder}
            disabled={disabled}
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
          </TextareaInner>
        );
      }}
    </FormField>
  );
}

interface TextareaInnerProps {
  id: string;
  errorId: string;
  label: string | undefined;
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  rows: number;
  maxLength: number | undefined;
  autoResize: boolean;
  placeholder: string | undefined;
  disabled: boolean | undefined;
  hasError: boolean;
  className: string | undefined;
  children: React.ReactNode;
}

function TextareaInner(props: TextareaInnerProps) {
  const {
    id,
    errorId,
    label,
    value,
    onChange,
    onBlur,
    rows,
    maxLength,
    autoResize,
    placeholder,
    disabled,
    hasError,
    className,
    children,
  } = props;
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    if (!autoResize) return;
    const el = ref.current;
    if (!el) return;
    // Reset first so scrollHeight reflects the *content*, not the previous box.
    el.style.height = "auto";
    const minPx = rows * 20; // ~20px per row baseline (jsdom-friendly fallback).
    const next = computeAutoResizeHeight(el.scrollHeight, minPx);
    el.style.height = `${next}px`;
  }, [autoResize, rows]);

  // Resize on mount + whenever the bound value changes (covers external updates).
  useEffect(() => {
    resize();
  }, [resize]);

  return (
    <div className={className ?? "mosaic-forms-textarea"}>
      {label ? (
        <label htmlFor={id} className="mosaic-forms-textarea-label">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          resize();
        }}
        onBlur={onBlur}
      />
      <div id={errorId}>{children}</div>
    </div>
  );
}

export { DEFAULT_TEXTAREA_ROWS };
