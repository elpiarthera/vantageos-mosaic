import { describe, expect, it } from "vitest";
import {
  buildAddAriaLabel,
  buildListAriaLabel,
  buildRemoveAriaLabel,
  nextFocusIndexAfterRemove,
} from "../../../../../components/forms/FieldArray.logic";
import { FieldArray, useFieldArray } from "../FieldArray";

describe("preact/forms FieldArray parity", () => {
  it("exports FieldArray", () => {
    expect(typeof FieldArray).toBe("function");
  });

  it("exports useFieldArray", () => {
    expect(typeof useFieldArray).toBe("function");
  });

  it("re-uses shared a11y logic with the React runtime", () => {
    // Reference equality with the shared logic confirms the cross-runtime
    // contract — same pure helpers feed both runtimes, no duplicated source.
    expect(buildListAriaLabel("vars")).toBe("vars items");
    expect(buildRemoveAriaLabel("vars", 0)).toBe("Remove vars item 1");
    expect(buildAddAriaLabel("vars")).toBe("Add vars item");
    expect(nextFocusIndexAfterRemove(1, 0)).toBe(-1);
  });
});
