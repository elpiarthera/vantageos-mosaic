import { describe, expect, it } from "vitest";
import { Input } from "../Input";

describe("preact/forms Input parity", () => {
  it("exports Input", () => {
    expect(typeof Input).toBe("function");
  });
});
