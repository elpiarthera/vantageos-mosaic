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
  /**
   * Keep declared secret fields in the embedded HTML props. Default false: a secret never goes
   * into a resource that may be placed in `content[]` (see {@link MOSAIC_NEVER_SERIALISE}).
   */
  includeSecrets?: boolean;
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
  const validated = schema.parse(props) as Record<string, unknown>;
  const embedded = options.includeSecrets
    ? validated
    : splitSecrets(componentName, validated, []).publicProps;
  const fallback = options.markdownFallback ?? MARKDOWN_BY_NAME[componentName](validated, locale);
  return buildResource(componentName, embedded, locale, fallback, options.uri);
}

/** Builds the UIResource from props that are ALREADY validated (and already split). */
function buildResource(
  componentName: SupportedComponent,
  embedded: unknown,
  locale: "en" | "fr",
  fallback: string,
  uriOverride?: `ui://${string}`,
): UIResource {
  const uri: `ui://${string}` = uriOverride ?? `ui://mosaic/${componentName.toLowerCase()}`;
  const html = buildHtml(componentName, embedded, locale);

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

/**
 * Fields whose VALUE must never be serialised into a tool result's `content[]` (text block or
 * ui:// resource): that text reaches the model's context, and `annotations.audience` is only a
 * hint hosts may ignore. Exhaustive by type: a new view cannot be added without answering. The
 * value reaches the view through the tool result `_meta["mosaic/secrets"]` instead.
 * (TableView additionally honours per-column `sensitive`.)
 */
export const MOSAIC_NEVER_SERIALISE: Record<SupportedComponent, readonly string[]> = {
  ProgressBar: [],
  ConfirmDialog: [],
  TableView: [],
  MarkdownRenderer: [],
  TokenDisplayOnceModal: ["token"],
  StatusBadge: [],
  StatCard: [],
  BalanceCard: [],
  Timeline: [],
  MessageFeed: [],
  PipelineBoard: [],
  TransactionPreview: [],
};

/** Thrown when a declared never-serialise value is found in `content[]`. Never prints the value. */
export class MosaicSecretLeakError extends Error {
  readonly field: string;
  constructor(field: string) {
    super(`createMosaicToolResult: the value of "${field}" would be serialised into content[]`);
    this.name = "MosaicSecretLeakError";
    this.field = field;
  }
}

type Secrets = Record<string, unknown>;

/**
 * Splits validated props into the public props (what may be embedded) and the secrets: declared
 * top-level fields, plus the cells of TableView columns flagged `sensitive`.
 */
function splitSecrets(
  name: SupportedComponent,
  validated: Record<string, unknown>,
  extraFields: readonly string[],
): { publicProps: Record<string, unknown>; secrets: Secrets } {
  const publicProps: Record<string, unknown> = { ...validated };
  const secrets: Secrets = {};
  for (const f of extraFields) {
    if (!(f in validated))
      throw new Error(`createMosaicToolResult: unknown field "${f}" for ${name}`);
  }
  for (const field of [...MOSAIC_NEVER_SERIALISE[name], ...extraFields]) {
    if (field in publicProps) {
      secrets[field] = publicProps[field];
      delete publicProps[field];
    }
  }
  if (name === "TableView") {
    const columns = (validated.columns ?? []) as Array<{ key: string; sensitive?: boolean }>;
    const sensitive = columns.filter((c) => c.sensitive).map((c) => c.key);
    if (sensitive.length > 0) {
      const cells: Record<string, unknown> = {};
      publicProps.rows = ((validated.rows ?? []) as Array<Record<string, unknown>>).map(
        (row, i) => {
          const rest = { ...row };
          for (const k of sensitive) {
            if (k in rest) {
              cells[`${i}.${k}`] = rest[k];
              delete rest[k];
            }
          }
          return rest;
        },
      );
      secrets.cells = cells;
    }
  }
  return { publicProps, secrets };
}

/** Secret VALUES that must be checked for: strings/numbers of the declared fields (>= 6 chars). */
function secretNeedles(secrets: Secrets): Array<{ field: string; needle: string }> {
  const out: Array<{ field: string; needle: string }> = [];
  for (const [field, v] of Object.entries(secrets)) {
    const values = field === "cells" && v && typeof v === "object" ? Object.values(v) : [v];
    for (const x of values) {
      const needle = typeof x === "string" ? x : typeof x === "number" ? String(x) : "";
      if (needle.length >= 6) out.push({ field, needle });
    }
  }
  return out;
}

export const MOSAIC_SUPPORTED_COMPONENTS: readonly SupportedComponent[] = COMPONENT_KEYS;
export type { SupportedComponent };

/**
 * MCP tool result for a view, App standard A-1: a markdown text block carrying the view's DATA,
 * next to the `ui://` resource, in `content[]` (reference handler, standard l.136-138):
 * `{ content: [ { type: "text", text }, { type: "resource", resource } ] }`.
 *
 * FAIL CLOSED on secrets: `content[]` reaches the model, so the fields declared in
 * {@link MOSAIC_NEVER_SERIALISE} (plus the caller's `neverSerialise`, plus TableView `sensitive`
 * columns) are removed from the embedded props, delivered to the view through
 * `_meta["mosaic/secrets"]`, and asserted absent from the serialised `content[]`; a leak throws
 * {@link MosaicSecretLeakError}. A declared field the view does not have throws (a typo would
 * otherwise assert nothing). Values shorter than 6 characters are not needle-checked.
 */
export function createMosaicToolResult(
  componentName: SupportedComponent,
  props: unknown,
  locale: "en" | "fr" = "en",
  options: { neverSerialise?: readonly string[] } = {},
): {
  content: [{ type: "text"; text: string }, UIResource];
  _meta?: { "mosaic/secrets": Secrets };
} {
  const schema = SCHEMA_BY_NAME[componentName];
  if (!schema) {
    throw new Error(`createMosaicResource: unknown component '${componentName}'`);
  }
  const validated = schema.parse(props) as Record<string, unknown>;
  const { publicProps, secrets } = splitSecrets(
    componentName,
    validated,
    options.neverSerialise ?? [],
  );
  const markdown = MARKDOWN_BY_NAME[componentName](validated, locale);
  const ui = buildResource(componentName, publicProps, locale, markdown);
  const content: [{ type: "text"; text: string }, UIResource] = [
    { type: "text", text: markdown },
    ui,
  ];
  const serialised = JSON.stringify(content);
  for (const { field, needle } of secretNeedles(secrets)) {
    if (serialised.includes(needle) || serialised.includes(JSON.stringify(needle).slice(1, -1))) {
      throw new MosaicSecretLeakError(field);
    }
  }
  return Object.keys(secrets).length > 0
    ? { content, _meta: { "mosaic/secrets": secrets } }
    : { content };
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
