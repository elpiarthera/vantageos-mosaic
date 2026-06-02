import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableView } from "./TableView";
import type { TableViewProps } from "./TableView.schema";
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

// ─── (a) Static rows — Observable emits once ─────────────────────────────────

describe("TableView — static rows (Observable emits once)", () => {
  it("renders all rows from a single emission", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Static table"
        virtualizeThreshold={100}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(10));
    });

    await waitFor(() => {
      // 1 header row + 10 data rows
      expect(screen.getAllByRole("row").length).toBe(11);
    });

    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-label")).toBe("Static table");
    expect(table.getAttribute("aria-rowcount")).toBe("10");
  });

  it("renders column headers", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Header table"
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(3));
    });

    await waitFor(() => {
      expect(screen.getByText("ID")).toBeDefined();
      expect(screen.getByText("Name")).toBeDefined();
    });
  });
});

// ─── (b) Streaming rows — Observable emits 3 chunks of 50 ────────────────────

describe("TableView — streaming rows (3 chunks of 50)", () => {
  it("grows table on each chunk emission", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
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

describe("TableView — virtualization threshold", () => {
  it("renders virtual container when rows.length > virtualizeThreshold", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Virtual table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(100));
    });

    await waitFor(() => {
      const table = screen.getByRole("table");
      // Virtual mode wraps the table in a div with data-virtual="true"
      const wrapper = table.closest("[data-virtual='true']");
      expect(wrapper).not.toBeNull();
    });
  });

  it("does NOT use virtual container when rows.length <= virtualizeThreshold", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Non-virtual table"
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

// ─── (d) Zod failure on missing columns renders fallback alert ────────────────

describe("TableView — Zod validation failure", () => {
  it("renders role=alert fallback when columns is empty array", () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={[] as unknown as TableViewProps<Row>["columns"]}
        rows$={subject.asObservable()}
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
    const subject = new Subject<Partial<Row>[]>();
    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel=""
        locale="fr"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("renders role=alert fallback when ariaLabel is empty string", () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel=""
        locale="en"
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/TableView: invalid props/);
  });
});

// ─── (e) Coverage branches — undefined cell value and missing row id ─────────

describe("TableView — branch coverage: undefined cell value + missing row id", () => {
  it("renders empty string when row value for a column key is undefined (??  fallback)", async () => {
    type SparseRow = { id: number; name?: string };
    const subject = new Subject<Partial<SparseRow>[]>();

    const columns: TableViewProps<SparseRow>["columns"] = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" }, // name is optional — triggers ?? "" when absent
    ];

    render(
      <TableView
        columns={columns}
        rows$={subject.asObservable()}
        ariaLabel="Sparse table"
        locale="en"
      />,
    );

    act(() => {
      // Row without 'name' — the String(undefined ?? "") fallback is hit
      subject.next([{ id: 1 }]);
    });

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(2); // header + 1 data row
    });
  });

  it("uses row-${index} key when row has no id field", async () => {
    type NoIdRow = { name: string };
    const subject = new Subject<Partial<NoIdRow>[]>();

    const columns: TableViewProps<NoIdRow>["columns"] = [{ key: "name", header: "Name" }];

    render(
      <TableView
        columns={columns}
        rows$={subject.asObservable()}
        ariaLabel="No-id table"
        locale="en"
      />,
    );

    act(() => {
      // Rows have no 'id' field — triggers the `row-${rowIndex}` key fallback
      subject.next([{ name: "Alice" }, { name: "Bob" }]);
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeDefined();
      expect(screen.getByText("Bob")).toBeDefined();
    });
  });
});

// ─── (e) Custom col.render callback (static table) ───────────────────────────

