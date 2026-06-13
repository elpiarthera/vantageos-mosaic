// Preact parity tests for ProgressBar
// Verifies the preact runtime subpath exports a functionally identical component.
// The tsup preact pass aliases react → preact/compat — these tests validate
// the alias chain produces correct DOM output.

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
// Import from preact runtime path — tests parity with React implementation
import { ProgressBar } from "../ProgressBar.preact";

afterEach(() => {
  cleanup();
});

// ─── Preact parity tests ──────────────────────────────────────────────────────

describe("ProgressBar — Preact runtime parity", () => {
  it("renders role=progressbar with correct ARIA attributes", () => {
    render(<ProgressBar value={75} label="Budget" locale="en" colorVariant="default" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeDefined();
    expect(bar.getAttribute("aria-valuenow")).toBe("75");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-label")).toBe("Budget");
  });

  it("applies warning colorVariant class", () => {
    render(<ProgressBar value={80} label="Warning" locale="en" colorVariant="warning" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("warning");
  });

  it("applies danger colorVariant class", () => {
    render(<ProgressBar value={95} label="Critical" locale="en" colorVariant="danger" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("danger");
  });

  it("fill width matches value%", () => {
    const { container } = render(
      <ProgressBar value={60} label="Storage" locale="en" colorVariant="default" />,
    );
    const fill = container.querySelector("[data-testid='progress-fill']") as HTMLElement | null;
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe("60%");
  });

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

  it("renders at 0% edge case", () => {
    render(<ProgressBar value={0} label="Empty" locale="en" colorVariant="default" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("renders at 100% edge case", () => {
    render(<ProgressBar value={100} label="Full" locale="fr" colorVariant="default" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });

  it("label and value text rendered", () => {
    render(<ProgressBar value={55} label="Licenses" locale="en" colorVariant="default" />);
    expect(screen.getByText(/Licenses/)).toBeDefined();
    expect(screen.getByText(/55%/)).toBeDefined();
  });
});
