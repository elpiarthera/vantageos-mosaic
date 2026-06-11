/**
 * @vantageos/mosaic/preact/display — VirtualList re-export (Preact 10 runtime).
 *
 * Re-exports from shared display implementation. The tsup preact pass aliases
 * react → preact/compat and react-dom → preact/compat at build time per §18.1,
 * so the shared VirtualList.tsx compiles to Preact hooks/JSX automatically.
 * No source duplication required.
 */
export { VirtualList } from "../../../../components/display/VirtualList.js";
export type { VirtualListProps } from "../../../../components/display/VirtualList.schema.js";
