import { describe, expect, it } from "vitest";
import {
  compareCells,
  compareDecimalStrings,
  isMissing,
  nextSort,
  sortItems,
  toggleAll,
  toggleSelection,
} from "./TableView.logic";

describe("TableView.logic: decimal strings compare without floats", () => {
  it("orders by value, not lexicographically, and keeps >2^53 precision", () => {
    expect(compareDecimalStrings("9", "10")).toBeLessThan(0);
    expect(compareDecimalStrings("10", "9")).toBeGreaterThan(0);
    expect(compareDecimalStrings("0.5", "0.50")).toBe(0);
    expect(compareDecimalStrings("9007199254740993", "9007199254740992")).toBeGreaterThan(0);
    expect(compareDecimalStrings("0.000000000000000002", "0.000000000000000001")).toBeGreaterThan(
      0,
    );
  });

  it("handles signs and leading zeros", () => {
    expect(compareDecimalStrings("-1", "1")).toBeLessThan(0);
    expect(compareDecimalStrings("-2", "-10")).toBeGreaterThan(0);
    expect(compareDecimalStrings("007", "7")).toBe(0);
    expect(compareDecimalStrings("-0", "0")).toBe(0);
  });
});

describe("TableView.logic: cell comparison", () => {
  it("compares text with a locale-aware, numeric-aware collator", () => {
    expect(compareCells("item 2", "item 10", "text", "en")).toBeLessThan(0);
    expect(compareCells("Éclair", "eclair", "text", "fr")).toBe(0);
    expect(compareCells("a", "b", "text", "en")).toBeLessThan(0);
  });

  it("compares number columns as numbers, including numeric strings", () => {
    expect(compareCells(2, 10, "number", "en")).toBeLessThan(0);
    expect(compareCells("2", 10, "number", "en")).toBeLessThan(0);
  });

  it("compares amount columns as exact decimals", () => {
    expect(compareCells("1.10", "1.9", "amount", "en")).toBeLessThan(0);
    expect(compareCells("100", "20", "amount", "en")).toBeGreaterThan(0);
  });

  it("treats null, undefined and empty string as missing", () => {
    expect(isMissing(null)).toBe(true);
    expect(isMissing(undefined)).toBe(true);
    expect(isMissing("")).toBe(true);
    expect(isMissing(0)).toBe(false);
    expect(isMissing("0")).toBe(false);
  });
});

describe("TableView.logic: sortItems", () => {
  const items = [
    { id: "a", v: "10" },
    { id: "b", v: "9" },
    { id: "c", v: null },
    { id: "d", v: "9" },
  ];
  const get = (i: { v: string | null }) => i.v;

  it("sorts ascending and descending, stable on ties", () => {
    expect(sortItems(items, get, "amount", "asc", "en").map((i) => i.id)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
    expect(sortItems(items, get, "amount", "desc", "en").map((i) => i.id)).toEqual([
      "a",
      "b",
      "d",
      "c",
    ]);
  });

  it("keeps missing values last in BOTH directions", () => {
    const asc = sortItems(items, get, "text", "asc", "en").map((i) => i.id);
    const desc = sortItems(items, get, "text", "desc", "en").map((i) => i.id);
    expect(asc.at(-1)).toBe("c");
    expect(desc.at(-1)).toBe("c");
  });

  it("does not mutate its input", () => {
    const copy = [...items];
    sortItems(items, get, "text", "asc", "en");
    expect(items).toEqual(copy);
  });
});

describe("TableView.logic: sort cycle and selection", () => {
  it("cycles none -> asc -> desc -> none on the same column, restarts on another", () => {
    const a = nextSort(undefined, "name");
    expect(a).toEqual({ key: "name", direction: "asc" });
    const b = nextSort(a, "name");
    expect(b).toEqual({ key: "name", direction: "desc" });
    expect(nextSort(b, "name")).toBeUndefined();
    expect(nextSort(b, "id")).toEqual({ key: "id", direction: "asc" });
  });

  it("single selection replaces and re-click deselects; multiple toggles", () => {
    expect([...toggleSelection(new Set(["a"]), "b", "single")]).toEqual(["b"]);
    expect([...toggleSelection(new Set(["a"]), "a", "single")]).toEqual([]);
    expect([...toggleSelection(new Set(["a"]), "b", "multiple")].sort()).toEqual(["a", "b"]);
    expect([...toggleSelection(new Set(["a", "b"]), "a", "multiple")]).toEqual(["b"]);
    expect([...toggleSelection(new Set(["a"]), "b", "none")]).toEqual(["a"]);
  });

  it("select-all selects every key, or clears when all are already selected", () => {
    expect([...toggleAll(new Set(["a"]), ["a", "b", "c"])].sort()).toEqual(["a", "b", "c"]);
    expect([...toggleAll(new Set(["a", "b", "c"]), ["a", "b", "c"])]).toEqual([]);
  });
});
