/**
 * @vantageos/mosaic/preact/input — Tabs (Preact 10 runtime).
 *
 * Re-exports from the shared React implementation. The tsup preact pass aliases
 * react → preact/compat and react-dom → preact/compat at build time per §18.1,
 * so the shared Tabs.tsx compiles to Preact hooks/JSX automatically.
 * No source duplication required.
 */
export { Tabs } from "../../../../runtimes/react/components/input/Tabs.js";
