// i18nKeys: Skeleton.aria.label, Skeleton.error.invalidProps

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "../../../runtimes/react/components/display/Skeleton.js";
import {
  SkeletonPropsSchema,
  resolveSkeletonDimensions,
  validateSkeletonProps,
} from "../Skeleton.schema.js";

afterEach(() => {
  cleanup();
});

// ─── (1) Zod props schema ──────────────────────────────────────────────────────

describe("Skeleton — Zod schema validation", () => {
  it("accepts valid rect props with defaults", () => {
    const result = SkeletonPropsSchema.safeParse({ variant: "rect" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("rect");
      expect(result.data.animation).toBe("pulse");
      expect(result.data.count).toBe(1);
      expect(result.data.locale).toBe("en");
    }
  });

  it("accepts valid circle props", () => {
    const result = SkeletonPropsSchema.safeParse({ variant: "circle", width: 48, height: 48 });
    expect(result.success).toBe(true);
  });

  it("accepts valid text props with count=3", () => {
    const result = SkeletonPropsSchema.safeParse({ variant: "text", count: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(3);
    }
  });

  it("accepts animation=wave", () => {
    const result = SkeletonPropsSchema.safeParse({ animation: "wave" });
    expect(result.success).toBe(true);
  });

  it("accepts animation=none", () => {
    const result = SkeletonPropsSchema.safeParse({ animation: "none" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid variant", () => {
    const result = SkeletonPropsSchema.safeParse({ variant: "diamond" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid animation", () => {
    const result = SkeletonPropsSchema.safeParse({ animation: "bounce" });
    expect(result.success).toBe(false);
  });

  it("rejects count=0", () => {
    const result = SkeletonPropsSchema.safeParse({ variant: "text", count: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects count > 20", () => {
    const result = SkeletonPropsSchema.safeParse({ variant: "text", count: 21 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale", () => {
    const result = SkeletonPropsSchema.safeParse({ locale: "de" });
    expect(result.success).toBe(false);
  });

  it("accepts string width and height", () => {
    const result = SkeletonPropsSchema.safeParse({ width: "200px", height: "50px" });
    expect(result.success).toBe(true);
  });

  it("throws ZodError on invalid input via validateSkeletonProps", () => {
    expect(() => validateSkeletonProps({ variant: "hexagon" })).toThrow();
  });
});

// ─── (2) resolveSkeletonDimensions ────────────────────────────────────────────

describe("resolveSkeletonDimensions", () => {
  it("rect defaults to width=100%, height=100px", () => {
    const result = resolveSkeletonDimensions("rect", undefined, undefined);
    expect(result.widthCss).toBe("100%");
    expect(result.heightCss).toBe("100px");
  });

  it("text defaults to width=100%, height=16px", () => {
    const result = resolveSkeletonDimensions("text", undefined, undefined);
    expect(result.widthCss).toBe("100%");
    expect(result.heightCss).toBe("16px");
  });

  it("circle uses width as both dimensions", () => {
    const result = resolveSkeletonDimensions("circle", 48, undefined);
    expect(result.widthCss).toBe("48px");
    expect(result.heightCss).toBe("48px");
  });

  it("circle falls back to height when width undefined", () => {
    const result = resolveSkeletonDimensions("circle", undefined, 56);
    expect(result.widthCss).toBe("56px");
    expect(result.heightCss).toBe("56px");
  });

  it("circle defaults to 40px when neither width nor height given", () => {
    const result = resolveSkeletonDimensions("circle", undefined, undefined);
    expect(result.widthCss).toBe("40px");
    expect(result.heightCss).toBe("40px");
  });

  it("converts number to px string", () => {
    const result = resolveSkeletonDimensions("rect", 320, 80);
    expect(result.widthCss).toBe("320px");
    expect(result.heightCss).toBe("80px");
  });

  it("passes string values through unchanged", () => {
    const result = resolveSkeletonDimensions("rect", "50%", "2rem");
    expect(result.widthCss).toBe("50%");
    expect(result.heightCss).toBe("2rem");
  });
});

// ─── (3) Component render — variant rect ──────────────────────────────────────

describe("Skeleton component — rect variant", () => {
  it("renders role=status with aria-busy=true", () => {
    render(<Skeleton variant="rect" />);
    const el = screen.getByRole("status");
    expect(el).toBeDefined();
    expect(el.getAttribute("aria-busy")).toBe("true");
  });

  it("renders with aria-label in English", () => {
    render(<Skeleton variant="rect" locale="en" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-label")).toMatch(/loading/i);
  });

  it("renders with aria-label in French", () => {
    render(<Skeleton variant="rect" locale="fr" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-label")).toMatch(/chargement/i);
  });

  it("applies animate-pulse class by default", () => {
    render(<Skeleton variant="rect" animation="pulse" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("animate-pulse");
  });

  it("applies skeleton-wave class for animation=wave", () => {
    render(<Skeleton variant="rect" animation="wave" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("skeleton-wave");
  });

  it("has no animation class for animation=none", () => {
    render(<Skeleton variant="rect" animation="none" />);
    const el = screen.getByRole("status");
    expect(el.className).not.toContain("animate-pulse");
    expect(el.className).not.toContain("skeleton-wave");
  });

  it("applies rounded-md class for rect variant", () => {
    render(<Skeleton variant="rect" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("rounded-md");
  });
});

// ─── (4) Component render — circle variant ────────────────────────────────────

describe("Skeleton component — circle variant", () => {
  it("renders role=status", () => {
    render(<Skeleton variant="circle" />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("applies rounded-full class", () => {
    render(<Skeleton variant="circle" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("rounded-full");
  });

  it("renders equal width and height style", () => {
    render(<Skeleton variant="circle" width={56} />);
    const el = screen.getByRole("status") as HTMLElement;
    expect(el.style.width).toBe("56px");
    expect(el.style.height).toBe("56px");
  });
});

// ─── (5) Component render — text variant (count lines) ────────────────────────

describe("Skeleton component — text variant", () => {
  it("renders role=status container", () => {
    render(<Skeleton variant="text" count={3} />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders exactly 3 distinct spans for count=3", () => {
    const { container } = render(<Skeleton variant="text" count={3} />);
    const spans = container.querySelectorAll("span[aria-hidden='true']");
    expect(spans.length).toBe(3);
  });

  it("renders exactly 1 span for default count=1", () => {
    const { container } = render(<Skeleton variant="text" />);
    const spans = container.querySelectorAll("span[aria-hidden='true']");
    expect(spans.length).toBe(1);
  });

  it("narrows last line to 75% when count > 1", () => {
    const { container } = render(<Skeleton variant="text" count={3} />);
    const spans = container.querySelectorAll<HTMLElement>("span[aria-hidden='true']");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by count=3 above
    expect(spans[2]!.style.width).toBe("75%");
  });

  it("does NOT narrow when count=1 (single line stays at full width)", () => {
    const { container } = render(<Skeleton variant="text" count={1} />);
    const spans = container.querySelectorAll<HTMLElement>("span[aria-hidden='true']");
    // biome-ignore lint/style/noNonNullAssertion: test array — length guaranteed by count=1 above
    expect(spans[0]!.style.width).not.toBe("75%");
  });

  it("applies rounded (not rounded-md) for text variant", () => {
    render(<Skeleton variant="text" count={2} />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("flex");
  });
});

// ─── (6) prefers-reduced-motion via animation=none ────────────────────────────

describe("Skeleton — animation=none (prefers-reduced-motion signal)", () => {
  it("renders without animate-pulse when animation=none", () => {
    render(<Skeleton variant="rect" animation="none" />);
    const el = screen.getByRole("status");
    expect(el.className).not.toContain("animate-pulse");
  });

  it("renders without skeleton-wave when animation=none", () => {
    render(<Skeleton variant="rect" animation="none" />);
    const el = screen.getByRole("status");
    expect(el.className).not.toContain("skeleton-wave");
  });
});

// ─── (7) Invalid props → error fallback ───────────────────────────────────────

describe("Skeleton component — invalid props fallback", () => {
  it("renders role=alert on invalid variant", () => {
    render(<Skeleton variant={"hexagon" as "rect"} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toMatch(/invalid props/i);
  });

  it("renders FR error message when locale=fr and invalid props", () => {
    render(<Skeleton variant={"hexagon" as "rect"} locale={"fr" as "en"} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });
});
