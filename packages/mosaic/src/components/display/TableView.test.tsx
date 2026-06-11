import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StreamingTableView, TableView } from "./TableView";
import type { StreamingTableViewProps, TableViewProps } from "./TableView.schema";
import corpus from "./eval-corpus.json";

// Mock @tanstack/react-virtual so VirtualTable renders rows in jsdom (no real scroll dims)
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

afterEach(() => {
  cleanup();
});

// ─── helpers ─────────────────────────────────────────────────────────────────

type Row = { id: number; name: string };

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
}

const defaultColumns: TableViewProps<Row>["columns"] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
];

// ─── (a) Static rows — TableView with rows array ──────────────────────────────

describe("TableView — static rows (rows array)", () => {
  it("renders all rows from a static array", async () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(10)}
        ariaLabel="Static table"
        virtualizeThreshold={100}
        locale="en"
      />,
    );

    // 1 header row + 10 data rows
    expect(screen.getAllByRole("row").length).toBe(11);

    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-label")).toBe("Static table");
    expect(table.getAttribute("aria-rowcount")).toBe("10");
  });

  it("renders column headers", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(3)}
        ariaLabel="Header table"
        locale="en"
      />,
    );

    expect(screen.getByText("ID")).toBeDefined();
    expect(screen.getByText("Name")).toBeDefined();
  });

  it("renders empty message when rows is empty array", () => {
    render(<TableView columns={defaultColumns} rows={[]} ariaLabel="Empty table" locale="en" />);

    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("0");
  });
});

// ─── (b) Streaming rows — StreamingTableView with Observable ─────────────────

describe("StreamingTableView — streaming rows (3 chunks of 50)", () => {
  it("grows table on each chunk emission", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Streaming table"
        virtualizeThreshold={200}
        locale="en"
      />,
    );

    // Chunk 1 — 50 rows
    act(() => {
      subject.next(makeRows(50));
    });
    await waitFor(() => {
      expect(screen.getByRole("table").getAttribute("aria-rowcount")).toBe("50");
    });

    // Chunk 2 — 50 more rows (total 100)
    act(() => {
      subject.next(makeRows(50).map((r) => ({ id: r.id + 50, name: `Row ${r.id + 50}` })));
    });
    await waitFor(() => {
      expect(screen.getByRole("table").getAttribute("aria-rowcount")).toBe("100");
    });

    // Chunk 3 — 50 more rows (total 150)
    act(() => {
      subject.next(makeRows(50).map((r) => ({ id: r.id + 100, name: `Row ${r.id + 100}` })));
    });
    await waitFor(() => {
      expect(screen.getByRole("table").getAttribute("aria-rowcount")).toBe("150");
    });
  });
});

// ─── (c) Virtualization activates above threshold ─────────────────────────────

describe("TableView — virtualization threshold (static)", () => {
  it("renders virtual container when rows.length > virtualizeThreshold", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(100)}
        ariaLabel="Virtual table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );

    const table = screen.getByRole("table");
    const wrapper = table.closest("[data-virtual='true']");
    expect(wrapper).not.toBeNull();
  });

  it("does NOT use virtual container when rows.length <= virtualizeThreshold", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(30)}
        ariaLabel="Non-virtual table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );

    const table = screen.getByRole("table");
    const wrapper = table.closest("[data-virtual='true']");
    expect(wrapper).toBeNull();
  });
});

// ─── (d) StreamingTableView virtualization threshold ─────────────────────────

describe("StreamingTableView — virtualization threshold", () => {
  it("renders virtual container when rows.length > virtualizeThreshold", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Virtual streaming table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(100));
    });

    await waitFor(() => {
      const table = screen.getByRole("table");
      const wrapper = table.closest("[data-virtual='true']");
      expect(wrapper).not.toBeNull();
    });
  });

  it("does NOT use virtual container when rows.length <= virtualizeThreshold", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Non-virtual streaming table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(30));
    });

    await waitFor(() => {
      const table = screen.getByRole("table");
      const wrapper = table.closest("[data-virtual='true']");
      expect(wrapper).toBeNull();
    });
  });
});

// ─── (e) Zod failure on missing columns renders fallback alert ────────────────

