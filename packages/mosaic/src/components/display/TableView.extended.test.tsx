import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableView } from "./TableView";
import type { TableViewProps } from "./TableView.schema";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (opts: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, i) => ({
        index: i,
        start: i * opts.estimateSize(),
        size: opts.estimateSize(),
        end: (i + 1) * opts.estimateSize(),
        lane: 0,
        key: i,
      })),
    getTotalSize: () => opts.count * opts.estimateSize(),
  }),
}));

afterEach(cleanup);

type Row = { id?: number; name: string; amount?: string; symbol?: string; logo?: string };

const rows: Row[] = [
  { id: 1, name: "Charlie", amount: "10", symbol: "CCC", logo: "https://x.example/c.png" },
  { id: 2, name: "alpha", amount: "9", symbol: "AAA", logo: "javascript:alert(1)" },
  { id: 3, name: "Bravo", amount: "1.10", symbol: "BBB" },
];

const columns: TableViewProps<Row>["columns"] = [
  { key: "name", header: "Name", sortable: true },
  { key: "amount", header: "Amount", type: "amount", sortable: true },
  { key: "symbol", header: "Symbol" },
];

function bodyNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).queryAllByRole("cell")[0]?.textContent ?? "");
}

describe("TableView extension: sort (R01)", () => {
  it("renders a sort button only on sortable columns, named from the header", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" />);
    expect(screen.queryAllByRole("button", { name: /sort by/i })).toHaveLength(2);
    expect(screen.queryAllByRole("button", { name: /sort by symbol/i })).toHaveLength(0);
  });

  it("cycles asc -> desc -> original order, exposing aria-sort", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" />);
    const btn = () => screen.getAllByRole("button", { name: /sort by name/i })[0] as HTMLElement;
    const th = () => screen.getAllByRole("columnheader")[0] as HTMLElement;
    expect(th().getAttribute("aria-sort")).toBe("none");
    fireEvent.click(btn());
    expect(bodyNames()).toEqual(["alpha", "Bravo", "Charlie"]);
    expect(th().getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(btn());
    expect(bodyNames()).toEqual(["Charlie", "Bravo", "alpha"]);
    expect(th().getAttribute("aria-sort")).toBe("descending");
    fireEvent.click(btn());
    expect(bodyNames()).toEqual(["Charlie", "alpha", "Bravo"]);
    expect(th().getAttribute("aria-sort")).toBe("none");
  });

  it("sorts amount columns as exact decimals", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" />);
    fireEvent.click(screen.getAllByRole("button", { name: /sort by amount/i })[0] as HTMLElement);
    expect(bodyNames()).toEqual(["alpha", "Bravo", "Charlie"]);
  });

  it("reports sort changes and honours a controlled sort", () => {
    const onSortChange = vi.fn();
    const { rerender } = render(
      <TableView columns={columns} rows={rows} ariaLabel="t" onSortChange={onSortChange} />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /sort by name/i })[0] as HTMLElement);
    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: "asc" });
    rerender(
      <TableView
        columns={columns}
        rows={rows}
        ariaLabel="t"
        sort={{ key: "name", direction: "desc" }}
      />,
    );
    expect(bodyNames()).toEqual(["Charlie", "Bravo", "alpha"]);
  });

  it("localises the sort button (FR)", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" locale="fr" />);
    expect(screen.queryAllByRole("button", { name: /trier par name/i })).toHaveLength(1);
  });
});

