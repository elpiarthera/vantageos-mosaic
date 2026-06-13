/**
 * @vantageos/mosaic/react/confirmation — `ConfirmDialog` subpath export.
 *
 * Thin re-export of the shared `ConfirmDialog` implementation so consumers
 * can import `ConfirmDialog` directly from the `react/confirmation` subpath
 * rather than the legacy `input` category barrel.
 *
 * Source of truth: src/components/input/ConfirmDialog.tsx
 * Schema:          src/components/input/ConfirmDialog.schema.ts
 * i18nKeys:        ConfirmDialog.button.confirm, ConfirmDialog.button.cancel,
 *                  ConfirmDialog.aria.dialog
 */
export { ConfirmDialog } from "../../../../components/input/ConfirmDialog";
export type { ConfirmDialogProps } from "../../../../components/input/ConfirmDialog.schema";
export {
  ConfirmDialogPropsSchema,
  validateConfirmDialogProps,
} from "../../../../components/input/ConfirmDialog.schema";
