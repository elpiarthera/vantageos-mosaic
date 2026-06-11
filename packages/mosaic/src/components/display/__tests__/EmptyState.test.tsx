// i18nKeys: EmptyState.error.invalidProps

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "../../../runtimes/react/components/display/EmptyState";
import { EmptyStatePropsSchema, validateEmptyStateProps } from "../EmptyState.schema";

afterEach(() => {
  cleanup();
});

// ─── (1) Zod props schema ──────────────────────────────────────────────────────

describe("EmptyState — Zod schema validation", () => {
  it("accepts minimal valid props (title only)", () => {
    const result = EmptyStatePropsSchema.safeParse({ title: "No results" });
    expect(result.success).toBe(true);
  });

  it("accepts full valid props with action", () => {
    const result = EmptyStatePropsSchema.safeParse({
      title: "Nothing here",
      description: "Try a different search",
      action: { label: "Reset", variant: "primary" },
      locale: "en",
    });
    expect(result.success).toBe(true);
  });

  it("accepts action with secondary variant", () => {
    const result = EmptyStatePropsSchema.safeParse({
      title: "Empty",
      action: { label: "Go back", variant: "secondary" },
    });
    expect(result.success).toBe(true);
  });

  it("defaults action.variant to primary when not provided", () => {
    const result = EmptyStatePropsSchema.safeParse({
      title: "Empty",
      action: { label: "Create" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action?.variant).toBe("primary");
    }
  });

  it("defaults locale to en when not provided", () => {
    const result = EmptyStatePropsSchema.safeParse({ title: "Empty" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
    }
  });

  it("rejects missing title", () => {
    const result = EmptyStatePropsSchema.safeParse({ description: "No results" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title string", () => {
    const result = EmptyStatePropsSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty action.label", () => {
    const result = EmptyStatePropsSchema.safeParse({
      title: "Empty",
      action: { label: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action.variant", () => {
    const result = EmptyStatePropsSchema.safeParse({
      title: "Empty",
      action: { label: "Go", variant: "danger" },
    });
    expect(result.success).toBe(false);
  });

  it("validateEmptyStateProps throws on invalid", () => {
    expect(() => validateEmptyStateProps({ title: "" })).toThrow();
  });

  it("validateEmptyStateProps passes on valid", () => {
    expect(() => validateEmptyStateProps({ title: "No data" })).not.toThrow();
  });
});

// ─── (2) Minimal render — title only ─────────────────────────────────────────

describe("EmptyState — minimal render (title only)", () => {
  it("renders the title as h2", () => {
    render(<EmptyState title="No results found" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("No results found");
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    // No p element with description content
    expect(screen.queryByText(/description/i)).toBeNull();
  });

  it("does not render action button when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders wrapper as landmark region", () => {
    render(<EmptyState title="Empty" />);
    const wrapper = screen.getByRole("region", { name: "Empty" });
    expect(wrapper).toBeDefined();
  });

  it("wrapper has aria-label set to title", () => {
    render(<EmptyState title="Nothing here" />);
    const wrapper = screen.getByRole("region", { name: "Nothing here" });
    expect(wrapper.getAttribute("aria-label")).toBe("Nothing here");
  });
});

// ─── (3) Full render — icon + description + action ───────────────────────────

describe("EmptyState — full render with icon + description + action", () => {
  function SearchIcon() {
    return (
      <svg data-testid="search-icon" width="48" height="48" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
      </svg>
    );
  }

  it("renders the icon when provided", () => {
    render(
      <EmptyState
        title="No results"
        icon={<SearchIcon />}
        description="Try adjusting your search."
        action={{ label: "Clear filters", onClick: vi.fn() }}
      />,
    );
    expect(screen.getByTestId("search-icon")).toBeDefined();
  });

  it("renders description paragraph when provided", () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search terms."
        action={{ label: "Clear filters", onClick: vi.fn() }}
      />,
    );
    expect(screen.getByText("Try adjusting your search terms.")).toBeDefined();
  });

  it("renders action button with correct label", () => {
    render(<EmptyState title="No data" action={{ label: "Create new item", onClick: vi.fn() }} />);
    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Create new item");
  });
});

// ─── (4) action.onClick callback ─────────────────────────────────────────────

describe("EmptyState — action onClick callback", () => {
  it("calls onClick when button is clicked", () => {
    const handler = vi.fn();
    render(<EmptyState title="Empty" action={{ label: "Try again", onClick: handler }} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not render button when action.onClick is missing", () => {
    render(
      <EmptyState
        title="Empty"
        // @ts-expect-error intentionally omitting onClick to test schema guard
        action={{ label: "Try again" }}
      />,
    );
    // action renders only when onClick is present
    expect(screen.queryByRole("button")).toBeNull();
  });
});

// ─── (5) Heading hierarchy semantic ──────────────────────────────────────────

describe("EmptyState — heading hierarchy", () => {
  it("title is always h2 (not h1 or h3)", () => {
    render(<EmptyState title="Section empty" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });
});

// ─── (6) Error fallback for invalid props ─────────────────────────────────────

describe("EmptyState — invalid props fallback", () => {
  it("renders role=alert span for invalid props (empty title)", () => {
    // Empty string passes TypeScript but fails Zod min(1) at runtime
    render(<EmptyState title="" />);
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("renders role=alert span when title is missing", () => {
    // @ts-expect-error intentionally missing required prop
    render(<EmptyState />);
    expect(screen.getByRole("alert")).toBeDefined();
  });
});

// ─── (7) action variant class ─────────────────────────────────────────────────

describe("EmptyState — action button variants", () => {
  it("renders primary variant button by default", () => {
    const { container } = render(
      <EmptyState title="Empty" action={{ label: "Create", onClick: vi.fn() }} />,
    );
    const button = container.querySelector("button");
    // Primary uses dark background
    expect(button?.className).toContain("bg-slate-900");
  });

  it("renders secondary variant button correctly", () => {
    const { container } = render(
      <EmptyState
        title="Empty"
        action={{ label: "Go back", variant: "secondary", onClick: vi.fn() }}
      />,
    );
    const button = container.querySelector("button");
    expect(button?.className).toContain("border-slate-300");
  });
});
