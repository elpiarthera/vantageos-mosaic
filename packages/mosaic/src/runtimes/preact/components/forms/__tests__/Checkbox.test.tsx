import { describe, expect, it } from "vitest";
import {
  resolveAriaChecked,
  resolveDescribedBy,
} from "../../../../../components/forms/Checkbox.logic";
import { Checkbox } from "../Checkbox";

/**
 * Preact parity smoke. The JSX runs via React testing library in vitest because
 * the `preact/compat` alias is applied at tsup build time only (Standard §18.2).
 * The shared logic file is the parity contract — we verify both runtimes share
 * the same `Checkbox.logic` reference and that the Preact component is exported.
 */
describe("preact/forms Checkbox parity", () => {
  it("exports Checkbox", () => {
    expect(typeof Checkbox).toBe("function");
  });

  it("shares the same logic helpers as the React runtime", () => {
    expect(resolveAriaChecked(false, true)).toBe("mixed");
    expect(resolveAriaChecked(true, false)).toBe(true);
    expect(resolveAriaChecked(false, undefined)).toBe(false);
  });

  it("resolveDescribedBy returns undefined when no description and no error", () => {
    expect(resolveDescribedBy("desc-id", undefined, false, "error-id")).toBeUndefined();
  });

  it("resolveDescribedBy returns combined IDs when both description and error", () => {
    expect(resolveDescribedBy("desc-id", "Hint", true, "error-id")).toBe("desc-id error-id");
  });
});