describe("TableView — custom col.render callback (static)", () => {
  it("uses col.render when provided instead of default string conversion", async () => {
    const subject = new Subject<Partial<Row>[]>();

    const columnsWithRender: TableViewProps<Row>["columns"] = [
      { key: "id", header: "ID", render: (row) => <span data-testid="custom-id">{row.id}</span> },
      { key: "name", header: "Name" },
    ];

    render(
      <TableView
        columns={columnsWithRender}
        rows$={subject.asObservable()}
        ariaLabel="Custom render table"
        locale="en"
      />,
    );

    act(() => {
      subject.next([{ id: 42, name: "Test Row" }]);
    });

    await waitFor(() => {
      const customCell = document.querySelector("[data-testid='custom-id']");
      expect(customCell).not.toBeNull();
      expect(customCell?.textContent).toBe("42");
    });
  });
});

// ─── (f) Virtual table — no-id row key fallback ──────────────────────────────

describe("TableView — virtual table no-id row key fallback", () => {
  it("uses vrow-${index} key in virtual table when row has no id field", async () => {
    type NoIdRow = { name: string };
    const subject = new Subject<Partial<NoIdRow>[]>();

    const columns: TableViewProps<NoIdRow>["columns"] = [{ key: "name", header: "Name" }];

    render(
      <TableView
        columns={columns}
        rows$={subject.asObservable()}
        ariaLabel="Virtual no-id table"
        virtualizeThreshold={5}
        locale="en"
      />,
    );

    act(() => {
      // Rows have no 'id' — triggers the `vrow-${index}` key fallback in VirtualTable
      subject.next(Array.from({ length: 10 }, (_, i) => ({ name: `Item ${i + 1}` })));
    });

    await waitFor(() => {
      const wrapper = document.querySelector("[data-virtual='true']");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.textContent).toContain("Item 1");
    });
  });
});

// ─── (f) Virtual table — default string render (no col.render) ───────────────

describe("TableView — virtual table default string render", () => {
  it("renders row cells using String() fallback when col.render is not provided", async () => {
    const subject = new Subject<Partial<Row>[]>();

    render(
      <TableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Virtual default render table"
        virtualizeThreshold={5}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(10));
    });

    await waitFor(() => {
      const wrapper = document.querySelector("[data-virtual='true']");
      expect(wrapper).not.toBeNull();
      // Cells rendered via String() fallback — row 1 has id=1, name="Row 1"
      expect(wrapper?.textContent).toContain("Row 1");
    });
  });
});

// ─── (g) Custom col.render callback (virtual table) ──────────────────────────

describe("TableView — custom col.render callback (virtual)", () => {
  it("uses col.render in virtual table when rows exceed threshold", async () => {
    const subject = new Subject<Partial<Row>[]>();

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
        rows$={subject.asObservable()}
        ariaLabel="Virtual custom render table"
        virtualizeThreshold={5}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(10));
    });

    await waitFor(() => {
      // Virtual mode wraps in data-virtual div
      const wrapper = document.querySelector("[data-virtual='true']");
      expect(wrapper).not.toBeNull();
      // At least one custom-rendered cell should be present
      const firstCustomCell = document.querySelector("[data-testid='virt-id-1']");
      expect(firstCustomCell).not.toBeNull();
    });
  });
});

// ─── Eval corpus iteration ────────────────────────────────────────────────────

describe("TableView — eval-corpus.json", () => {
  for (const entry of corpus) {
    it(`corpus case: ${entry.case} — ${entry.expect}`, async () => {
      const subject = new Subject<Partial<Row>[]>();

      const result = render(
        <TableView
          columns={entry.input.columns as unknown as TableViewProps<Row>["columns"]}
          rows$={subject.asObservable()}
          ariaLabel={entry.input.ariaLabel}
          virtualizeThreshold={
            "virtualizeThreshold" in entry.input ? (entry.input.virtualizeThreshold as number) : 100
          }
          locale={(entry.input.locale as "en" | "fr") ?? "en"}
        />,
      );

      if (entry.case === "failure") {
        const alert = screen.getByRole("alert");
        expect(alert).toBeDefined();
        expect(alert.textContent).toMatch(/TableView: invalid props/);
      } else {
        act(() => {
          subject.next(makeRows(entry.rowCount));
        });

        await waitFor(() => {
          const table = screen.getByRole("table");
          expect(table.getAttribute("aria-rowcount")).toBe(String(entry.rowCount));
        });
      }

      result.unmount();
    });
  }
});
