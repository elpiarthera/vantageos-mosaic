/**
 * @vantageos/mosaic/react/display — runtime subpath barrel.
 */
export { EmptyState } from "./EmptyState.js";
export type { EmptyStateProps } from "../../../../components/display/EmptyState.schema.js";
export {
  EmptyStatePropsSchema,
  validateEmptyStateProps,
} from "../../../../components/display/EmptyState.schema.js";
export { Skeleton } from "./Skeleton.js";
export type { SkeletonProps } from "../../../../components/display/Skeleton.schema.js";
export {
  SkeletonPropsSchema,
  validateSkeletonProps,
  resolveSkeletonDimensions,
} from "../../../../components/display/Skeleton.schema.js";
/**
 * v0.3.0-alpha.0: VirtualList (virtualized list, cross-runtime, display category)
 */
export { VirtualList } from "./VirtualList.js";
export type { VirtualListProps } from "../../../../components/display/VirtualList.schema.js";
export {
  VirtualListPropsSchema,
  validateVirtualListProps,
} from "../../../../components/display/VirtualList.schema.js";
/**
 * v0.3.0: StatusBadge (status indicator badge, cross-runtime, display category)
 */
export { StatusBadge } from "./StatusBadge.js";
export type { StatusBadgeProps } from "../../../../components/media/StatusBadge.schema.js";
export {
  StatusBadgePropsSchema,
  validateProps as validateStatusBadgeProps,
} from "../../../../components/media/StatusBadge.schema.js";
/**
 * v0.3.2: Badge (generic visual label primitive, cross-runtime, display category)
 */
export { Badge } from "./Badge.js";
export type { BadgeProps } from "../../../../components/display/Badge.schema.js";
export {
  BadgePropsSchema,
  validateBadgeProps,
} from "../../../../components/display/Badge.schema.js";
/**
 * v0.3.0: TableView — static + streaming table with TanStack Virtual v3 windowing.
 * Accepts rows array (static) or RxJS Observable<Row[]> (streaming).
 * Zod-validated, bilingue FR+EN, aria-rowcount + role=alert on invalid props.
 */
export { StreamingTableView, TableView } from "./TableView.js";
export type {
  ColumnDef,
  StreamingTableViewProps,
  TableViewOptions,
  TableViewProps,
} from "../../../../components/display/TableView.schema.js";
export type {
  ColumnKind,
  SelectionMode,
  SortDirection,
  SortState,
} from "../../../../components/display/TableView.logic.js";
export {
  compareDecimalStrings,
  nextSort,
  sortItems,
} from "../../../../components/display/TableView.logic.js";
export {
  TableViewPropsSchema,
  validateTableViewProps,
} from "../../../../components/display/TableView.schema.js";

/**
 * StatCard — shared cross-runtime implementation (the tsup preact pass aliases react -> preact/compat).
 */
export { StatCard } from "../../../../components/display/StatCard.js";
export type {
  StatCardProps,
  StatCardPropsOutput,
} from "../../../../components/display/StatCard.schema.js";
export {
  StatCardPropsSchema,
  validateStatCardProps,
} from "../../../../components/display/StatCard.schema.js";

/**
 * BalanceCard — shared cross-runtime implementation (the tsup preact pass aliases react -> preact/compat).
 */
export { BalanceCard } from "../../../../components/display/BalanceCard.js";
export type {
  BalanceCardProps,
  BalanceCardPropsOutput,
} from "../../../../components/display/BalanceCard.schema.js";
export {
  BalanceCardPropsSchema,
  validateBalanceCardProps,
} from "../../../../components/display/BalanceCard.schema.js";
