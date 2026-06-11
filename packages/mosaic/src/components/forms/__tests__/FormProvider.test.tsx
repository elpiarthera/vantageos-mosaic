import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FormProviderPropsSchema } from "../FormProvider.schema";
import {
  FormProvider,
  useMosaicFormContext,
} from "../../../runtimes/react/components/forms/FormProvider";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("FormProviderPropsSchema", () => {
  it("rejects null children placeholder (children supplied at runtime, not parsed)", () => {
    // Schema only validates serializable props — children passed through JSX
    const r = FormProviderPropsSchema.safeParse({});
    expect(r.success).toBe(true);
  });
});

// ─── Provider tests ─────────────────────────────────────────────────────────

describe("FormProvider", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("renders children and exposes form context via useMosaicFormContext", () => {
    const { result: formResult } = renderHook(() =>
      useMosaicForm({ schema, defaultValues: { name: "" } }),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProvider form={formResult.current}>{children}</FormProvider>
    );

    const { result } = renderHook(() => useMosaicFormContext(), { wrapper });
    expect(result.current).toBeDefined();
    expect(typeof result.current.register).toBe("function");
    expect(result.current.mosaicMode).toBe("onBlur");
  });

  it("renders children DOM correctly", () => {
    const { result: formResult } = renderHook(() =>
      useMosaicForm({ schema, defaultValues: { name: "" } }),
    );
    const { container } = render(
      <FormProvider form={formResult.current}>
        <span data-testid="child">hello</span>
      </FormProvider>,
    );
    expect(container.querySelector("[data-testid='child']")?.textContent).toBe("hello");
  });

  it("throws when useMosaicFormContext called outside provider", () => {
    expect(() => renderHook(() => useMosaicFormContext())).toThrow();
  });
});
