import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "../Badge.react.js";
import { BadgePropsSchema, validateBadgeProps } from "../Badge.schema.js";

afterEach(() => {
  cleanup();
});

// ─── (a) Zod schema — variant validation ─────────────────────────────────────

describe("BadgePropsSchema — variant", () => {
  it("accepts all 4 valid variants", () => {
    for (const variant of ["default", "primary", "secondary", "outline"] as const) {
      const result = BadgePropsSchema.safeParse({ variant, content: "Label" });
      expect(result.success, `variant="${variant}" should be valid`).toBe(true);
    }
  });

  it("rejects an invalid variant", () => {
    const result = BadgePropsSchema.safeParse({ variant: "danger", content: "Label" });
    expect(result.success).toBe(false);
  });

  it("defaults variant to 'default' when omitted", () => {
    const result = BadgePropsSchema.safeParse({ content: "Label" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.variant).toBe("default");
  });
});

// ─── (b) Zod schema — size validation ────────────────────────────────────────

describe("BadgePropsSchema — size", () => {
  it("accepts all 3 valid sizes", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const result = BadgePropsSchema.safeParse({ size, content: "Tag" });
      expect(result.success, `size="${size}" should be valid`).toBe(true);
    }
  });

  it("rejects an invalid size", () => {
    const result = BadgePropsSchema.safeParse({ size: "xl", content: "Tag" });
    expect(result.success).toBe(false);
  });

  it("defaults size to 'md' when omitted", () => {
    const result = BadgePropsSchema.safeParse({ content: "Tag" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.size).toBe("md");
  });
});

// ─── (c) Zod schema — content validation ─────────────────────────────────────

describe("BadgePropsSchema — content", () => {
  it("accepts a non-empty string", () => {
    const result = BadgePropsSchema.safeParse({ content: "New" });
    expect(result.success).toBe(true);
  });

  it("accepts an integer number", () => {
    const result = BadgePropsSchema.safeParse({ content: 42 });
    expect(result.success).toBe(true);
  });

  it("rejects an empty string", () => {
    const result = BadgePropsSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when content is missing", () => {
    const result = BadgePropsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── (d) Content rendering — string ──────────────────────────────────────────

describe("Badge — string content render", () => {
  it("renders the string content", () => {
    render(<Badge content="Beta" />);
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("renders 'New' string content", () => {
    render(<Badge content="New" variant="primary" size="sm" />);
    expect(screen.getByText("New")).toBeTruthy();
  });
});

// ─── (e) Content rendering — number ──────────────────────────────────────────

describe("Badge — numeric content render", () => {
  it("renders a numeric count as string", () => {
    render(<Badge content={99} aria-label="99 notifications" />);
    expect(screen.getByText("99")).toBeTruthy();
  });

  it("renders 0 as string", () => {
    render(<Badge content={0} aria-label="0 messages" />);
    expect(screen.getByText("0")).toBeTruthy();
  });
});

// ─── (f) aria-label propagation ──────────────────────────────────────────────

describe("Badge — aria-label", () => {
  it("uses explicit aria-label when provided", () => {
    render(<Badge content={5} aria-label="5 unread messages" />);
    const badge = screen.getByLabelText("5 unread messages");
    expect(badge).toBeTruthy();
  });

  it("uses string content as aria-label when no explicit aria-label", () => {
    render(<Badge content="Pro" />);
    const badge = screen.getByLabelText("Pro");
    expect(badge).toBeTruthy();
  });
});

// ─── (g) Error fallback — invalid props ──────────────────────────────────────

describe("Badge — error fallback", () => {
  it("renders an accessible error fallback for invalid props", () => {
    // Pass raw object that fails Zod (empty content string)
    const raw: Record<string, unknown> = { content: "" };
    render(<Badge {...raw} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("renders error fallback in French when locale='fr'", () => {
    const raw: Record<string, unknown> = { content: "", locale: "fr" };
    render(<Badge {...raw} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Badge");
  });
});

// ─── (h) validateBadgeProps — throws on invalid ───────────────────────────────

describe("validateBadgeProps", () => {
  it("returns parsed props for valid input", () => {
    const result = validateBadgeProps({ content: "Hello", variant: "primary", size: "lg" });
    expect(result.content).toBe("Hello");
    expect(result.variant).toBe("primary");
    expect(result.size).toBe("lg");
  });

  it("throws ZodError for invalid input", () => {
    expect(() => validateBadgeProps({ content: "" })).toThrow();
  });
});
