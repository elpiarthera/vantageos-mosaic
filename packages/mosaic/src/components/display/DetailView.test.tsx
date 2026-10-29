import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { BAD_FRAGMENT, wcagViolations } from "../../__tests__/axe";
import { DetailView } from "./DetailView";
import { detailViewToMarkdown } from "./DetailView.markdown";
import {
  type DetailViewProps,
  DetailViewPropsSchema,
  validateDetailViewProps,
} from "./DetailView.schema";

afterEach(cleanup);

const props: DetailViewProps = {
  title: "Condo",
  sections: [
    {
      id: "id",
      title: "Identity",
      fields: [
        { label: "Name", value: "Les Lilas" },
        { label: "Balance", value: "15234.80", format: { type: "money", currency: "EUR" } },
        { label: "Since", value: "2023-01-01", format: { type: "date" } },
        { label: "Active", value: true, format: { type: "boolean" } },
        { label: "Nothing", value: null },
      ],
    },
    {
      id: "lots",
      title: "Lots",
      table: {
        columns: [
          { key: "code", header: "Code" },
          { key: "area", header: "Area", path: "a.m2", format: { type: "number" } },
        ],
        rows: [{ code: "A1", a: { m2: 54.2 } }],
      },
    },
  ],
};

describe("DetailView (G1)", () => {
  it("renders a labelled article with section headings and a description list", () => {
    render(<DetailView {...props} />);
    expect(screen.getByRole("article", { name: "Condo" })).toBeTruthy();
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Condo",
      "Identity",
      "Lots",
    ]);
    const terms = document.querySelectorAll("dt");
    const defs = document.querySelectorAll("dd");
    expect(terms.length).toBe(5);
    expect(defs.length).toBe(5);
    expect(terms[1]?.textContent).toBe("Balance");
    expect(defs[1]?.textContent).toBe("€15,234.80");
    expect(defs[2]?.textContent).toBe("Jan 1, 2023");
    expect(defs[3]?.textContent).toBe("Yes");
    expect(defs[4]?.textContent).toBe("—");
  });

  it("renders the nested table with path and format, named after its section", () => {
    render(<DetailView {...props} />);
    const table = screen.getByRole("table", { name: "Lots" });
    expect(within(table).queryAllByText("54.2")).toHaveLength(1);
    expect(within(table).queryAllByText("A1")).toHaveLength(1);
  });

  it("localises the chrome and the formats (FR)", () => {
    render(<DetailView {...props} locale="fr" />);
    expect(document.querySelector("article")?.getAttribute("lang")).toBe("fr");
    expect(screen.queryAllByText("Oui")).toHaveLength(1);
    expect(screen.queryAllByText("1 janv. 2023")).toHaveLength(1);
  });

  it("a record with sections but no title is named by the library title", () => {
    render(
      <DetailView sections={[{ id: "a", title: "A", fields: [{ label: "L", value: "v" }] }]} />,
    );
    expect(screen.getByRole("article", { name: "Detail" })).toBeTruthy();
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual(["A"]);
  });

  it("accepts {} and says there is nothing to show", () => {
    render(<DetailView />);
    expect(screen.queryAllByText("No detail to display")).toHaveLength(1);
  });

  it("shows a Skeleton while loading", () => {
    render(<DetailView {...props} loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryAllByText("Condo")).toHaveLength(0);
  });

  it("renders an alert on invalid props rather than throwing", () => {
    render(<DetailView sections={"no" as unknown as DetailViewProps["sections"]} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });

  it("axe finds 0 WCAG A/AA violations (and the harness does find a known-bad fragment)", async () => {
    const bad = document.createElement("div");
    bad.innerHTML = BAD_FRAGMENT;
    document.body.appendChild(bad);
    expect((await wcagViolations(bad)).length).toBeGreaterThan(0);
    bad.remove();
    const { container } = render(<DetailView {...props} />);
    expect(await wcagViolations(container)).toEqual([]);
  });
});

describe("DetailView schema + markdown twin", () => {
  it("defaults every field so {} parses", () => {
    expect(DetailViewPropsSchema.parse({})).toMatchObject({
      title: "",
      sections: [],
      locale: "en",
    });
    expect(validateDetailViewProps({}).loading).toBe(false);
  });

  it("refuses a section with a bad format", () => {
    expect(
      DetailViewPropsSchema.safeParse({
        sections: [
          { id: "a", title: "A", fields: [{ label: "x", value: 1, format: { type: "money" } }] },
        ],
      }).success,
    ).toBe(false);
  });

  it("produces markdown with a heading, sections, bold labels and a table", () => {
    const md = detailViewToMarkdown(props, "en");
    expect(md).toContain("# Condo");
    expect(md).toContain("## Identity");
    expect(md).toContain("- **Balance**: €15,234.80");
    expect(md).toContain("| Code | Area |");
    expect(md).toContain("| A1 | 54.2 |");
  });

  it("escapes untrusted text and never emits a live link", () => {
    const md = detailViewToMarkdown({
      title: "T",
      sections: [
        { id: "a", title: "A", fields: [{ label: "L", value: "[x](http://evil.test) **b**" }] },
      ],
    });
    expect(md).not.toContain("](http://evil.test)");
    expect(md).toContain("\\[x\\]");
  });

  it("states emptiness for {} and localises (FR)", () => {
    expect(detailViewToMarkdown({}, "fr")).toContain("Aucun détail à afficher");
  });
});
