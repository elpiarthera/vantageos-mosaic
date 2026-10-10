import { describe, expect, it } from "vitest";
import { buildMcpAppResource } from "./mcp-app-resource.js";

const base = { uri: "ui://mosaic/tasks" as const, html: "<html></html>" };

// Spec: MCP Apps 2026-01-26 ext-apps-spec.mdx
//   l.332      `visibility?: Array<"model" | "app">`
//   l.395-401  defaults to ["model", "app"] if omitted; hosts MUST NOT list tools without "model"
//              in the agent's tool list, and MUST reject app tools/call for tools without "app".
//   l.1490     app-only tools enable UI-only interactions (refresh buttons, form submissions).
// OpenAI spec: _meta.ui.visibility is ignored when an MCP App is invoked as an entrypoint.
describe("tool visibility (H05)", () => {
  it("emits no visibility key when none is given (the spec default applies)", () => {
    expect(buildMcpAppResource(base).toolMeta.ui).toEqual({ resourceUri: "ui://mosaic/tasks" });
  });

  it("emits visibility ['app'] for an app-only tool, next to resourceUri", () => {
    const { toolMeta } = buildMcpAppResource({ ...base, visibility: ["app"] });
    expect(toolMeta.ui).toEqual({ resourceUri: "ui://mosaic/tasks", visibility: ["app"] });
  });

  it("emits visibility ['model'] for a model-only tool and both values for an explicit default", () => {
    expect(buildMcpAppResource({ ...base, visibility: ["model"] }).toolMeta.ui.visibility).toEqual([
      "model",
    ]);
    expect(
      buildMcpAppResource({ ...base, visibility: ["model", "app"] }).toolMeta.ui.visibility,
    ).toEqual(["model", "app"]);
  });

  it("de-duplicates values", () => {
    expect(
      buildMcpAppResource({ ...base, visibility: ["app", "app"] }).toolMeta.ui.visibility,
    ).toEqual(["app"]);
  });

  it("refuses an empty list and any value outside model | app", () => {
    expect(() => buildMcpAppResource({ ...base, visibility: [] })).toThrow(/visibility/);
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard past the type
      buildMcpAppResource({ ...base, visibility: ["user"] as any }),
    ).toThrow(/visibility/);
  });

  it("adds the Claude host-font origin to resourceDomains once when hostFonts is set", () => {
    const { resource } = buildMcpAppResource({
      ...base,
      csp: { resourceDomains: ["https://assets.claude.ai", "https://cdn.example.com"] },
      hostFonts: true,
    });
    expect(resource._meta.ui.csp.resourceDomains).toEqual([
      "https://assets.claude.ai",
      "https://cdn.example.com",
    ]);
    const plain = buildMcpAppResource({ ...base, hostFonts: true });
    expect(plain.resource._meta.ui.csp.resourceDomains).toEqual(["https://assets.claude.ai"]);
    expect(buildMcpAppResource(base).resource._meta.ui.csp.resourceDomains).toEqual([]);
  });
});
