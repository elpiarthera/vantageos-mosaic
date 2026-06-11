"use client";

import { computeSubmitButtonState } from "../../../../components/forms/SubmitButton.logic.js";
import { validateSubmitButtonProps } from "../../../../components/forms/SubmitButton.schema.js";
import { useMosaicFormContext } from "./FormProvider.js";

export interface SubmitButtonProps {
  label?: string;
  loadingLabel?: string;
  className?: string;
}

/**
 * Form submit button bound to the surrounding `<FormProvider>` form state.
 * Disabled while `formState.isValid` is false OR `formState.isSubmitting`
 * is true. While submitting, the loading label replaces the default label.
 */
export function SubmitButton(props: SubmitButtonProps) {
  const { label, loadingLabel } = validateSubmitButtonProps({
    label: props.label,
    loadingLabel: props.loadingLabel,
  });
  const form = useMosaicFormContext();
  const { isValid, isSubmitting } = form.formState;
  const { disabled, loading } = computeSubmitButtonState({ isValid, isSubmitting });

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={loading || undefined}
      className={props.className ?? "mosaic-forms-submit"}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
