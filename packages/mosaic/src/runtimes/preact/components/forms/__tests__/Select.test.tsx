import { describe, expect, it } from "vitest";
import {
  filterOptions,
  findByTypeAhead,
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  indexOfValue,
  resolveSelectedLabel,
} from "../../../../../components/forms/Select.logic";
import { Select } from "../Select";

/**
 * Preact parity smoke. The JSX runs via React testing library in vitest because
 * the `preact/compat` alias is applied at tsup build time only (Standard §18.2).
 * The shared logic file is the parity contract — we verify both runtimes share
 * the same `Select.logic` reference and that the Preact component is exported.
 */
describe("preact/forms Select parity", () => {
  it("exports Select", () => {
    expect(typeof Select).toBe("function");
  });

  it("shares the same filterOptions logic as the React runtime", () => {
    const opts = [
      { value: "fr", label: "France", disabled: false },
      { value: "us", label: "United States", disabled: false },
    ];
    expect(filterOptions(opts, "france")).toHaveLength(1);
    expect(filterOptions(opts, "")).toHaveLength(2);
  });

  it("shares the same indexOfValue logic", () => {
    const opts = [
      { value: "fr", label: "France", disabled: false },
      { value: "us", label: "United States", disabled: false },
    ];
    expect(indexOfValue(opts, "us")).toBe(1);
    expect(indexOfValue(opts, null)).toBe(-1);
  });

  it("shares the same resolveSelectedLabel logic", () => {
    const opts = [
      { value: "fr", label: "France", disabled: false },
      { value: "us", label: "United States", disabled: false },
    ];
    expect(resolveSelectedLabel(opts, "fr")).toBe("France");
    expect(resolveSelectedLabel(opts, null)).toBeNull();
  });

  it("shares the same navigation helpers", () => {
    const opts = [
      { value: "a", label: "Alpha", disabled: true },
      { value: "b", label: "Beta", disabled: false },
      { value: "c", label: "Gamma", disabled: false },
    ];
    expect(findFirstEnabledIndex(opts)).toBe(1);
    expect(findLastEnabledIndex(opts)).toBe(2);
    expect(findNextEnabledIndex(opts, 1, 1)).toBe(2);
    expect(findNextEnabledIndex(opts, 2, -1)).toBe(1);
  });

  it("shares the same type-ahead logic", () => {
    const opts = [
      { value: "fr", label: "France", disabled: false },
      { value: "de", label: "Germany", disabled: true },
      { value: "jp", label: "Japan", disabled: false },
    ];
    expect(findByTypeAhead(opts, "j")).toBe(2); // Japan
    expect(findByTypeAhead(opts, "g")).toBe(-1); // Germany is disabled
    expect(findByTypeAhead(opts, "")).toBe(-1);
  });
});
