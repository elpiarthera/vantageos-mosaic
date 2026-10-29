import { describe, expect, it } from "vitest";
import { DETAIL_CONFIG, DETAIL_PAYLOAD, LIST_CONFIG, LIST_PAYLOAD } from "../view-config/fixtures";
import { ViewConfigError } from "../view-config/view-config";
import {
  CONFIG_VIEW_URI,
  buildConfigViewResource,
  createConfigViewToolResult,
} from "./config-view";

const HTML = "<!doctype html><html><body>view</body></html>";

describe("buildConfigViewResource (G3 + G5 route A)", () => {
  it("returns the ui://mosaic/config-view resource through buildMcpAppResource", () => {
    const r = buildConfigViewResource({ html: HTML, servedUrl: "https://example.com/mcp" });
    expect(CONFIG_VIEW_URI).toBe("ui://mosaic/config-view");
    expect(r.resource.uri).toBe("ui://mosaic/config-view");
    expect(r.resource.mimeType).toBe("text/html;profile=mcp-app");
    expect(r.resource.text).toBe(HTML);
    expect(r.resource._meta.ui.domain).toBe(
      "c3d80a4ed901ee05b21755a88273b4a4.claudemcpcontent.com",
    );
  });

  it("declares no network, resource or frame domain (CSP empty)", () => {
    const { csp } = buildConfigViewResource({ html: HTML }).resource._meta.ui;
    expect(csp).toEqual({
      connectDomains: [],
      resourceDomains: [],
      frameDomains: [],
      baseUriDomains: [],
    });
  });

  it("the tool meta carries only the nested _meta.ui.resourceUri, never the flat key", () => {
    const r = buildConfigViewResource({ html: HTML });
    expect(r.toolMeta).toEqual({ ui: { resourceUri: "ui://mosaic/config-view" } });
    expect(JSON.stringify(r)).not.toContain("ui/resourceUri");
    expect(Object.keys(r.toolMeta)).not.toContain("ui/resourceUri");
  });

  it("refuses an empty html and a non-ui:// uri", () => {
    expect(() => buildConfigViewResource({ html: "" })).toThrow(/html/);
    expect(() => buildConfigViewResource({ html: HTML, uri: "http://x" as never })).toThrow(
      /ui:\/\//,
    );
  });

  it("honours a custom ui:// uri", () => {
    expect(
      buildConfigViewResource({ html: HTML, uri: "ui://acme/v" }).toolMeta.ui.resourceUri,
    ).toBe("ui://acme/v");
  });
});

describe("createConfigViewToolResult (A-1 + view config in _meta)", () => {
  it("returns markdown content, the typed payload and the view config + locale in _meta", () => {
    const r = createConfigViewToolResult({
      viewConfig: LIST_CONFIG,
      payload: LIST_PAYLOAD,
      locale: "fr",
    });
    expect(r.content).toHaveLength(1);
    expect(r.content[0].type).toBe("text");
    expect(r.content[0].text).toContain("# Contrats locataires");
    expect(r.structuredContent).toEqual(LIST_PAYLOAD);
    expect(r._meta.viewConfig).toEqual(LIST_CONFIG);
    expect(r._meta.locale).toBe("fr");
  });

  it("defaults the locale to en and serves a detail", () => {
    const r = createConfigViewToolResult({ viewConfig: DETAIL_CONFIG, payload: DETAIL_PAYLOAD });
    expect(r._meta.locale).toBe("en");
    expect(r.content[0].text).toContain("# Condominium");
  });

  it("is loud on an invalid config or a mismatching payload", () => {
    expect(() => createConfigViewToolResult({ viewConfig: {}, payload: {} })).toThrow(
      ViewConfigError,
    );
    expect(() => createConfigViewToolResult({ viewConfig: LIST_CONFIG, payload: {} })).toThrow(
      ViewConfigError,
    );
  });
});
