"use client";

import { useCallback, useId, useRef } from "react";
import {
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  getGroupClasses,
  getGroupLabelId,
  getNavKeys,
  getOptionDescriptionId,
  getOptionLabelId,
  getOptionRowClasses,
  getRovingTabIndex,
  isActivationKey,
} from "../../../../components/forms/RadioGroup.logic.js";
import { validateRadioGroupProps } from "../../../../components/forms/RadioGroup.schema.js";
import { FormField } from "./FormField.js";

export interface RadioGroupProps {
  name: string;
  label: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  className?: string;
}

/**
 * RadioGroup — mutually exclusive single-choice primitive, WCAG-AA compliant.
 *
 * Uses native `<input type="radio">` elements for browser-native semantics
 * while implementing roving tabIndex + Arrow key selection sync per the
 * WAI-ARIA radiogroup pattern (§3.10).
 *
 * ARIA contract:
 *   - `role="radiogroup"` + `aria-labelledby` on the container (fieldset equivalent)
 *   - Native `<input type="radio">` per option — browser provides role + aria-checked
 *   - `aria-labelledby` per input → its `<label>` span id
 *   - `aria-describedby` per input → its description span id (when present)
 *   - Roving tabIndex — selected radio has tabIndex 0, all others -1
 *   - Arrow keys move focus AND selection (WAI-ARIA §3.10)
 *   - Home/End jump to first/last enabled option
 *   - Space/Enter activate the focused radio
 *   - Disabled radios are skipped during arrow navigation
 */
export function RadioGroup(props: RadioGroupProps) {
  const validated = validateRadioGroupProps({
    name: props.name,
    label: props.label,
    options: props.options,
    orientation: props.orientation,
    disabled: props.disabled,
  });

  const { name, label, options, orientation, disabled } = validated;

  const instanceId = useId();
  const groupLabelId = getGroupLabelId(instanceId, name);
  const { prev: prevKey, next: nextKey } = getNavKeys(orientation);

  const radioRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusAndSelect = useCallback(
    (index: number, onChange: (value: string) => void) => {
      const el = radioRefs.current[index];
      if (el) el.focus();
      const opt = options[index];
      if (opt && !opt.disabled) {
        onChange(opt.value);
      }
    },
    [options],
  );

  return (
    <FormField name={name}>
      {({ field, fieldState }) => {
        const selectedValue = field.value as string | undefined;
        const rovingIdx = getRovingTabIndex(options, selectedValue);

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
          const { key } = e;

          if (key === prevKey || key === nextKey) {
            e.preventDefault();
            const direction = key === nextKey ? 1 : -1;
            const nextIdx = findNextEnabledIndex(options, currentIndex, direction);
            focusAndSelect(nextIdx, field.onChange);
            return;
          }

          if (key === "Home") {
            e.preventDefault();
            focusAndSelect(findFirstEnabledIndex(options), field.onChange);
            return;
          }

          if (key === "End") {
            e.preventDefault();
            focusAndSelect(findLastEnabledIndex(options), field.onChange);
            return;
          }

          if (isActivationKey(key)) {
            e.preventDefault();
            const opt = options[currentIndex];
            if (opt && !opt.disabled) {
              field.onChange(opt.value);
            }
          }
        };

        return (
          <div className={props.className ?? "mosaic-forms-radiogroup"}>
            <span id={groupLabelId} className="mosaic-forms-radiogroup-label">
              {label}
            </span>
            <div
              role="radiogroup"
              aria-labelledby={groupLabelId}
              aria-orientation={orientation}
              aria-disabled={disabled || undefined}
              className={getGroupClasses(orientation)}
            >
              {options.map((option, index) => {
                const isSelected = selectedValue === option.value;
                const isDisabled = !!(disabled || option.disabled);
                const optLabelId = getOptionLabelId(instanceId, name, option.value);
                const optDescId = option.description
                  ? getOptionDescriptionId(instanceId, name, option.value)
                  : undefined;
                const tabIdx = index === rovingIdx ? 0 : -1;

                return (
                  <div key={option.value} className={getOptionRowClasses(isDisabled, orientation)}>
                    <input
                      ref={(el) => {
                        radioRefs.current[index] = el;
                      }}
                      type="radio"
                      id={`${instanceId}-${name}-${option.value}`}
                      name={field.name}
                      value={option.value}
                      checked={isSelected}
                      disabled={isDisabled}
                      aria-labelledby={optLabelId}
                      aria-describedby={optDescId}
                      tabIndex={isDisabled ? -1 : tabIdx}
                      className="mosaic-forms-radiogroup-input sr-only"
                      onChange={() => {
                        field.onChange(option.value);
                      }}
                      onKeyDown={(e) => {
                        if (!isDisabled) handleKeyDown(e, index);
                      }}
                      onBlur={field.onBlur}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span id={optLabelId} className="mosaic-forms-radiogroup-option-label">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span
                          id={optDescId}
                          className="mosaic-forms-radiogroup-option-description text-sm text-slate-500"
                        >
                          {option.description}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {fieldState.error ? (
              <span role="alert" className="mosaic-forms-radiogroup-error text-sm text-red-600">
                {fieldState.error.message}
              </span>
            ) : null}
          </div>
        );
      }}
    </FormField>
  );
}
