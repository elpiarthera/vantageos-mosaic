import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  MCP_UI_CAPABILITY_KEY,
  MOSAIC_MIME_TYPE,
  MOSAIC_SUPPORTED_COMPONENTS,
  createMosaicResource,
} from "./create-mosaic-resource";

describe("createMosaicResource — happy path", () => {
  it("produces a UIResource with canonical nested _meta.ui shape (ProgressBar EN)", () => {
    const r = createMosaicResource(
      "ProgressBar",
      { value: 42, label: "Budget", locale: "en", colorVariant: "default" },
      "en",
    );
    expect(r.type).toBe("resource");
    expect(r.resource.mimeType).toBe(MOSAIC_MIME_TYPE);
    expect(r.resource.uri.startsWith("ui://mosaic/")).toBe(true);
    const meta = r.resource._meta as { ui?: Record<string, unknown> } | undefined;
    expect(meta?.ui?.resourceUri).toBe(r.resource.uri);
    expect(meta?.ui?.componentName).toBe("ProgressBar");
    expect(meta?.ui?.locale).toBe("en");
    expect(typeof meta?.ui?.fallback).toBe("string");
    expect((meta?.ui?.fallback as string).length).toBeGreaterThan(0);
  });

  it("emits FR markdown fallback when locale=fr (StatusBadge)", () => {
    const r = createMosaicResource(
      "StatusBadge",
      { status: "actif", variant: "success", locale: "fr" },
      "fr",
    );
    const meta = r.resource._meta as { ui?: { fallback?: string } } | undefined;
    expect(meta?.ui?.fallback).toMatch(/Mosaic/i);
  });
});

describe("createMosaicResource — Zod validation failure", () => {
  it("throws ZodError when props violate the schema (ProgressBar value > 100)", () => {
    expect(() => createMosaicResource("ProgressBar", { value: 999, label: "Bad" }, "en")).toThrow(
      ZodError,
    );
  });

  it("throws when component name is unknown", () => {
    expect(() =>
      // @ts-expect-error — exercising runtime guard
      createMosaicResource("DoesNotExist", { foo: "bar" }, "en"),
    ).toThrow(/unknown component/);
  });
});

describe("createMosaicResource — exports", () => {
  it("exports the MCP UI capability key", () => {
    expect(MCP_UI_CAPABILITY_KEY).toBe("io.modelcontextprotocol/ui");
  });

  it("lists all 6 supported component names", () => {
    expect(MOSAIC_SUPPORTED_COMPONENTS).toHaveLength(6);
    for (const name of [
      "ProgressBar",
      "ConfirmDialog",
      "TableView",
      "MarkdownRenderer",
      "TokenDisplayOnceModal",
      "StatusBadge",
    ]) {
      expect(MOSAIC_SUPPORTED_COMPONENTS).toContain(name);
    }
  });
});
