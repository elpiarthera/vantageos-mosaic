// Preact parity tests for VirtualList
// Uses the preact runtime implementation via preact/compat

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
// Import from preact runtime path — tests parity with React implementation
import { VirtualList } from "../VirtualList";

// Mock @tanstack/react-virtual (same mock as React side — preact/compat alias resolves to same module)
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (opts: {
    count: number;
    estimateSize: (index: number) => number;
    overscan?: number;
  }) => ({
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, i) => ({
        index: i,
        start: i * opts.estimateSize(i),
        size: opts.estimateSize(i),
        end: (i + 1) * opts.estimateSize(i),
        lane: 0,
        key: i,
      })),
    getTotalSize: () => opts.count * opts.estimateSize(0),
  }),
}));

afterEach(() => {
  cleanup();
});

type Item = { id: number; label: string };

function makeItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, label: `Preact Item ${i + 1}` }));
}

function renderItem(item: Item, _index: number) {
  return <div data-testid={`preact-item-${item.id}`}>{item.label}</div>;
}

// ─── Preact parity tests ──────────────────────────────────────────────────────

describe("VirtualList — Preact runtime parity", () => {
  it("renders empty state (EN) — parity with React", () => {
    render(<VirtualList items={[]} itemHeight={40} renderItem={renderItem} locale="en" />);
    expect(screen.getByText("No items to display")).toBeDefined();
  });

  it("renders empty state (FR) — parity with React", () => {
    render(<VirtualList items={[]} itemHeight={40} renderItem={renderItem} locale="fr" />);
    expect(screen.getByText("Aucun élément à afficher")).toBeDefined();
  });

  it("renders 1 item — parity", () => {
    render(<VirtualList items={makeItems(1)} itemHeight={40} renderItem={renderItem} />);
    expect(screen.getByTestId("preact-item-1")).toBeDefined();
  });

  it("renders 100 items — parity", () => {
    render(<VirtualList items={makeItems(100)} itemHeight={40} renderItem={renderItem} />);
    expect(screen.getByTestId("preact-item-1")).toBeDefined();
    expect(screen.getByTestId("preact-item-100")).toBeDefined();
  });

  it("data-virtual attribute present for non-empty lists — parity", () => {
    // Use small count to avoid DOM thrash in jsdom; data-virtual marker confirms virtualizer engaged
    const { container } = render(
      <VirtualList items={makeItems(50)} itemHeight={40} renderItem={renderItem} />,
    );
    expect(container.querySelector('[data-virtual="true"]')).not.toBeNull();
  });

  it("role=button + tabIndex=0 when onRowClick defined — parity", () => {
    render(
      <VirtualList
        items={makeItems(3)}
        itemHeight={40}
        renderItem={renderItem}
        onRowClick={vi.fn()}
      />,
    );
    const rows = screen.getAllByRole("button");
    expect(rows.length).toBe(3);
    for (const row of rows) {
      expect(row.getAttribute("tabindex")).toBe("0");
    }
  });

  it("no role=button when onRowClick undefined — parity", () => {
    render(<VirtualList items={makeItems(3)} itemHeight={40} renderItem={renderItem} />);
    expect(screen.queryAllByRole("button").length).toBe(0);
  });

  it("calls onRowClick on click — parity", () => {
    const handler = vi.fn();
    const items = makeItems(3);
    render(
      <VirtualList items={items} itemHeight={40} renderItem={renderItem} onRowClick={handler} />,
    );
    const rows = screen.getAllByRole("button");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by makeItems(3)
    fireEvent.click(rows[0]!);
    expect(handler).toHaveBeenCalledWith(items[0], 0);
  });

  it("calls onRowClick on Enter key — parity", () => {
    const handler = vi.fn();
    const items = makeItems(2);
    render(
      <VirtualList items={items} itemHeight={40} renderItem={renderItem} onRowClick={handler} />,
    );
    const rows = screen.getAllByRole("button");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by makeItems(2)
    fireEvent.keyDown(rows[1]!, { key: "Enter" });
    expect(handler).toHaveBeenCalledWith(items[1], 1);
  });

  it("calls onRowClick on Space key — parity", () => {
    const handler = vi.fn();
    const items = makeItems(2);
    render(
      <VirtualList items={items} itemHeight={40} renderItem={renderItem} onRowClick={handler} />,
    );
    const rows = screen.getAllByRole("button");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by makeItems(2)
    fireEvent.keyDown(rows[0]!, { key: " " });
    expect(handler).toHaveBeenCalledWith(items[0], 0);
  });

  it("applies className to scroll container — parity", () => {
    const { container } = render(
      <VirtualList
        items={makeItems(2)}
        itemHeight={40}
        renderItem={renderItem}
        className="preact-custom"
      />,
    );
    expect(container.querySelector(".preact-custom")).toBeDefined();
  });

  it("renders error fallback for invalid props — parity", () => {
    // @ts-expect-error intentionally invalid
    render(<VirtualList itemHeight={40} renderItem={renderItem} />);
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
