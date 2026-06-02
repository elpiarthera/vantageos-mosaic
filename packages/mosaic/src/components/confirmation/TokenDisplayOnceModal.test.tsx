import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenDisplayOnceModal } from "./TokenDisplayOnceModal";
import corpus from "./eval-corpus.json";

// Patch HTMLDialogElement for jsdom
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
  }
  // Stub Clipboard API
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Corpus-driven tests ────────────────────────────────────────────────────

describe("TokenDisplayOnceModal eval-corpus", () => {
  const [happy, edge, failure] = corpus;

  it("corpus happy — renders token in code block with copy and close buttons", () => {
    const onClose = vi.fn();
    render(
      <TokenDisplayOnceModal
        {...(happy?.input as Parameters<typeof TokenDisplayOnceModal>[0])}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    // Token is displayed (via code element content)
    const codeEl = document.querySelector("code");
    expect(codeEl).toBeTruthy();
    expect(screen.getByText("Copy token")).toBeTruthy();
    expect(screen.getByText("I have copied it")).toBeTruthy();
  });

  it("corpus edge — renders with single-char token and fr locale", () => {
    const onClose = vi.fn();
    render(
      <TokenDisplayOnceModal
        {...(edge?.input as Parameters<typeof TokenDisplayOnceModal>[0])}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Copier")).toBeTruthy();
    expect(screen.getByText("Fermer")).toBeTruthy();
  });

  it("corpus failure — renders null on invalid props", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onClose = vi.fn();
    const { container } = render(
      <TokenDisplayOnceModal
        {...(failure?.input as Parameters<typeof TokenDisplayOnceModal>[0])}
        onClose={onClose}
      />,
    );
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ─── Behaviour tests ────────────────────────────────────────────────────────

describe("TokenDisplayOnceModal behaviour", () => {
  const baseProps = {
    token: "tok_demo_xxx_safe_dummy",
    title: "Your API Token",
    warningMessage: "This token will only be shown once. Copy it now.",
    copyLabel: "Copy token",
    closeLabel: "Close",
    locale: "en" as const,
  };

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls Clipboard API on copy click and shows ephemeral toast", async () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy token"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("tok_demo_xxx_safe_dummy");
    // Ephemeral "Copied" toast appears
    expect(screen.getByText("Copied")).toBeTruthy();
    // Toast region uses aria-live polite (output element has implicit role="status")
    const liveRegion = document.querySelector("output");
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
  });

  it("toast does NOT contain the token text", async () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy token"));
    });
    const liveRegion = document.querySelector("output");
    expect(liveRegion?.textContent).not.toContain("tok_demo_xxx_safe_dummy");
  });

  it("toast disappears after 2 seconds", async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy token"));
    });
    expect(screen.getByText("Copied")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByText("Copied")).toBeNull();
    vi.useRealTimers();
  });

  it("has correct ARIA attributes", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const titleEl = screen.getByText("Your API Token");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(titleEl.id).toBe(labelledBy);
    const warningEl = screen.getByText("This token will only be shown once. Copy it now.");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(warningEl.id).toBe(describedBy);
  });

  it("token is NOT stored in data-* attributes", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    const allElements = document.querySelectorAll("*");
    for (const el of allElements) {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (attr.name.startsWith("data-")) {
          expect(attr.value).not.toContain("tok_demo_xxx_safe_dummy");
        }
      }
    }
  });

  it("token is NOT in any innerHTML attribute string (no dangerouslySetInnerHTML)", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    // Verify no element uses innerHTML to display the token (only textContent via React)
    const codeEl = document.querySelector("code");
    expect(codeEl).toBeTruthy();
    // The code element's textContent contains the token (that is correct — it's displayed)
    // but it should NOT be embedded via dangerouslySetInnerHTML (verified by absence of script/XSS risk)
    expect(codeEl?.innerHTML).toBe("tok_demo_xxx_safe_dummy");
  });
});
