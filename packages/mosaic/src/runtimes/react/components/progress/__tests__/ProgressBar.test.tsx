// Tests for ProgressBar — React 19 runtime subpath
// Covers: variants, a11y, i18n, error fallback, fill width parity with BARE

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ProgressBarPropsSchema,
  validateProps,
} from "../../../../../components/progress/ProgressBar.schema";
import { ProgressBar } from "../ProgressBar";

afterEach(() => {
  cleanup();
});

// ─── 1. Zod schema parity (runtime re-uses BARE schema) ───────────────────────

describe("ProgressBar (react) — Zod schema", () => {
  it("accepts valid happy-path props", () => {
    const result = ProgressBarPropsSchema.safeParse({ value: 75, label: "Budget", locale: "fr" });
    expect(result.success).toBe(true);
  });

  it("applies default locale=en and colorVariant=default when omitted", () => {
    const result = ProgressBarPropsSchema.safeParse({ value: 50, label: "Usage" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
      expect(result.data.colorVariant).toBe("default");
    }
  });

  it("rejects value > 100", () => {
    expect(ProgressBarPropsSchema.safeParse({ value: 150, label: "X" }).success).toBe(false);
  });

  it("rejects empty label", () => {
    expect(ProgressBarPropsSchema.safeParse({ value: 50, label: "" }).success).toBe(false);
  });

  it("validateProps throws on invalid input", () => {
    expect(() => validateProps({ value: 200, label: "X" })).toThrow();
  });
});

// ─── 2. Component render — WCAG-AA ARIA ───────────────────────────────────────

describe("ProgressBar (react) — ARIA attributes", () => {
  it("renders role=progressbar with correct aria attributes", () => {
    render(<ProgressBar value={75} label="Budget" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeDefined();
    expect(bar.getAttribute("aria-valuenow")).toBe("75");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-label")).toBe("Budget");
  });

  it("is keyboard focusable (tabIndex=0)", () => {
    render(<ProgressBar value={50} label="Licenses" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("tabindex")).toBe("0");
  });
});

// ─── 3. Color variants ────────────────────────────────────────────────────────

describe("ProgressBar (react) — color variants", () => {
  it("applies default variant class", () => {
    render(<ProgressBar value={50} label="Default" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progressbar-default");
  });

  it("applies warning variant class", () => {
    render(<ProgressBar value={80} label="Warn" locale="en" colorVariant="warning" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("warning");
  });

  it("applies danger variant class", () => {
    render(<ProgressBar value={95} label="Crit" locale="en" colorVariant="danger" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("danger");
  });
});

// ─── 4. Fill width parity ─────────────────────────────────────────────────────

describe("ProgressBar (react) — fill width", () => {
  it("sets fill width equal to value%", () => {
    const { container } = render(
      <ProgressBar value={42} label="Quota" locale="en" colorVariant="default" />,
    );
    const fill = container.querySelector("[data-testid='progress-fill']") as HTMLElement | null;
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe("42%");
  });

  it("renders at 0% edge case", () => {
    render(<ProgressBar value={0} label="Empty" locale="en" colorVariant="default" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("renders at 100% edge case", () => {
    render(<ProgressBar value={100} label="Full" locale="en" colorVariant="default" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });
});

// ─── 5. i18n + error fallback ─────────────────────────────────────────────────

describe("ProgressBar (react) — i18n + error fallback", () => {
  it("renders EN error fallback for invalid props", () => {
    render(
      <ProgressBar
        value={999 as unknown as number}
        label=""
        locale={"en" as const}
        colorVariant="default"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/invalid props/i);
  });

  it("renders FR error fallback when locale=fr", () => {
    render(
      <ProgressBar
        value={999 as unknown as number}
        label=""
        locale={"fr" as const}
        colorVariant="default"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("renders with locale=fr without error on valid props", () => {
    render(<ProgressBar value={50} label="Progression" locale="fr" colorVariant="default" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("Progression");
  });
});
