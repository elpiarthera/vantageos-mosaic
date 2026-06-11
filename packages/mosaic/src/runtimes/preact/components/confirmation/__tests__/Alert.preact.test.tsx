// Preact parity tests for Alert
// Uses the preact runtime implementation via preact/compat alias

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
// Import from preact runtime path — tests parity with React implementation
import { Alert } from "../Alert";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Preact parity tests ──────────────────────────────────────────────────────

describe("Alert — Preact runtime parity", () => {
  it("renders success Alert with role=status + aria-live=polite", () => {
    render(<Alert variant="success" title="Operation completed" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("renders error Alert with role=alert + aria-live=assertive", () => {
    render(<Alert variant="error" title="Something went wrong" />);
    const el = screen.getByRole("alert");
    expect(el.getAttribute("aria-live")).toBe("assertive");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("renders info Alert with correct variant classes", () => {
    render(<Alert variant="info" title="FYI" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("bg-blue-50");
  });

  it("renders warning Alert with correct variant classes", () => {
    render(<Alert variant="warning" title="Watch out" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("bg-amber-50");
  });

  it("renders title text content (Preact)", () => {
    render(<Alert variant="success" title="All good" />);
    expect(screen.getByText("All good")).toBeTruthy();
  });

  it("renders description when provided (Preact)", () => {
    render(<Alert variant="info" title="Notice" description="Extra detail here." />);
    expect(screen.getByText("Extra detail here.")).toBeTruthy();
  });

  it("does NOT render dismiss button when dismissible=false (Preact)", () => {
    render(<Alert variant="warning" title="No dismiss" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders dismiss button when dismissible=true (Preact)", () => {
    render(<Alert variant="info" title="Info" dismissible={true} onDismiss={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeTruthy();
  });

  it("calls onDismiss when dismiss button is clicked (Preact)", () => {
    const onDismiss = vi.fn();
    render(<Alert variant="success" title="Clickable" dismissible={true} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders EN dismiss button aria-label (Preact)", () => {
    render(
      <Alert variant="success" title="Done" dismissible={true} onDismiss={() => {}} locale="en" />,
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Dismiss alert");
  });

  it("renders FR dismiss button aria-label (Preact)", () => {
    render(
      <Alert variant="success" title="Sauvé" dismissible={true} onDismiss={() => {}} locale="fr" />,
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Fermer l'alerte");
  });

  it("renders error fallback for invalid props (Preact)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Alert variant={"invalid" as "success"} title="X" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Alert: invalid props");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("renders FR error message for invalid props with locale=fr (Preact)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Alert variant={"invalid" as "success"} title="X" locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Alert");
    errorSpy.mockRestore();
  });

  it("Alert is PERSISTENT — no auto-dismiss timer (Preact)", () => {
    // Alert has no duration prop — it stays forever
    render(<Alert variant="info" title="I stay" />);
    expect(screen.getByText("I stay")).toBeTruthy();
    // No dismiss button = stays permanently
    expect(screen.queryByRole("button")).toBeNull();
  });
});
