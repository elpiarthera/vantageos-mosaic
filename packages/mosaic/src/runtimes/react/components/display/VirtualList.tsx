/**
 * @vantageos/mosaic/react/display — VirtualList re-export (React 19 runtime).
 *
 * Re-exports from shared display implementation. The shared VirtualList.tsx
 * is cross-runtime: tsup react pass compiles it with react imports intact;
 * tsup preact pass aliases react → preact/compat per §18.1.
 */
export { VirtualList } from "../../../../components/display/VirtualList.js";
export type { VirtualListProps } from "../../../../components/display/VirtualList.schema.js";
