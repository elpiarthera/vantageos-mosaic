import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { Textarea } from "../../../runtimes/react/components/forms/Textarea";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import {
  DEFAULT_TEXTAREA_ROWS,
  clampToMaxLength,
  computeAutoResizeHeight,
  resolveRows,
} from "../Textarea.logic";
import { TextareaPropsSchema, validateTextareaProps } from "../Textarea.schema";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("TextareaPropsSchema", () => {
  it("requires non-empty name", () => {
    const r = TextareaPropsSchema.safeParse({ name: "" });
    expect(r.success).toBe(false);
  });

  it("defaults rows to 3 when omitted", () => {
    const parsed = TextareaPropsSchema.parse({ name: "bio" });
    expect(parsed.rows).toBe(3);
  });

  it("defaults autoResize to false", () => {
    const parsed = TextareaPropsSchema.parse({ name: "bio" });
    expect(parsed.autoResize).toBe(false);
  });

  it("rejects rows < 1", () => {
    const r = TextareaPropsSchema.safeParse({ name: "bio", rows: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects non-integer rows", () => {
    const r = TextareaPropsSchema.safeParse({ name: "bio", rows: 2.5 });
    expect(r.success).toBe(false);
  });

  it("rejects maxLength < 1", () => {
    const r = TextareaPropsSchema.safeParse({ name: "bio", maxLength: 0 });
    expect(r.success).toBe(false);
  });

  it("accepts a full props object", () => {
    const parsed = validateTextareaProps({
      name: "bio",
      rows: 5,
      maxLength: 200,
      autoResize: true,
      placeholder: "Tell us about yourself",
      disabled: false,
      label: "Bio",
    });
    expect(parsed.name).toBe("bio");
    expect(parsed.rows).toBe(5);
    expect(parsed.maxLength).toBe(200);
    expect(parsed.autoResize).toBe(true);
  });
});

// ─── Pure logic tests ──────────────────────────────────────────────────────

describe("Textarea logic", () => {
  it("DEFAULT_TEXTAREA_ROWS is 3", () => {
    expect(DEFAULT_TEXTAREA_ROWS).toBe(3);
  });

  describe("clampToMaxLength", () => {
    it("returns value unchanged when maxLength undefined", () => {
      expect(clampToMaxLength("hello world", undefined)).toBe("hello world");
    });

    it("returns value unchanged when within limit", () => {
      expect(clampToMaxLength("hi", 5)).toBe("hi");
    });

    it("clamps value when over limit", () => {
      expect(clampToMaxLength("hello world", 5)).toBe("hello");
    });

    it("returns empty string unchanged with maxLength", () => {
      expect(clampToMaxLength("", 5)).toBe("");
    });
  });

  describe("resolveRows", () => {
    it("returns default when undefined", () => {
      expect(resolveRows(undefined)).toBe(3);
    });

    it("returns the value when valid integer ≥ 1", () => {
      expect(resolveRows(5)).toBe(5);
    });

    it("falls back to default when < 1", () => {
      expect(resolveRows(0)).toBe(3);
      expect(resolveRows(-2)).toBe(3);
    });

    it("floors non-integer values", () => {
      expect(resolveRows(4.7)).toBe(4);
    });
  });

  describe("computeAutoResizeHeight", () => {
    it("returns minHeightPx when scrollHeight ≤ 0", () => {
      expect(computeAutoResizeHeight(0, 60)).toBe(60);
      expect(computeAutoResizeHeight(-1, 60)).toBe(60);
    });

    it("returns scrollHeight when greater than min", () => {
      expect(computeAutoResizeHeight(120, 60)).toBe(120);
    });

    it("returns min when scrollHeight is less than min", () => {
      expect(computeAutoResizeHeight(40, 60)).toBe(60);
    });
  });
});

// ─── Runtime tests (React) ─────────────────────────────────────────────────

function Harness({
  defaultValues,
  maxLength,
  rows,
  label,
  autoResize,
  placeholder,
}: {
  defaultValues: { bio: string };
  maxLength?: number;
  rows?: number;
  label?: string;
  autoResize?: boolean;
  placeholder?: string;
}) {
  const schema = z.object({
    bio: z.string().min(5, "too_short"),
  });
  const form = useMosaicForm({ schema, defaultValues });
  return (
    <FormProvider form={form}>
      <Textarea
        name="bio"
        maxLength={maxLength}
        rows={rows}
        label={label}
        autoResize={autoResize}
        placeholder={placeholder}
      />
    </FormProvider>
  );
}

describe("Textarea (React runtime)", () => {
  it("renders a <textarea> with default rows=3 when rows omitted", () => {
    render(<Harness defaultValues={{ bio: "" }} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta.rows).toBe(3);
  });

  it("renders with custom rows when provided", () => {
    render(<Harness defaultValues={{ bio: "" }} rows={6} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.rows).toBe(6);
  });

  it("renders the label when provided", () => {
    render(<Harness defaultValues={{ bio: "" }} label="Bio" />);
    expect(screen.getByText("Bio")).toBeTruthy();
  });

  it("renders the placeholder when provided", () => {
    render(<Harness defaultValues={{ bio: "" }} placeholder="Tell us" />);
    const ta = screen.getByPlaceholderText("Tell us") as HTMLTextAreaElement;
    expect(ta).toBeTruthy();
  });

  it("binds the field value from RHF", () => {
    render(<Harness defaultValues={{ bio: "seed" }} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.value).toBe("seed");
  });

  it("updates the field value on change", () => {
    render(<Harness defaultValues={{ bio: "" }} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "hello" } });
    expect(ta.value).toBe("hello");
  });

  it("emits aria-invalid + describedby AFTER blur with invalid value (onBlur timing)", async () => {
    render(<Harness defaultValues={{ bio: "" }} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "no" } });
    // No error yet — onBlur mode default
    expect(ta.getAttribute("aria-invalid")).toBeNull();
    fireEvent.blur(ta);
    await waitFor(() => {
      expect(ta.getAttribute("aria-invalid")).toBe("true");
    });
    expect(ta.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("too_short");
  });

  it("clamps onChange when over maxLength (logic-gated)", () => {
    render(<Harness defaultValues={{ bio: "" }} maxLength={5} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    // Simulate a programmatic over-cap write (DOM maxLength caps typed input, but
    // pasted/programmatic values still need the logic gate). RHF receives the
    // clamped value, then React re-renders the controlled textarea.
    fireEvent.change(ta, { target: { value: "hello world" } });
    expect(ta.value).toBe("hello");
    expect(ta.maxLength).toBe(5);
  });

  it("propagates autoResize prop without crashing (jsdom — scrollHeight is 0)", () => {
    render(<Harness defaultValues={{ bio: "hi" }} autoResize={true} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "longer content here" } });
    // jsdom reports scrollHeight = 0; logic falls back to min height. The
    // assertion here is "did not throw, applied a height style".
    expect(ta.style.height).toMatch(/px$/);
  });
});
