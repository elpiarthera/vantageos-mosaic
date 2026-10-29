/**
 * @vantageos/mosaic/preact/display — runtime subpath barrel.
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
export { Badge } from "./Badge.preact.js";
export type { BadgeProps } from "../../../../components/display/Badge.schema.js";
export {
  BadgePropsSchema,
  validateBadgeProps,
} from "../../../../components/display/Badge.schema.js";
/**
 * v0.3.0: TableView — static + streaming table with TanStack Virtual v3 windowing.
 * Accepts rows array (static) or RxJS Observable<Row[]> (streaming).
 * Zod-validated, bilingue FR+EN, aria-rowcount + role=alert on invalid props.
 * tsup preact pass aliases react → preact/compat — no source duplication required.
 */
export { StreamingTableView, TableView } from "./TableView.preact.js";
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

/**
 * MessageFeed — shared cross-runtime implementation (the tsup preact pass aliases react -> preact/compat).
 */
export { MessageFeed } from "../../../../components/display/MessageFeed.js";
export type {
  MessageFeedProps,
  MessageFeedPropsOutput,
  FeedMessage,
} from "../../../../components/display/MessageFeed.schema.js";
export {
  MessageFeedPropsSchema,
  validateMessageFeedProps,
} from "../../../../components/display/MessageFeed.schema.js";
export type { MessageFeedViewProps } from "../../../../components/display/MessageFeed.js";

/**
 * PipelineBoard — shared cross-runtime implementation (the tsup preact pass aliases react -> preact/compat).
 */
export { PipelineBoard } from "../../../../components/display/PipelineBoard.js";
export type {
  PipelineBoardProps,
  PipelineBoardPropsOutput,
  PipelineStage,
  PipelineDeal,
} from "../../../../components/display/PipelineBoard.schema.js";
export {
  PipelineBoardPropsSchema,
  validatePipelineBoardProps,
} from "../../../../components/display/PipelineBoard.schema.js";
export type { PipelineBoardViewProps } from "../../../../components/display/PipelineBoard.js";

// DetailView (G1) — description list with sections, labelled fields and nested tables
export { DetailView } from "../../../../components/display/DetailView.js";
export type {
  DetailViewProps,
  DetailViewPropsOutput,
} from "../../../../components/display/DetailView.schema.js";
export {
  DetailViewPropsSchema,
  validateDetailViewProps,
} from "../../../../components/display/DetailView.schema.js";
export { detailViewToMarkdown } from "../../../../components/display/DetailView.markdown.js";

// ConfigList / ConfigDetail — config-driven views (view-config/1) + the A-1 fallback
export { ConfigList } from "../../../../components/display/ConfigList.js";
export type { ConfigListProps } from "../../../../components/display/ConfigList.js";
export { ConfigListPropsSchema } from "../../../../components/display/ConfigList.schema.js";
export { ConfigDetail } from "../../../../components/display/ConfigDetail.js";
export type { ConfigDetailProps } from "../../../../components/display/ConfigDetail.js";
export { ConfigDetailPropsSchema } from "../../../../components/display/ConfigDetail.schema.js";
export { configToMarkdown } from "../../../../components/display/ConfigView.markdown.js";
export {
  ViewConfigError,
  ViewConfigSchema,
  assertViewConfig,
  parseViewConfig,
} from "../../../../view-config/view-config.js";
export type {
  ConfigToolResult,
  ConfigViewBridge,
  DetailViewConfig,
  ListViewConfig,
  ViewConfig,
} from "../../../../view-config/view-config.js";
export {
  COLUMN_FORMAT_TYPES,
  ColumnFormatSchema,
  formatValue,
} from "../../../../components/shared/format.js";
export type { ColumnFormat } from "../../../../components/shared/format.js";
