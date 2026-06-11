import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  UseMosaicFormOptionsSchema,
  validateOptions,
} from "../useMosaicForm.schema";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("UseMosaicFormOptionsSchema", () => {
  it("applies default mode='onBlur' when omitted", () => {
    const result = UseMosaicFormOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("onBlur");
    }
  });

  it("accepts valid mode='onBlur'", () => {
    const r = UseMosaicFormOptionsSchema.safeParse({ mode: "onBlur" });
    expect(r.success).toBe(true);
  });

  it("accepts valid mode='onChange'", () => {
    const r = UseMosaicFormOptionsSchema.safeParse({ mode: "onChange" });
    expect(r.success).toBe(true);
  });

  it("accepts valid mode='onSubmit'", () => {
    const r = UseMosaicFormOptionsSchema.safeParse({ mode: "onSubmit" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid mode value", () => {
    const r = UseMosaicFormOptionsSchema.safeParse({ mode: "always" });
    expect(r.success).toBe(false);
  });

  it("validateOptions throws on invalid mode", () => {
    expect(() => validateOptions({ mode: "always" })).toThrow();
  });

  it("validateOptions returns parsed defaults", () => {
    const opts = validateOptions({});
    expect(opts.mode).toBe("onBlur");
  });
});

// ─── Hook integration tests ─────────────────────────────────────────────────

describe("useMosaicForm hook", () => {
  const schema = z.object({
    email: z.string().email("invalid_email"),
    age: z.number().min(18, "min_18"),
  });

  it("returns RHF form object with mosaicSchema metadata attached", () => {
    const { result } = renderHook(() =>
      useMosaicForm({ schema, defaultValues: { email: "", age: 0 } }),
    );
    expect(result.current).toBeDefined();
    expect(typeof result.current.register).toBe("function");
    expect(typeof result.current.handleSubmit).toBe("function");
    expect(result.current.mosaicSchema).toBe(schema);
    expect(result.current.mosaicMode).toBe("onBlur");
  });

  it("integrates zodResolver and validates on submit", async () => {
    const { result } = renderHook(() =>
      useMosaicForm({ schema, defaultValues: { email: "invalid", age: 5 } }),
    );

    await act(async () => {
      await result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.formState.errors.email).toBeDefined();
      expect(result.current.formState.errors.age).toBeDefined();
    });
    expect(result.current.formState.errors.email?.message).toBe("invalid_email");
    expect(result.current.formState.errors.age?.message).toBe("min_18");
  });

  it("validates successfully when data is valid", async () => {
    const { result } = renderHook(() =>
      useMosaicForm({
        schema,
        defaultValues: { email: "ok@example.com", age: 25 },
      }),
    );

    let valid = false;
    await act(async () => {
      valid = await result.current.trigger();
    });

    expect(valid).toBe(true);
    expect(result.current.formState.errors.email).toBeUndefined();
  });

  it("respects mode override (onSubmit instead of default onBlur)", () => {
    const { result } = renderHook(() =>
      useMosaicForm({ schema, defaultValues: { email: "", age: 0 }, mode: "onSubmit" }),
    );
    expect(result.current.mosaicMode).toBe("onSubmit");
  });
});
