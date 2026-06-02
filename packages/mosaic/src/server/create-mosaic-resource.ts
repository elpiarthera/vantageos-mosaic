import { type UIResource, createUIResource } from "@mcp-ui/server";
import { MarkdownRendererPropsSchema } from "../components/artifacts/MarkdownRenderer.schema.js";
import { TokenDisplayOnceModalPropsSchema } from "../components/confirmation/TokenDisplayOnceModal.schema.js";
import { TableViewPropsSchema } from "../components/display/TableView.schema.js";
import { ConfirmDialogPropsSchema } from "../components/input/ConfirmDialog.schema.js";
import { StatusBadgePropsSchema } from "../components/media/StatusBadge.schema.js";
import { ProgressBarPropsSchema } from "../components/progress/ProgressBar.schema.js";

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
  | "StatusBadge";

const SCHEMA_BY_NAME = {
  ProgressBar: ProgressBarPropsSchema,
  ConfirmDialog: ConfirmDialogPropsSchema,
  TableView: TableViewPropsSchema,
  MarkdownRenderer: MarkdownRendererPropsSchema,
  TokenDisplayOnceModal: TokenDisplayOnceModalPropsSchema,
  StatusBadge: StatusBadgePropsSchema,
} as const;

const COMPONENT_KEYS = Object.keys(SCHEMA_BY_NAME) as SupportedComponent[];

const I18N_TITLE: Record<SupportedComponent, { en: string; fr: string }> = {
  ProgressBar: { en: "Progress", fr: "Progression" },
  ConfirmDialog: { en: "Confirmation", fr: "Confirmation" },
  TableView: { en: "Data table", fr: "Tableau de données" },
  MarkdownRenderer: { en: "Markdown content", fr: "Contenu Markdown" },
  TokenDisplayOnceModal: { en: "Token (shown once)", fr: "Jeton (affiché une fois)" },
  StatusBadge: { en: "Status", fr: "Statut" },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fallbackMarkdown(componentName: SupportedComponent, locale: "en" | "fr"): string {
  const heading = I18N_TITLE[componentName][locale];
  const note =
    locale === "fr"
      ? "Rendu Markdown de secours — composant Mosaic chargé via MCP UI."
      : "Markdown fallback — Mosaic component rendered via MCP UI.";
  return `# ${heading}\n\n${note}\n`;
}

function buildHtml(componentName: SupportedComponent, props: unknown, locale: "en" | "fr"): string {
  const propsJson = escapeHtml(JSON.stringify(props));
  const title = escapeHtml(I18N_TITLE[componentName][locale]);
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"><title>${title}</title></head><body><div id="mosaic-root" data-component="${componentName}" data-props='${propsJson}'></div></body></html>`;
}

export interface CreateMosaicResourceOptions {
  /** Optional override for the generated `ui://` URI. */
  uri?: `ui://${string}`;
  /** Optional override of the markdown fallback emitted under `_meta.ui.fallback`. */
  markdownFallback?: string;
}

/**
 * Create a canonical MCP UI Apps `UIResource` for a Mosaic component.
 *
 * - Runtime-validates `props` with the component's Zod schema (throws on failure).
 * - Wraps the rendered HTML with `createUIResource()` from `@mcp-ui/server`.
 * - Emits canonical nested `_meta.ui.{ resourceUri, locale, componentName, fallback }`.
 * - Uses MIME `text/html;profile=mcp-app` (Mosaic standard §2.1).
 *
 * @throws ZodError when `props` fails validation for `componentName`.
 */
export function createMosaicResource(
  componentName: SupportedComponent,
  props: unknown,
  locale: "en" | "fr" = "en",
): UIResource {
  const schema = SCHEMA_BY_NAME[componentName];
  if (!schema) {
    throw new Error(`createMosaicResource: unknown component '${componentName}'`);
  }
  const validated = schema.parse(props);
  const uri: `ui://${string}` = `ui://mosaic/${componentName.toLowerCase()}`;
  const html = buildHtml(componentName, validated, locale);
  const fallback = fallbackMarkdown(componentName, locale);

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
