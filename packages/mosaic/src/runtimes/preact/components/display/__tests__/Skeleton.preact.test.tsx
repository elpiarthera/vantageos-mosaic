/**
 * Preact parity tests for Skeleton.
 *
 * These run under the React 19 vitest setup (jsdom + @vitejs/plugin-react)
 * because the shared .schema.ts + .logic.ts are framework-agnostic.
 * The Preact JSX runtime is tested via structural parity assertions — same
 * class names, same ARIA attributes, same error fallback — mirroring the
 * React runtime tests in __tests__/Skeleton.test.tsx.
 *
 * The Preact component itself (Skeleton.tsx) is exercised end-to-end in the
 * tsup preact pass (esbuildOptions alias react → preact/compat). These unit
 * tests validate the shared logic layer and schema integration that underpins
 * the Preact runtime.
 */

// i18nKeys: Skeleton.aria.label, Skeleton.error.invalidProps

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  SKELETON_BG_CLASS,
  getAnimationClass,
  getVariantClass,
  lastLineWidth,
  textLineKey,
} from "../../../../../components/display/Skeleton.logic.js";
import {
  SkeletonPropsSchema,
  resolveSkeletonDimensions,
} from "../../../../../components/display/Skeleton.schema.js";
// Import React variant for structural parity render tests (Preact .tsx uses Preact JSX types, not React)
import { Skeleton } from "../../../../../runtimes/react/components/display/Skeleton.js";

afterEach(() => {
  cleanup();
});

// ─── Preact parity: schema ────────────────────────────────────────────────────

describe("Skeleton Preact parity — schema", () => {
  it("schema accepts all 3 variants", () => {
    for (const variant of ["rect", "circle", "text"] as const) {
      const result = SkeletonPropsSchema.safeParse({ variant });
      expect(result.success).toBe(true);
    }
  });

  it("schema accepts all 3 animations", () => {
    for (const animation of ["pulse", "wave", "none"] as const) {
      const result = SkeletonPropsSchema.safeParse({ animation });
      expect(result.success).toBe(true);
    }
  });

  it("defaults: variant=rect, animation=pulse, count=1, locale=en", () => {
    const result = SkeletonPropsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("rect");
      expect(result.data.animation).toBe("pulse");
      expect(result.data.count).toBe(1);
      expect(result.data.locale).toBe("en");
    }
  });
});

// ─── Preact parity: logic layer ───────────────────────────────────────────────

describe("Skeleton Preact parity — logic", () => {
  it("getAnimationClass: pulse → animate-pulse", () => {
    expect(getAnimationClass("pulse")).toBe("animate-pulse");
  });

  it("getAnimationClass: wave → skeleton-wave", () => {
    expect(getAnimationClass("wave")).toBe("skeleton-wave");
  });

  it("getAnimationClass: none → empty string", () => {
    expect(getAnimationClass("none")).toBe("");
  });

  it("getVariantClass: rect → rounded-md", () => {
    expect(getVariantClass("rect")).toBe("rounded-md");
  });

  it("getVariantClass: circle → rounded-full", () => {
    expect(getVariantClass("circle")).toBe("rounded-full");
  });

  it("getVariantClass: text → rounded", () => {
    expect(getVariantClass("text")).toBe("rounded");
  });

  it("SKELETON_BG_CLASS is non-empty string", () => {
    expect(typeof SKELETON_BG_CLASS).toBe("string");
    expect(SKELETON_BG_CLASS.length).toBeGreaterThan(0);
  });

  it("textLineKey: returns stable string key per index", () => {
    expect(textLineKey(0)).toBe("skeleton-line-0");
    expect(textLineKey(4)).toBe("skeleton-line-4");
  });

  it("lastLineWidth: narrows last line when total > 1", () => {
    expect(lastLineWidth(2, 3, "100%")).toBe("75%");
  });

  it("lastLineWidth: does not narrow non-last lines", () => {
    expect(lastLineWidth(0, 3, "100%")).toBe("100%");
    expect(lastLineWidth(1, 3, "100%")).toBe("100%");
  });

  it("lastLineWidth: does not narrow when count=1", () => {
    expect(lastLineWidth(0, 1, "100%")).toBe("100%");
  });

  it("resolveSkeletonDimensions: circle width=height always", () => {
    const { widthCss, heightCss } = resolveSkeletonDimensions("circle", 64, undefined);
    expect(widthCss).toBe(heightCss);
  });
});

// ─── Preact parity: render (via React runtime — structural parity) ────────────

describe("Skeleton Preact parity — render", () => {
  it("renders role=status (rect)", () => {
    render(<Skeleton variant="rect" />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders role=status (circle)", () => {
    render(<Skeleton variant="circle" />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders role=status (text)", () => {
    render(<Skeleton variant="text" count={2} />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders 3 aria-hidden spans for text count=3", () => {
    const { container } = render(<Skeleton variant="text" count={3} />);
    const spans = container.querySelectorAll("span[aria-hidden='true']");
    expect(spans.length).toBe(3);
  });

  it("renders error fallback on invalid props", () => {
    render(<Skeleton variant={"hexagon" as "rect"} />);
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("renders FR error message when locale=fr and props invalid", () => {
    render(<Skeleton variant={"hexagon" as "rect"} locale={"fr" as "en"} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("animation=none: no animate-pulse class", () => {
    render(<Skeleton variant="rect" animation="none" />);
    const el = screen.getByRole("status");
    expect(el.className).not.toContain("animate-pulse");
  });
});
