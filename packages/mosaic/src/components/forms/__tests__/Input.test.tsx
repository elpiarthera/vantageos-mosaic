import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { Input } from "../../../runtimes/react/components/forms/Input";
import {
  type UseMosaicFormReturn,
  useMosaicForm,
} from "../../../runtimes/react/components/forms/useMosaicForm";
import { buildErrorDescribedBy, buildInputId, resolveHtmlType } from "../Input.logic";
import { InputPropsSchema, InputTypeSchema } from "../Input.schema";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("InputPropsSchema", () => {
  it("requires non-empty name", () => {
    const r = InputPropsSchema.safeParse({ name: "", label: "Email" });
    expect(r.success).toBe(false);
  });

  it("requires non-empty label (consumer-driven i18n)", () => {
    const r = InputPropsSchema.safeParse({ name: "email", label: "" });
    expect(r.success).toBe(false);
  });

  it.each(["text", "email", "password", "number", "url"] as const)("accepts type = %s", (type) => {
    const r = InputPropsSchema.safeParse({ name: "f", label: "F", type });
    expect(r.success).toBe(true);
  });

  it("rejects unknown type", () => {
    const r = InputTypeSchema.safeParse("checkbox");
    expect(r.success).toBe(false);
  });

  it("accepts optional placeholder + disabled + autoComplete", () => {
    const r = InputPropsSchema.safeParse({
      name: "email",
      label: "Email",
      placeholder: "you@example.com",
      disabled: true,
      autoComplete: "email",
    });
    expect(r.success).toBe(true);
  });
});

// ─── Pure logic tests ───────────────────────────────────────────────────────

describe("Input.logic", () => {
  it("buildInputId composes form name + field name when provided", () => {
    expect(buildInputId("signup", "email")).toBe("signup-email");
  });

  it("buildInputId falls back to mosaic-input prefix when no form name", () => {
    expect(buildInputId(undefined, "email")).toBe("mosaic-input-email");
  });

  it("buildErrorDescribedBy returns id-error when hasError true", () => {
    expect(buildErrorDescribedBy("signup-email", true)).toBe("signup-email-error");
  });

  it("buildErrorDescribedBy returns undefined when hasError false", () => {
    expect(buildErrorDescribedBy("signup-email", false)).toBeUndefined();
  });

  it("resolveHtmlType defaults to text when undefined", () => {
    expect(resolveHtmlType(undefined)).toBe("text");
  });

  it("resolveHtmlType passes through known types", () => {
    expect(resolveHtmlType("email")).toBe("email");
    expect(resolveHtmlType("password")).toBe("password");
  });
});

// ─── Runtime tests ──────────────────────────────────────────────────────────

interface HarnessProps {
  type?: "text" | "email" | "password" | "number" | "url";
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  onForm?: (form: UseMosaicFormReturn<{ email: string }>) => void;
}

function Harness({
  type,
  disabled,
  placeholder,
  autoComplete,
  defaultValue,
  onForm,
}: HarnessProps) {
  const schema = z.object({ email: z.string().email("invalid_email") });
  const form = useMosaicForm({ schema, defaultValues: { email: defaultValue ?? "" } });
  const captured = useRef(false);
  if (!captured.current && onForm) {
    captured.current = true;
    onForm(form);
  }
  return (
    <FormProvider form={form}>
      <Input
        name="email"
        type={type}
        label="Email"
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </FormProvider>
  );
}

describe("Input (runtime)", () => {
  it.each([
    ["text", "text"],
    ["email", "email"],
    ["password", "password"],
    ["number", "number"],
    ["url", "url"],
  ] as const)("renders an <input> with HTML type=%s when type=%s", (htmlType, type) => {
    render(<Harness type={type} />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.type).toBe(htmlType);
  });

  it("defaults to type=text when no type prop given", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.type).toBe("text");
  });

  it("renders the consumer-supplied label and wires htmlFor / id", () => {
    render(<Harness />);
    const label = screen.getByText("Email");
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(label.tagName).toBe("LABEL");
    expect((label as HTMLLabelElement).htmlFor).toBe(input.id);
    expect(input.id.length).toBeGreaterThan(0);
  });

  it("passes through placeholder, disabled, autoComplete to the DOM", () => {
    render(<Harness placeholder="you@example.com" disabled autoComplete="email" />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.placeholder).toBe("you@example.com");
    expect(input.disabled).toBe(true);
    expect(input.autocomplete).toBe("email");
  });

  it("integrates with FormProvider — typing updates form values", async () => {
    let formRef: UseMosaicFormReturn<{ email: string }> | undefined;
    const capture = (f: UseMosaicFormReturn<{ email: string }>) => {
      formRef = f;
    };
    render(<Harness type="email" onForm={capture} />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abc@def.gh" } });
    await waitFor(() => {
      expect(formRef?.getValues("email")).toBe("abc@def.gh");
    });
  });

  it("validation does NOT fire on keystroke (default onBlur mode)", async () => {
    render(<Harness type="email" />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "not-email" } });
    await new Promise((r) => setTimeout(r, 30));
    expect(input.getAttribute("aria-invalid")).not.toBe("true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("validation FIRES on blur — emits aria-invalid=true + aria-describedby + error element", async () => {
    // T10 lesson #5 — inspect errors via onInvalid handler (formState.errors is
    // a lazy Proxy; checking via submit-onInvalid is the doctrine pattern).
    const onInvalid = vi.fn();
    function Inner() {
      const schema = z.object({ email: z.string().email("invalid_email") });
      const form = useMosaicForm({ schema, defaultValues: { email: "" } });
      return (
        <FormProvider form={form}>
          <form onSubmit={form.handleSubmit(() => undefined, onInvalid)} noValidate>
            <Input name="email" type="email" label="Email" />
            <button type="submit">submit</button>
          </form>
        </FormProvider>
      );
    }
    render(<Inner />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "not-email" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });
    const errId = input.getAttribute("aria-describedby");
    expect(errId).toBeTruthy();
    const errEl = errId ? document.getElementById(errId) : null;
    expect(errEl).not.toBeNull();
    expect(errEl?.getAttribute("role")).toBe("alert");
    expect(errEl?.textContent).toBe("invalid_email");
    // Confirm RHF onInvalid receives a populated errors object after submit
    fireEvent.click(screen.getByText("submit"));
    await waitFor(() => {
      expect(onInvalid).toHaveBeenCalled();
    });
    const errors = onInvalid.mock.calls[0]?.[0] as { email?: { message?: string } };
    expect(errors.email?.message).toBe("invalid_email");
  });

  it("clears aria-invalid + error after blur with valid value", async () => {
    render(<Harness type="email" />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    // first: invalid + blur
    fireEvent.change(input, { target: { value: "bad" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });
    // then: fix + blur
    fireEvent.change(input, { target: { value: "ok@ok.ok" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(input.getAttribute("aria-invalid")).not.toBe("true");
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
