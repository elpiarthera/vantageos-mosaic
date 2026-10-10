import { describe, expect, it } from "vitest";
import { readHostContext } from "./host-context.js";
import { applySafeAreaInsets, readSafeAreaInsets, safeAreaPadding } from "./safe-area.js";

// Spec: MCP Apps 2026-01-26 ext-apps-spec.mdx l.582-587, HostContext.safeAreaInsets
//   { top: number; right: number; bottom: number; left: number }   (pixels)
// Claude design guidelines: apply as padding on the root container, or as scroll-padding on
// scroll-snap containers.
describe("safe-area insets (H01)", () => {
  it("reads the four pixel values from hostContext.safeAreaInsets", () => {
    expect(
      readSafeAreaInsets({ safeAreaInsets: { top: 44, right: 0, bottom: 34, left: 8 } }),
    ).toEqual({
      top: 44,
      right: 0,
      bottom: 34,
      left: 8,
    });
  });

  it("is absent-safe: missing, non-object, partial, negative or non-finite insets read as undefined", () => {
    for (const raw of [
      undefined,
      null,
      {},
      { safeAreaInsets: null },
      { safeAreaInsets: "8px" },
      { safeAreaInsets: { top: 1, right: 2, bottom: 3 } },
      { safeAreaInsets: { top: -1, right: 0, bottom: 0, left: 0 } },
      { safeAreaInsets: { top: Number.NaN, right: 0, bottom: 0, left: 0 } },
      { safeAreaInsets: { top: "1", right: 0, bottom: 0, left: 0 } },
    ]) {
      expect(readSafeAreaInsets(raw)).toBeUndefined();
    }
  });

  it("formats a CSS padding shorthand in top right bottom left order", () => {
    expect(safeAreaPadding({ top: 1, right: 2, bottom: 3, left: 4 })).toBe("1px 2px 3px 4px");
  });

  it("applies padding and exposes the insets as CSS variables on the root", () => {
    const el = document.createElement("div");
    applySafeAreaInsets({ top: 44, right: 0, bottom: 34, left: 8 }, el);
    expect(el.style.padding).toBe("44px 0px 34px 8px");
    expect(el.style.getPropertyValue("--mosaic-safe-area-top")).toBe("44px");
    expect(el.style.getPropertyValue("--mosaic-safe-area-left")).toBe("8px");
  });

  it("clears the padding and variables when the host reports no insets", () => {
    const el = document.createElement("div");
    applySafeAreaInsets({ top: 1, right: 1, bottom: 1, left: 1 }, el);
    applySafeAreaInsets(undefined, el);
    expect(el.style.padding).toBe("");
    expect(el.style.getPropertyValue("--mosaic-safe-area-top")).toBe("");
  });

  it("is surfaced on the host context read by readHostContext", () => {
    const c = readHostContext({ safeAreaInsets: { top: 10, right: 0, bottom: 0, left: 0 } });
    expect(c.safeAreaInsets).toEqual({ top: 10, right: 0, bottom: 0, left: 0 });
    expect(readHostContext({}).safeAreaInsets).toBeUndefined();
  });
});
