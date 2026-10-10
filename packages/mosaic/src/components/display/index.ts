// @vantageos/mosaic — display category barrel
export { TableView, StreamingTableView } from "./TableView";
export type {
  ColumnDef,
  TableViewOptions,
  TableViewProps,
  StreamingTableViewProps,
  TableViewPropsSchemaInput,
  TableViewPropsSchemaOutput,
} from "./TableView.schema";
export { TableViewPropsSchema, validateTableViewProps } from "./TableView.schema";

// EmptyState
export type {
  EmptyStateProps,
  EmptyStatePropsSchemaInput,
  EmptyStatePropsSchemaOutput,
} from "./EmptyState.schema.js";
export { EmptyStatePropsSchema, validateEmptyStateProps } from "./EmptyState.schema.js";
// Skeleton
export { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
export type { SkeletonProps } from "./Skeleton.schema.js";
export {
  SkeletonPropsSchema,
  validateSkeletonProps,
  resolveSkeletonDimensions,
} from "./Skeleton.schema.js";

export type { SortDirection, SortState, ColumnKind, SelectionMode } from "./TableView.logic";
export {
  compareDecimalStrings,
  sortItems,
  nextSort,
} from "./TableView.logic";

// StatCard
export { StatCard } from "./StatCard.js";
export type { StatCardProps, StatCardPropsOutput } from "./StatCard.schema.js";
export { StatCardPropsSchema, validateStatCardProps } from "./StatCard.schema.js";
export { statCardToMarkdown } from "./StatCard.markdown.js";

// BalanceCard
export { BalanceCard } from "./BalanceCard.js";
export type { BalanceCardProps, BalanceCardPropsOutput } from "./BalanceCard.schema.js";
export { BalanceCardPropsSchema, validateBalanceCardProps } from "./BalanceCard.schema.js";
export { balanceCardToMarkdown } from "./BalanceCard.markdown.js";

// MessageFeed
export { MessageFeed } from "./MessageFeed.js";
export type {
  MessageFeedProps,
  MessageFeedPropsOutput,
  FeedMessage,
} from "./MessageFeed.schema.js";
export { MessageFeedPropsSchema, validateMessageFeedProps } from "./MessageFeed.schema.js";
export { messageFeedToMarkdown } from "./MessageFeed.markdown.js";
export type { MessageFeedViewProps } from "./MessageFeed.js";

// PipelineBoard
export { PipelineBoard } from "./PipelineBoard.js";
export type {
  PipelineBoardProps,
  PipelineBoardPropsOutput,
  PipelineStage,
  PipelineDeal,
} from "./PipelineBoard.schema.js";
export { PipelineBoardPropsSchema, validatePipelineBoardProps } from "./PipelineBoard.schema.js";
export { pipelineBoardToMarkdown } from "./PipelineBoard.markdown.js";
export type { PipelineBoardViewProps } from "./PipelineBoard.js";
