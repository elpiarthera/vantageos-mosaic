import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorDisplay } from "../../../runtimes/react/components/forms/ErrorDisplay";
import { formatErrorMessage } from "../ErrorDisplay.logic";
import { ErrorDisplayPropsSchema } from "../ErrorDisplay.schema";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("ErrorDisplayPropsSchema", () => {
  it("accepts undefined error (no error to show)", () => {
    const r = ErrorDisplayPropsSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts error with type=required", () => {
    const r = ErrorDisplayPropsSchema.safeParse({
      error: { type: "required", message: "champ requis" },
    });
    expect(r.success).toBe(true);
  });

  it("accepts custom messageMap for i18n", () => {
    const r = ErrorDisplayPropsSchema.safeParse({
      error: { type: "min" },
      messageMap: { min: "Trop court" },
    });
    expect(r.success).toBe(true);
  });
});

// ─── formatErrorMessage logic tests ─────────────────────────────────────────

describe("formatErrorMessage", () => {
  it("returns undefined when error is undefined", () => {
    expect(formatErrorMessage(undefined, {})).toBeUndefined();
  });

  it("prefers explicit error.message over messageMap", () => {
    expect(
      formatErrorMessage({ type: "required", message: "Custom msg" }, { required: "default" }),
    ).toBe("Custom msg");
  });

  it("falls back to messageMap[type] when error.message missing — required", () => {
    expect(formatErrorMessage({ type: "required" }, { required: "Required field" })).toBe(
      "Required field",
    );
  });

  it("falls back to messageMap[type] when error.message missing — min", () => {
    expect(formatErrorMessage({ type: "min" }, { min: "Too short" })).toBe("Too short");
  });

  it("falls back to messageMap[type] when error.message missing — max", () => {
    expect(formatErrorMessage({ type: "max" }, { max: "Too long" })).toBe("Too long");
  });

  it("falls back to messageMap[type] when error.message missing — regex (pattern)", () => {
    expect(formatErrorMessage({ type: "pattern" }, { pattern: "Bad format" })).toBe("Bad format");
  });

  it("returns generic fallback when neither message nor messageMap match", () => {
    expect(formatErrorMessage({ type: "unknown" }, {})).toBe("Invalid value");
  });
});

// ─── ErrorDisplay component tests ───────────────────────────────────────────

describe("ErrorDisplay component", () => {
  it("renders nothing when error is undefined", () => {
    const { container } = render(<ErrorDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("renders role=alert with explicit error.message", () => {
    render(<ErrorDisplay error={{ type: "required", message: "Champ requis" }} />);
    const el = screen.getByRole("alert");
    expect(el.textContent).toBe("Champ requis");
  });

  it("renders messageMap[type] when message missing", () => {
    render(<ErrorDisplay error={{ type: "min" }} messageMap={{ min: "Min 3 chars" }} />);
    expect(screen.getByRole("alert").textContent).toBe("Min 3 chars");
  });

  it("renders generic fallback for unknown error type", () => {
    render(<ErrorDisplay error={{ type: "weird-type" }} />);
    expect(screen.getByRole("alert").textContent).toBe("Invalid value");
  });
});
