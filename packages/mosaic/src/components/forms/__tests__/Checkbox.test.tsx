import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Checkbox } from "../../../runtimes/react/components/forms/Checkbox";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import { resolveAriaChecked, resolveDescribedBy } from "../Checkbox.logic";
import { CheckboxPropsSchema, validateCheckboxProps } from "../Checkbox.schema";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("CheckboxPropsSchema", () => {
  it("requires non-empty name", () => {
    const r = CheckboxPropsSchema.safeParse({ name: "", label: "Accept" });
    expect(r.success).toBe(false);
  });

  it("requires non-empty label", () => {
    const r = CheckboxPropsSchema.safeParse({ name: "accept", label: "" });
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid props", () => {
    const parsed = CheckboxPropsSchema.parse({ name: "accept", label: "Accept terms" });
    expect(parsed.name).toBe("accept");
    expect(parsed.label).toBe("Accept terms");
  });

  it("optional fields default to undefined", () => {
    const parsed = CheckboxPropsSchema.parse({ name: "agree", label: "I agree" });
    expect(parsed.disabled).toBeUndefined();
    expect(parsed.indeterminate).toBeUndefined();
    expect(parsed.description).toBeUndefined();
  });

  it("accepts all optional fields", () => {
    const parsed = validateCheckboxProps({
      name: "agree",
      label: "I agree",
      disabled: false,
      indeterminate: true,
      description: "Check this to agree to the terms / Cochez pour accepter",
    });
    expect(parsed.indeterminate).toBe(true);
    expect(parsed.description).toBeTruthy();
  });

  it("rejects invalid types", () => {
    const r = CheckboxPropsSchema.safeParse({ name: 42, label: "Accept" });
    expect(r.success).toBe(false);
  });
});

// ─── Pure logic tests ──────────────────────────────────────────────────────

describe("Checkbox logic", () => {
  describe("resolveAriaChecked", () => {
    it("returns 'mixed' when indeterminate is true regardless of checked", () => {
      expect(resolveAriaChecked(false, true)).toBe("mixed");
      expect(resolveAriaChecked(true, true)).toBe("mixed");
    });

    it("returns true when checked and not indeterminate", () => {
      expect(resolveAriaChecked(true, false)).toBe(true);
      expect(resolveAriaChecked(true, undefined)).toBe(true);
    });

    it("returns false when unchecked and not indeterminate", () => {
      expect(resolveAriaChecked(false, false)).toBe(false);
      expect(resolveAriaChecked(false, undefined)).toBe(false);
    });
  });

  describe("resolveDescribedBy", () => {
    it("returns undefined when no description and no error", () => {
      expect(resolveDescribedBy("desc-id", undefined, false, "error-id")).toBeUndefined();
    });

    it("returns descriptionId when description is provided and no error", () => {
      expect(resolveDescribedBy("desc-id", "Some hint", false, "error-id")).toBe("desc-id");
    });

    it("returns errorId when has error and no description", () => {
      expect(resolveDescribedBy("desc-id", undefined, true, "error-id")).toBe("error-id");
    });

    it("returns both IDs joined when description and error are present", () => {
      expect(resolveDescribedBy("desc-id", "Hint text", true, "error-id")).toBe("desc-id error-id");
    });

    it("returns undefined when description is empty string", () => {
      expect(resolveDescribedBy("desc-id", "", false, "error-id")).toBeUndefined();
    });
  });
});

// ─── Runtime tests (React) ─────────────────────────────────────────────────

function Harness({
  defaultValues,
  label,
  indeterminate,
  description,
  disabled,
}: {
  defaultValues: { accept: boolean };
  label?: string;
  indeterminate?: boolean;
  description?: string;
  disabled?: boolean;
}) {
  const schema = z.object({
    accept: z.boolean().refine((v) => v === true, { message: "must_accept" }),
  });
  const form = useMosaicForm({ schema, defaultValues });
  return (
    <FormProvider form={form}>
      <Checkbox
        name="accept"
        label={label ?? "Accept terms / Accepter les conditions"}
        indeterminate={indeterminate}
        description={description}
        disabled={disabled}
      />
    </FormProvider>
  );
}

describe("Checkbox (React runtime)", () => {
  it("renders a checkbox input with the provided label", () => {
    render(<Harness defaultValues={{ accept: false }} label="Accept / Accepter" />);
    expect(screen.getByRole("checkbox")).toBeTruthy();
    expect(screen.getByText("Accept / Accepter")).toBeTruthy();
  });

  it("starts unchecked when defaultValues is false", () => {
    render(<Harness defaultValues={{ accept: false }} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it("starts checked when defaultValues is true", () => {
    render(<Harness defaultValues={{ accept: true }} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("toggles checked state on space/click", () => {
    render(<Harness defaultValues={{ accept: false }} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(cb);
    expect(cb.checked).toBe(true);
    fireEvent.click(cb);
    expect(cb.checked).toBe(false);
  });

  it("sets DOM .indeterminate=true and aria-checked=mixed when indeterminate=true", () => {
    render(<Harness defaultValues={{ accept: false }} indeterminate={true} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    expect(cb.indeterminate).toBe(true);
    expect(cb.getAttribute("aria-checked")).toBe("mixed");
  });

  it("does not set indeterminate when prop is false", () => {
    render(<Harness defaultValues={{ accept: false }} indeterminate={false} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    expect(cb.indeterminate).toBe(false);
    expect(cb.getAttribute("aria-checked")).not.toBe("mixed");
  });

  it("wires aria-describedby to description element when description provided", () => {
    render(
      <Harness
        defaultValues={{ accept: false }}
        description="You must accept to continue / Vous devez accepter"
      />,
    );
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    const describedBy = cb.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(screen.getByText("You must accept to continue / Vous devez accepter")).toBeTruthy();
  });

  it("renders aria-invalid + describedby AFTER blur with invalid value", async () => {
    render(<Harness defaultValues={{ accept: false }} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.blur(cb);
    await waitFor(() => {
      expect(cb.getAttribute("aria-invalid")).toBe("true");
    });
    expect(cb.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("must_accept");
  });

  it("is disabled when disabled=true", () => {
    render(<Harness defaultValues={{ accept: false }} disabled={true} />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    expect(cb.disabled).toBe(true);
  });
});
