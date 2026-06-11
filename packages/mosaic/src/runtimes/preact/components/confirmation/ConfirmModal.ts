/**
 * @vantageos/mosaic/preact/confirmation — `ConfirmModal` alias.
 *
 * Mirror of the react runtime alias for preact consumers. Re-exports
 * the same shared `ConfirmDialog` implementation; the tsup preact pass
 * rewrites `react` / `react-dom` → `preact/compat` at build time so a
 * single source module ships verbatim across both runtimes (per
 * spec §1.4 + §18.1). Referential identity holds across runtimes.
 *
 * Source of truth: src/components/input/ConfirmDialog.tsx
 * Schema:          src/components/input/ConfirmDialog.schema.ts
 */
export { ConfirmDialog as ConfirmModal } from "../../../../components/input/ConfirmDialog";
export type { ConfirmDialogProps as ConfirmModalProps } from "../../../../components/input/ConfirmDialog.schema";
