import { describe, expect, it } from "vitest";
import { REMOVE, mutated } from "../__tests__/mutate";
import { DETAIL_CONFIG, LIST_CONFIG, LIST_PAYLOAD } from "./fixtures";
import {
  type ListViewConfig,
  ViewConfigError,
  ViewConfigSchema,
  actionVisible,
  assertViewConfig,
  listRows,
  pagingState,
  parseViewConfig,
  pick,
  resolveActionArgs,
  toColumnDefs,
  toolErrorText,
} from "./view-config";

describe("ViewConfigSchema: accepts the section E examples", () => {
  it("list", () => {
    expect(ViewConfigSchema.safeParse(LIST_CONFIG).success).toBe(true);
  });
  it("detail", () => {
    expect(ViewConfigSchema.safeParse(DETAIL_CONFIG).success).toBe(true);
  });
});

describe("ViewConfigSchema: refuses an invalid config (one case per rule)", () => {
  const cases: Array<[string, unknown, string, unknown, RegExp]> = [
    ["wrong schemaVersion", LIST_CONFIG, "schemaVersion", 2, /schemaVersion/],
    ["missing tool", LIST_CONFIG, "tool", REMOVE, /tool/],
    ["unknown kind", LIST_CONFIG, "kind", "grid", /kind/],
    ["unknown top-level key", LIST_CONFIG, "surprise", 1, /surprise|Unrecognized/],
    ["label missing fr", LIST_CONFIG, "title.fr", REMOVE, /title/],
    ["column label missing en", LIST_CONFIG, "columns.0.label.en", REMOVE, /columns/],
    ["list without columns", LIST_CONFIG, "columns", [], /columns/],
    ["list carrying sections", LIST_CONFIG, "sections", [], /sections|Unrecognized/],
    ["detail without sections", DETAIL_CONFIG, "sections", [], /sections/],
    ["detail carrying columns", DETAIL_CONFIG, "columns", [], /columns|Unrecognized/],
    [
      "section with neither fields nor table",
      DETAIL_CONFIG,
      "sections.0.fields",
      REMOVE,
      /sections/,
    ],
    ["money without currency", LIST_CONFIG, "columns.6.format.currency", REMOVE, /currency/],
    ["enum without map", LIST_CONFIG, "columns.1.format.map", REMOVE, /map/],
    ["unknown format type", LIST_CONFIG, "columns.4.format.type", "color", /format/],
    ["defaultSort names no column", LIST_CONFIG, "defaultSort.column", "nope", /defaultSort/],
    ["duplicate column ids", LIST_CONFIG, "columns.1.id", "reference", /columns/],
    ["bad sort direction", LIST_CONFIG, "defaultSort.direction", "up", /direction/],
    ["page size not positive", LIST_CONFIG, "paging.pageSize", 0, /pageSize/],
    [
      "list action using a $. reference",
      LIST_CONFIG,
      "rowActions.0.args.lease_id",
      "$.id",
      /rowActions/,
    ],
    [
      "detail action using a $row. reference",
      DETAIL_CONFIG,
      "rowActions.0.args.condominium_id",
      "$row.id",
      /rowActions/,
    ],
    ["unknown $ reference", LIST_CONFIG, "rowActions.0.args.lease_id", "$other.id", /rowActions/],
    ["object-valued arg", LIST_CONFIG, "rowActions.0.args.lease_id", { a: 1 }, /rowActions/],
    ["action without label", LIST_CONFIG, "rowActions.0.label", REMOVE, /rowActions/],
  ];
  for (const [name, base, path, value, rx] of cases) {
    it(name, () => {
      const r = parseViewConfig(mutated(base, path, value));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.issues.length).toBeGreaterThan(0);
        expect(r.issues.join("\n")).toMatch(rx);
      }
    });
  }
  it("a non-object is refused", () => {
    expect(parseViewConfig(null).ok).toBe(false);
    expect(parseViewConfig("x").ok).toBe(false);
  });
  it("assertViewConfig throws ViewConfigError carrying the issues", () => {
    expect(() => assertViewConfig({})).toThrow(ViewConfigError);
    try {
      assertViewConfig({});
    } catch (e) {
      expect((e as ViewConfigError).issues.length).toBeGreaterThan(0);
    }
    expect(assertViewConfig(LIST_CONFIG).kind).toBe("list");
  });
  it("accepts literal args and the disabled flag", () => {
    const c = mutated(LIST_CONFIG, "rowActions.0", {
      tool: "t",
      args: { a: 1, b: true, c: null, d: "plain" },
      label: { en: "x", fr: "y" },
      disabled: true,
    });
    expect(parseViewConfig(c).ok).toBe(true);
  });
});

