import { describe, expect, it } from "vitest";
import { FormProvider, useMosaicFormContext } from "../FormProvider";

describe("preact/forms FormProvider parity", () => {
  it("exports FormProvider", () => {
    expect(typeof FormProvider).toBe("function");
  });

  it("exports useMosaicFormContext", () => {
    expect(typeof useMosaicFormContext).toBe("function");
  });
});