describe("TableView — Zod validation failure", () => {
  it("renders role=alert fallback when columns is empty array", () => {
    render(
      <TableView
        columns={[] as unknown as TableViewProps<Row>["columns"]}
        rows={[]}
        ariaLabel="Bad table"
        locale="en"
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/TableView: invalid props/);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders FR role=alert fallback when ariaLabel is empty and locale=fr (i18n branch)", () => {
    render(<TableView columns={defaultColumns} rows={[]} ariaLabel="" locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("renders role=alert fallback when ariaLabel is empty string", () => {
    render(<TableView columns={defaultColumns} rows={[]} ariaLabel="" locale="en" />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/TableView: invalid props/);
  });
});

// ─── (f) StreamingTableView Zod failure ──────────────────────────────────────

describe("StreamingTableView — Zod validation failure", () => {
  it("renders role=alert fallback when columns is empty array", () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <StreamingTableView
        columns={[] as unknown as StreamingTableViewProps<Row>["columns"]}
        rows$={subject.asObservable()}
        ariaLabel="Bad streaming table"
        locale="en"
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/TableView: invalid props/);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders FR role=alert fallback when ariaLabel is empty and locale=fr (i18n branch)", () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <StreamingTableView
        columns={[] as unknown as StreamingTableViewProps<Row>["columns"]}
        rows$={subject.asObservable()}
        ariaLabel="Bad streaming table"
        locale="fr"
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });
});

// ─── (f2) StreamingTableView with FR locale (inner branch coverage) ───────────

describe("StreamingTableView — FR locale in inner component", () => {
  it("renders table with FR locale in streaming mode", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Tableau FR"
        locale="fr"
      />,
    );

    act(() => {
      subject.next(makeRows(5));
    });

    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table.getAttribute("aria-rowcount")).toBe("5");
    });
  });
});

// ─── (g) Coverage branches — undefined cell value and missing row id ──────────

describe("TableView — branch coverage: undefined cell value + missing row id", () => {
  it("renders empty string when row value for a column key is undefined (??  fallback)", () => {
    type SparseRow = { id: number; name?: string };

    const columns: TableViewProps<SparseRow>["columns"] = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" }, // name is optional — triggers ?? "" when absent
    ];

    render(<TableView columns={columns} rows={[{ id: 1 }]} ariaLabel="Sparse table" locale="en" />);

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(2); // header + 1 data row
  });

  it("uses row-${index} key when row has no id field", () => {
    type NoIdRow = { name: string };

    const columns: TableViewProps<NoIdRow>["columns"] = [{ key: "name", header: "Name" }];

    render(
      <TableView
        columns={columns}
        rows={[{ name: "Alice" }, { name: "Bob" }]}
        ariaLabel="No-id table"
        locale="en"
      />,
    );

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
  });
});

// ─── (h) Custom col.render callback (static table) ───────────────────────────

describe("TableView — custom col.render callback (static)", () => {
  it("uses col.render when provided instead of default string conversion", () => {
    const columnsWithRender: TableViewProps<Row>["columns"] = [
      { key: "id", header: "ID", render: (row) => <span data-testid="custom-id">{row.id}</span> },
      { key: "name", header: "Name" },
    ];

    render(
      <TableView
        columns={columnsWithRender}
        rows={[{ id: 42, name: "Test Row" }]}
        ariaLabel="Custom render table"
        locale="en"
      />,
    );

    const customCell = document.querySelector("[data-testid='custom-id']");
    expect(customCell).not.toBeNull();
    expect(customCell?.textContent).toBe("42");
  });
});

// ─── (i) Virtual table — no-id row key fallback ──────────────────────────────

describe("TableView — virtual table no-id row key fallback", () => {
  it("uses vrow-${index} key in virtual table when row has no id field", () => {
    type NoIdRow = { name: string };

    const columns: TableViewProps<NoIdRow>["columns"] = [{ key: "name", header: "Name" }];

    render(
      <TableView
        columns={columns}
        rows={Array.from({ length: 10 }, (_, i) => ({ name: `Item ${i + 1}` }))}
        ariaLabel="Virtual no-id table"
        virtualizeThreshold={5}
        locale="en"
      />,
    );

    const wrapper = document.querySelector("[data-virtual='true']");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.textContent).toContain("Item 1");
  });
});

// ─── (j) Virtual table — default string render (no col.render) ───────────────

describe("TableView — virtual table default string render", () => {
  it("renders row cells using String() fallback when col.render is not provided", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(10)}
        ariaLabel="Virtual default render table"
        virtualizeThreshold={5}
        locale="en"
      />,
    );

    const wrapper = document.querySelector("[data-virtual='true']");
    expect(wrapper).not.toBeNull();
    // Cells rendered via String() fallback — row 1 has id=1, name="Row 1"
    expect(wrapper?.textContent).toContain("Row 1");
  });
});

// ─── (k) Custom col.render callback (virtual table) ──────────────────────────

