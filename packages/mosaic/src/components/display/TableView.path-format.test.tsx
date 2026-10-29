import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { TableView } from "./TableView";
import { tableViewToMarkdown } from "./TableView.markdown";
import { ColumnDefSchema, TableViewPropsSchema } from "./TableView.schema";

afterEach(cleanup);

const rows = [
  { ref: "b", meta: { amount: 1200.5, day: "2024-05-01", ok: true }, kind: "Bail" },
  { ref: "a", meta: { amount: 99, day: "2025-01-15", ok: false }, kind: "Vacant" },
];

describe("ColumnDef path + format (G2)", () => {
  it("renders a nested path with a money format", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={rows}
        columns={[
          {
            key: "amt",
            header: "Amount",
            path: "meta.amount",
            format: { type: "money", currency: "EUR" },
          },
        ]}
      />,
    );
    expect(screen.queryAllByText("€1,200.50")).toHaveLength(1);
    expect(screen.queryAllByText("€99.00")).toHaveLength(1);
  });

  it("renders date, boolean and enum formats in the locale", () => {
    render(
      <TableView
        ariaLabel="t"
        locale="fr"
        rows={rows}
        columns={[
          { key: "d", header: "D", path: "meta.day", format: { type: "date" } },
          { key: "o", header: "O", path: "meta.ok", format: { type: "boolean" } },
          {
            key: "k",
            header: "K",
            path: "kind",
            format: { type: "enum", map: { Bail: { en: "Lease", fr: "Bail loué" } } },
          },
        ]}
      />,
    );
    expect(screen.queryAllByText("1 mai 2024")).toHaveLength(1);
    expect(screen.queryAllByText("Oui")).toHaveLength(1);
    expect(screen.queryAllByText("Bail loué")).toHaveLength(1);
    expect(screen.queryAllByText("Vacant")).toHaveLength(1);
  });

  it("a format-less column keeps the flat-key behaviour (back-compat)", () => {
    render(<TableView ariaLabel="t" rows={rows} columns={[{ key: "ref", header: "Ref" }]} />);
    expect(screen.queryAllByText("a")).toHaveLength(1);
  });

  it("a path alone reads the nested value as plain text", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={rows}
        columns={[{ key: "x", header: "X", path: "meta.day" }]}
      />,
    );
    expect(screen.queryAllByText("2024-05-01")).toHaveLength(1);
  });

  it("a missing value under a format shows a dash", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={[{ ref: "z" }]}
        columns={[{ key: "d", header: "D", path: "nope.day", format: { type: "date" } }]}
      />,
    );
    expect(screen.queryAllByText("—")).toHaveLength(1);
  });

  it("sorts a money column by the raw number, not the formatted text", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={rows}
        columns={[
          {
            key: "amt",
            header: "Amount",
            path: "meta.amount",
            sortable: true,
            format: { type: "money", currency: "EUR" },
          },
        ]}
        defaultSort={{ key: "amt", direction: "asc" }}
      />,
    );
    const cells = screen.getAllByRole("cell").map((c) => c.textContent);
    expect(cells).toEqual(["€99.00", "€1,200.50"]);
  });

  it("sorts by a nested path on a header click", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={rows}
        columns={[
          { key: "d", header: "Day", path: "meta.day", sortable: true, format: { type: "date" } },
        ]}
      />,
    );
    const button = screen.getByRole("button", { name: /Sort by Day/ });
    fireEvent.click(button);
    fireEvent.click(button);
    const first = within(screen.getAllByRole("row")[1] as HTMLElement).getByRole("cell");
    expect(first.textContent).toBe("Jan 15, 2025");
  });

  it("right-aligns numeric formats", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={rows}
        columns={[{ key: "n", header: "N", path: "meta.amount", format: { type: "number" } }]}
      />,
    );
    expect((screen.getAllByRole("cell")[0] as HTMLElement).style.textAlign).toBe("end");
  });

  it("rowKey keys rows by a path (selection survives a re-sort)", () => {
    const seen: string[][] = [];
    render(
      <TableView
        ariaLabel="t"
        rows={rows}
        rowKey="ref"
        selectionMode="multiple"
        onSelectionChange={(_r, keys) => seen.push(keys)}
        columns={[{ key: "ref", header: "Ref" }]}
      />,
    );
    fireEvent.click(screen.getAllByRole("checkbox")[1] as HTMLElement);
    expect(seen[0]).toEqual(["b"]);
  });

  it("the selection label of a row with no value in the first column is still named", () => {
    render(
      <TableView
        ariaLabel="t"
        rows={[{ id: "r1" }]}
        selectionMode="multiple"
        columns={[{ key: "x", header: "X", path: "nope" }]}
      />,
    );
    expect(screen.queryAllByRole("checkbox", { name: "Select row:" })).toHaveLength(1);
  });

  it("the schema keeps path and format, and refuses a bad format", () => {
    const ok = ColumnDefSchema.parse({
      key: "a",
      header: "A",
      path: "x.y",
      format: { type: "date" },
    });
    expect(ok).toMatchObject({ path: "x.y", format: { type: "date" } });
    expect(
      ColumnDefSchema.safeParse({ key: "a", header: "A", format: { type: "money" } }).success,
    ).toBe(false);
    expect(
      TableViewPropsSchema.safeParse({
        columns: [{ key: "a", header: "A", path: "" }],
        ariaLabel: "x",
      }).success,
    ).toBe(false);
  });

  it("a sensitive column cannot use a path (the secret split reads the flat key)", () => {
    const r = ColumnDefSchema.safeParse({ key: "a", header: "A", path: "x.y", sensitive: true });
    expect(r.success).toBe(false);
  });

  it("an invalid format renders the invalid-props alert instead of throwing", () => {
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    const bad: any = { key: "a", header: "A", format: { type: "money" } };
    render(<TableView ariaLabel="t" rows={rows} columns={[bad]} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
});

describe("tableViewToMarkdown with path + format", () => {
  it("uses the path and the formatted text, in the locale", () => {
    const md = tableViewToMarkdown(
      {
        ariaLabel: "t",
        columns: [
          {
            key: "amt",
            header: "Montant",
            path: "meta.amount",
            format: { type: "money", currency: "EUR" },
          },
          { key: "ref", header: "Ref" },
        ],
        rows,
      },
      "fr",
    );
    expect(md).toMatch(/1\s234,50|1\s200,50/);
    expect(md).toContain("| a |");
  });
});
