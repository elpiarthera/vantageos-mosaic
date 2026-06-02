import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";
import { ProgressBarSchema, validateProps } from "./ProgressBar.schema";
import corpus from "./eval-corpus.json";

// ─── Schema unit tests ───────────────────────────────────────────────────────

describe("ProgressBarSchema", () => {
  it("accepts valid happy-path props", () => {
    const result = ProgressBarSchema.safeParse({ value: 75, label: "Budget", locale: "fr" });
    expect(result.success).toBe(true);
  });

  it("applies default locale=en and colorVariant=default when omitted", () => {
    const result = ProgressBarSchema.safeParse({ value: 50, label: "Usage" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
      expect(result.data.colorVariant).toBe("default");
    }
  });

  it("rejects value > 100", () => {
    const result = ProgressBarSchema.safeParse({ value: 150, label: "Budget" });
    expect(result.success).toBe(false);
  });

  it("rejects value < 0", () => {
    const result = ProgressBarSchema.safeParse({ value: -1, label: "Budget" });
    expect(result.success).toBe(false);
  });

  it("rejects empty label", () => {
    const result = ProgressBarSchema.safeParse({ value: 50, label: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale", () => {
    const result = ProgressBarSchema.safeParse({ value: 50, label: "X", locale: "de" });
    expect(result.success).toBe(false);
  });

  it("accepts colorVariant=warning", () => {
    const result = ProgressBarSchema.safeParse({
      value: 80,
      label: "Warn",
      colorVariant: "warning",
    });
    expect(result.success).toBe(true);
  });

  it("accepts colorVariant=danger", () => {
    const result = ProgressBarSchema.safeParse({
      value: 95,
      label: "Crit",
      colorVariant: "danger",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid colorVariant", () => {
    const result = ProgressBarSchema.safeParse({ value: 50, label: "X", colorVariant: "purple" });
    expect(result.success).toBe(false);
  });
});

describe("validateProps", () => {
  it("parses valid props and returns typed object", () => {
    const props = validateProps({ value: 42, label: "Test", locale: "en" });
    expect(props.value).toBe(42);
    expect(props.label).toBe("Test");
    expect(props.locale).toBe("en");
    expect(props.colorVariant).toBe("default");
  });

  it("throws ZodError on invalid input", () => {
    expect(() => validateProps({ value: 200, label: "X" })).toThrow();
  });
});

// ─── Component render tests ───────────────────────────────────────────────────

describe("ProgressBar component", () => {
  it("renders progressbar role with correct aria attributes", () => {
    render(<ProgressBar value={75} label="Budget" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeDefined();
    expect(bar.getAttribute("aria-valuenow")).toBe("75");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-label")).toBe("Budget");
  });

  it("renders label and value text", () => {
    render(<ProgressBar value={60} label="Licenses" locale="en" colorVariant="default" />);
    expect(screen.getByText(/Licenses/)).toBeDefined();
    expect(screen.getByText(/60%/)).toBeDefined();
  });

  it("renders at 0% (edge case)", () => {
    render(<ProgressBar value={0} label="Empty" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
  });

  it("renders at 100% (edge case)", () => {
    render(<ProgressBar value={100} label="Full" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
  });

  it("renders error fallback for invalid props — role=alert", () => {
    render(
      <ProgressBar
        value={999 as unknown as number}
        label=""
        locale={"de" as "en"}
        colorVariant="default"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/invalid props/i);
  });

  it("renders with locale=fr (i18n label)", () => {
    render(<ProgressBar value={50} label="Budget" locale="fr" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-label")).toBe("Budget");
  });

  it("applies warning colorVariant class", () => {
    render(<ProgressBar value={80} label="Warn" locale="en" colorVariant="warning" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("warning");
  });

  it("applies danger colorVariant class", () => {
    render(<ProgressBar value={95} label="Crit" locale="en" colorVariant="danger" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("danger");
  });

  it("sets fill width equal to value%", () => {
    const { container } = render(
      <ProgressBar value={42} label="Quota" locale="en" colorVariant="default" />,
    );
    const fill = container.querySelector("[data-testid='progress-fill']") as HTMLElement | null;
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe("42%");
  });
});

// ─── Eval-corpus driven tests ─────────────────────────────────────────────────

describe("ProgressBar eval-corpus", () => {
  for (const entry of corpus) {
    it(`corpus case "${entry.case}": ${entry.expect}`, () => {
      if (entry.case === "failure") {
        render(
          <ProgressBar
            value={entry.input.value as number}
            label={(entry.input.label ?? "") as string}
            locale={(entry.input.locale ?? "en") as "en" | "fr"}
            colorVariant="default"
          />,
        );
        expect(screen.getByRole("alert")).toBeDefined();
      } else {
        render(
          <ProgressBar
            value={entry.input.value as number}
            label={(entry.input.label ?? "Test") as string}
            locale={(entry.input.locale ?? "en") as "en" | "fr"}
            colorVariant="default"
          />,
        );
        expect(screen.getByRole("progressbar")).toBeDefined();
      }
    });
  }
});
