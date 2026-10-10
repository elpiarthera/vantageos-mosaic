import { describe, expect, it } from "vitest";
import { formatDecimalString, sumDecimalStrings, truncateAddress } from "./decimal";
import { mdEscape, mdHeading, mdTable } from "./markdown";

describe("shared decimal helpers (money is a string, never a float)", () => {
  it("sums decimal strings exactly, beyond 2^53 and across decimals", () => {
    expect(sumDecimalStrings(["0.1", "0.2"])).toBe("0.3");
    expect(sumDecimalStrings(["9007199254740993", "1"])).toBe("9007199254740994");
    expect(sumDecimalStrings(["1.50", "2.5"])).toBe("4");
    expect(sumDecimalStrings(["-1.5", "0.5"])).toBe("-1");
    expect(sumDecimalStrings([])).toBe("0");
  });

  it("returns undefined (never a guess) when any value is not a decimal string", () => {
    expect(sumDecimalStrings(["1", "abc"])).toBeUndefined();
    expect(sumDecimalStrings(["1", ""])).toBeUndefined();
    expect(sumDecimalStrings(["1e3"])).toBeUndefined();
  });

  it("formats a decimal string for a locale without a float round trip", () => {
    expect(formatDecimalString("1234567890123456789.12", "en", "USD")).toBe(
      "$1,234,567,890,123,456,789.12",
    );
    expect(formatDecimalString("1234.5", "fr")).toContain("1");
    expect(formatDecimalString("1234.5", "fr")).toMatch(/1\s?234,5/);
  });

  it("falls back to the raw string when the value cannot be formatted", () => {
    expect(formatDecimalString("n/a", "en")).toBe("n/a");
  });

  it("truncates an address to head...tail and leaves short strings alone", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
    expect(truncateAddress("0x1234567890abcdef", 4, 2)).toBe("0x12…ef");
    expect(truncateAddress("0x12")).toBe("0x12");
  });
});

describe("shared markdown helpers", () => {
  it("escapes the characters that break a GFM table cell or inline emphasis", () => {
    expect(mdEscape("a|b")).toBe("a\\|b");
    expect(mdEscape("line1\nline2")).toBe("line1 line2");
    expect(mdEscape("*bold* _x_ `c`")).toBe("\\*bold\\* \\_x\\_ \\`c\\`");
  });

  it("renders a GFM table with a header separator", () => {
    expect(mdTable(["A", "B"], [["1", "2"]])).toBe("| A | B |\n| --- | --- |\n| 1 | 2 |");
  });

  it("renders headings by level", () => {
    expect(mdHeading("Title")).toBe("# Title");
    expect(mdHeading("Sub", 2)).toBe("## Sub");
  });
});
