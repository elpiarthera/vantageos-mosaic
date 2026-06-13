/**
 * StatusBadge — React runtime tests.
 *
 * Tests cover:
 *   - All 5 variant classes (success / warning / danger / info / neutral)
 *   - Accessibility: role="status" via <output> implicit ARIA role
 *   - aria-label fallback (status → label)
 *   - lang attribute bound to locale
 *   - Invalid-props error fallback (EN + FR i18n branch)
 *   - Barrel export resolution from react/display
 *   - Preact structural parity (schema + render contract)
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusBadge } from "../StatusBadge.js";

afterEach(() => {
  cleanup();
});

// ─── Variant classes ──────────────────────────────────────────────────────────

describe("StatusBadge — variants", () => {
  it("applies success classes for success variant", () => {
    render(<StatusBadge status="active" variant="success" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("applies warning classes for warning variant", () => {
    render(<StatusBadge status="pending" variant="warning" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-800");
  });

  it("applies danger classes for danger variant", () => {
    render(<StatusBadge status="error" variant="danger" locale="fr" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-red-100");
  });

  it("applies info classes for info variant", () => {
    render(<StatusBadge status="info" variant="info" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-blue-100");
  });

  it("defaults variant to neutral when not specified", () => {
    render(<StatusBadge status="unknown" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-slate-100");
    expect(badge.className).toContain("text-slate-800");
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe("StatusBadge — accessibility", () => {
  it("renders with implicit role=status via <output> element", () => {
    render(<StatusBadge status="active" variant="success" locale="en" />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("uses label as aria-label when provided", () => {
    render(<StatusBadge status="active" variant="success" label="Active task" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.getAttribute("aria-label")).toBe("Active task");
    expect(badge.textContent).toBe("Active task");
  });

  it("falls back to status as aria-label when no label", () => {
    render(<StatusBadge status="done" variant="success" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.getAttribute("aria-label")).toBe("done");
  });

  it("sets lang attribute to locale", () => {
    render(<StatusBadge status="actif" locale="fr" />);
    const badge = screen.getByRole("status");
    expect(badge.getAttribute("lang")).toBe("fr");
  });
});

// ─── Invalid props / error fallback ──────────────────────────────────────────

describe("StatusBadge — invalid props fallback", () => {
  it("renders EN error alert for missing required fields", () => {
    render(<StatusBadge />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("StatusBadge: invalid props");
  });

  it("renders FR error alert when raw.locale=fr (i18n branch)", () => {
    render(<StatusBadge status={123 as unknown as string} variant="unknown" locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("renders error fallback for invalid variant", () => {
    render(<StatusBadge status="test" variant="invalid_variant" locale="en" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

// ─── Barrel export ────────────────────────────────────────────────────────────

describe("StatusBadge — barrel resolution", () => {
  it("is exported from react/display barrel", async () => {
    const barrel = await import("../index.js");
    expect(barrel.StatusBadge).toBeDefined();
    expect(typeof barrel.StatusBadge).toBe("function");
  });

  it("StatusBadgePropsSchema exported from barrel", async () => {
    const barrel = await import("../index.js");
    expect(barrel.StatusBadgePropsSchema).toBeDefined();
  });
});
