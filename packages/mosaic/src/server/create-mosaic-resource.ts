import { type UIResource, createUIResource } from "@mcp-ui/server";
import { markdownRendererToMarkdown } from "../components/artifacts/MarkdownRenderer.markdown.js";
import { MarkdownRendererPropsSchema } from "../components/artifacts/MarkdownRenderer.schema.js";
import { tokenDisplayOnceModalToMarkdown } from "../components/confirmation/TokenDisplayOnceModal.markdown.js";
import { TokenDisplayOnceModalPropsSchema } from "../components/confirmation/TokenDisplayOnceModal.schema.js";
import { transactionPreviewToMarkdown } from "../components/confirmation/TransactionPreview.markdown.js";
import { TransactionPreviewPropsSchema } from "../components/confirmation/TransactionPreview.schema.js";
import { balanceCardToMarkdown } from "../components/display/BalanceCard.markdown.js";
import { BalanceCardPropsSchema } from "../components/display/BalanceCard.schema.js";
import { messageFeedToMarkdown } from "../components/display/MessageFeed.markdown.js";
import { MessageFeedPropsSchema } from "../components/display/MessageFeed.schema.js";
import { pipelineBoardToMarkdown } from "../components/display/PipelineBoard.markdown.js";
import { PipelineBoardPropsSchema } from "../components/display/PipelineBoard.schema.js";
import { statCardToMarkdown } from "../components/display/StatCard.markdown.js";
import { StatCardPropsSchema } from "../components/display/StatCard.schema.js";
import { tableViewToMarkdown } from "../components/display/TableView.markdown.js";
import { TableViewPropsSchema } from "../components/display/TableView.schema.js";
import { confirmDialogToMarkdown } from "../components/input/ConfirmDialog.markdown.js";
import { ConfirmDialogPropsSchema } from "../components/input/ConfirmDialog.schema.js";
import { statusBadgeToMarkdown } from "../components/media/StatusBadge.markdown.js";
import { StatusBadgePropsSchema } from "../components/media/StatusBadge.schema.js";
import { progressBarToMarkdown } from "../components/progress/ProgressBar.markdown.js";
import { ProgressBarPropsSchema } from "../components/progress/ProgressBar.schema.js";
import { timelineToMarkdown } from "../components/progress/Timeline.markdown.js";
import { TimelinePropsSchema } from "../components/progress/Timeline.schema.js";
import { t } from "../i18n/strings.js";

/**
 * MCP capability key used by hosts to discover that this server emits
 * MCP UI Apps resources (mosaic-architecture-standard-v1 §2.1).
 */
export const MCP_UI_CAPABILITY_KEY = "io.modelcontextprotocol/ui" as const;

/**
 * Canonical Mosaic MIME type — every UIResource produced by this server
 * advertises the MCP Apps profile (`text/html;profile=mcp-app`).
 */
export const MOSAIC_MIME_TYPE = "text/html;profile=mcp-app" as const;

type SupportedComponent =
  | "ProgressBar"
  | "ConfirmDialog"
  | "TableView"
  | "MarkdownRenderer"
  | "TokenDisplayOnceModal"
  | "StatusBadge"
  | "StatCard"
  | "BalanceCard"
  | "Timeline"
  | "MessageFeed"
  | "PipelineBoard"
  | "TransactionPreview";

const SCHEMA_BY_NAME = {
  ProgressBar: ProgressBarPropsSchema,
  ConfirmDialog: ConfirmDialogPropsSchema,
  TableView: TableViewPropsSchema,
  MarkdownRenderer: MarkdownRendererPropsSchema,
  TokenDisplayOnceModal: TokenDisplayOnceModalPropsSchema,
  StatusBadge: StatusBadgePropsSchema,
  StatCard: StatCardPropsSchema,
  BalanceCard: BalanceCardPropsSchema,
  Timeline: TimelinePropsSchema,
  MessageFeed: MessageFeedPropsSchema,
  PipelineBoard: PipelineBoardPropsSchema,
  TransactionPreview: TransactionPreviewPropsSchema,
} as const;

/**
 * Per-view `toMarkdown(props, locale)` (App standard A-1): the DATA of the view as markdown, for
 * clients with no UI layer. Keyed by component so a view without one fails to compile.
 */
const MARKDOWN_BY_NAME: Record<
  SupportedComponent,
  (props: unknown, locale: "en" | "fr") => string
> = {
  ProgressBar: progressBarToMarkdown,
  ConfirmDialog: confirmDialogToMarkdown,
  TableView: tableViewToMarkdown,
  MarkdownRenderer: markdownRendererToMarkdown,
  TokenDisplayOnceModal: tokenDisplayOnceModalToMarkdown,
  StatusBadge: statusBadgeToMarkdown,
  StatCard: statCardToMarkdown,
  BalanceCard: balanceCardToMarkdown,
  Timeline: timelineToMarkdown,
  MessageFeed: messageFeedToMarkdown,
  PipelineBoard: pipelineBoardToMarkdown,
  TransactionPreview: transactionPreviewToMarkdown,
};

