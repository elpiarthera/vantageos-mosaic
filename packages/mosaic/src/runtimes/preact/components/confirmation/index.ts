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
 * v0.3.0-alpha.0 T9 — preact mirror of the react alias. Exposes
 * `ConfirmModal` as a re-export of the shared `ConfirmDialog`
 * implementation. Referential identity invariant is asserted by
 * __tests__/ConfirmModal.preact.test.tsx.
 */
export { ConfirmModal } from "./ConfirmModal";
export type { ConfirmModalProps } from "./ConfirmModal";
