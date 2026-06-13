/**
 * TokenDisplayOnceModal — React runtime subpath tests (v0.3.0 Wave 1 T5).
 *
 * Verifies:
 *   1. Import resolution from @vantageos/mosaic/react/confirmation barrel.
 *   2. Referential identity: runtime export === BARE component (zero-cost re-export).
 *   3. Copy clipboard mock — clipboard API called with token value.
 *   4. Close button fires onClose callback.
 *   5. Warning visible — amber warning message is rendered.
 *   6. A11y — aria-modal, aria-labelledby, aria-describedby present.
 *   7. EN/FR locale parity — copied label differs by locale.
 *   8. Invalid props → null (Zod guard).
 *   9. ESC key fires onClose.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenDisplayOnceModal as BareTokenDisplayOnceModal } from "../../../../../components/confirmation/TokenDisplayOnceModal";
import { TokenDisplayOnceModal } from "../TokenDisplayOnceModal";

// jsdom does not implement HTMLDialogElement.showModal / close natively.
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

const baseProps = {
  token: "tok_react_runtime_test_dummy",
  title: "Your API Token",
  warningMessage: "This token will only be shown once. Copy it now.",
  copyLabel: "Copy token",
  closeLabel: "Close",
  locale: "en" as const,
};

// ─── Resolution + identity ────────────────────────────────────────────────────

describe("TokenDisplayOnceModal — react runtime resolution", () => {
  it("resolves from @vantageos/mosaic/react/confirmation barrel", () => {
    expect(TokenDisplayOnceModal).toBeDefined();
    expect(typeof TokenDisplayOnceModal).toBe("function");
  });

  it("is referentially identical to the BARE component (zero-cost re-export)", () => {
    expect(TokenDisplayOnceModal).toBe(BareTokenDisplayOnceModal);
  });
});

// ─── Behaviour ───────────────────────────────────────────────────────────────

describe("TokenDisplayOnceModal — react runtime behaviour", () => {
  it("copy clipboard mock — Clipboard API called with token value", async () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy token"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("tok_react_runtime_test_dummy");
  });

  it("close button fires onClose callback", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("warning visible — amber warning message rendered", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    expect(screen.getByText("This token will only be shown once. Copy it now.")).toBeTruthy();
  });

  it("a11y — aria-modal, aria-labelledby, aria-describedby present", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("EN locale — shows 'Copied' ephemeral toast after copy", async () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy token"));
    });
    expect(screen.getByText("Copied")).toBeTruthy();
  });

  it("FR locale parity — renders fr labels and 'Copié' toast after copy", async () => {
    const onClose = vi.fn();
    render(
      <TokenDisplayOnceModal
        {...baseProps}
        locale="fr"
        copyLabel="Copier le jeton"
        closeLabel="Fermer"
        onClose={onClose}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Copier le jeton"));
    });
    expect(screen.getByText("Copié")).toBeTruthy();
  });

  it("invalid props → null (Zod guard fires console.warn)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onClose = vi.fn();
    const { container } = render(
      <TokenDisplayOnceModal
        token=""
        title=""
        warningMessage=""
        copyLabel=""
        closeLabel=""
        onClose={onClose}
      />,
    );
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("ESC key fires onClose", () => {
    const onClose = vi.fn();
    render(<TokenDisplayOnceModal {...baseProps} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
