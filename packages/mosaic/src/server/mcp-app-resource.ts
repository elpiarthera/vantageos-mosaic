/**
 * MCP Apps resource helper — server side, pure, no React, no DOM.
 *
 * Emits the MCP Apps (spec 2026-01-26) standard keys FIRST: resource `_meta.ui`
 * ({ csp, prefersBorder?, domain? }) and tool `_meta.ui.resourceUri`. `openai/*` keys are
 * strictly additive and appear only when the caller passes the matching input; a client that
 * ignores them loses nothing.
 */
import { createHash } from "node:crypto";

export const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app" as const;

export interface McpAppCsp {
  connectDomains?: string[];
  resourceDomains?: string[];
  frameDomains?: string[];
  baseUriDomains?: string[];
}

export type OpenAiEntrypoint =
  | { type: "global" }
  | { type: "thread" }
  | { type: "file"; extensions: string[] };

export interface McpAppOpenAiInput {
  /** `openai/outputTemplate`: compatibility alias of `_meta.ui.resourceUri` (tool level). */
  outputTemplate?: string;
  /** `openai/widgetDescription` (resource level). */
  widgetDescription?: string;
  /** `openai/preferredDisplayMode` (resource level). inline | fullscreen only, never pip. */
  preferredDisplayMode?: "inline" | "fullscreen";
  /** `openai/ui` entrypoints (tool level). */
  entrypoints?: OpenAiEntrypoint[];
}

export interface McpAppResourceInput {
  uri: `ui://${string}`;
  html: string;
  csp?: McpAppCsp;
  /** The URL this MCP server is served at. Claude's `ui.domain` is DERIVED from it. */
  servedUrl?: string;
  prefersBorder?: boolean;
  openai?: McpAppOpenAiInput;
}

export interface McpAppResourceMetaUi {
  csp: Required<McpAppCsp>;
  prefersBorder?: boolean;
  domain?: string;
}

export interface McpAppResourceOutput {
  resource: {
    uri: `ui://${string}`;
    mimeType: typeof MCP_APP_MIME_TYPE;
    text: string;
    _meta: {
      ui: McpAppResourceMetaUi;
      "openai/widgetDescription"?: string;
      "openai/preferredDisplayMode"?: "inline" | "fullscreen";
    };
  };
  toolMeta: {
    ui: { resourceUri: `ui://${string}` };
    "openai/outputTemplate"?: string;
    "openai/ui"?: { entrypoints: OpenAiEntrypoint[] };
  };
}

/**
 * Claude's stable app origin: `{sha256(mcpServerUrl) first 32 hex}.claudemcpcontent.com`
 * (the derivation documented in `@modelcontextprotocol/ext-apps/server`).
 */
export function deriveClaudeAppDomain(servedUrl: string): string {
  const hash = createHash("sha256").update(servedUrl).digest("hex").slice(0, 32);
  return `${hash}.claudemcpcontent.com`;
}

export function buildMcpAppResource(input: McpAppResourceInput): McpAppResourceOutput {
  const { uri, html, csp, servedUrl, prefersBorder, openai } = input;
  if ((openai?.preferredDisplayMode as string | undefined) === "pip") {
    throw new Error(
      'buildMcpAppResource: preferredDisplayMode "pip" is refused (inline | fullscreen only)',
    );
  }

  const ui: McpAppResourceMetaUi = {
    csp: {
      connectDomains: csp?.connectDomains ?? [],
      resourceDomains: csp?.resourceDomains ?? [],
      frameDomains: csp?.frameDomains ?? [],
      baseUriDomains: csp?.baseUriDomains ?? [],
    },
    ...(prefersBorder === undefined ? {} : { prefersBorder }),
    ...(servedUrl ? { domain: deriveClaudeAppDomain(servedUrl) } : {}),
  };

  // Standard key first, vendor keys after, only when passed.
  const resourceMeta: McpAppResourceOutput["resource"]["_meta"] = { ui };
  if (openai?.widgetDescription !== undefined) {
    resourceMeta["openai/widgetDescription"] = openai.widgetDescription;
  }
  if (openai?.preferredDisplayMode !== undefined) {
    resourceMeta["openai/preferredDisplayMode"] = openai.preferredDisplayMode;
  }

  const toolMeta: McpAppResourceOutput["toolMeta"] = { ui: { resourceUri: uri } };
  if (openai?.outputTemplate !== undefined) {
    toolMeta["openai/outputTemplate"] = openai.outputTemplate;
  }
  if (openai?.entrypoints !== undefined) {
    toolMeta["openai/ui"] = { entrypoints: openai.entrypoints };
  }

  return {
    resource: { uri, mimeType: MCP_APP_MIME_TYPE, text: html, _meta: resourceMeta },
    toolMeta,
  };
}
