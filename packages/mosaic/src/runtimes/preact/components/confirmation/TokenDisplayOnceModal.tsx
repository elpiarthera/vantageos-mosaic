/**
 * @vantageos/mosaic/preact/confirmation — TokenDisplayOnceModal (Preact 10 runtime).
 *
 * Re-exports from the React runtime implementation. The tsup preact pass aliases
 * react → preact/compat and react-dom → preact/compat at build time per §18.1,
 * so the shared TokenDisplayOnceModal.tsx compiles to Preact hooks/JSX
 * automatically. No source duplication required.
 *
 * i18nKeys: TokenDisplayOnceModal.button.copy, TokenDisplayOnceModal.button.close,
 *            TokenDisplayOnceModal.warning.once, TokenDisplayOnceModal.copied
 *
 * Source of truth: src/components/confirmation/TokenDisplayOnceModal.tsx
 * Schema:          src/components/confirmation/TokenDisplayOnceModal.schema.ts
 */
export {
  TokenDisplayOnceModal,
  TokenDisplayOnceModalPropsSchema,
  validateTokenDisplayOnceModalProps,
} from "../../../../runtimes/react/components/confirmation/TokenDisplayOnceModal.js";
export type { TokenDisplayOnceModalProps } from "../../../../components/confirmation/TokenDisplayOnceModal.schema.js";
