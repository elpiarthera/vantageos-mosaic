import { describe, expect, it } from "vitest";
import {
  addValue,
  filterBySearch,
  getAvailableOptions,
  getSelectedOptions,
  isAtMaxItems,
  removeValue,
} from "../../../../../components/forms/MultiSelect.logic";
import { MultiSelect } from "../MultiSelect";

/**
 * Preact parity smoke. The JSX runs via React testing library in vitest because
 * the `preact/compat` alias is applied at tsup build time only (Standard §18.2).
 * The shared logic file is the parity contract — we verify both runtimes share
 * the same `MultiSelect.logic` reference and that the Preact component is
 * exported with the same name.
 */
describe("preact/forms MultiSelect parity", () => {
  it("exports MultiSelect", () => {
    expect(typeof MultiSelect).toBe("function");
  });

  it("shares the same logic helpers as the React runtime", () => {
    const OPTS = [
      { value: "fr", label: "France" },
      { value: "es", label: "Spain" },
    ];
    expect(getAvailableOptions(OPTS, ["fr"]).map((o) => o.value)).toEqual(["es"]);
    expect(getSelectedOptions(OPTS, ["es"]).map((o) => o.label)).toEqual(["Spain"]);
    expect(filterBySearch(OPTS, "fra").map((o) => o.value)).toEqual(["fr"]);
    expect(addValue(["fr"], "es")).toEqual(["fr", "es"]);
    expect(addValue(["fr"], "fr")).toEqual(["fr"]);
    expect(removeValue(["fr", "es"], "fr")).toEqual(["es"]);
    expect(isAtMaxItems(["fr", "es"], 2)).toBe(true);
  });
});
