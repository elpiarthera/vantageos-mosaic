"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  addValue,
  filterBySearch,
  getAvailableOptions,
  getSelectedOptions,
  isAtMaxItems,
  removeValue,
} from "../../../../components/forms/MultiSelect.logic.js";
import { MultiSelectPropsSchema } from "../../../../components/forms/MultiSelect.schema.js";
import type { MultiSelectOption } from "../../../../components/forms/MultiSelect.schema.js";
import { FormField } from "./FormField.js";

export interface MultiSelectProps {
  name: string;
  label: string;
  options: MultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxItems?: number;
  className?: string;
}

/**
 * Multi-value dropdown. Bound to RHF via `FormField` — value lives at
 * `form.values[name]` as `string[]`. Selected values render as removable
 * chips; the dropdown lists only unselected options. WCAG-AA combobox
 * pattern: `role=combobox aria-multiselectable=true`, chip removal via
 * Backspace / Delete / per-chip close icon, Tab + Arrow nav.
 */
export function MultiSelect(props: MultiSelectProps) {
  const parsed = MultiSelectPropsSchema.parse({
    name: props.name,
    label: props.label,
    options: props.options,
    placeholder: props.placeholder,
    disabled: props.disabled,
    searchable: props.searchable,
    maxItems: props.maxItems,
  });
  const { name, label, options, placeholder, disabled, searchable, maxItems } = parsed;

  const reactId = useId();
  const triggerId = `${reactId}-trigger`;
  const listboxId = `${reactId}-listbox`;
  const labelId = `${reactId}-label`;

  return (
    <FormField name={name}>
      {({ field }) => {
        // RHF field.value is `unknown` (erased generic). We tighten to string[].
        const value: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];
        return (
          <Inner
            triggerId={triggerId}
            listboxId={listboxId}
            labelId={labelId}
            label={label}
            options={options}
            value={value}
            disabled={disabled}
            searchable={searchable}
            maxItems={maxItems}
            placeholder={placeholder}
            onChange={(next) => field.onChange(next)}
            onBlur={() => field.onBlur()}
            className={props.className}
          />
        );
      }}
    </FormField>
  );
}

interface InnerProps {
  triggerId: string;
  listboxId: string;
  labelId: string;
  label: string;
  options: MultiSelectOption[];
  value: string[];
  disabled?: boolean;
  searchable?: boolean;
  maxItems?: number;
  placeholder?: string;
  className?: string;
  onChange: (next: string[]) => void;
  onBlur: () => void;
}

function Inner(p: InnerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedOptions = useMemo(
    () => getSelectedOptions(p.options, p.value),
    [p.options, p.value],
  );
  const availableAfterSelect = useMemo(
    () => getAvailableOptions(p.options, p.value),
    [p.options, p.value],
  );
  const visibleOptions = useMemo(
    () => (p.searchable ? filterBySearch(availableAfterSelect, query) : availableAfterSelect),
    [availableAfterSelect, p.searchable, query],
  );
  const atMax = isAtMaxItems(p.value, p.maxItems);

  const handleSelect = useCallback(
    (val: string) => {
      const next = addValue(p.value, val, p.maxItems);
      if (next !== p.value) {
        p.onChange(next);
      }
      setQuery("");
    },
    [p],
  );

  const handleRemove = useCallback(
    (val: string) => {
      p.onChange(removeValue(p.value, val));
    },
    [p],
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (p.disabled) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        const last = p.value[p.value.length - 1];
        if (last !== undefined) {
          e.preventDefault();
          handleRemove(last);
        }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [p.disabled, p.value, handleRemove],
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(visibleOptions.length - 1, 0)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = visibleOptions[activeIndex];
        if (opt) handleSelect(opt.value);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    },
    [visibleOptions, activeIndex, handleSelect],
  );

  return (
    <div className={p.className ?? "mosaic-multiselect"} onBlur={p.onBlur}>
      <span id={p.labelId} className="mosaic-multiselect-label">
        {p.label}
      </span>
      <div className="mosaic-multiselect-chips" data-testid="multiselect-chips">
        {selectedOptions.map((opt) => (
          <span key={opt.value} className="mosaic-multiselect-chip" data-chip-value={opt.value}>
            {opt.label}
            <button
              type="button"
              aria-label={`Remove ${opt.label}`}
              data-testid={`chip-remove-${opt.value}`}
              className="mosaic-multiselect-chip-remove"
              disabled={p.disabled}
              onClick={() => handleRemove(opt.value)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <button
        ref={triggerRef}
        id={p.triggerId}
        type="button"
        // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA combobox pattern requires role=combobox on the trigger element (button is the recommended host element per APG 1.2 — there is no semantic HTML equivalent for a multi-select combobox).
        role="combobox"
        aria-multiselectable={true}
        aria-expanded={open}
        aria-controls={p.listboxId}
        aria-labelledby={p.labelId}
        aria-disabled={p.disabled || atMax || undefined}
        disabled={p.disabled}
        data-testid="multiselect-trigger"
        className="mosaic-multiselect-trigger"
        onClick={() => !p.disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        {p.value.length === 0 ? (p.placeholder ?? "Select…") : `${p.value.length} selected`}
      </button>
      {open ? (
        <div className="mosaic-multiselect-panel">
          {p.searchable ? (
            <input
              type="text"
              aria-label="Search options"
              data-testid="multiselect-search"
              className="mosaic-multiselect-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
            />
          ) : null}
          <ul
            id={p.listboxId}
            // biome-ignore lint/a11y/useSemanticElements: APG combobox requires role=listbox on a ul container.
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: APG combobox listbox pattern.
            role="listbox"
            aria-multiselectable={true}
            aria-labelledby={p.labelId}
            tabIndex={-1}
            className="mosaic-multiselect-listbox"
            onKeyDown={handleListKeyDown}
          >
            {visibleOptions.length === 0 ? (
              <li className="mosaic-multiselect-empty">No options</li>
            ) : (
              visibleOptions.map((opt, i) => (
                // biome-ignore lint/a11y/useFocusableInteractive: focus stays on the listbox; APG combobox active-descendant pattern.
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled at listbox level per APG.
                <li
                  key={opt.value}
                  // biome-ignore lint/a11y/useSemanticElements: APG combobox-listbox pattern.
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: APG combobox-listbox pattern.
                  role="option"
                  aria-selected={false}
                  data-testid={`option-${opt.value}`}
                  data-active={i === activeIndex || undefined}
                  className="mosaic-multiselect-option"
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
