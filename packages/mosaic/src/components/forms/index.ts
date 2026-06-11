/**
 * @vantageos/mosaic/forms — root subpath barrel.
 *
 * Mirrors the React runtime surface for back-compat with the v0.1.x style
 * `@vantageos/mosaic/<cat>` import path. The runtime-explicit
 * `@vantageos/mosaic/react/forms` and `@vantageos/mosaic/preact/forms`
 * subpaths are the recommended surface from v0.3.0 onwards.
 */
export {
  useMosaicForm,
  type UseMosaicFormReturn,
} from "../../runtimes/react/components/forms/useMosaicForm.js";
export {
  FormProvider,
  useMosaicFormContext,
} from "../../runtimes/react/components/forms/FormProvider.js";
export { FormField } from "../../runtimes/react/components/forms/FormField.js";
export { ErrorDisplay } from "../../runtimes/react/components/forms/ErrorDisplay.js";
export { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
export { Checkbox } from "../../runtimes/react/components/forms/Checkbox.js";
export { RadioGroup } from "../../runtimes/react/components/forms/RadioGroup.js";

// Shared schemas + pure logic (runtime-agnostic, safe to re-export)
export {
  UseMosaicFormOptionsSchema,
  MosaicFormModeSchema,
  validateOptions,
  type MosaicFormMode,
  type UseMosaicFormOptions,
} from "./useMosaicForm.schema.js";
export { toRhfMode } from "./useMosaicForm.logic.js";
export { FormProviderPropsSchema } from "./FormProvider.schema.js";
export { FORM_PROVIDER_CONTEXT_MISSING } from "./FormProvider.logic.js";
export { FormFieldPropsSchema } from "./FormField.schema.js";
export { buildFieldId } from "./FormField.logic.js";
export {
  ErrorDisplayPropsSchema,
  FieldErrorShapeSchema,
  type FieldErrorShape,
} from "./ErrorDisplay.schema.js";
export { formatErrorMessage } from "./ErrorDisplay.logic.js";
export {
  SubmitButtonPropsSchema,
  validateSubmitButtonProps,
} from "./SubmitButton.schema.js";
export { computeSubmitButtonState } from "./SubmitButton.logic.js";
export {
  CheckboxPropsSchema,
  validateCheckboxProps,
} from "./Checkbox.schema.js";
export {
  computeAriaChecked,
  buildDescriptionId,
} from "./Checkbox.logic.js";
export {
  RadioGroupPropsSchema,
  RadioGroupOptionSchema,
  validateRadioGroupProps,
  type RadioGroupOption,
  type RadioGroupPropsValidated,
} from "./RadioGroup.schema.js";
export {
  getNavKeys,
  findNextEnabledIndex,
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findSelectedIndex,
  getRovingTabIndex,
  getGroupLabelId,
  getOptionLabelId,
  getOptionDescriptionId,
  getGroupClasses,
  getOptionRowClasses,
  getRadioControlClasses,
  isActivationKey,
  type RadioOrientation,
} from "./RadioGroup.logic.js";
