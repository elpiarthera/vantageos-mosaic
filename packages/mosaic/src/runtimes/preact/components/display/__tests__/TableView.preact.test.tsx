/**
 * TableView — Preact 10 runtime parity tests.
 *
 * Imports from the preact runtime path. The shared TableView source is
 * cross-runtime (react hooks only; no Preact-specific JSX). The tsup preact
 * pass aliases react → preact/compat at build time, so these tests confirm
 * structural parity with the React implementation.
 *
 * 9 tests: data(2) + pagination/virtual(2) + empty(1) + a11y(2) + parity(2)
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TableViewProps } from "../../../../../components/display/TableView.schema.js";
// Import from preact runtime path — parity with React runtime
import { StreamingTableView, TableView } from "../TableView.preact";

// Mock @tanstack/react-virtual — same mock as React side (preact/compat resolves same module)
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
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Preact Row ${i + 1}` }));
}

const defaultColumns: TableViewProps<Row>["columns"] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
];

// ─── (1+2) Data rendering — parity ───────────────────────────────────────────

describe("TableView Preact — data rendering parity", () => {
  it("(1) renders all static rows with correct aria-rowcount — parity", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(5)}
        ariaLabel="Preact data table"
        locale="en"
      />,
    );
    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("5");
    // header row + 5 data rows
    expect(screen.getAllByRole("row").length).toBe(6);
  });

  it("(2) renders column headers with scope='col' — parity", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(2)}
        ariaLabel="Preact header table"
        locale="en"
      />,
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(2);
    for (const th of headers) {
      expect(th.getAttribute("scope")).toBe("col");
    }
  });
});

// ─── (3+4) Virtualization threshold — parity ─────────────────────────────────

describe("TableView Preact — virtualization threshold parity", () => {
  it("(3) activates virtual container when rows.length > threshold — parity", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(60)}
        ariaLabel="Preact virtual table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );
    const wrapper = screen.getByRole("table").closest("[data-virtual='true']");
    expect(wrapper).not.toBeNull();
  });

  it("(4) no virtual container when rows.length <= threshold — parity", () => {
    render(
      <TableView
        columns={defaultColumns}
        rows={makeRows(20)}
        ariaLabel="Preact static table"
        virtualizeThreshold={50}
        locale="en"
      />,
    );
    const wrapper = screen.getByRole("table").closest("[data-virtual='true']");
    expect(wrapper).toBeNull();
  });
});

// ─── (5) Empty state — parity ─────────────────────────────────────────────────

describe("TableView Preact — empty state parity", () => {
  it("(5) renders FR empty message when rows=[] and locale=fr — parity", () => {
    render(
      <TableView columns={defaultColumns} rows={[]} ariaLabel="Tableau vide FR" locale="fr" />,
    );
    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("0");
    expect(table.textContent).toContain("Aucune donnée à afficher");
  });
});

// ─── (6+7) Accessibility — parity ────────────────────────────────────────────

describe("TableView Preact — accessibility parity", () => {
  it("(6) renders role=alert EN fallback on invalid props (empty columns) — parity", () => {
    render(
      <TableView
        columns={[] as unknown as TableViewProps<Row>["columns"]}
        rows={[]}
        ariaLabel="Bad preact table"
        locale="en"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/TableView: invalid props/);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("(7) renders role=alert FR fallback on invalid ariaLabel — parity", () => {
    render(<TableView columns={defaultColumns} rows={[]} ariaLabel="" locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });
});

// ─── (8+9) Streaming — parity ────────────────────────────────────────────────

describe("TableView Preact — streaming parity", () => {
  it("(8) StreamingTableView accumulates chunks correctly — parity", () => {
    const subject = new Subject<Partial<Row>[]>();
    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Streaming Preact"
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

  it("(9) StreamingTableView renders FR locale correctly — parity", () => {
    const subject = new Subject<Partial<Row>[]>();
    render(
      <StreamingTableView
        columns={defaultColumns}
        rows$={subject.asObservable()}
        ariaLabel="Tableau streaming Preact FR"
        locale="fr"
      />,
    );

    act(() => {
      subject.next(makeRows(3));
    });

    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-rowcount")).toBe("3");
    expect(table.getAttribute("aria-label")).toBe("Tableau streaming Preact FR");
  });
});
