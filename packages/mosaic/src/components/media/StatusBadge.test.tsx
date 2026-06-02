import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";
import corpus from "./eval-corpus.json";

describe("StatusBadge — eval-corpus", () => {
  it("happy: renders green badge with status text", () => {
    const c = corpus[0];
    if (!c) throw new Error("corpus[0] missing");
    render(<StatusBadge {...c.input} />);
    const badge = screen.getByRole("status");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("active");
    expect(badge.className).toContain("bg-green-100");
  });

  it("edge: renders neutral badge with custom label", () => {
    const c = corpus[1];
    if (!c) throw new Error("corpus[1] missing");
    render(<StatusBadge {...c.input} />);
    const badge = screen.getByRole("status");
    expect(badge.textContent).toBe("En attente");
    expect(badge.getAttribute("aria-label")).toBe("En attente");
  });

  it("failure: renders error fallback alert span for invalid props", () => {
    const c = corpus[2];
    if (!c) throw new Error("corpus[2] missing");
    render(<StatusBadge {...c.input} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("StatusBadge: invalid props");
  });
});

describe("StatusBadge — unit", () => {
  it("defaults variant to neutral when not specified", () => {
    render(<StatusBadge status="unknown" locale="en" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-slate-100");
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

  it("renders invalid props alert for missing required fields", () => {
    render(<StatusBadge />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("StatusBadge: invalid props");
  });
});
