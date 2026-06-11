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
export { Checkbox, type CheckboxProps } from "./Checkbox.js";

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
  CheckboxPropsSchema,
  validateCheckboxProps,
  type CheckboxPropsValidated,
} from "../../../../components/forms/Checkbox.schema.js";
export {
  resolveAriaChecked,
  resolveDescribedBy,
} from "../../../../components/forms/Checkbox.logic.js";
