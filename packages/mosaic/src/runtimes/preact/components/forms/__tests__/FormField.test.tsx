import { describe, expect, it } from "vitest";
import { FormField } from "../FormField";

describe("preact/forms FormField parity", () => {
  it("exports FormField", () => {
    expect(typeof FormField).toBe("function");
  });
});
