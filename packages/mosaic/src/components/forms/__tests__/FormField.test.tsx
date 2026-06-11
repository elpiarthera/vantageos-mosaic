import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormFieldPropsSchema } from "../FormField.schema";
import { FormField } from "../../../runtimes/react/components/forms/FormField";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("FormFieldPropsSchema", () => {
  it("requires non-empty name", () => {
    const r = FormFieldPropsSchema.safeParse({ name: "" });
    expect(r.success).toBe(false);
  });

  it("accepts valid name", () => {
    const r = FormFieldPropsSchema.safeParse({ name: "email" });
    expect(r.success).toBe(true);
  });
});

// ─── FormField tests ────────────────────────────────────────────────────────

function Harness({
  defaultValues,
  onRender,
}: {
  defaultValues: { email: string };
  onRender?: () => void;
}) {
  const schema = z.object({ email: z.string().email("invalid_email") });
  const form = useMosaicForm({ schema, defaultValues });
  return (
    <FormProvider form={form}>
      <FormField name="email">
        {({ field, fieldState }) => {
          onRender?.();
          return (
            <>
              <input
                data-testid="email-input"
                aria-label="email"
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
              {fieldState.error ? (
                <span data-testid="email-err">{fieldState.error.message}</span>
              ) : null}
            </>
          );
        }}
      </FormField>
    </FormProvider>
  );
}

describe("FormField", () => {
  it("renders child via render-prop with field + fieldState", () => {
    render(<Harness defaultValues={{ email: "seed" }} />);
    const input = screen.getByTestId("email-input") as HTMLInputElement;
    expect(input.value).toBe("seed");
  });

  it("validation does NOT fire on keystroke (default onBlur mode)", async () => {
    render(<Harness defaultValues={{ email: "" }} />);
    const input = screen.getByTestId("email-input");
    fireEvent.change(input, { target: { value: "not-email" } });
    // Give RHF a tick
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(screen.queryByTestId("email-err")).toBeNull();
  });

  it("validation FIRES on blur (onBlur timing assertion)", async () => {
    render(<Harness defaultValues={{ email: "" }} />);
    const input = screen.getByTestId("email-input");
    fireEvent.change(input, { target: { value: "not-email" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByTestId("email-err").textContent).toBe("invalid_email");
    });
  });

  it("re-renders on each blur event (vi.fn spy)", async () => {
    const renderSpy = vi.fn();
    render(<Harness defaultValues={{ email: "" }} onRender={renderSpy} />);
    const initialCalls = renderSpy.mock.calls.length;
    const input = screen.getByTestId("email-input");
    fireEvent.change(input, { target: { value: "bad" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(renderSpy.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
