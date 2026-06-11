import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { SubmitButton } from "../../../runtimes/react/components/forms/SubmitButton";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import { computeSubmitButtonState } from "../SubmitButton.logic";
import { SubmitButtonPropsSchema } from "../SubmitButton.schema";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("SubmitButtonPropsSchema", () => {
  it("applies defaults: label='Submit', loadingLabel='Submitting…'", () => {
    const r = SubmitButtonPropsSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.label).toBe("Submit");
      expect(r.data.loadingLabel).toBe("Submitting…");
    }
  });

  it("accepts custom labels", () => {
    const r = SubmitButtonPropsSchema.safeParse({ label: "Send", loadingLabel: "Sending…" });
    expect(r.success).toBe(true);
  });

  it("rejects empty label", () => {
    const r = SubmitButtonPropsSchema.safeParse({ label: "" });
    expect(r.success).toBe(false);
  });
});

// ─── computeSubmitButtonState state machine tests ───────────────────────────

describe("computeSubmitButtonState", () => {
  it("invalid → disabled=true, loading=false", () => {
    const s = computeSubmitButtonState({ isValid: false, isSubmitting: false });
    expect(s).toEqual({ disabled: true, loading: false });
  });

  it("submitting → disabled=true, loading=true", () => {
    const s = computeSubmitButtonState({ isValid: true, isSubmitting: true });
    expect(s).toEqual({ disabled: true, loading: true });
  });

  it("invalid + submitting → disabled=true, loading=true (loading wins on display)", () => {
    const s = computeSubmitButtonState({ isValid: false, isSubmitting: true });
    expect(s).toEqual({ disabled: true, loading: true });
  });

  it("valid + not submitting → enabled (disabled=false, loading=false)", () => {
    const s = computeSubmitButtonState({ isValid: true, isSubmitting: false });
    expect(s).toEqual({ disabled: false, loading: false });
  });
});

// ─── Integration tests ─────────────────────────────────────────────────────

function Harness({
  onSubmit,
  formRef,
}: {
  onSubmit?: (data: { email: string }) => void;
  formRef?: { current: ReturnType<typeof useMosaicForm> | null };
}) {
  const schema = z.object({ email: z.string().email() });
  const form = useMosaicForm({
    schema,
    defaultValues: { email: "ok@example.com" },
    mode: "onChange",
  });
  if (formRef) formRef.current = form;
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit?.(data))}>
        <SubmitButton label="Send" />
      </form>
    </FormProvider>
  );
}

describe("SubmitButton component", () => {
  it("renders with default label 'Submit'", () => {
    const schema = z.object({ x: z.string() });
    const TestComp = () => {
      const form = useMosaicForm({ schema, defaultValues: { x: "" } });
      return (
        <FormProvider form={form}>
          <form onSubmit={form.handleSubmit(() => undefined)}>
            <SubmitButton />
          </form>
        </FormProvider>
      );
    };
    render(<TestComp />);
    expect(screen.getByRole("button").textContent).toBe("Submit");
  });

  it("renders with custom label", () => {
    render(<Harness />);
    expect(screen.getByRole("button").textContent).toBe("Send");
  });

  it("submits form when clicked with valid data", async () => {
    const spy = vi.fn();
    const formRef = { current: null as ReturnType<typeof useMosaicForm> | null };
    render(<Harness onSubmit={spy} formRef={formRef} />);
    // RHF computes isValid lazily; trigger() forces a validation pass so the
    // button becomes enabled before we click it.
    await act(async () => {
      await formRef.current?.trigger();
    });
    await waitFor(() => {
      expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ email: "ok@example.com" });
    });
  });

  it("has type=submit attribute", () => {
    render(<Harness />);
    expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
  });
});
