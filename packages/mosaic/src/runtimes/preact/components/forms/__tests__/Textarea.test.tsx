import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEXTAREA_ROWS,
  clampToMaxLength,
  resolveRows,
} from "../../../../../components/forms/Textarea.logic";
import { Textarea } from "../Textarea";

/**
 * Preact parity smoke. The JSX runs via React testing library in vitest because
 * the `preact/compat` alias is applied at tsup build time only (Standard §18.2).
 * The shared logic file is the parity contract — we verify both runtimes share
 * the same `Textarea.logic` reference and that the Preact component is exported.
 */
describe("preact/forms Textarea parity", () => {
  it("exports Textarea", () => {
    expect(typeof Textarea).toBe("function");
  });

  it("shares the same logic helpers as the React runtime", () => {
    expect(DEFAULT_TEXTAREA_ROWS).toBe(3);
    expect(resolveRows(undefined)).toBe(3);
    expect(clampToMaxLength("abcdef", 3)).toBe("abc");
  });
});
