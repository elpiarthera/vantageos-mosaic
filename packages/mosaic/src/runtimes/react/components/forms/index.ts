/**
 * @vantageos/mosaic/react/forms — runtime subpath barrel.
 *
 * Wave 2 Phase 2 — composite form primitives wrapping `react-hook-form` +
 * `@hookform/resolvers/zod`. v0.3.0-alpha.1 ships the 5 scaffolding pieces:
 * `useMosaicForm`, `FormProvider`, `FormField`, `ErrorDisplay`, `SubmitButton`.
 *
 * Field primitives (Input, Textarea, Select, Checkbox, MultiSelect, RadioGroup,
 * FieldArray) land in T11-T20 per `docs/v0.3.0-plan.md` §7.
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
export {
  FieldArray,
  useFieldArray,
  type FieldArrayProps,
  type FieldArrayRenderItemArgs,
  type FieldArrayControls,
  type UseFieldArrayOptions,
  type UseFieldArrayReturn,
} from "./FieldArray.js";

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
  FieldArrayPropsSchema,
  UseFieldArrayOptionsSchema,
} from "../../../../components/forms/FieldArray.schema.js";
export {
  buildListAriaLabel,
  buildRemoveAriaLabel,
  buildAddAriaLabel,
  nextFocusIndexAfterRemove,
} from "../../../../components/forms/FieldArray.logic.js";
