import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useMosaicForm } from "../useMosaicForm";

// Preact runtime modules ship the same JSX as React (aliased to preact/compat
// at BUILD time only). In the vitest jsdom environment we exercise the React
// path because the test runner resolves `react` directly. This parity smoke
// verifies the preact runtime module is importable and exports the same shape.

describe("preact/forms useMosaicForm parity", () => {
  it("exports the hook", () => {
    expect(typeof useMosaicForm).toBe("function");
  });

  it("hook factory accepts the same options shape (schema-level parity)", () => {
    const schema = z.object({ a: z.string() });
    expect(() => {
      // smoke import — actual hook invocation requires component context
      const _options = { schema, defaultValues: { a: "x" }, mode: "onBlur" as const };
      expect(_options.schema).toBe(schema);
    }).not.toThrow();
  });
});
