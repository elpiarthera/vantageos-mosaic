import { describe, expect, it } from "vitest";
import { type ZodTypeAny, z } from "zod";
import {
  MOSAIC_NEVER_SERIALISE,
  MOSAIC_SUPPORTED_COMPONENTS,
  MosaicSecretLeakError,
  type SupportedComponent,
  createMosaicResource,
  createMosaicToolResult,
  tokenDisplayOnceModalToMarkdown,
} from "./create-mosaic-resource";

// Ruling: the A-1 fallback must NEVER carry a secret. `content[]` text reaches the model's
// context; `annotations.audience: ["user"]` is a hint hosts may ignore, so it is not a control.
const SECRET = "tok_live_SECRET_9f8e7d6c5b4a";
const tokenProps = {
  token: SECRET,
  title: "Deploy key",
  warningMessage: "Copy it now",
  copyLabel: "Copy",
  closeLabel: "Close",
  scope: "repo:read",
  expiresAt: "2026-12-31",
  fingerprint: "SHA256:ab12cd",
};

describe("TokenDisplayOnceModal fallback carries everything EXCEPT the secret", () => {
  for (const locale of ["en", "fr"] as const) {
    it(`(${locale}) the secret appears nowhere in content[] (text, resource text, resource _meta)`, () => {
      const r = createMosaicToolResult("TokenDisplayOnceModal", tokenProps, locale);
      expect(JSON.stringify(r.content)).not.toContain(SECRET);
      expect(JSON.stringify(r.content)).not.toContain("SECRET_9f8e");
      expect(tokenDisplayOnceModalToMarkdown(tokenProps, locale)).not.toContain(SECRET);
      const ui = r.content[1] as { resource: { text: string; _meta: unknown } };
      expect(ui.resource.text).not.toContain(SECRET);
      expect(JSON.stringify(ui.resource._meta)).not.toContain(SECRET);
    });

    it(`(${locale}) carries the name, scope, expiry, supplied fingerprint and the fixed once-only sentence`, () => {
      const md = (
        createMosaicToolResult("TokenDisplayOnceModal", tokenProps, locale).content[0] as {
          text: string;
        }
      ).text;
      for (const s of ["Deploy key", "repo:read", "2026-12-31", "SHA256:ab12cd"])
        expect(md).toContain(s);
      expect(md).toContain(
        locale === "en"
          ? "The value is shown once, in the app view only."
          : "La valeur n'est affichée qu'une fois, dans la vue de l'application uniquement.",
      );
    });
  }

  it("no audience annotation is relied on any more", () => {
    const t = createMosaicToolResult("TokenDisplayOnceModal", tokenProps, "en").content[0] as {
      annotations?: unknown;
    };
    expect(t.annotations).toBeUndefined();
  });

  it("derives no fingerprint from the secret when none is supplied", () => {
    const { fingerprint: _f, ...noFp } = tokenProps;
    const md = (
      createMosaicToolResult("TokenDisplayOnceModal", noFp, "en").content[0] as { text: string }
    ).text;
    expect(md).not.toMatch(/SHA256|fingerprint/i);
  });

  it("delivers the value to the view OUTSIDE content[], in the tool result _meta", () => {
    const r = createMosaicToolResult("TokenDisplayOnceModal", tokenProps, "en") as {
      _meta?: { "mosaic/secrets"?: Record<string, unknown> };
    };
    expect(r._meta?.["mosaic/secrets"]).toEqual({ token: SECRET });
  });

  it("createMosaicResource keeps the secret out of the embedded html by default", () => {
    const html = createMosaicResource("TokenDisplayOnceModal", tokenProps, "en").resource
      .text as string;
    expect(html).not.toContain(SECRET);
  });
});

