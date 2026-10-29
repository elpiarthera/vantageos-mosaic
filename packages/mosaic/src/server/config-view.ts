/**
 * Server helpers for the single-file config view (`ui://mosaic/config-view`): ONE resource
 * serves every config-driven List and Detail; the view switches on `_meta.viewConfig.kind`.
 * One resource matters because a row action calls another tool inside the same iframe, and the
 * iframe is not reloaded when the next tool points at another resource.
 *
 * Route A for the legacy key (App standard A-6): the tool meta returned here carries ONLY the
 * nested `_meta.ui.resourceUri`. Register the tool with `server.registerTool` and this meta;
 * do not use a helper that back-fills the deprecated flat `ui/resourceUri` key.
 */
import { configToMarkdown } from "../components/display/ConfigView.markdown.js";
import { type McpAppResourceOutput, buildMcpAppResource } from "./mcp-app-resource.js";

export const CONFIG_VIEW_URI = "ui://mosaic/config-view" as const;

export interface BuildConfigViewResourceInput {
  /** The built single file: read it from `@vantageos/mosaic/server/config-view.html`. */
  html: string;
  /** The URL this MCP server is served at (Claude's `ui.domain` is derived from it). */
  servedUrl?: string;
  uri?: `ui://${string}`;
}

/**
 * The `ui://` resource for the config view, built through `buildMcpAppResource` with an EMPTY csp:
 * the view loads nothing and calls nothing but the host bridge (no connect, resource or frame domain).
 */
export function buildConfigViewResource(input: BuildConfigViewResourceInput): McpAppResourceOutput {
  const { html, servedUrl, uri = CONFIG_VIEW_URI } = input;
  if (html.trim() === "") {
    throw new Error("buildConfigViewResource: html is empty (read dist/config-view.html)");
  }
  if (!uri.startsWith("ui://")) {
    throw new Error("buildConfigViewResource: uri must start with ui://");
  }
  return buildMcpAppResource({ uri, html, csp: {}, ...(servedUrl ? { servedUrl } : {}) });
}

/**
 * A tool result for a config-driven view (App standard A-1): `content` is the markdown fallback
 * rendered from the same config, `structuredContent` the typed payload, `_meta` the view config
 * and the resolved locale. LOUD: an invalid config or a payload that does not match throws
 * `ViewConfigError`; the tool decides how to answer, nothing is silently defaulted.
 */
export function createConfigViewToolResult(input: {
  viewConfig: unknown;
  payload: unknown;
  locale?: "en" | "fr";
}): {
  content: [{ type: "text"; text: string }];
  structuredContent: unknown;
  _meta: { viewConfig: unknown; locale: "en" | "fr" };
} {
  const locale = input.locale ?? "en";
  const text = configToMarkdown(input.viewConfig, input.payload, locale);
  return {
    content: [{ type: "text", text }],
    structuredContent: input.payload,
    _meta: { viewConfig: input.viewConfig, locale },
  };
}
