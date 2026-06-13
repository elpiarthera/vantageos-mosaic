/**
 * @vantageos/mosaic/preact/progress — ProgressBar (Preact 10 runtime).
 *
 * Re-exports from the shared React implementation. The tsup preact pass aliases
 * react → preact/compat and react-dom → preact/compat at build time per §18.1,
 * so the shared ProgressBar.tsx compiles to Preact hooks/JSX automatically.
 * No source duplication required.
 *
 * Import: `import { ProgressBar } from "@vantageos/mosaic/preact/progress"`
 */
export { ProgressBar } from "../../../../runtimes/react/components/progress/ProgressBar.js";
