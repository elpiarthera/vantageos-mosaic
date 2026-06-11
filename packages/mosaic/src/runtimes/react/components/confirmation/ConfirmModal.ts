/**
 * @vantageos/mosaic/react/confirmation — `ConfirmModal` alias.
 *
 * Thin re-export of the shared `ConfirmDialog` implementation under the
 * `ConfirmModal` name. Exists to honor the consumer-facing naming
 * contract of Chi's gptpowerups-extension (Day 89 lift-and-shift list)
 * without duplicating implementation, tests, schema, or i18n.
 *
 * Referential identity is a hard invariant — see ConfirmModal.test.tsx.
 *
 * Source of truth: src/components/input/ConfirmDialog.tsx
 * Schema:          src/components/input/ConfirmDialog.schema.ts
 */
export { ConfirmDialog as ConfirmModal } from "../../../../components/input/ConfirmDialog";
export type { ConfirmDialogProps as ConfirmModalProps } from "../../../../components/input/ConfirmDialog.schema";
