// Tests for Tabs — React 19 runtime
// Covers: Zod props, controlled+uncontrolled mode, keyboard nav, onValueChange, disabled tab skip, ARIA

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabsPropsSchema, validateTabsProps } from "../../../../../components/input/Tabs.schema";
import { Tabs } from "../Tabs";

afterEach(() => {
  cleanup();
});

// ─── helpers ──────────────────────────────────────────────────────────────────

const baseTabs = [
  { id: "tab-1", label: "Overview", content: <div>Overview panel content</div> },
  { id: "tab-2", label: "Details", content: <div>Details panel content</div> },
  { id: "tab-3", label: "Settings", content: <div>Settings panel content</div> },
];

// ─── 1. Zod schema validation ──────────────────────────────────────────────────

describe("Tabs — Zod schema validation", () => {
  it("accepts minimal valid props", () => {
    const result = TabsPropsSchema.safeParse({ tabs: baseTabs });
    expect(result.success).toBe(true);
  });

  it("defaults orientation to horizontal", () => {
    const result = TabsPropsSchema.safeParse({ tabs: baseTabs });
    expect(result.success && result.data.orientation).toBe("horizontal");
  });

  it("accepts vertical orientation", () => {
    const result = TabsPropsSchema.safeParse({ tabs: baseTabs, orientation: "vertical" });
    expect(result.success && result.data.orientation).toBe("vertical");
  });

  it("accepts controlled value", () => {
    const result = TabsPropsSchema.safeParse({ tabs: baseTabs, value: "tab-1" });
    expect(result.success).toBe(true);
  });

  it("accepts defaultValue for uncontrolled mode", () => {
    const result = TabsPropsSchema.safeParse({ tabs: baseTabs, defaultValue: "tab-2" });
    expect(result.success).toBe(true);
  });

  it("rejects empty tabs array", () => {
    const result = TabsPropsSchema.safeParse({ tabs: [] });
    expect(result.success).toBe(false);
  });

  it("rejects tab with empty id", () => {
    const result = TabsPropsSchema.safeParse({
      tabs: [{ id: "", label: "Tab", content: null }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects tab with empty label", () => {
    const result = TabsPropsSchema.safeParse({
      tabs: [{ id: "t1", label: "", content: null }],
    });
    expect(result.success).toBe(false);
  });

  it("validateTabsProps throws on invalid props", () => {
    expect(() => validateTabsProps({ tabs: [] })).toThrow();
  });
});

// ─── 2. Uncontrolled mode ─────────────────────────────────────────────────────

describe("Tabs — uncontrolled mode", () => {
  it("renders first enabled tab active by default", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("false");
  });

  it("respects defaultValue for initial active tab", () => {
    render(<Tabs tabs={baseTabs} defaultValue="tab-2" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Details panel content")).toBeTruthy();
  });

  it("switches active tab on click", () => {
    render(<Tabs tabs={baseTabs} />);
    // Click tab button by role=tab
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[1] as HTMLElement);
    expect(tabButtons[1]?.getAttribute("aria-selected")).toBe("true");
    expect(tabButtons[0]?.getAttribute("aria-selected")).toBe("false");
  });

  it("shows only the active panel (others hidden attribute set)", () => {
    const { container } = render(<Tabs tabs={baseTabs} />);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    // Panel 0 is visible (no hidden attr), panels 1+2 are hidden
    expect((panels[0] as HTMLElement)?.hasAttribute("hidden")).toBe(false);
    expect((panels[1] as HTMLElement)?.hasAttribute("hidden")).toBe(true);
    expect((panels[2] as HTMLElement)?.hasAttribute("hidden")).toBe(true);
  });
});

// ─── 3. Controlled mode ───────────────────────────────────────────────────────

describe("Tabs — controlled mode", () => {
  it("renders the tab specified by value prop", () => {
    render(<Tabs tabs={baseTabs} value="tab-3" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
  });

  it("does not change active tab on click without onValueChange updating value", () => {
    // In controlled mode, value is fixed — the tab won't change unless parent updates value
    render(<Tabs tabs={baseTabs} value="tab-1" onValueChange={vi.fn()} />);
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[1] as HTMLElement);
    // Still tab-1 because value prop is still "tab-1"
    expect(tabButtons[0]?.getAttribute("aria-selected")).toBe("true");
  });
});

// ─── 4. onValueChange callback ────────────────────────────────────────────────

describe("Tabs — onValueChange callback", () => {
  it("calls onValueChange with tab id when a tab is clicked", () => {
    const onValueChange = vi.fn();
    render(<Tabs tabs={baseTabs} onValueChange={onValueChange} />);
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[1] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith("tab-2");
  });

  it("calls onValueChange once per click", () => {
    const onValueChange = vi.fn();
    render(<Tabs tabs={baseTabs} onValueChange={onValueChange} />);
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[2] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

// ─── 5. Keyboard navigation — horizontal ─────────────────────────────────────

describe("Tabs — keyboard navigation (horizontal)", () => {
  it("ArrowRight moves focus to next tab", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabButtons[1]);
  });

  it("ArrowLeft moves focus to previous tab (wraps to last)", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabButtons[2]);
  });

  it("Home moves focus to first tab", () => {
    render(<Tabs tabs={baseTabs} defaultValue="tab-3" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[2] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[2] as HTMLElement, { key: "Home" });
    expect(document.activeElement).toBe(tabButtons[0]);
  });

  it("End moves focus to last tab", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(tabButtons[2]);
  });

  it("ArrowRight wraps from last tab to first", () => {
    render(<Tabs tabs={baseTabs} defaultValue="tab-3" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[2] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[2] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabButtons[0]);
  });
});

// ─── 6. Keyboard navigation — vertical ───────────────────────────────────────

describe("Tabs — keyboard navigation (vertical)", () => {
  it("ArrowDown moves focus to next tab in vertical mode", () => {
    render(<Tabs tabs={baseTabs} orientation="vertical" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(tabButtons[1]);
  });

  it("ArrowUp moves focus to previous tab in vertical mode", () => {
    render(<Tabs tabs={baseTabs} orientation="vertical" defaultValue="tab-2" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[1] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[1] as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(tabButtons[0]);
  });
});

// ─── 7. Disabled tab — skipped in nav ────────────────────────────────────────

describe("Tabs — disabled tab skipped in keyboard nav", () => {
  const tabsWithDisabled = [
    { id: "t1", label: "Tab One", content: <div>One content</div> },
    { id: "t2", label: "Tab Disabled", content: <div>Disabled content</div>, disabled: true },
    { id: "t3", label: "Tab Three", content: <div>Three content</div> },
  ];

  it("skips disabled tab on ArrowRight", () => {
    render(<Tabs tabs={tabsWithDisabled} />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[0] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[0] as HTMLElement, { key: "ArrowRight" });
    // Should jump to "Tab Three", skipping "Tab Disabled"
    expect(document.activeElement).toBe(tabButtons[2]);
  });

  it("does not call onValueChange when clicking disabled tab", () => {
    const onValueChange = vi.fn();
    render(<Tabs tabs={tabsWithDisabled} onValueChange={onValueChange} />);
    const tabButtons = screen.getAllByRole("tab");
    fireEvent.click(tabButtons[1] as HTMLElement);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disabled tab has disabled attribute", () => {
    render(<Tabs tabs={tabsWithDisabled} />);
    const tabButtons = screen.getAllByRole("tab");
    expect((tabButtons[1] as HTMLElement).hasAttribute("disabled")).toBe(true);
  });

  it("skips disabled on Home if first tab is disabled", () => {
    const tabsFirstDisabled = [
      { id: "t1", label: "Tab Dis", content: null, disabled: true },
      { id: "t2", label: "Tab Sec", content: null },
      { id: "t3", label: "Tab Thi", content: null },
    ];
    render(<Tabs tabs={tabsFirstDisabled} defaultValue="t3" />);
    const tabButtons = screen.getAllByRole("tab");
    (tabButtons[2] as HTMLElement).focus();
    fireEvent.keyDown(tabButtons[2] as HTMLElement, { key: "Home" });
    expect(document.activeElement).toBe(tabButtons[1]);
  });
});

// ─── 8. ARIA structure ────────────────────────────────────────────────────────

describe("Tabs — ARIA structure", () => {
  it("renders role=tablist on the container", () => {
    render(<Tabs tabs={baseTabs} />);
    expect(screen.getByRole("tablist")).toBeTruthy();
  });

  it("each tab has role=tab and aria-selected", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      expect(tab.getAttribute("aria-selected")).toBeTruthy();
    }
  });

  it("each panel has role=tabpanel and aria-labelledby matching tab id", () => {
    const { container } = render(<Tabs tabs={baseTabs} />);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    const tabs = screen.getAllByRole("tab");
    expect(panels).toHaveLength(3);
    for (let i = 0; i < panels.length; i++) {
      const labelledBy = (panels[i] as HTMLElement).getAttribute("aria-labelledby");
      const tabId = tabs[i]?.getAttribute("id");
      expect(labelledBy).toBe(tabId);
    }
  });

  it("active tab has aria-controls pointing to its panel id", () => {
    const { container } = render(<Tabs tabs={baseTabs} />);
    const firstTab = screen.getAllByRole("tab")[0] as HTMLElement;
    const controlsId = firstTab?.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    const panel = container.querySelector(`#${controlsId}`);
    expect(panel?.getAttribute("role")).toBe("tabpanel");
  });

  it("roving tabindex: active tab = 0, others = -1", () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]?.getAttribute("tabindex")).toBe("0");
    expect(tabs[1]?.getAttribute("tabindex")).toBe("-1");
    expect(tabs[2]?.getAttribute("tabindex")).toBe("-1");
  });

  it("tablist has aria-orientation=horizontal by default", () => {
    render(<Tabs tabs={baseTabs} />);
    expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("tablist has aria-orientation=vertical when orientation=vertical", () => {
    render(<Tabs tabs={baseTabs} orientation="vertical" />);
    expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("vertical");
  });
});

// ─── 9. Invalid props — Zod guard ────────────────────────────────────────────

describe("Tabs — Zod guard renders null on invalid props", () => {
  it("returns null and logs error on invalid props", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Tabs tabs={[]} />);
    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
