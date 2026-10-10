/**
 * MCP Apps resource helper — server side, pure, no React, no DOM.
 *
 * Emits the MCP Apps (spec 2026-01-26) standard keys FIRST: resource `_meta.ui`
 * ({ csp, prefersBorder?, domain? }) and tool `_meta.ui.resourceUri`. `openai/*` keys are
 * strictly additive and appear only when the caller passes the matching input; a client that
 * ignores them loses nothing.
 *
 * Composition with `@modelcontextprotocol/ext-apps/server` (read at 2.0.3): `registerAppResource`
 * only defaults the MIME type and `registerAppTool` only back-fills the deprecated flat
 * `ui/resourceUri` key; neither computes csp defaults, the Claude `domain`, or any `openai/*`
 * key. This helper produces the metadata those registrars pass through: use `resource._meta` as
 * the resource config `_meta` and the read-result content `_meta`, and `toolMeta` as the tool
 * config `_meta`.
 */
import { createHash } from "node:crypto";
import { CLAUDE_HOST_FONT_ORIGIN } from "../host/style-variables.js";

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

/** ChatGPT display modes. `pip` is not one (openai/mcp-extensions docs/spec.md l.843-890). */
export type ChatGptDisplayMode = "inline" | "fullscreen";

export interface McpAppOpenAiInput {
  /** `openai/outputTemplate`: compatibility alias of `_meta.ui.resourceUri` (tool level; fleet ruling, additive). */
  outputTemplate?: string;
  /** `_meta["openai/ui"].availableDisplayModes` on the resource content item (spec l.843-890). */
  availableDisplayModes?: ChatGptDisplayMode[];
  /** `_meta["openai/ui"].preferredDisplayMode` on the resource content item (spec l.843-890). */
  preferredDisplayMode?: ChatGptDisplayMode;
  /** `_meta["openai/ui"].entrypoints` on the tool descriptor (spec l.59, l.116). */
  entrypoints?: OpenAiEntrypoint[];
}

/** Who sees a tool: `"model"` (agent tool list) and/or `"app"` (callable from the view). */
export type ToolVisibility = "model" | "app";

export interface McpAppResourceInput {
  uri: `ui://${string}`;
  html: string;
  csp?: McpAppCsp;
  /** The URL this MCP server is served at. Claude's `ui.domain` is DERIVED from it. */
  servedUrl?: string;
  prefersBorder?: boolean;
  openai?: McpAppOpenAiInput;
  /**
   * Tool-level `_meta.ui.visibility` (MCP Apps spec 2026-01-26, ext-apps-spec.mdx l.332,
   * l.395-401). Omitted = the spec default `["model", "app"]`. `["app"]` makes an app-only tool
   * (refresh, UI-only sort/filter; l.1490) that hosts MUST keep out of the agent's tool list.
   * OpenAI: ignored when the App is invoked as an entrypoint.
   */
  visibility?: ToolVisibility[];
  /**
   * Allow Claude host fonts (`hostContext.styles.css.fonts`): adds `https://assets.claude.ai` to
   * `csp.resourceDomains` (Claude transparent-theming page).
   */
  hostFonts?: boolean;
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
      "openai/ui"?: {
        availableDisplayModes?: ChatGptDisplayMode[];
        preferredDisplayMode?: ChatGptDisplayMode;
      };
    };
  };
  toolMeta: {
    ui: { resourceUri: `ui://${string}`; visibility?: ToolVisibility[] };
    "openai/outputTemplate"?: string;
    "openai/ui"?: { entrypoints: OpenAiEntrypoint[] };
  };
}

/**
 * Claude's stable app origin: `{sha256(mcpServerUrl) first 32 hex}.claudemcpcontent.com`.
 * Source: https://claude.com/docs/connectors/building/mcp-apps/getting-started, section
 * "Set ui.domain for Claude" (same derivation as the `@modelcontextprotocol/ext-apps/server`
 * example). Known answer: "https://example.com/mcp" ->
 * "c3d80a4ed901ee05b21755a88273b4a4.claudemcpcontent.com".
 */
export function deriveClaudeAppDomain(servedUrl: string): string {
  const hash = createHash("sha256").update(servedUrl).digest("hex").slice(0, 32);
  return `${hash}.claudemcpcontent.com`;
}

export function buildMcpAppResource(input: McpAppResourceInput): McpAppResourceOutput {
  const { uri, html, csp, servedUrl, prefersBorder, openai, visibility, hostFonts } = input;
  const modes = [...(openai?.availableDisplayModes ?? []), openai?.preferredDisplayMode];
  if (modes.some((m) => (m as string | undefined) === "pip")) {
    throw new Error("buildMcpAppResource: display mode pip is refused (inline | fullscreen only)");
  }

  let toolVisibility: ToolVisibility[] | undefined;
  if (visibility !== undefined) {
    const valid = visibility.every((v) => (v as string) === "model" || (v as string) === "app");
    if (visibility.length === 0 || !valid) {
      throw new Error(
        'buildMcpAppResource: visibility must be a non-empty list of "model" | "app"',
      );
    }
    toolVisibility = [...new Set(visibility)];
  }
  const resourceDomains = [...(csp?.resourceDomains ?? [])];
  if (hostFonts && !resourceDomains.includes(CLAUDE_HOST_FONT_ORIGIN)) {
    resourceDomains.push(CLAUDE_HOST_FONT_ORIGIN);
  }

  const ui: McpAppResourceMetaUi = {
    csp: {
      connectDomains: csp?.connectDomains ?? [],
      resourceDomains,
      frameDomains: csp?.frameDomains ?? [],
      baseUriDomains: csp?.baseUriDomains ?? [],
    },
    ...(prefersBorder === undefined ? {} : { prefersBorder }),
    ...(servedUrl ? { domain: deriveClaudeAppDomain(servedUrl) } : {}),
  };

  // Standard key first, vendor keys after, only when passed.
  const resourceMeta: McpAppResourceOutput["resource"]["_meta"] = { ui };
  if (openai?.availableDisplayModes !== undefined || openai?.preferredDisplayMode !== undefined) {
    resourceMeta["openai/ui"] = {
      ...(openai.availableDisplayModes !== undefined
        ? { availableDisplayModes: openai.availableDisplayModes }
        : {}),
      ...(openai.preferredDisplayMode !== undefined
        ? { preferredDisplayMode: openai.preferredDisplayMode }
        : {}),
    };
  }

  const toolMeta: McpAppResourceOutput["toolMeta"] = {
    ui: { resourceUri: uri, ...(toolVisibility ? { visibility: toolVisibility } : {}) },
  };
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
