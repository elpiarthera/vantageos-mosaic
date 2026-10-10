import { describe, expect, it } from "vitest";
import {
  MCP_APP_MIME_TYPE,
  buildMcpAppResource,
  deriveClaudeAppDomain,
} from "./mcp-app-resource.js";

const base = {
  uri: "ui://mosaic/tasks" as const,
  html: "<!doctype html><html><body>x</body></html>",
  csp: {
    connectDomains: ["https://api.example.com"],
    resourceDomains: [],
    frameDomains: [],
    baseUriDomains: [],
  },
};

describe("host-context resource helper: standard MCP Apps keys first", () => {
  it("emits _meta.ui with the four csp arrays explicit, with no openai input at all", () => {
    const { resource, toolMeta } = buildMcpAppResource(base);
    expect(resource.uri).toBe("ui://mosaic/tasks");
    expect(resource.mimeType).toBe(MCP_APP_MIME_TYPE);
    expect(resource.text).toBe(base.html);
    expect(resource._meta.ui.csp).toEqual({
      connectDomains: ["https://api.example.com"],
      resourceDomains: [],
      frameDomains: [],
      baseUriDomains: [],
    });
    expect(toolMeta.ui.resourceUri).toBe("ui://mosaic/tasks");
    const all = [...Object.keys(resource._meta), ...Object.keys(toolMeta)];
    expect(all.filter((k) => k.startsWith("openai/"))).toEqual([]);
  });

  it("defaults every csp array to [] (secure default, explicit not omitted)", () => {
    const { resource } = buildMcpAppResource({ uri: base.uri, html: base.html });
    expect(resource._meta.ui.csp).toEqual({
      connectDomains: [],
      resourceDomains: [],
      frameDomains: [],
      baseUriDomains: [],
    });
  });

  it("puts `ui` as the FIRST key of _meta, before any vendor key", () => {
    const { resource, toolMeta } = buildMcpAppResource({
      ...base,
      openai: { preferredDisplayMode: "inline", outputTemplate: "ui://mosaic/tasks" },
    });
    expect(Object.keys(resource._meta)[0]).toBe("ui");
    expect(Object.keys(toolMeta)[0]).toBe("ui");
  });

  it("emits prefersBorder only when passed", () => {
    expect(buildMcpAppResource(base).resource._meta.ui).not.toHaveProperty("prefersBorder");
    expect(
      buildMcpAppResource({ ...base, prefersBorder: true }).resource._meta.ui.prefersBorder,
    ).toBe(true);
  });
});

describe("host-context resource helper: domain is derived, never typed", () => {
  it("matches the documented KNOWN ANSWER (not recomputed by the code under test)", () => {
    // Source: https://claude.com/docs/connectors/building/mcp-apps/getting-started
    // section "Set ui.domain for Claude": first 32 hex of SHA-256(server URL) + ".claudemcpcontent.com".
    expect(deriveClaudeAppDomain("https://example.com/mcp")).toBe(
      "c3d80a4ed901ee05b21755a88273b4a4.claudemcpcontent.com",
    );
  });

  it("derives {sha256(url)[0..32]}.claudemcpcontent.com from servedUrl", () => {
    expect(deriveClaudeAppDomain("https://example.com/mcp")).toBe(
      `${expectedHash("https://example.com/mcp")}.claudemcpcontent.com`,
    );
    const { resource } = buildMcpAppResource({ ...base, servedUrl: "https://example.com/mcp" });
    expect(resource._meta.ui.domain).toBe(
      `${expectedHash("https://example.com/mcp")}.claudemcpcontent.com`,
    );
  });

  it("omits domain when servedUrl is not given", () => {
    expect(buildMcpAppResource(base).resource._meta.ui).not.toHaveProperty("domain");
  });
});

describe("host-context resource helper: openai keys strictly additive", () => {
  // Spec: https://github.com/openai/mcp-extensions/blob/HEAD/docs/spec.md
  // "Display Modes" (l.843-890): resource content item `_meta["openai/ui"]` =
  // { availableDisplayModes?, preferredDisplayMode? }; entrypoints on the tool (l.59, l.116).
  it("emits openai/ui display modes on the resource, outputTemplate + entrypoints on the tool", () => {
    const out = buildMcpAppResource({
      ...base,
      openai: {
        outputTemplate: "ui://mosaic/tasks",
        availableDisplayModes: ["inline", "fullscreen"],
        preferredDisplayMode: "inline",
        entrypoints: [{ type: "global" }],
      },
    });
    expect(out.toolMeta["openai/outputTemplate"]).toBe("ui://mosaic/tasks");
    expect(out.toolMeta["openai/ui"]).toEqual({ entrypoints: [{ type: "global" }] });
    expect(out.resource._meta["openai/ui"]).toEqual({
      availableDisplayModes: ["inline", "fullscreen"],
      preferredDisplayMode: "inline",
    });
    // the standard keys are unchanged by the vendor input
    expect(out.resource._meta.ui).toEqual(buildMcpAppResource(base).resource._meta.ui);
    expect(out.toolMeta.ui).toEqual(buildMcpAppResource(base).toolMeta.ui);
  });

  it("never emits the keys the spec does not define", () => {
    const out = buildMcpAppResource({
      ...base,
      openai: { preferredDisplayMode: "fullscreen", outputTemplate: "ui://mosaic/tasks" },
    });
    const keys = [...Object.keys(out.resource._meta), ...Object.keys(out.toolMeta)];
    expect(keys).not.toContain("openai/preferredDisplayMode");
    expect(keys).not.toContain("openai/widgetDescription");
  });

  it("emits nothing for an openai key that was not passed", () => {
    const out = buildMcpAppResource({ ...base, openai: { preferredDisplayMode: "inline" } });
    expect(out.resource._meta["openai/ui"]).toEqual({ preferredDisplayMode: "inline" });
    expect(out.toolMeta).not.toHaveProperty("openai/outputTemplate");
    expect(out.toolMeta).not.toHaveProperty("openai/ui");
    expect(buildMcpAppResource({ ...base, openai: {} }).resource._meta).not.toHaveProperty(
      "openai/ui",
    );
  });

  it("refuses pip anywhere in display modes (not a ChatGPT mode)", () => {
    for (const openai of [
      { preferredDisplayMode: "pip" },
      { availableDisplayModes: ["inline", "pip"] },
    ]) {
      expect(() =>
        // biome-ignore lint/suspicious/noExplicitAny: proving the runtime refusal past the type
        buildMcpAppResource({ ...base, openai: openai as any }),
      ).toThrow(/pip/);
    }
  });
});

import { createHash } from "node:crypto";
function expectedHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}
