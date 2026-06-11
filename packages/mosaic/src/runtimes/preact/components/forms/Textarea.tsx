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

/**
 * Preact runtime mirror of `Textarea`. Identical JSX shape — tsup preactPass
 * aliases `react`, `react-dom`, and JSX runtimes to `preact/compat` at build
 * time per `mosaic-architecture-standard` §18.2.
 *
 * Shared with the React runtime via `Textarea.logic.ts` pure helpers
 * (`resolveRows`, `clampToMaxLength`, `computeAutoResizeHeight`). The logic
 * file is the parity contract; this file's JSX must remain byte-equivalent in
 * structure to its React sibling for cross-runtime tests to pass.
 */

export interface TextareaProps<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  errorMessageMap?: Record<string, string>;
}

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
    el.style.height = "auto";
    const minPx = rows * 20;
    const next = computeAutoResizeHeight(el.scrollHeight, minPx);
    el.style.height = `${next}px`;
  }, [autoResize, rows]);

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
