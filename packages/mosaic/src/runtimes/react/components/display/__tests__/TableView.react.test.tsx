/**
 * TableView — React 19 runtime tests.
 *
 * Verifies that the react subpath re-export provides a real implementation
 * (not a stub): data rendering, empty state, virtualization, a11y, and
 * Zod validation error fallback — bilingue FR+EN.
 *
 * 9 tests: data(2) + pagination/virtual(2) + empty(1) + a11y(2) + parity(2)
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StreamingTableView, TableView } from "../TableView";
import type { TableViewProps } from "../../../../../components/display/TableView.schema.js";

// Mock @tanstack/react-virtual — jsdom has no real scroll dimensions
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

// ─── helpers ──────────────────────────────────────────────────────────────────

type Row = { id: number; name: string };

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
}

const defaultColumns: TableViewProps<Row>["columns"] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
];

// ─── (1+2) Data rendering ─────────────────────────────────────────────────────

describe("TableView React — data rendering", () => {
  it("(1) renders all static rows with correct aria-rowcount", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(5)}
        ariaLabel="React data table"
        locale="en"
      />,
    );
    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("5");
    // header row + 5 data rows
    expect(screen.getAllByRole("row").length).toBe(6);
  });

  it("(2) renders column headers with scope='col'", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(2)}
        ariaLabel="Header table"
        locale="en"
      />,
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(2);
    for (const th of headers) {
      expect(th.getAttribute("scope")).toBe("col");
    }
    expect(screen.getByText("ID")).toBeDefined();
    expect(screen.getByText("Name")).toBeDefined();
  });
});

// ─── (3+4) Pagination / virtualization ───────────────────────────────────────

describe("TableView React — virtualization threshold", () => {
  it("(3) activates virtual container when rows.length > virtualizeThreshold", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(60)}
        ariaLabel="Virtual table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );
    const wrapper = screen.getByRole("table").closest("[data-virtual='true']");
    expect(wrapper).not.toBeNull();
  });

  it("(4) no virtual container when rows.length <= virtualizeThreshold", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(20)}
        ariaLabel="Static table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );
    const wrapper = screen.getByRole("table").closest("[data-virtual='true']");
    expect(wrapper).toBeNull();
  });
});

// ─── (5) Empty state ──────────────────────────────────────────────────────────

describe("TableView React — empty state", () => {
  it("(5) renders FR empty message when rows=[] and locale=fr", () => {
    render(
      <TableView columns={defaultColumns} rows={[]} ariaLabel="Empty FR" locale="fr" />,
    );
    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("0");
    // FR i18n key: "Aucune donnée à afficher"
    expect(table.textContent).toContain("Aucune donnée à afficher");
  });
});

// ─── (6+7) Accessibility ──────────────────────────────────────────────────────

describe("TableView React — accessibility", () => {
  it("(6) renders role=alert with EN error message on invalid props (empty columns)", () => {
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

  it("(7) renders role=alert with FR error message on invalid ariaLabel", () => {
    render(
      <TableView columns={defaultColumns} rows={[]} ariaLabel="" locale="fr" />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });
});

// ─── (8+9) React/Preact parity — streaming ───────────────────────────────────

describe("TableView React — streaming parity", () => {
  it("(8) StreamingTableView accumulates chunks correctly", async () => {
    const subject = new Subject<Partial<Row>[]>();
    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Streaming React"
        virtualizeThreshold={200}
        locale="en"
      />,
    );

    act(() => {
      subject.next(makeRows(10));
    });

    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("10");
  });

  it("(9) StreamingTableView renders FR locale correctly", async () => {
    const subject = new Subject<Partial<Row>[]>();
    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Tableau streaming FR"
        locale="fr"
      />,
    );

    act(() => {
      subject.next(makeRows(3));
    });

    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("3");
    expect(table.getAttribute("aria-label")).toBe("Tableau streaming FR");
  });
});
