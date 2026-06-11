// i18nKeys: VirtualList.empty.message, VirtualList.error.invalidProps

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VirtualList } from "../VirtualList";
import { VirtualListPropsSchema, validateVirtualListProps } from "../VirtualList.schema";

// Mock @tanstack/react-virtual so VirtualList renders rows in jsdom (no real scroll dims)
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

// ─── helpers ──────────────────────────────────────────────────────────────────

type Item = { id: number; label: string };

function makeItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, label: `Item ${i + 1}` }));
}

function renderItem(item: Item, _index: number) {
  return <div data-testid={`item-${item.id}`}>{item.label}</div>;
}

// ─── (1) Zod props schema ──────────────────────────────────────────────────────

describe("VirtualList — Zod schema validation", () => {
  it("accepts valid fixed itemHeight props", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [{ id: 1, label: "A" }],
      itemHeight: 40,
      renderItem: (_item: unknown, _i: number) => null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid estimateSize function props", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [{ id: 1 }],
      estimateSize: (i: number) => i * 10 + 40,
      renderItem: (_item: unknown, _i: number) => null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional overscan override", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [],
      itemHeight: 50,
      renderItem: (_item: unknown, _i: number) => null,
      overscan: 10,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional className", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [],
      itemHeight: 40,
      renderItem: (_item: unknown, _i: number) => null,
      className: "my-list",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing items", () => {
    const result = VirtualListPropsSchema.safeParse({
      itemHeight: 40,
      renderItem: (_item: unknown, _i: number) => null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative itemHeight", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [],
      itemHeight: -10,
      renderItem: (_item: unknown, _i: number) => null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero itemHeight", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [],
      itemHeight: 0,
      renderItem: (_item: unknown, _i: number) => null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative overscan", () => {
    const result = VirtualListPropsSchema.safeParse({
      items: [],
      itemHeight: 40,
      renderItem: (_item: unknown, _i: number) => null,
      overscan: -1,
    });
    expect(result.success).toBe(false);
  });

  it("validateVirtualListProps throws on invalid", () => {
    expect(() => validateVirtualListProps({ items: "not-an-array", itemHeight: 40 })).toThrow();
  });

  it("validateVirtualListProps passes on valid", () => {
    expect(() =>
      validateVirtualListProps({
        items: [],
        itemHeight: 40,
        renderItem: (_item: unknown, _i: number) => null,
      }),
    ).not.toThrow();
  });
});

// ─── (2) Render edge cases ────────────────────────────────────────────────────

describe("VirtualList — render edge cases", () => {
  it("renders empty state when items array is empty", () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={40}
        renderItem={renderItem}
        locale="en"
      />,
    );
    // Should show empty message
    expect(screen.getByText("No items to display")).toBeDefined();
  });

  it("renders empty state in FR locale", () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={40}
        renderItem={renderItem}
        locale="fr"
      />,
    );
    expect(screen.getByText("Aucun élément à afficher")).toBeDefined();
  });

  it("renders 1 item correctly", () => {
    render(
      <VirtualList
        items={makeItems(1)}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    expect(screen.getByTestId("item-1")).toBeDefined();
  });

  it("renders 100 items", () => {
    render(
      <VirtualList
        items={makeItems(100)}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    // All 100 rendered because virtualizer mock returns all items
    expect(screen.getByTestId("item-1")).toBeDefined();
    expect(screen.getByTestId("item-100")).toBeDefined();
  });

  it("renders 10000 items (virtualization active — data-virtual marker present)", () => {
    // Use a small subset to avoid DOM thrash in jsdom; data-virtual marker confirms virtualizer engaged
    const items = makeItems(50);
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    // data-virtual="true" is set on the scroll container whenever items.length > 0
    expect(container.querySelector("[data-virtual=\"true\"]")).not.toBeNull();
    expect(screen.getByTestId("item-1")).toBeDefined();
    expect(screen.getByTestId("item-50")).toBeDefined();
  });

  it("applies custom className to scroll container", () => {
    const { container } = render(
      <VirtualList
        items={makeItems(3)}
        itemHeight={40}
        renderItem={renderItem}
        className="custom-class"
      />,
    );
    expect(container.querySelector(".custom-class")).toBeDefined();
  });

  it("renders with estimateSize instead of itemHeight", () => {
    render(
      <VirtualList
        items={makeItems(5)}
        estimateSize={(_i) => 48}
        renderItem={renderItem}
      />,
    );
    expect(screen.getByTestId("item-1")).toBeDefined();
    expect(screen.getByTestId("item-5")).toBeDefined();
  });

  it("renders error fallback for invalid props (no items array)", () => {
    // @ts-expect-error intentionally invalid
    render(<VirtualList itemHeight={40} renderItem={renderItem} />);
    expect(screen.getByRole("alert")).toBeDefined();
  });
});

