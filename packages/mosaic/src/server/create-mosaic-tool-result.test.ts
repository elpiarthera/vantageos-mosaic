import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  MOSAIC_MIME_TYPE,
  MOSAIC_SUPPORTED_COMPONENTS,
  type SupportedComponent,
  createMosaicResource,
  createMosaicToolResult,
} from "./create-mosaic-resource";

// App standard mcp-app-standard.md v2.2 A-1: "Repli markdown obligatoire ... dans content[] a cote
// de la ressource ui://. Un client sans couche UI recoit une reponse texte equivalente et
// significative, sans erreur. Aucune exception." Reference handler (l.136-138):
//   return { content: [ { type: "text", text: fallbackMarkdown }, { type: "resource", resource: ui } ] };
// `fixtures` carries, per component, valid props and the DATA strings the markdown must contain.
const fixtures: Record<SupportedComponent, { props: unknown; data: string[] }> = {
  ProgressBar: {
    props: { value: 42, label: "Budget used", locale: "en" },
    data: ["Budget used", "42"],
  },
  ConfirmDialog: {
    props: {
      title: "Delete project",
      message: "This cannot be undone",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    },
    data: ["Delete project", "This cannot be undone", "Delete", "Keep"],
  },
  TableView: {
    props: {
      columns: [
        { key: "name", header: "Name" },
        { key: "qty", header: "Qty" },
      ],
      rows: [
        { name: "Bolt", qty: 4 },
        { name: "Nut", qty: 9 },
      ],
      ariaLabel: "Parts",
    },
    data: ["Name", "Qty", "Bolt", "Nut", "9"],
  },
  MarkdownRenderer: {
    props: { content: "## Release notes\n\nShipped **today**", locale: "en" },
    data: ["Release notes", "Shipped"],
  },
  TokenDisplayOnceModal: {
    props: {
      token: "tok_live_abc123",
      title: "API token",
      warningMessage: "Shown once",
      copyLabel: "Copy",
      closeLabel: "Close",
    },
    data: ["API token", "shown once, in the app view only"],
  },
  StatusBadge: {
    props: { status: "deployed", variant: "success", label: "Deployed", locale: "en" },
    data: ["Deployed"],
  },
  StatCard: { props: { label: "MRR", value: "12000", unit: "EUR" }, data: ["MRR", "12000", "EUR"] },
  BalanceCard: {
    props: { token: "FUSE", balance: "12.5", address: "0xabc", network: "Fuse" },
    data: ["FUSE", "12.5", "0xabc", "Fuse"],
  },
  Timeline: {
    props: {
      steps: [
        { title: "Build", status: "done" },
        { title: "Review", status: "current" },
      ],
    },
    data: ["Build", "Review"],
  },
  MessageFeed: {
    props: {
      messages: [{ sender: "pi", content: "Start the build", timestamp: "2026-10-10T08:00:00Z" }],
    },
    data: ["pi", "Start the build"],
  },
  PipelineBoard: {
    props: {
      stages: [{ id: "s", name: "Lead", deals: [{ id: "d", title: "Acme", amount: "10" }] }],
    },
    data: ["Lead", "Acme"],
  },
  TransactionPreview: {
    props: { kind: "transfer", from: "0xfrom", to: "0xto", amount: { value: "1", symbol: "FUSE" } },
    data: ["0xfrom", "0xto", "1 FUSE", "NOT SIGNED"],
  },
};

const STUB = /Markdown fallback|Rendu Markdown de secours/;

describe("createMosaicToolResult: A-1 markdown beside the ui:// resource", () => {
  it("supports the six original components and the six new views, and every one has a fixture", () => {
    expect(MOSAIC_SUPPORTED_COMPONENTS).toHaveLength(12);
    for (const name of MOSAIC_SUPPORTED_COMPONENTS) expect(fixtures, name).toHaveProperty(name);
  });

  for (const name of Object.keys(fixtures) as SupportedComponent[]) {
    for (const locale of ["en", "fr"] as const) {
      it(`${name} (${locale}): content[] = [text with the DATA, ui:// resource]`, () => {
        const f = fixtures[name];
        const r = createMosaicToolResult(name, f.props, locale);
        expect(r.content).toHaveLength(2);
        const [text, resource] = r.content as Array<{
          type: string;
          text?: string;
          resource?: { uri: string; mimeType: string };
        }>;
        expect(text?.type).toBe("text");
        expect(resource?.type).toBe("resource");
        expect(resource?.resource?.uri.startsWith("ui://mosaic/")).toBe(true);
        expect(resource?.resource?.mimeType).toBe(MOSAIC_MIME_TYPE);
        expect(text?.text?.length ?? 0).toBeGreaterThan(20);
        expect(text?.text ?? "").not.toMatch(STUB);
        if (locale === "en") {
          for (const s of f.data) expect(text?.text ?? "", s).toContain(s);
        }
      });
    }

    it(`${name}: the markdown differs between EN and FR (localised, not a copy)`, () => {
      const f = fixtures[name];
      const en = (createMosaicToolResult(name, f.props, "en").content[0] as { text: string }).text;
      const fr = (createMosaicToolResult(name, f.props, "fr").content[0] as { text: string }).text;
      expect(fr).not.toBe(en);
    });

    it(`${name}: _meta.ui.fallback is kept and equals the content[] text`, () => {
      const f = fixtures[name];
      const text = (createMosaicToolResult(name, f.props, "en").content[0] as { text: string })
        .text;
      const meta = createMosaicResource(name, f.props, "en").resource._meta as {
        ui?: { fallback?: string };
      };
      expect(meta.ui?.fallback).toBe(text);
    });
  }

  it("new views accept empty args and still return a meaningful text block", () => {
    for (const name of [
      "StatCard",
      "BalanceCard",
      "Timeline",
      "MessageFeed",
      "PipelineBoard",
      "TransactionPreview",
    ] as const) {
      const r = createMosaicToolResult(name, {}, "en");
      expect((r.content[0] as { text: string }).text.length, name).toBeGreaterThan(10);
    }
  });

  it("throws ZodError on invalid props and on an unknown component", () => {
    expect(() => createMosaicToolResult("ProgressBar", { value: 999, label: "x" }, "en")).toThrow(
      ZodError,
    );
    // @ts-expect-error runtime guard
    expect(() => createMosaicToolResult("Nope", {}, "en")).toThrow(/unknown component/);
  });
});