describe("TableView — custom col.render callback (virtual)", () => {
  it("uses col.render in virtual table when rows exceed threshold", () => {
    const columnsWithRender: TableViewProps<Row>["columns"] = [
      {
        key: "id",
        header: "ID",
        render: (row) => <span data-testid={`virt-id-${row.id}`}>{row.id}</span>,
      },
      { key: "name", header: "Name" },
    ];

    render(
      <TableView
        columns={columnsWithRender}
        rows={makeRows(10)}
        ariaLabel="Virtual custom render table"
        virtualizeThreshold={5}
        locale="en"
      />,
    );

    // Virtual mode wraps in data-virtual div
    const wrapper = document.querySelector("[data-virtual='true']");
    expect(wrapper).not.toBeNull();
    // At least one custom-rendered cell should be present
    const firstCustomCell = document.querySelector("[data-testid='virt-id-1']");
    expect(firstCustomCell).not.toBeNull();
  });
});

// ─── (l) onRowClick prop — v0.2.1 ────────────────────────────────────────────

describe("TableView.onRowClick (v0.2.1)", () => {
  it("onRowClick is called with (row, index) when a row is clicked", () => {
    const spy = vi.fn();
    const rows = makeRows(3);

    render(
      <TableView
        columns={defaultColumns}
        rows={rows}
        ariaLabel="Clickable table"
        locale="en"
        onRowClick={spy}
      />,
    );

    fireEvent.click(screen.getByText("Row 2"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ id: 2, name: "Row 2" }, 1);
  });

  it("onRowClick is called when Enter is pressed on a focused row", () => {
    const spy = vi.fn();
    const rows = makeRows(2);

    render(
      <TableView
        columns={defaultColumns}
        rows={rows}
        ariaLabel="Keyboard table"
        locale="en"
        onRowClick={spy}
      />,
    );

    const dataRows = screen.getAllByRole("button");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by makeRows(2)
    fireEvent.keyDown(dataRows[0]!, { key: "Enter" });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ id: 1, name: "Row 1" }, 0);
  });

  it("onRowClick is called when Space is pressed on a focused row", () => {
    const spy = vi.fn();
    const rows = makeRows(2);

    render(
      <TableView
        columns={defaultColumns}
        rows={rows}
        ariaLabel="Space key table"
        locale="en"
        onRowClick={spy}
      />,
    );

    const dataRows = screen.getAllByRole("button");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by makeRows(2)
    fireEvent.keyDown(dataRows[1]!, { key: " " });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ id: 2, name: "Row 2" }, 1);
  });

  it("rows have role='button' and tabIndex={0} when onRowClick is provided", () => {
    const spy = vi.fn();

    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(3)}
        ariaLabel="Role button table"
        locale="en"
        onRowClick={spy}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(3);
    for (const btn of buttons) {
      expect(btn.getAttribute("tabindex")).toBe("0");
    }
  });

  it("rows do NOT have role='button' or tabIndex when onRowClick is undefined (v0.2.0 back-compat)", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(3)}
        ariaLabel="No-click table"
        locale="en"
      />,
    );

    // All rows are plain <tr> — no role=button
    expect(screen.queryAllByRole("button").length).toBe(0);
    // Data rows have no tabIndex
    const dataRows = screen.getAllByRole("row").slice(1); // skip header
    for (const row of dataRows) {
      expect(row.getAttribute("tabindex")).toBeNull();
    }
  });
});

// ─── Eval corpus iteration ────────────────────────────────────────────────────

describe("TableView — eval-corpus.json", () => {
  for (const entry of corpus) {
    it(`corpus case: ${entry.case} — ${entry.expect}`, () => {
      const result = render(
        <TableView
          columns={entry.input.columns as unknown as TableViewProps<Row>["columns"]}
          rows={makeRows(entry.rowCount)}
          ariaLabel={entry.input.ariaLabel}
          virtualizeThreshold={
            "virtualizeThreshold" in entry.input ? (entry.input.virtualizeThreshold as number) : 100
          }
          locale={(entry.input.locale as "en" | "fr") ?? "en"}
        />,
      );

      if (entry.case === "failure") {
        // Failure cases have empty columns array — Zod min(1) triggers role=alert
        const alert = screen.getByRole("alert");
        expect(alert).toBeDefined();
        expect(alert.textContent).toMatch(/TableView: invalid props/);
      } else {
        const table = screen.getByRole("table");
        expect(table.getAttribute("aria-rowcount")).toBe(String(entry.rowCount));
      }

      result.unmount();
    });
  }
});