describe("fail-closed helper", () => {
  it("declares the never-serialise fields per view, exhaustively (token for the modal, none else)", () => {
    for (const name of MOSAIC_SUPPORTED_COMPONENTS)
      expect(MOSAIC_NEVER_SERIALISE, name).toHaveProperty(name);
    expect(MOSAIC_NEVER_SERIALISE.TokenDisplayOnceModal).toEqual(["token"]);
    expect(MOSAIC_NEVER_SERIALISE.StatusBadge).toEqual([]);
  });

  it("asserts a caller-declared field never reaches content[]: a leaking view throws", () => {
    const props = { value: 42, label: "Budget used" };
    expect(() =>
      createMosaicToolResult("ProgressBar", props, "en", { neverSerialise: ["label"] }),
    ).toThrow(MosaicSecretLeakError);
    expect(() => createMosaicToolResult("ProgressBar", props, "en")).not.toThrow();
  });

  it("refuses a declared field that the view does not have (a typo would assert nothing)", () => {
    expect(() =>
      createMosaicToolResult("ProgressBar", { value: 1, label: "x" }, "en", {
        neverSerialise: ["nope"],
      }),
    ).toThrow(/unknown field/);
  });

  it("the leak error names the field and never prints the value", () => {
    try {
      createMosaicToolResult("ProgressBar", { value: 1, label: "Budget used" }, "en", {
        neverSerialise: ["label"],
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("label");
      expect((e as Error).message).not.toContain("Budget used");
    }
  });
});

describe("TableView sensitive columns", () => {
  const props = {
    columns: [
      { key: "name", header: "Name" },
      { key: "apiKey", header: "API key", sensitive: true },
    ],
    rows: [{ name: "svc-a", apiKey: "sk_live_ROW_SECRET_001" }],
    ariaLabel: "Keys",
  };
  it("masks the column in markdown, strips it from the embedded props, and delivers it via _meta", () => {
    const r = createMosaicToolResult("TableView", props, "en") as {
      content: unknown[];
      _meta?: { "mosaic/secrets"?: Record<string, unknown> };
    };
    expect(JSON.stringify(r.content)).not.toContain("sk_live_ROW_SECRET_001");
    expect((r.content[0] as { text: string }).text).toContain("svc-a");
    expect((r.content[0] as { text: string }).text).toContain("••••");
    expect(JSON.stringify(r._meta?.["mosaic/secrets"])).toContain("sk_live_ROW_SECRET_001");
  });
});

// Census: the sensitive-name domain is DERIVED from the schemas, not recalled.
const SENSITIVE = /secret|token|password|apiKey|key|credential|private/i;
function fieldNames(schema: ZodTypeAny, path: string, out: string[]): void {
  if (schema instanceof z.ZodObject) {
    for (const [k, v] of Object.entries(schema.shape as Record<string, ZodTypeAny>)) {
      out.push(`${path}.${k}`);
      fieldNames(v, `${path}.${k}`, out);
    }
  } else if (schema instanceof z.ZodArray) fieldNames(schema.element, path, out);
  else if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable)
    fieldNames(schema.unwrap(), path, out);
  else if (schema instanceof z.ZodDefault) fieldNames(schema._def.innerType, path, out);
}
const VERDICTS: Record<string, string> = {
  "TokenDisplayOnceModal.token":
    "SECRET: excluded from markdown, html and content[]; delivered via _meta",
  "BalanceCard.token": "public token SYMBOL (e.g. FUSE), not a credential",
  "BalanceCard.tokenAddress": "public on-chain contract address",
  "TableView.columns.key": "column property NAME, not a value",
  "TableView.sort.key": "column property NAME, not a value",
  "TableView.rows":
    "row values of columns not flagged sensitive; flagged columns are masked/stripped",
};

describe("sensitive-field census over every supported schema", () => {
  it("every field whose name matches the sensitive pattern has a recorded verdict", () => {
    const schemas: Record<string, ZodTypeAny> = {};
    // the schema registry is private; derive it from a parse-able round trip via each view's file
    for (const name of MOSAIC_SUPPORTED_COMPONENTS)
      schemas[name] = SCHEMAS[name as SupportedComponent];
    const unknown: string[] = [];
    for (const [name, schema] of Object.entries(schemas)) {
      const names: string[] = [];
      fieldNames(schema, name, names);
      for (const n of names) {
        const leaf = n.split(".").at(-1) ?? "";
        if (SENSITIVE.test(leaf) && !(n in VERDICTS)) unknown.push(n);
      }
    }
    expect(unknown).toEqual([]);
  });
});
import { MarkdownRendererPropsSchema } from "../components/artifacts/MarkdownRenderer.schema";
import { TokenDisplayOnceModalPropsSchema } from "../components/confirmation/TokenDisplayOnceModal.schema";
import { TransactionPreviewPropsSchema } from "../components/confirmation/TransactionPreview.schema";
import { BalanceCardPropsSchema } from "../components/display/BalanceCard.schema";
import { MessageFeedPropsSchema } from "../components/display/MessageFeed.schema";
import { PipelineBoardPropsSchema } from "../components/display/PipelineBoard.schema";
import { StatCardPropsSchema } from "../components/display/StatCard.schema";
import { TableViewPropsSchema } from "../components/display/TableView.schema";
import { ConfirmDialogPropsSchema } from "../components/input/ConfirmDialog.schema";
import { StatusBadgePropsSchema } from "../components/media/StatusBadge.schema";
import { ProgressBarPropsSchema } from "../components/progress/ProgressBar.schema";
import { TimelinePropsSchema } from "../components/progress/Timeline.schema";
const SCHEMAS: Record<SupportedComponent, ZodTypeAny> = {
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
};
