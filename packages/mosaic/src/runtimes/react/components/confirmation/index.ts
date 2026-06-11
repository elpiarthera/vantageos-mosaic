/**
 * @vantageos/mosaic/react/confirmation — runtime subpath barrel.
 *
 * Wave 1 T8: Alert — persistent inline banner (vs Toast ephemeral).
 */
export { Alert } from "./Alert.js";
export type { AlertProps } from "../../../../components/confirmation/Alert.schema.js";
export {
  AlertPropsSchema,
  validateAlertProps,
} from "../../../../components/confirmation/Alert.schema.js";
 * v0.3.0-alpha.0 T9 — exposes `ConfirmModal` as an alias of the shared
 * `ConfirmDialog` (categorised under `input` in the source tree) so the
 * Chi gptpowerups-extension naming bridge can resolve a `ConfirmModal`
 * import from this barrel. Referential identity contract enforced by
 * __tests__/ConfirmModal.test.tsx.
 */
export { ConfirmModal } from "./ConfirmModal";
export type { ConfirmModalProps } from "./ConfirmModal";