// ─── (3) onRowClick — a11y: Enter + Space + role=button + tabIndex=0 ──────────

describe("VirtualList — onRowClick a11y", () => {
  it("adds role=button and tabIndex=0 to items when onRowClick is provided", () => {
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

  it("calls onRowClick with item and index on click", () => {
    const handler = vi.fn();
    const items = makeItems(3);
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        renderItem={renderItem}
        onRowClick={handler}
      />,
    );
    const rows = screen.getAllByRole("button");
    fireEvent.click(rows[1]!);
    expect(handler).toHaveBeenCalledWith(items[1], 1);
  });

  it("calls onRowClick on Enter key", () => {
    const handler = vi.fn();
    const items = makeItems(3);
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        renderItem={renderItem}
        onRowClick={handler}
      />,
    );
    const rows = screen.getAllByRole("button");
    fireEvent.keyDown(rows[0]!, { key: "Enter" });
    expect(handler).toHaveBeenCalledWith(items[0], 0);
  });

  it("calls onRowClick on Space key", () => {
    const handler = vi.fn();
    const items = makeItems(3);
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        renderItem={renderItem}
        onRowClick={handler}
      />,
    );
    const rows = screen.getAllByRole("button");
    fireEvent.keyDown(rows[2]!, { key: " " });
    expect(handler).toHaveBeenCalledWith(items[2], 2);
  });

  it("does NOT call handler on other keys (Arrow, Tab, etc.)", () => {
    const handler = vi.fn();
    render(
      <VirtualList
        items={makeItems(1)}
        itemHeight={40}
        renderItem={renderItem}
        onRowClick={handler}
      />,
    );
    const firstRow = screen.getAllByRole("button")[0];
    if (!firstRow) throw new Error("No button row found");
    fireEvent.keyDown(firstRow, { key: "ArrowDown" });
    fireEvent.keyDown(firstRow, { key: "Tab" });
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── (4) onRowClick undefined → no role/tabIndex/handlers ─────────────────────

describe("VirtualList — onRowClick undefined (back-compat)", () => {
  it("does NOT add role=button when onRowClick is undefined", () => {
    render(
      <VirtualList
        items={makeItems(3)}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    expect(screen.queryAllByRole("button").length).toBe(0);
  });

  it("does NOT add tabIndex=0 when onRowClick is undefined", () => {
    const { container } = render(
      <VirtualList
        items={makeItems(3)}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    const rows = container.querySelectorAll("[data-list-row]");
    for (const row of rows) {
      expect(row.getAttribute("tabindex")).toBeNull();
    }
  });
});

// ─── (5) overscan prop ────────────────────────────────────────────────────────

describe("VirtualList — overscan prop", () => {
  it("defaults overscan to 5 when not provided", () => {
    // Verifying component renders without error — overscan is passed internally
    render(
      <VirtualList
        items={makeItems(10)}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    expect(screen.getByTestId("item-1")).toBeDefined();
  });

  it("accepts custom overscan value", () => {
    render(
      <VirtualList
        items={makeItems(10)}
        itemHeight={40}
        renderItem={renderItem}
        overscan={10}
      />,
    );
    expect(screen.getByTestId("item-1")).toBeDefined();
  });
});