const COMPONENT_KEYS = Object.keys(SCHEMA_BY_NAME) as SupportedComponent[];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(componentName: SupportedComponent, props: unknown, locale: "en" | "fr"): string {
  const propsJson = escapeHtml(JSON.stringify(props));
  const title = escapeHtml(t(`${componentName}.title`, locale));
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"><title>${title}</title></head><body><div id="mosaic-root" data-component="${componentName}" data-props='${propsJson}'></div></body></html>`;
}

export interface CreateMosaicResourceOptions {
  /** Optional override for the generated `ui://` URI. */
  uri?: `ui://${string}`;
  /**
   * Optional override of the markdown fallback emitted under `_meta.ui.fallback`. Default: the
   * view's own `toMarkdown`, which carries the data.
   */
  markdownFallback?: string;
}

/**
 * Create a canonical MCP UI Apps `UIResource` for a Mosaic component.
 *
 * - Runtime-validates `props` with the component's Zod schema (throws on failure).
 * - Wraps the rendered HTML with `createUIResource()` from `@mcp-ui/server`.
 * - Emits canonical nested `_meta.ui.{ resourceUri, locale, componentName, fallback }`; `fallback`
 *   is kept (published contract) and now carries the view's data as markdown (it was a title and a
 *   note). The A-1 conformant place is the tool result `content[]`: see {@link createMosaicToolResult}.
 * - Uses MIME `text/html;profile=mcp-app` (Mosaic standard §2.1).
 *
 * @throws ZodError when `props` fails validation for `componentName`.
 */
export function createMosaicResource(
  componentName: SupportedComponent,
  props: unknown,
  locale: "en" | "fr" = "en",
  options: CreateMosaicResourceOptions = {},
): UIResource {
  const schema = SCHEMA_BY_NAME[componentName];
  if (!schema) {
    throw new Error(`createMosaicResource: unknown component '${componentName}'`);
  }
  const validated = schema.parse(props);
  const uri: `ui://${string}` = options.uri ?? `ui://mosaic/${componentName.toLowerCase()}`;
  const html = buildHtml(componentName, validated, locale);
  const fallback = options.markdownFallback ?? MARKDOWN_BY_NAME[componentName](validated, locale);

  const resource = createUIResource({
    uri,
    content: { type: "rawHtml", htmlString: html },
    encoding: "text",
    metadata: {
      ui: {
        resourceUri: uri,
        locale,
        componentName,
        fallback,
      },
    },
  });

  // createUIResource may itself default the MIME type; ensure it matches the
  // Mosaic canonical profile regardless of upstream defaults.
  resource.resource.mimeType = MOSAIC_MIME_TYPE;
  return resource;
}

export const MOSAIC_SUPPORTED_COMPONENTS: readonly SupportedComponent[] = COMPONENT_KEYS;
export type { SupportedComponent };

/**
 * MCP tool result for a view, App standard A-1: a markdown text block carrying the view's DATA,
 * next to the `ui://` resource, in `content[]` (reference handler, standard l.136-138):
 * `{ content: [ { type: "text", text }, { type: "resource", resource } ] }`.
 * A client with no UI layer renders the first block and loses nothing. A one-time token is
 * marked `annotations.audience: ["user"]` (MCP content annotations) so it is not for the model.
 */
export function createMosaicToolResult(
  componentName: SupportedComponent,
  props: unknown,
  locale: "en" | "fr" = "en",
): {
  content: [
    { type: "text"; text: string; annotations?: { audience: Array<"user" | "assistant"> } },
    UIResource,
  ];
} {
  const ui = createMosaicResource(componentName, props, locale);
  const text = (ui.resource._meta as { ui: { fallback: string } }).ui.fallback;
  return {
    content: [
      {
        type: "text",
        text,
        ...(componentName === "TokenDisplayOnceModal"
          ? { annotations: { audience: ["user" as const] } }
          : {}),
      },
      ui,
    ],
  };
}

// The per-view A-1 builders, importable by a server that renders no UI.
export {
  progressBarToMarkdown,
  confirmDialogToMarkdown,
  tableViewToMarkdown,
  markdownRendererToMarkdown,
  tokenDisplayOnceModalToMarkdown,
  statusBadgeToMarkdown,
  statCardToMarkdown,
  balanceCardToMarkdown,
  timelineToMarkdown,
  messageFeedToMarkdown,
  pipelineBoardToMarkdown,
  transactionPreviewToMarkdown,
};
