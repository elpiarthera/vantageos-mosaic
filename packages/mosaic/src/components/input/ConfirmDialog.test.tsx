import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import corpus from "./eval-corpus.json";

// jsdom does not implement HTMLDialogElement.showModal / close natively in all versions.
// We patch it so tests can exercise the component without DOM errors.
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
});

afterEach(() => {
  cleanup();
});

// ─── Corpus-driven tests ────────────────────────────────────────────────────

describe("ConfirmDialog eval-corpus", () => {
  const [happy, edge, failure] = corpus;

  it("corpus happy — renders danger confirm button", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...(happy?.input as Parameters<typeof ConfirmDialog>[0])}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    const confirmBtn = screen.getByText("Delete");
    expect(confirmBtn.className).toContain("bg-red-600");
  });

  it("corpus edge — renders default variant", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...(edge?.input as Parameters<typeof ConfirmDialog>[0])}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const confirmBtn = screen.getByText("Yes");
    expect(confirmBtn.className).not.toContain("bg-red-600");
  });

  it("corpus failure — renders null on invalid props", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog
        {...(failure?.input as Parameters<typeof ConfirmDialog>[0])}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ─── Behaviour tests ────────────────────────────────────────────────────────

describe("ConfirmDialog behaviour", () => {
  const baseProps = {
    title: "Confirm delete",
    message: "This action is irreversible.",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default" as const,
    locale: "en" as const,
  };

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when ESC key is pressed", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("has correct ARIA attributes", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const titleEl = screen.getByText("Confirm delete");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(titleEl.id).toBe(labelledBy);
    const messageEl = screen.getByText("This action is irreversible.");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(messageEl.id).toBe(describedBy);
  });

  it("danger variant: confirm button has red classes", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog {...baseProps} variant="danger" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.className).toContain("bg-red-600");
    expect(confirmBtn.className).toContain("text-white");
  });
});
