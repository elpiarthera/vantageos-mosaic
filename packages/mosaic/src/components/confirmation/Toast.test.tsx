// i18nKeys: Toast.aria.close, Toast.error.invalidProps

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "../../runtimes/react/components/confirmation/Toast";
import { getAriaLive, getAriaRole, variantContainerClasses } from "./Toast.logic";
import { ToastPropsSchema, validateToastProps } from "./Toast.schema";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── (1) Zod props schema ──────────────────────────────────────────────────────

describe("Toast — Zod schema validation", () => {
  it("accepts all 4 valid variants", () => {
    for (const variant of ["success", "error", "info", "warning"] as const) {
      const result = ToastPropsSchema.safeParse({ variant, title: "Hello" });
      expect(result.success, `variant ${variant} should be accepted`).toBe(true);
    }
  });

  it("rejects unknown variant", () => {
    const result = ToastPropsSchema.safeParse({ variant: "critical", title: "Oops" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = ToastPropsSchema.safeParse({ variant: "info", title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing variant", () => {
    const result = ToastPropsSchema.safeParse({ title: "No variant" });
    expect(result.success).toBe(false);
  });

  it("defaults duration to 5000 when omitted", () => {
    const parsed = validateToastProps({ variant: "success", title: "Hi" });
    expect(parsed.duration).toBe(5000);
  });

  it("accepts duration=0 (persistent toast)", () => {
    const result = ToastPropsSchema.safeParse({
      variant: "info",
      title: "Persistent",
      duration: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.duration).toBe(0);
  });

  it("rejects negative duration", () => {
    const result = ToastPropsSchema.safeParse({ variant: "info", title: "Bad", duration: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts optional description", () => {
    const result = ToastPropsSchema.safeParse({
      variant: "success",
      title: "Done",
      description: "Your changes have been saved.",
    });
    expect(result.success).toBe(true);
  });
});

// ─── (2) ARIA role / aria-live per variant ─────────────────────────────────────

describe("Toast — aria-live + role (WCAG-AA)", () => {
  it('getAriaRole: error → "alert"', () => {
    expect(getAriaRole("error")).toBe("alert");
  });

  it('getAriaRole: success → "status"', () => {
    expect(getAriaRole("success")).toBe("status");
  });

  it('getAriaRole: info → "status"', () => {
    expect(getAriaRole("info")).toBe("status");
  });

  it('getAriaRole: warning → "status"', () => {
    expect(getAriaRole("warning")).toBe("status");
  });

  it('getAriaLive: error → "assertive"', () => {
    expect(getAriaLive("error")).toBe("assertive");
  });

  it('getAriaLive: success → "polite"', () => {
    expect(getAriaLive("success")).toBe("polite");
  });

  it("renders error Toast with role=alert + aria-live=assertive", () => {
    render(<Toast variant="error" title="Something went wrong" />);
    const el = screen.getByRole("alert");
    expect(el.getAttribute("aria-live")).toBe("assertive");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("renders success Toast with role=status + aria-live=polite", () => {
    render(<Toast variant="success" title="Saved!" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it("renders info Toast with role=status + aria-live=polite", () => {
    render(<Toast variant="info" title="FYI" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it("renders warning Toast with role=status + aria-live=polite", () => {
    render(<Toast variant="warning" title="Watch out" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });
});

// ─── (3) Auto-dismiss (duration) ──────────────────────────────────────────────

describe("Toast — auto-dismiss (vi.useFakeTimers)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onClose after default 5000ms", async () => {
    const onClose = vi.fn();
    render(<Toast variant="info" title="Auto closing" onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(5100);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose after custom duration", async () => {
    const onClose = vi.fn();
    render(<Toast variant="success" title="Quick" duration={2000} onClose={onClose} />);
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does NOT auto-dismiss when duration=0 (persistent)", async () => {
    const onClose = vi.fn();
    render(<Toast variant="warning" title="Persistent" duration={0} onClose={onClose} />);
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does NOT auto-dismiss when onClose is not provided", async () => {
    // No onClose — should not throw
    render(<Toast variant="info" title="No closer" />);
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    // Just checking no crash
    expect(screen.getByRole("status")).toBeTruthy();
  });
});

// ─── (4) onClose manual + ESC key ─────────────────────────────────────────────

describe("Toast — manual close + ESC key", () => {
  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<Toast variant="success" title="Done" onClose={onClose} />);
    const btn = screen.getByRole("button", { name: /close notification/i });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose on ESC keydown", () => {
    const onClose = vi.fn();
    render(<Toast variant="info" title="Press ESC" onClose={onClose} />);
    const toast = screen.getByRole("status");
    fireEvent.keyDown(toast, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does NOT render close button when onClose is undefined", () => {
    render(<Toast variant="warning" title="No close button" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ESC keydown without onClose does not throw", () => {
    render(<Toast variant="error" title="No handler" />);
    const toast = screen.getByRole("alert");
    expect(() => fireEvent.keyDown(toast, { key: "Escape" })).not.toThrow();
  });
});

// ─── (5) Variant visual classes ────────────────────────────────────────────────

describe("Toast — variant visual classes", () => {
  it("success variant applies green classes", () => {
    render(<Toast variant="success" title="Great" />);
    const toast = screen.getByRole("status");
    expect(toast.className).toContain("bg-green-50");
    expect(toast.className).toContain("border-green-500");
  });

  it("error variant applies red classes", () => {
    render(<Toast variant="error" title="Error" />);
    const toast = screen.getByRole("alert");
    expect(toast.className).toContain("bg-red-50");
    expect(toast.className).toContain("border-red-600");
  });

  it("info variant applies blue classes", () => {
    render(<Toast variant="info" title="Info" />);
    const toast = screen.getByRole("status");
    expect(toast.className).toContain("bg-blue-50");
  });

  it("warning variant applies amber classes", () => {
    render(<Toast variant="warning" title="Warning" />);
    const toast = screen.getByRole("status");
    expect(toast.className).toContain("bg-amber-50");
  });

  it("variantContainerClasses covers all 4 variants", () => {
    for (const variant of ["success", "error", "info", "warning"] as const) {
      expect(variantContainerClasses[variant]).toBeDefined();
    }
  });
});

// ─── (6) Description rendering ────────────────────────────────────────────────

describe("Toast — description", () => {
  it("renders description when provided", () => {
    render(<Toast variant="info" title="Notice" description="More detail here." />);
    expect(screen.getByText("More detail here.")).toBeTruthy();
  });

  it("does NOT render description paragraph when omitted", () => {
    render(<Toast variant="success" title="No desc" />);
    // Only the title paragraph should exist
    const paragraphs = document.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
  });
});

// ─── (7) i18n close button label ──────────────────────────────────────────────

describe("Toast — i18n close button label", () => {
  it("EN locale: close button aria-label is English", () => {
    const onClose = vi.fn();
    render(<Toast variant="success" title="Done" locale="en" onClose={onClose} />);
    const btn = screen.getByRole("button", { name: "Close notification" });
    expect(btn).toBeTruthy();
  });

  it("FR locale: close button aria-label is French", () => {
    const onClose = vi.fn();
    render(<Toast variant="info" title="Info" locale="fr" onClose={onClose} />);
    const btn = screen.getByRole("button", { name: "Fermer la notification" });
    expect(btn).toBeTruthy();
  });
});

// ─── (8) Invalid props fallback ───────────────────────────────────────────────

describe("Toast — invalid props fallback", () => {
  it("renders error span for completely invalid props", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Toast variant={"bad" as "success"} title="X" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Toast: invalid props");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("renders FR error message when locale=fr on invalid props", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Toast variant={"bad" as "success"} title="X" locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
    expect(errorSpy).toHaveBeenCalled();
  });
});