function asList(raw: unknown): ListViewConfig {
  const c = assertViewConfig(raw);
  if (c.kind !== "list") throw new Error("list expected");
  return c;
}

describe("helpers", () => {
  it("pick returns the label of the locale", () => {
    expect(pick({ en: "a", fr: "b" }, "fr")).toBe("b");
    expect(pick({ en: "a", fr: "b" }, "en")).toBe("a");
  });
  it("toColumnDefs maps id/path/label/format/sortable/align", () => {
    const cfg = asList(LIST_CONFIG);
    const cols = toColumnDefs(cfg.columns, "fr");
    expect(cols[0]).toMatchObject({ key: "reference", path: "reference", header: "Référence" });
    expect(cols[0]?.sortable).toBe(true);
    expect(cols[6]).toMatchObject({ key: "rent", align: "end", format: { type: "money" } });
  });
  it("listRows reads the rows at dataPath and refuses anything else", () => {
    const cfg = asList(LIST_CONFIG);
    const ok = listRows(cfg, LIST_PAYLOAD);
    expect(ok.ok && ok.rows.length).toBe(2);
    expect(listRows(cfg, {}).ok).toBe(false);
    expect(listRows(cfg, { contracts: "x" }).ok).toBe(false);
  });
  it("pagingState reads cursor, exhausted, truncated", () => {
    const cfg = asList(LIST_CONFIG);
    expect(pagingState(cfg, LIST_PAYLOAD)).toEqual({
      cursor: "cur-2",
      exhausted: false,
      truncated: false,
    });
    expect(pagingState(cfg, { nextCursor: null, exhausted: true, truncated: true })).toEqual({
      cursor: undefined,
      exhausted: true,
      truncated: true,
    });
    expect(pagingState(cfg, { nextCursor: "" })).toMatchObject({ cursor: undefined });
  });
  it("pagingState without paging config has no cursor", () => {
    const c = mutated(LIST_CONFIG, "paging", REMOVE);
    expect(pagingState(asList(c), LIST_PAYLOAD)).toEqual({
      cursor: undefined,
      exhausted: true,
      truncated: false,
    });
  });
  it("resolveActionArgs resolves $row. and $. references, keeps literals", () => {
    expect(resolveActionArgs({ id: "$row.id", n: 3, k: "x" }, { row: { id: "c1" } })).toEqual({
      ok: true,
      args: { id: "c1", n: 3, k: "x" },
    });
    expect(resolveActionArgs({ id: "$.a.b" }, { record: { a: { b: 9 } } })).toEqual({
      ok: true,
      args: { id: 9 },
    });
  });
  it("resolveActionArgs names the missing reference instead of sending undefined", () => {
    expect(resolveActionArgs({ id: "$row.id" }, { row: {} })).toEqual({
      ok: false,
      missing: "$row.id",
    });
    expect(resolveActionArgs({ id: "$.id" }, { record: { id: null } })).toEqual({
      ok: false,
      missing: "$.id",
    });
  });
  it("actionVisible: no `when` is visible; `when` needs a non-null path", () => {
    expect(actionVisible({}, { row: {} })).toBe(true);
    expect(actionVisible({ when: "x" }, { row: { x: 1 } })).toBe(true);
    expect(actionVisible({ when: "x" }, { row: { x: null } })).toBe(false);
    expect(actionVisible({ when: "x" }, { record: {} })).toBe(false);
    expect(actionVisible({ when: "x" }, { record: { x: 0 } })).toBe(true);
  });
  it("toolErrorText joins the text blocks, never throws on odd content", () => {
    expect(
      toolErrorText({
        isError: true,
        content: [{ type: "text", text: "boom" }, { type: "image" }],
      }),
    ).toBe("boom");
    expect(toolErrorText({ isError: true })).toBe("");
  });
});
