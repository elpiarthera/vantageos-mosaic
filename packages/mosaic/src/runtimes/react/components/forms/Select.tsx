"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FieldValues, Path } from "react-hook-form";
import {
  filterOptions,
  findByTypeAhead,
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  getListboxClasses,
  getListboxId,
  getOptionClasses,
  getOptionId,
  getSearchInputClasses,
  getTriggerClasses,
  getTriggerId,
  indexOfValue,
  resolveSelectedLabel,
} from "../../../../components/forms/Select.logic.js";
import type { SelectOption } from "../../../../components/forms/Select.schema.js";
import { ErrorDisplay } from "./ErrorDisplay.js";
import { FormField } from "./FormField.js";

export interface SelectProps<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  /** Optional i18n map passed through to `ErrorDisplay` for error type → message. */
  errorMessageMap?: Record<string, string>;
}

/**
 * Single-select dropdown primitive — combobox+listbox APG pattern.
 * Wraps `FormField` (RHF Controller) and exposes error state via `ErrorDisplay`.
 * WCAG-AA strict.
 *
 * The visible value-label is shown in the trigger button; the listbox popup
 * uses `aria-activedescendant` to track keyboard focus without moving DOM focus
 * (focus stays on the trigger or the search input).
 */
export function Select<TValues extends FieldValues = FieldValues>({
  name,
  label,
  options,
  placeholder,
  disabled = false,
  searchable = false,
  className,
  errorMessageMap,
}: SelectProps<TValues>) {
  const reactId = useId();
  const instanceId = `mosaic-select-${reactId.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const triggerId = getTriggerId(instanceId);
  const listboxId = getListboxId(instanceId);
  const labelId = `${instanceId}-label`;
  const errorId = `${instanceId}-error`;

  return (
    <FormField<TValues> name={name}>
      {({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);
        return (
          <SelectInner
            field={
              field as unknown as {
                value: string | null;
                onChange: (v: string) => void;
                onBlur: () => void;
                ref: (el: HTMLElement | null) => void;
              }
            }
            label={label}
            labelId={labelId}
            triggerId={triggerId}
            listboxId={listboxId}
            errorId={errorId}
            instanceId={instanceId}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            searchable={searchable}
            className={className}
            hasError={hasError}
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
          </SelectInner>
        );
      }}
    </FormField>
  );
}

interface InnerProps {
  field: {
    value: string | null;
    onChange: (v: string) => void;
    onBlur: () => void;
    ref: (el: HTMLElement | null) => void;
  };
  label: string;
  labelId: string;
  triggerId: string;
  listboxId: string;
  errorId: string;
  instanceId: string;
  options: SelectOption[];
  placeholder?: string;
  disabled: boolean;
  searchable: boolean;
  className?: string;
  hasError: boolean;
  children: React.ReactNode;
}

function SelectInner({
  field,
  label,
  labelId,
  triggerId,
  listboxId,
  errorId,
  instanceId,
  options,
  placeholder,
  disabled,
  searchable,
  className,
  hasError,
  children,
}: InnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const typeAheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  });

  const visibleOptions = useMemo(
    () => (searchable ? filterOptions(options, query) : options),
    [options, query, searchable],
  );

  // Keep activeIndex coherent when popup opens or filter changes
  useEffect(() => {
    if (!isOpen) return;
    const selectedIdx = indexOfValue(visibleOptions, field.value);
    if (selectedIdx >= 0 && !visibleOptions[selectedIdx]?.disabled) {
      setActiveIndex(selectedIdx);
    } else {
      setActiveIndex(findFirstEnabledIndex(visibleOptions));
    }
  }, [isOpen, visibleOptions, field.value]);

  const closePopup = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const commitOption = useCallback(
    (idx: number) => {
      const opt = visibleOptions[idx];
      if (!opt || opt.disabled) return;
      field.onChange(opt.value);
      closePopup(true);
      field.onBlur();
    },
    [visibleOptions, field, closePopup],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        // Closed: open on Enter/Space/ArrowDown/ArrowUp
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const start = activeIndex < 0 ? -1 : activeIndex;
          const next = findNextEnabledIndex(visibleOptions, start, 1);
          if (next >= 0) setActiveIndex(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const start = activeIndex < 0 ? visibleOptions.length : activeIndex;
          const prev = findNextEnabledIndex(visibleOptions, start, -1);
          if (prev >= 0) setActiveIndex(prev);
          break;
        }
        case "Home": {
          e.preventDefault();
          const first = findFirstEnabledIndex(visibleOptions);
          if (first >= 0) setActiveIndex(first);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = findLastEnabledIndex(visibleOptions);
          if (last >= 0) setActiveIndex(last);
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0) commitOption(activeIndex);
          break;
        }
        case "Escape": {
          e.preventDefault();
          closePopup(true);
          break;
        }
        default: {
          // Type-ahead when search input is not the active typing surface
          if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            const ta = typeAheadRef.current;
            ta.buffer += e.key.toLowerCase();
            if (ta.timer) clearTimeout(ta.timer);
            ta.timer = setTimeout(() => {
              ta.buffer = "";
            }, 500);
            const idx = findByTypeAhead(visibleOptions, ta.buffer);
            if (idx >= 0) setActiveIndex(idx);
          }
          break;
        }
      }
    },
    [activeIndex, closePopup, commitOption, disabled, isOpen, searchable, visibleOptions],
  );

  // Close on outside click
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
        field.onBlur();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen, field]);

  const selectedLabel = resolveSelectedLabel(options, field.value);
  const activeId =
    activeIndex >= 0
      ? getOptionId(instanceId, visibleOptions[activeIndex]?.value ?? "")
      : undefined;

  return (
    <div ref={rootRef} className={className ?? "relative inline-block w-full"}>
      <label
        id={labelId}
        htmlFor={triggerId}
        className="block text-sm font-medium text-slate-700 mb-1"
      >
        {label}
      </label>
      <button
        type="button"
        id={triggerId}
        ref={(el) => {
          triggerRef.current = el;
          field.ref(el);
        }}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={labelId}
        aria-activedescendant={isOpen ? activeId : undefined}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        disabled={disabled}
        className={getTriggerClasses(disabled, isOpen)}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          // Don't blur if focus moves into the popup
          if (rootRef.current?.contains(e.relatedTarget as Node | null)) return;
          if (!isOpen) field.onBlur();
        }}
      >
        <span className={selectedLabel ? "" : "text-slate-400"}>
          {selectedLabel ?? placeholder ?? ""}
        </span>
        <span aria-hidden="true">▾</span>
      </button>

      {isOpen ? (
        <div className={getListboxClasses()}>
          {searchable ? (
            <input
              ref={searchRef}
              type="text"
              className={getSearchInputClasses()}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              // biome-ignore lint/a11y/noAutofocus: focus follows popup open per APG combobox pattern
              autoFocus
              aria-label="Search options"
            />
          ) : null}
          <ul id={listboxId} role="listbox" aria-labelledby={labelId} tabIndex={-1}>
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500" role="presentation">
                No options
              </li>
            ) : (
              visibleOptions.map((opt, idx) => {
                const isSelected = opt.value === field.value;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={opt.value}
                    id={getOptionId(instanceId, opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    className={getOptionClasses(isActive, isSelected, !!opt.disabled)}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep trigger focus
                      if (!opt.disabled) commitOption(idx);
                    }}
                    onMouseEnter={() => {
                      if (!opt.disabled) setActiveIndex(idx);
                    }}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      <div id={errorId}>{children}</div>
    </div>
  );
}