describe("TableView extension: selection (R01)", () => {
  it("adds no selection column by default", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("multiple: one checkbox per row plus select-all; reports the selected rows in table order", () => {
    const onSelectionChange = vi.fn();
    render(
      <TableView
        columns={columns}
        rows={rows}
        ariaLabel="t"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    const boxes = screen.queryAllByRole("checkbox");
    expect(boxes).toHaveLength(4);
    fireEvent.click(screen.getByRole("checkbox", { name: /select row: bravo/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /select row: charlie/i }));
    const [selectedRows, keys] = onSelectionChange.mock.calls.at(-1) as [Row[], string[]];
    expect(selectedRows.map((r) => r.name)).toEqual(["Charlie", "Bravo"]);
    expect(keys.sort()).toEqual(["1", "3"]);
    const all = screen.getByRole("checkbox", { name: /select all/i }) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    fireEvent.click(all);
    expect((onSelectionChange.mock.calls.at(-1) as [Row[]])[0]).toHaveLength(3);
    fireEvent.click(all);
    expect((onSelectionChange.mock.calls.at(-1) as [Row[]])[0]).toHaveLength(0);
  });

  it("single: radio inputs, selecting replaces the previous one", () => {
    const onSelectionChange = vi.fn();
    render(
      <TableView
        columns={columns}
        rows={rows}
        ariaLabel="t"
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(screen.queryAllByRole("radio")).toHaveLength(3);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    fireEvent.click(screen.getByRole("radio", { name: /select row: alpha/i }));
    fireEvent.click(screen.getByRole("radio", { name: /select row: bravo/i }));
    expect((onSelectionChange.mock.calls.at(-1) as [Row[]])[0].map((r) => r.name)).toEqual([
      "Bravo",
    ]);
  });

  it("keeps selection attached to rows across a re-sort", () => {
    const onSelectionChange = vi.fn();
    render(
      <TableView
        columns={columns}
        rows={rows}
        ariaLabel="t"
        selectionMode="multiple"
        defaultSelectedKeys={["3"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /sort by name/i })[0] as HTMLElement);
    const box = screen.getByRole("checkbox", { name: /select row: bravo/i }) as HTMLInputElement;
    expect(box.checked).toBe(true);
  });

  it("uses the ORIGINAL index as key for rows without an id", () => {
    const onSelectionChange = vi.fn();
    const noId = [{ name: "Zed" }, { name: "Amy" }];
    render(
      <TableView
        columns={[{ key: "name", header: "Name", sortable: true }]}
        rows={noId}
        ariaLabel="t"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /sort by name/i })[0] as HTMLElement);
    fireEvent.click(screen.getByRole("checkbox", { name: /select row: amy/i }));
    expect((onSelectionChange.mock.calls.at(-1) as [unknown, string[]])[1]).toEqual(["row-1"]);
  });

  it("a selection click does not trigger onRowClick", () => {
    const onRowClick = vi.fn();
    render(
      <TableView
        columns={columns}
        rows={rows}
        ariaLabel="t"
        selectionMode="multiple"
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /select row: alpha/i }));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("localises selection labels (FR)", () => {
    render(
      <TableView columns={columns} rows={rows} ariaLabel="t" selectionMode="multiple" locale="fr" />,
    );
    expect(screen.queryAllByRole("checkbox", { name: /tout sélectionner/i })).toHaveLength(1);
    expect(screen.queryAllByRole("checkbox", { name: /sélectionner la ligne/i })).toHaveLength(3);
  });

  it("supports selection and sort in virtual mode", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `N${30 - i}` }));
    const onSelectionChange = vi.fn();
    render(
      <TableView
        columns={[{ key: "name", header: "Name", sortable: true }]}
        rows={many}
        virtualizeThreshold={10}
        ariaLabel="t"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(document.querySelector('[data-virtual="true"]')).not.toBeNull();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(31);
    fireEvent.click(screen.getAllByRole("button", { name: /sort by name/i })[0] as HTMLElement);
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("N1");
  });
});

describe("TableView extension: layout (R01 / R10)", () => {
  it("aligns amount/number columns to the end by default and honours explicit align + width", () => {
    render(
      <TableView
        columns={[
          { key: "name", header: "Name" },
          { key: "amount", header: "Amount", type: "amount" },
          { key: "symbol", header: "Symbol", align: "center", width: 80 },
        ]}
        rows={rows}
        ariaLabel="t"
      />,
    );
    const heads = screen.getAllByRole("columnheader");
    expect((heads[0] as HTMLElement).style.textAlign).toBe("start");
    expect((heads[1] as HTMLElement).style.textAlign).toBe("end");
    expect((heads[2] as HTMLElement).style.textAlign).toBe("center");
    expect((heads[2] as HTMLElement).style.width).toBe("80px");
    const cell = screen.getAllByRole("row")[1]?.querySelectorAll("td")[1] as HTMLElement;
    expect(cell.style.textAlign).toBe("end");
  });

  it("renders amount cells as the exact decimal string, never reformatted through a float", () => {
    render(
      <TableView
        columns={[{ key: "amount", header: "Amount", type: "amount" }]}
        rows={[{ amount: "123456789012345678.123456789012345678" }]}
        ariaLabel="t"
      />,
    );
    expect(screen.getByText("123456789012345678.123456789012345678")).toBeTruthy();
  });

  it("renders icon cells as decorative images and drops non-http(s)/data:image sources", () => {
    const { container } = render(
      <TableView
        columns={[
          { key: "logo", header: "Logo", type: "icon" },
          { key: "symbol", header: "Symbol" },
        ]}
        rows={rows}
        ariaLabel="t"
      />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]?.getAttribute("src")).toBe("https://x.example/c.png");
    expect(imgs[0]?.getAttribute("alt")).toBe("");
  });

  it("sticky header sits in a keyboard-reachable scroll region", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" stickyHeader maxHeight={200} />);
    const region = screen.getByRole("region", { name: "t" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.style.maxHeight).toBe("200px");
    expect((screen.getAllByRole("columnheader")[0] as HTMLElement).style.position).toBe("sticky");
  });

  it("marks compact density on the table", () => {
    render(<TableView columns={columns} rows={rows} ariaLabel="t" density="compact" />);
    expect(screen.getByRole("table").getAttribute("data-density")).toBe("compact");
  });

  it("shows a Skeleton table instead of rows while loading", () => {
    render(<TableView columns={columns} rows={[]} ariaLabel="t" loading />);
    expect(screen.queryAllByRole("table")).toHaveLength(0);
    const busy = document.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
  });
});
