/**
 * @vantageos/mosaic/preact/confirmation — `ConfirmDialog` subpath export.
 *
 * Mirror of the react runtime re-export for preact consumers. The tsup
 * preact pass rewrites `react` / `react-dom` → `preact/compat` at build
 * time so the shared ConfirmDialog implementation compiles to Preact
 * hooks/JSX automatically (per spec §1.4 + §18.1). No source duplication.
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
