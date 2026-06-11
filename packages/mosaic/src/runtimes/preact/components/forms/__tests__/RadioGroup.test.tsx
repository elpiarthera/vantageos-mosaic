import { describe, expect, it } from "vitest";
import { RadioGroup } from "../RadioGroup";

/**
 * Preact parity tests for RadioGroup.
 *
 * Deep behavioral tests live in the React runtime test suite
 * (`src/components/forms/__tests__/RadioGroup.test.tsx`) which also
 * validates the runtime-agnostic schema + logic.
 *
 * This file asserts that the Preact runtime exports the component and that
 * its type is a function — identical pattern to other Preact parity tests
 * in this project (FormField, FormProvider, ErrorDisplay, SubmitButton).
 */
describe("preact/forms RadioGroup parity", () => {
  it("exports RadioGroup as a function", () => {
    expect(typeof RadioGroup).toBe("function");
  });

  it("RadioGroup has the correct function name", () => {
    expect(RadioGroup.name).toBe("RadioGroup");
  });
});
