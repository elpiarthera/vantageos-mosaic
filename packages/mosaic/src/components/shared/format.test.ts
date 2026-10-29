import { describe, expect, it } from "vitest";
import {
  ColumnFormatSchema,
  I18nTextSchema,
  formatValue,
  isNumericFormat,
  sortKindOfFormat,
} from "./format";
import { getPath } from "./path";

describe("getPath", () => {
  const obj = { a: { b: [{ c: 1 }, { c: 2 }] }, n: null, s: "x" };
  it("reads nested dot paths and array indexes", () => {
    expect(getPath(obj, "a.b.1.c")).toBe(2);
    expect(getPath(obj, "s")).toBe("x");
  });
  it("returns undefined for a missing path, a null hop or a primitive hop", () => {
    expect(getPath(obj, "a.x.y")).toBeUndefined();
    expect(getPath(obj, "n.y")).toBeUndefined();
    expect(getPath(obj, "s.length")).toBeUndefined();
    expect(getPath(undefined, "a")).toBeUndefined();
  });
  it("never walks the prototype chain", () => {
    expect(getPath({}, "constructor")).toBeUndefined();
    expect(getPath({}, "__proto__")).toBeUndefined();
    expect(getPath([], "length")).toBeUndefined();
  });
});

describe("format schemas", () => {
  it("I18nText needs a non-empty en and fr", () => {
    expect(I18nTextSchema.safeParse({ en: "a", fr: "b" }).success).toBe(true);
    expect(I18nTextSchema.safeParse({ en: "a" }).success).toBe(false);
    expect(I18nTextSchema.safeParse({ en: "a", fr: "" }).success).toBe(false);
  });
  it("accepts every format type of the view-config schema", () => {
    for (const type of ["text", "date", "percent", "number", "boolean", "count", "join"]) {
      expect(ColumnFormatSchema.safeParse({ type }).success).toBe(true);
    }
    expect(ColumnFormatSchema.safeParse({ type: "money", currency: "EUR" }).success).toBe(true);
    expect(
      ColumnFormatSchema.safeParse({ type: "enum", map: { A: { en: "a", fr: "b" } } }).success,
    ).toBe(true);
  });
  it("refuses unknown types, unknown keys, money without currency, enum without map", () => {
    expect(ColumnFormatSchema.safeParse({ type: "color" }).success).toBe(false);
    expect(ColumnFormatSchema.safeParse({ type: "text", extra: 1 }).success).toBe(false);
    expect(ColumnFormatSchema.safeParse({ type: "money" }).success).toBe(false);
    expect(ColumnFormatSchema.safeParse({ type: "money", currency: "euro" }).success).toBe(false);
    expect(ColumnFormatSchema.safeParse({ type: "enum" }).success).toBe(false);
  });
});

describe("formatValue", () => {
  it("date: locale formatted in UTC, raw text when unparseable", () => {
    expect(formatValue("2024-05-01", { type: "date" }, "en")).toBe("May 1, 2024");
    expect(formatValue("2024-05-01", { type: "date" }, "fr")).toBe("1 mai 2024");
    expect(formatValue("not a date", { type: "date" }, "en")).toBe("not a date");
  });
  it("money: currency from the format, decimal strings accepted", () => {
    expect(formatValue(1234.5, { type: "money", currency: "EUR" }, "en")).toBe("€1,234.50");
    expect(formatValue("1234.50", { type: "money", currency: "EUR" }, "fr")).toMatch(
      /^1\s234,50\s€$/,
    );
    expect(formatValue("abc", { type: "money", currency: "EUR" }, "en")).toBe("abc");
  });
  it("money: a currency code Intl rejects still shows the amount and the code", () => {
    expect(formatValue(5, { type: "money", currency: "euro" }, "en")).toBe("5 euro");
  });
  it("percent: the value is in percent units", () => {
    expect(formatValue(87.5, { type: "percent" }, "en")).toBe("87.5%");
    expect(formatValue("x", { type: "percent" }, "en")).toBe("x");
  });
  it("number and count", () => {
    expect(formatValue(12345.6, { type: "number" }, "en")).toBe("12,345.6");
    expect(formatValue("x", { type: "number" }, "en")).toBe("x");
    expect(formatValue([1, 2, 3], { type: "count" }, "en")).toBe("3");
    expect(formatValue(7, { type: "count" }, "en")).toBe("7");
    expect(formatValue("x", { type: "count" }, "en")).toBe("x");
  });
  it("boolean: words in the locale, raw text for a non-boolean", () => {
    expect(formatValue(true, { type: "boolean" }, "en")).toBe("Yes");
    expect(formatValue(false, { type: "boolean" }, "fr")).toBe("Non");
    expect(formatValue("maybe", { type: "boolean" }, "en")).toBe("maybe");
  });
  it("enum: label from the map in the locale, raw key when unmapped", () => {
    const f = { type: "enum", map: { Bail: { en: "Lease", fr: "Bail" } } } as const;
    expect(formatValue("Bail", f, "en")).toBe("Lease");
    expect(formatValue("Autre", f, "fr")).toBe("Autre");
  });
  it("join: separator, joinPath, missing elements dropped", () => {
    expect(
      formatValue([{ n: "A" }, { n: null }, { n: "B" }], { type: "join", joinPath: "n" }, "en"),
    ).toBe("A, B");
    expect(formatValue(["x", "y"], { type: "join", separator: " / " }, "en")).toBe("x / y");
    expect(formatValue("solo", { type: "join" }, "en")).toBe("solo");
  });
  it("text, no format, and missing values", () => {
    expect(formatValue("hello", { type: "text" }, "en")).toBe("hello");
    expect(formatValue({ a: 1 }, { type: "text" }, "en")).toBe('{"a":1}');
    expect(formatValue(5, undefined, "en")).toBe("5");
    expect(formatValue(null, { type: "date" }, "en")).toBe("—");
    expect(formatValue(undefined, undefined, "en")).toBe("—");
    expect(formatValue("", { type: "text" }, "en")).toBe("—");
  });
  it("numeric formats are right-aligned and sort as numbers", () => {
    for (const type of ["money", "number", "percent", "count"] as const) {
      expect(isNumericFormat({ type })).toBe(true);
      expect(sortKindOfFormat({ type })).toBe("number");
    }
    expect(isNumericFormat({ type: "date" })).toBe(false);
    expect(isNumericFormat(undefined)).toBe(false);
    expect(sortKindOfFormat({ type: "date" })).toBe("text");
    expect(sortKindOfFormat(undefined)).toBeUndefined();
  });
});
