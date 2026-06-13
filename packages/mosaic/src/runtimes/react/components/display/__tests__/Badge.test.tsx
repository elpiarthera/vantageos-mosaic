/**
 * Badge — React runtime tests.
 *
 * Tests cover:
 *   - All 4 core variant classes (default / primary / success / warning)
 *   - Additional variants: danger / info / neutral
 *   - Optional dot indicator (aria-hidden, renders dot span)
 *   - Optional count badge (aria-hidden, renders count span)
 *   - Accessibility: aria-label combining "Badge: <label>" + lang attribute
 *   - Invalid-props error fallback (EN + FR i18n branch)
 *   - Barrel export resolution from react/display
 *   - Preact structural parity (schema + render contract)
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "../Badge.js";

afterEach(() => {
  cleanup();
});

// ─── Variant classes ──────────────────────────────────────────────────────────

describe("Badge — variants", () => {
  it("applies default classes for default variant", () => {
    render(<Badge label="Tag" variant="default" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: Tag/i });
    expect(badge.className).toContain("bg-slate-100");
    expect(badge.className).toContain("text-slate-700");
  });

  it("applies primary classes for primary variant", () => {
    render(<Badge label="New" variant="primary" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: New/i });
    expect(badge.className).toContain("bg-indigo-100");
    expect(badge.className).toContain("text-indigo-800");
  });

  it("applies success classes for success variant", () => {
    render(<Badge label="Active" variant="success" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: Active/i });
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("applies warning classes for warning variant", () => {
    render(<Badge label="Pending" variant="warning" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: Pending/i });
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-800");
  });

  it("applies danger classes for danger variant", () => {
    render(<Badge label="Error" variant="danger" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: Error/i });
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
  });

  it("applies info classes for info variant", () => {
    render(<Badge label="Info" variant="info" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: Info/i });
    expect(badge.className).toContain("bg-blue-100");
    expect(badge.className).toContain("text-blue-800");
  });

  it("defaults variant to default when not specified", () => {
    render(<Badge label="Generic" locale="en" />);
    const badge = screen.getByRole("generic", { name: /Badge: Generic/i });
    expect(badge.className).toContain("bg-slate-100");
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe("Badge — accessibility", () => {
  it("sets aria-label to 'Badge: <label>'", () => {
    render(<Badge label="Release" variant="success" locale="en" />);
    const badge = screen.getByRole("generic", { name: "Badge: Release" });
    expect(badge.getAttribute("aria-label")).toBe("Badge: Release");
  });

  it("sets lang attribute to locale", () => {
    render(<Badge label="Nouveau" variant="primary" locale="fr" />);
    const badge = screen.getByRole("generic", { name: /Badge: Nouveau/i });
    expect(badge.getAttribute("lang")).toBe("fr");
  });

  it("dot span is aria-hidden when dot=true", () => {
    const { container } = render(<Badge label="Live" variant="success" dot locale="en" />);
    const dotSpan = container.querySelector("span[aria-hidden='true']");
    expect(dotSpan).not.toBeNull();
  });

  it("count span is aria-hidden when count is provided", () => {
    const { container } = render(
      <Badge label="Notifications" variant="primary" count={5} locale="en" />,
    );
    const hiddenSpans = container.querySelectorAll("span[aria-hidden='true']");
    expect(hiddenSpans.length).toBeGreaterThan(0);
    const countSpan = Array.from(hiddenSpans).find((el) => el.textContent === "5");
    expect(countSpan).not.toBeNull();
  });

  it("aria-label includes count when count is provided", () => {
    render(<Badge label="Messages" variant="info" count={3} locale="en" />);
    const badge = screen.getByRole("generic", { name: "Badge: Messages (3)" });
    expect(badge).not.toBeNull();
  });
});

// ─── Optional dot ─────────────────────────────────────────────────────────────

describe("Badge — dot indicator", () => {
  it("renders dot span when dot=true", () => {
    const { container } = render(<Badge label="Online" variant="success" dot locale="en" />);
    const dotSpan = container.querySelector(".rounded-full.h-1\\.5.w-1\\.5");
    expect(dotSpan).not.toBeNull();
  });

  it("does not render dot span when dot is omitted", () => {
    const { container } = render(<Badge label="No dot" variant="default" locale="en" />);
    const dotSpan = container.querySelector(".h-1\\.5.w-1\\.5");
    expect(dotSpan).toBeNull();
  });
});

// ─── Invalid props / error fallback ──────────────────────────────────────────

describe("Badge — invalid props fallback", () => {
  it("renders EN error alert when label is missing", () => {
    render(<Badge />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Badge: invalid props");
  });

  it("renders FR error alert when raw.locale=fr", () => {
    render(<Badge locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("renders error fallback for invalid variant", () => {
    render(<Badge label="test" variant={"invalid_variant" as "default"} locale="en" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

// ─── Barrel export ────────────────────────────────────────────────────────────

describe("Badge — barrel resolution", () => {
  it("is exported from react/display barrel", async () => {
    const barrel = await import("../index.js");
    expect((barrel as Record<string, unknown>).Badge).toBeDefined();
    expect(typeof (barrel as Record<string, unknown>).Badge).toBe("function");
  });

  it("BadgePropsSchema exported from react/display barrel", async () => {
    const barrel = await import("../index.js");
    expect((barrel as Record<string, unknown>).BadgePropsSchema).toBeDefined();
  });
});

// ─── Preact structural parity ─────────────────────────────────────────────────

describe("Badge — Preact parity (schema)", () => {
  it("schema accepts all 7 variants", async () => {
    const { BadgePropsSchema } = await import("../../../../../components/display/Badge.schema.js");
    for (const variant of [
      "default",
      "primary",
      "success",
      "warning",
      "danger",
      "info",
      "neutral",
    ] as const) {
      const result = BadgePropsSchema.safeParse({ label: "x", variant, locale: "en" });
      expect(result.success).toBe(true);
    }
  });

  it("schema defaults variant to 'default' and locale to 'en'", async () => {
    const { BadgePropsSchema } = await import("../../../../../components/display/Badge.schema.js");
    const result = BadgePropsSchema.safeParse({ label: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("default");
      expect(result.data.locale).toBe("en");
    }
  });

  it("schema rejects missing label", async () => {
    const { BadgePropsSchema } = await import("../../../../../components/display/Badge.schema.js");
    const result = BadgePropsSchema.safeParse({ variant: "success", locale: "en" });
    expect(result.success).toBe(false);
  });

  it("schema rejects negative count", async () => {
    const { BadgePropsSchema } = await import("../../../../../components/display/Badge.schema.js");
    const result = BadgePropsSchema.safeParse({ label: "x", count: -1, locale: "en" });
    expect(result.success).toBe(false);
  });
});
