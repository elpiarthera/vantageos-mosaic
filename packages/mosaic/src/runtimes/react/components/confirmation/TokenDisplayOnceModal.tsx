/**
 * @vantageos/mosaic/react/confirmation — TokenDisplayOnceModal (React 19 runtime).
 *
 * Re-exports from the shared BARE implementation. The BARE component is
 * authored with React 19 hooks (useState, useEffect, useRef, useId) — no
 * source duplication required for the react runtime subpath.
 *
 * Security: token is held in React state only, never written to data-*
 * attributes, never passed to dangerouslySetInnerHTML, never logged.
 *
 * i18nKeys: TokenDisplayOnceModal.button.copy, TokenDisplayOnceModal.button.close,
 *            TokenDisplayOnceModal.warning.once, TokenDisplayOnceModal.copied
 *
 * Source of truth: src/components/confirmation/TokenDisplayOnceModal.tsx
 * Schema:          src/components/confirmation/TokenDisplayOnceModal.schema.ts
 */
export { TokenDisplayOnceModal } from "../../../../components/confirmation/TokenDisplayOnceModal.js";
export type { TokenDisplayOnceModalProps } from "../../../../components/confirmation/TokenDisplayOnceModal.schema.js";
export {
  TokenDisplayOnceModalPropsSchema,
  validateTokenDisplayOnceModalProps,
} from "../../../../components/confirmation/TokenDisplayOnceModal.schema.js";
