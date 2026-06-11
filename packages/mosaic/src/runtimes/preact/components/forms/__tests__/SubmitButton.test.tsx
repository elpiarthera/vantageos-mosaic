import { describe, expect, it } from "vitest";
import { computeSubmitButtonState } from "../../../../../components/forms/SubmitButton.logic";
import { SubmitButton } from "../SubmitButton";

describe("preact/forms SubmitButton parity", () => {
  it("exports SubmitButton", () => {
    expect(typeof SubmitButton).toBe("function");
  });

  it("shares the same state machine logic as React runtime", () => {
    expect(computeSubmitButtonState({ isValid: true, isSubmitting: false })).toEqual({
      disabled: false,
      loading: false,
    });
  });
});
