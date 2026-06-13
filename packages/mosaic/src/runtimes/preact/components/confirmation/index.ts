/**
 * @vantageos/mosaic/preact/confirmation — runtime subpath barrel.
 *
 * Wave 1 T8: Alert — persistent inline banner (vs Toast ephemeral).
 */
export { Alert } from "./Alert.js";
export type { AlertProps } from "../../../../components/confirmation/Alert.schema.js";
export {
  AlertPropsSchema,
  validateAlertProps,
} from "../../../../components/confirmation/Alert.schema.js";
/**
 * v0.3.0-alpha.0 T9 — preact mirror of the react alias. Exposes
 * `ConfirmModal` as a re-export of the shared `ConfirmDialog`
 * implementation. Referential identity invariant is asserted by
 * __tests__/ConfirmModal.preact.test.tsx.
 */
export { ConfirmModal } from "./ConfirmModal";
export type { ConfirmModalProps } from "./ConfirmModal";
/**
 * v0.3.0 T5 — promotes `ConfirmDialog` to the `preact/confirmation` subpath
 * so consumers can import the canonical name directly. The tsup preact pass
 * aliases react → preact/compat at build time, so the shared source ships
 * verbatim. Referential identity with `ConfirmModal` preserved.
 * Athena audit blocker resolved — dist/preact/confirmation.d.ts now contains
 * both `ConfirmDialog` and `ConfirmModal`.
 */
export {
  ConfirmDialog,
  ConfirmDialogPropsSchema,
  validateConfirmDialogProps,
} from "./ConfirmDialog";
export type { ConfirmDialogProps } from "./ConfirmDialog";
/**
 * v0.3.0 Wave 1 T5 — TokenDisplayOnceModal: Preact 10 mirror of the React
 * runtime implementation. The tsup preact pass aliases react → preact/compat
 * at build time (§18.1), so the shared React source compiles to Preact
 * hooks/JSX automatically. No source duplication required.
 *
 * i18nKeys: TokenDisplayOnceModal.button.copy, .button.close,
 *            .warning.once, .copied  (EN + FR)
 */
export {
  TokenDisplayOnceModal,
  TokenDisplayOnceModalPropsSchema,
  validateTokenDisplayOnceModalProps,
} from "./TokenDisplayOnceModal.js";
export type { TokenDisplayOnceModalProps } from "../../../../components/confirmation/TokenDisplayOnceModal.schema.js";
