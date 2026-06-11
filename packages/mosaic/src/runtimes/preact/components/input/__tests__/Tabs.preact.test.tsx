// Preact parity tests for Tabs
// Uses the preact runtime implementation via preact/compat alias

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
// Import from preact runtime path — tests parity with React implementation
import { Tabs } from "../Tabs";

afterEach(() => {
  cleanup();
});

// ─── helpers ──────────────────────────────────────────────────────────────────

const baseTabs = [
  { id: "p1", label: "Alpha", content: <div>Alpha panel content</div> },
  { id: "p2", label: "Beta", content: <div>Beta panel content</div> },
  { id: "p3", label: "Gamma", content: <div>Gamma panel content</div> },
];

// ─── Preact parity tests ──────────────────────────────────────────────────────

describe("Tabs — Preact runtime parity", () => {
  it("renders tablist with correct ARIA roles", () => {
    render(<Tabs tabs={baseTabs} />);
    expect(screen.getByRole("tablist")).toBeTruthy();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  it("first tab is active by default", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("respects defaultValue uncontrolled", () => {
    render(<Tabs tabs={baseTabs} defaultValue="p2" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("clicking tab changes active tab", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[1] as HTMLElement);
    expect(tabButtons[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("calls onValueChange on tab click", () => {
    const onValueChange = vi.fn();
    render(<Tabs tabs={baseTabs} onValueChange={onValueChange} />);
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[2] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith("p3");
  });

  it("ArrowRight navigates to next tab", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabButtons[1]);
  });

  it("Home key moves to first tab", () => {
    render(<Tabs tabs={baseTabs} defaultValue="p3" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[2] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[2] as HTMLElement, { key: "Home" });
    expect(document.activeElement).toBe(tabButtons[0]);
  });

  it("End key moves to last tab", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(tabButtons[2]);
  });

  it("disabled tab is skipped in ArrowRight nav", () => {
    const tabsWithDisabled = [
      { id: "d1", label: "First Tab", content: null },
      { id: "d2", label: "Dis Tab", content: null, disabled: true },
      { id: "d3", label: "Third Tab", content: null },
    ];
    render(<Tabs tabs={tabsWithDisabled} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabButtons[2]);
  });

  it("ArrowDown navigates in vertical orientation", () => {
    render(<Tabs tabs={baseTabs} orientation="vertical" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(tabButtons[1]);
  });

  it("tabpanels have aria-labelledby linking to their tab id", () => {
    const { container } = render(<Tabs tabs={baseTabs} />);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    const tabs = screen.getAllByRole("tab");
    expect(panels).toHaveLength(3);
    for (let i = 0; i < panels.length; i++) {
      expect((panels[i] as HTMLElement).getAttribute("aria-labelledby")).toBe(
        tabs[i]?.getAttribute("id"),
      );
    }
  });

  it("renders null and logs error on invalid props", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Tabs tabs={[]} />);
    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
