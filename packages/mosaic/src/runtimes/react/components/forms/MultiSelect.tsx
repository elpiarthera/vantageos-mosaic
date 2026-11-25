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
  /** `chips`: every option is a visible toggle button (aria-pressed), no dropdown. */
  appearance?: "default" | "chips";
  className?: string;
}

/**
 * Multi-value dropdown. Bound to RHF via `FormField` — value lives at
 * `form.values[name]` as `string[]`. Selected values render as removable
 * chips; the dropdown lists only unselected options. WCAG-AA combobox
 * pattern (APG select-only combobox): focus stays on the `role=combobox`
 * trigger, which drives the open `role=listbox aria-multiselectable=true`
 * through `aria-activedescendant` (Arrow keys move, Enter selects, Escape
 * closes); chip removal via Backspace / Delete / per-chip close icon.
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
    appearance: props.appearance,
  });
  const { name, label, options, placeholder, disabled, searchable, maxItems, appearance } = parsed;

  const reactId = useId();
  const triggerId = `${reactId}-trigger`;
  const listboxId = `${reactId}-listbox`;
  const labelId = `${reactId}-label`;

  return (
    <FormField name={name}>
      {({ field }) => {
        // RHF field.value is `unknown` (erased generic). We tighten to string[].
        const value: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];
        if (appearance === "chips") {
          return (
            <ChipToggles
              labelId={labelId}
              label={label}
              options={options}
              value={value}
              disabled={disabled}
              maxItems={maxItems}
              onChange={(next) => field.onChange(next)}
              onBlur={() => field.onBlur()}
              className={props.className}
            />
          );
        }
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

interface ChipTogglesProps {
  labelId: string;
  label: string;
  options: MultiSelectOption[];
  value: string[];
  disabled?: boolean;
  maxItems?: number;
  className?: string;
  onChange: (next: string[]) => void;
  onBlur: () => void;
}

/** `appearance="chips"`: all options visible as toggle buttons (no menu to clip in the iframe). */
function ChipToggles(p: ChipTogglesProps) {
  const atMax = isAtMaxItems(p.value, p.maxItems);
  return (
    <fieldset
      aria-labelledby={p.labelId}
      data-appearance="chips"
      className={`m-0 min-w-0 border-0 p-0 ${p.className ?? "mosaic-multiselect mosaic-multiselect--chips"}`}
      onBlur={p.onBlur}
    >
      <span id={p.labelId} className="mosaic-multiselect-label">
        {p.label}
      </span>
      <div className="flex flex-row flex-wrap gap-2">
        {p.options.map((opt) => {
          const on = p.value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              disabled={p.disabled || (!on && atMax)}
              data-chip-value={opt.value}
              className={`mosaic-multiselect-chip inline-flex items-center rounded-full border px-3 py-1 text-sm ${
                on
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() =>
                p.onChange(
                  on ? removeValue(p.value, opt.value) : addValue(p.value, opt.value, p.maxItems),
                )
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
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
  // The option list shrinks after every selection (and on each search keystroke), so the
  // stored index can point past its end. Every read goes through the clamped value: it
  // always names an existing option, or nothing when the list is empty.
  const currentIndex = Math.min(activeIndex, visibleOptions.length - 1);
  const optionId = (i: number) => `${p.listboxId}-option-${i}`;
  const activeDescendant = open && currentIndex >= 0 ? optionId(currentIndex) : undefined;

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

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(Math.min(currentIndex + 1, Math.max(visibleOptions.length - 1, 0)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(Math.max(currentIndex - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = visibleOptions[currentIndex];
        if (opt) handleSelect(opt.value);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    },
    [visibleOptions, currentIndex, handleSelect],
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
      // Open: the trigger keeps focus and drives the listbox (aria-activedescendant).
      if (
        open &&
        (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")
      ) {
        handleListKeyDown(e);
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
    [p.disabled, p.value, handleRemove, open, handleListKeyDown],
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
        aria-expanded={open}
        aria-controls={p.listboxId}
        aria-activedescendant={activeDescendant}
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
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: APG combobox listbox pattern. // react-doctor-disable-next-line react-doctor/no-noninteractive-element-to-interactive-role -- APG combobox popup: the explicit listbox role replaces the list semantics of <ul>; no native element is a multi-select listbox popup
            role="listbox"
            // react-doctor-disable-next-line react-doctor/role-supports-aria-props -- ARIA 1.2 lists aria-multiselectable as a supported property of role=listbox; the rule's table omits it
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
                // biome-ignore lint/a11y/useFocusableInteractive: focus stays on the combobox; APG combobox active-descendant pattern.
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled on the combobox per APG. // react-doctor-disable-next-line react-doctor/click-events-have-key-events -- options are never focused: Arrow/Enter on the focused combobox select the aria-activedescendant option (APG combobox)
                <li
                  key={opt.value}
                  id={optionId(i)}
                  // biome-ignore lint/a11y/useSemanticElements: APG combobox-listbox pattern.
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: APG combobox-listbox pattern. // react-doctor-disable-next-line react-doctor/no-noninteractive-element-to-interactive-role -- APG combobox popup: each <li> of the listbox is an option; the role replaces listitem semantics
                  role="option"
                  aria-selected={false}
                  data-testid={`option-${opt.value}`}
                  data-active={i === currentIndex || undefined}
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
