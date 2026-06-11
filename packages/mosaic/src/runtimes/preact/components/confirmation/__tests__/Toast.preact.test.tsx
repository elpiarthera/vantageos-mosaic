// Preact parity tests for Toast
// Uses the preact runtime implementation via preact/compat alias

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import from preact runtime path — tests parity with React implementation
import { Toast } from "../Toast";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Preact parity tests ──────────────────────────────────────────────────────

describe("Toast — Preact runtime parity", () => {
  it("renders success Toast with role=status + aria-live=polite", () => {
    render(<Toast variant="success" title="Saved!" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("renders error Toast with role=alert + aria-live=assertive", () => {
    render(<Toast variant="error" title="Something went wrong" />);
    const el = screen.getByRole("alert");
    expect(el.getAttribute("aria-live")).toBe("assertive");
  });

  it("renders info Toast with correct variant classes", () => {
    render(<Toast variant="info" title="FYI" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("bg-blue-50");
  });

  it("renders warning Toast with correct variant classes", () => {
    render(<Toast variant="warning" title="Watch out" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("bg-amber-50");
  });

  it("renders title text content", () => {
    render(<Toast variant="success" title="All good" />);
    expect(screen.getByText("All good")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(<Toast variant="info" title="Notice" description="Extra detail here." />);
    expect(screen.getByText("Extra detail here.")).toBeTruthy();
  });

  it("does NOT render close button when onClose is undefined", () => {
    render(<Toast variant="warning" title="No close" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls onClose when close button is clicked (Preact)", () => {
    const onClose = vi.fn();
    render(<Toast variant="success" title="Clickable" onClose={onClose} />);
    const btn = screen.getByRole("button", { name: /close notification/i });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose on ESC keydown (Preact)", () => {
    const onClose = vi.fn();
    render(<Toast variant="info" title="ESC test" onClose={onClose} />);
    const toast = screen.getByRole("status");
    fireEvent.keyDown(toast, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders FR close button label with locale=fr (Preact)", () => {
    const onClose = vi.fn();
    render(<Toast variant="success" title="Sauvé" locale="fr" onClose={onClose} />);
    const btn = screen.getByRole("button", { name: "Fermer la notification" });
    expect(btn).toBeTruthy();
  });

  it("renders error fallback for invalid props (Preact)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Toast variant={"invalid" as "success"} title="X" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Toast: invalid props");
    expect(errorSpy).toHaveBeenCalled();
  });
});

// ─── Auto-dismiss parity ──────────────────────────────────────────────────────

describe("Toast — auto-dismiss (Preact parity)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onClose after 5000ms default duration (Preact)", async () => {
    const onClose = vi.fn();
    render(<Toast variant="info" title="Auto close" onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(5100);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does NOT auto-dismiss when duration=0 (Preact persistent)", async () => {
    const onClose = vi.fn();
    render(<Toast variant="warning" title="Stays" duration={0} onClose={onClose} />);
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
