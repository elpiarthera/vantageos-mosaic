import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";
import { afterEach, describe, expect, it } from "vitest";
import { TableView } from "./TableView";
import type { TableViewProps } from "./TableView.schema";
import corpus from "./eval-corpus.json";

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
