/**
 * @vantageos/mosaic/preact/forms — runtime subpath barrel.
 *
 * Mirror of the React runtime barrel. JSX files are aliased to
 * `preact/compat` at tsup build time (see `tsup.config.ts` preactPass).
 * Shared schema + logic re-exports are identical (runtime-agnostic).
 */
export {
  useMosaicForm,
  type UseMosaicFormOptions,
  type UseMosaicFormReturn,
} from "./useMosaicForm.js";
export {
  FormProvider,
  useMosaicFormContext,
  type FormProviderProps,
} from "./FormProvider.js";
export {
  FormField,
  type FormFieldProps,
  type FormFieldRenderArgs,
} from "./FormField.js";
export { ErrorDisplay, type ErrorDisplayProps } from "./ErrorDisplay.js";
export { SubmitButton, type SubmitButtonProps } from "./SubmitButton.js";
export { Input, type InputProps } from "./Input.js";
export { Textarea, type TextareaProps } from "./Textarea.js";
export {
  FieldArray,
  useFieldArray,
  type FieldArrayProps,
  type FieldArrayRenderItemArgs,
  type FieldArrayControls,
  type UseFieldArrayOptions,
} from "./FieldArray.js";
export { Checkbox, type CheckboxProps } from "./Checkbox.js";
export { MultiSelect, type MultiSelectProps } from "./MultiSelect.js";
export { RadioGroup, type RadioGroupProps } from "./RadioGroup.js";

export { Select, type SelectProps } from "./Select.js";



// Shared schemas + logic re-export for type access
export {
  UseMosaicFormOptionsSchema,
  MosaicFormModeSchema,
  type MosaicFormMode,
} from "../../../../components/forms/useMosaicForm.schema.js";
export {
  ErrorDisplayPropsSchema,
  FieldErrorShapeSchema,
  type FieldErrorShape,
} from "../../../../components/forms/ErrorDisplay.schema.js";
export { SubmitButtonPropsSchema } from "../../../../components/forms/SubmitButton.schema.js";
export { FormFieldPropsSchema } from "../../../../components/forms/FormField.schema.js";
export { FormProviderPropsSchema } from "../../../../components/forms/FormProvider.schema.js";
export {
  InputPropsSchema,
  InputTypeSchema,
  type InputType,
} from "../../../../components/forms/Input.schema.js";
export {
  TextareaPropsSchema,
  validateTextareaProps,
  type TextareaPropsValidated,
} from "../../../../components/forms/Textarea.schema.js";
export {
  DEFAULT_TEXTAREA_ROWS,
  clampToMaxLength,
  computeAutoResizeHeight,
  resolveRows,
} from "../../../../components/forms/Textarea.logic.js";
export {
  FieldArrayPropsSchema,
  UseFieldArrayOptionsSchema,
} from "../../../../components/forms/FieldArray.schema.js";
export {
  buildListAriaLabel,
  buildRemoveAriaLabel,
  buildAddAriaLabel,
  nextFocusIndexAfterRemove,
} from "../../../../components/forms/FieldArray.logic.js";
export {
  CheckboxPropsSchema,
  validateCheckboxProps,
  type CheckboxPropsValidated,
} from "../../../../components/forms/Checkbox.schema.js";
export {
  resolveAriaChecked,
  resolveDescribedBy,
} from "../../../../components/forms/Checkbox.logic.js";
export {
  MultiSelectPropsSchema,
  MultiSelectOptionSchema,
  type MultiSelectOption,
} from "../../../../components/forms/MultiSelect.schema.js";
export {
  RadioGroupPropsSchema,
  RadioGroupOptionSchema,
  validateRadioGroupProps,
  type RadioGroupOption,
  type RadioGroupPropsValidated,
} from "../../../../components/forms/RadioGroup.schema.js";
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
} from "../../../../components/forms/RadioGroup.logic.js";
export {
  SelectPropsSchema,
  SelectOptionSchema,
  validateSelectProps,
  type SelectOption,
  type SelectPropsValidated,
} from "../../../../components/forms/Select.schema.js";


