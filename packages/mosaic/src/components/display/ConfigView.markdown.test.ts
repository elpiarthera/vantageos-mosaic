import { describe, expect, it } from "vitest";
import { REMOVE, mutated } from "../../__tests__/mutate";
import {
  DETAIL_CONFIG,
  DETAIL_PAYLOAD,
  LIST_CONFIG,
  LIST_PAYLOAD,
} from "../../view-config/fixtures";
import { ViewConfigError } from "../../view-config/view-config";
import { configToMarkdown } from "./ConfigView.markdown";

describe("configToMarkdown (A-1 fallback)", () => {
  it("list: title, labelled header, formatted rows, and the cursor to continue", () => {
    const md = configToMarkdown(LIST_CONFIG, LIST_PAYLOAD, "en");
    expect(md).toContain("# Tenant contracts");
    expect(md).toContain(
      "| Reference | Type | Tenant | Lots | Start | End | Rent incl. VAT | Signed |",
    );
    expect(md).toContain("BAIL-001");
    expect(md).toContain("Lease");
    expect(md).toContain("A1, B2");
    expect(md).toContain("May 1, 2024");
    expect(md).toContain("€1,234.50");
    expect(md).toContain("cursor");
    expect(md).toContain("cur-2");
  });

  it("list: FR labels", () => {
    const md = configToMarkdown(LIST_CONFIG, LIST_PAYLOAD, "fr");
    expect(md).toContain("# Contrats locataires");
    expect(md).toContain("| Référence |");
    expect(md).toContain("Oui");
  });

  it("list: empty message and the 'more rows' summary beyond the cap", () => {
    expect(configToMarkdown(LIST_CONFIG, { contracts: [] }, "fr")).toContain(
      "Aucun contrat ne correspond à ces filtres.",
    );
    const many = {
      contracts: Array.from({ length: 55 }, (_, i) => ({ id: `r${i}`, reference: `R${i}` })),
    };
    const md = configToMarkdown(LIST_CONFIG, many, "en");
    expect(md).toContain("5 more rows");
    expect(md).not.toContain("| R54 |");
  });

  it("list: library empty message when the config has none", () => {
    const cfg = mutated(LIST_CONFIG, "emptyMessage", REMOVE);
    expect(configToMarkdown(cfg, { contracts: [] }, "en")).toContain("No data to display");
  });

  it("list: truncation notice, default cursor argument name, incomplete totals without a note", () => {
    const cfg = {
      ...mutated(LIST_CONFIG, "paging", { cursorPath: "nextCursor", truncatedPath: "truncated" }),
      totalsScope: { completePath: "c" },
    };
    const md = configToMarkdown(cfg, { ...LIST_PAYLOAD, truncated: true, c: false }, "en");
    expect(md).toContain("Results are truncated");
    expect(md).toContain("cursor = ` cur-2 `");
    expect(md).toContain("Totals are incomplete");
  });

  it("list: an empty note adds nothing to the incomplete warning", () => {
    const cfg = { ...LIST_CONFIG, totalsScope: { completePath: "c", notePath: "n" } };
    const md = configToMarkdown(cfg, { ...LIST_PAYLOAD, c: false, n: "" }, "en");
    expect(md).toContain("Totals are incomplete\n");
  });

  it("list: no cursor line once exhausted", () => {
    const md = configToMarkdown(
      LIST_CONFIG,
      { ...LIST_PAYLOAD, nextCursor: null, exhausted: true },
      "en",
    );
    expect(md).not.toContain("cur-2");
  });

  it("list: escapes untrusted cell text", () => {
    const md = configToMarkdown(
      LIST_CONFIG,
      { contracts: [{ id: "x", reference: "[a](http://evil.test)" }] },
      "en",
    );
    expect(md).not.toContain("](http://evil.test)");
  });

  it("list: totals appear with the incomplete warning", () => {
    const cfg = {
      ...LIST_CONFIG,
      totals: [
        {
          path: "t",
          label: { en: "Total", fr: "Total" },
          format: { type: "money", currency: "EUR" },
        },
      ],
      totalsScope: { completePath: "c", notePath: "n" },
    };
    const md = configToMarkdown(cfg, { ...LIST_PAYLOAD, t: 10, c: false, n: "page only" }, "en");
    expect(md).toContain("- **Total**: €10.00");
    expect(md).toContain("Totals are incomplete");
    expect(md).toContain("page only");
  });

  it("detail: sections, labelled values, nested table", () => {
    const md = configToMarkdown(DETAIL_CONFIG, DETAIL_PAYLOAD, "en");
    expect(md).toContain("# Condominium");
    expect(md).toContain("## Identity");
    expect(md).toContain("- **Name**: Résidence des Lilas");
    expect(md).toContain("- **Treasury balance**: €15,234.80");
    expect(md).toContain("| Code | Type | Living area \\(m²\\) |");
    expect(md).toContain("| A1 | Apartment | 54.2 |");
  });

  it("detail: several records are listed one after the other; none says so", () => {
    const two = {
      condominiums: [
        { id: "a", title: "A" },
        { id: "b", title: "B" },
      ],
    };
    const md = configToMarkdown(DETAIL_CONFIG, two, "en");
    expect(md).toContain("- **Name**: A");
    expect(md).toContain("- **Name**: B");
    expect(configToMarkdown(DETAIL_CONFIG, { condominiums: [] }, "fr")).toContain(
      "Aucun enregistrement à afficher",
    );
  });

  it("is loud: an invalid config or a payload that does not match throws", () => {
    expect(() => configToMarkdown({}, {}, "en")).toThrow(ViewConfigError);
    expect(() => configToMarkdown(LIST_CONFIG, {}, "en")).toThrow(ViewConfigError);
    expect(() => configToMarkdown(DETAIL_CONFIG, {}, "en")).toThrow(ViewConfigError);
    expect(() =>
      configToMarkdown(DETAIL_CONFIG, { condominiums: [{ lots_listed: "x" }] }, "en"),
    ).toThrow(ViewConfigError);
  });
});
