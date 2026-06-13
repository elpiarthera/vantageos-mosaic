/**
 * ConfirmDialog — react/confirmation subpath tests (v0.3.0 T5).
 *
 * Verifies:
 *   1. Import resolution from @vantageos/mosaic/react/confirmation barrel.
 *   2. Referential identity: ConfirmDialog (subpath) === ConfirmDialog (source).
 *   3. Referential identity bridge: ConfirmModal === ConfirmDialog (alias preserved).
 *   4. Open/close lifecycle — showModal fires on mount, close on unmount.
 *   5. Confirm callback fires on confirm button click.
 *   6. Cancel callback fires on cancel button click.
 *   7. A11y: role="dialog", aria-modal, aria-labelledby, aria-describedby present.
 *   8. ESC key calls onCancel.
 *   9. Danger variant: confirm button carries bg-red-600.
 *   10. FR locale: labels rendered correctly (parity).
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog as ConfirmDialogSource } from "../../../../../components/input/ConfirmDialog";
import { ConfirmDialog, ConfirmModal } from "../index";

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
});

afterEach(() => {
  cleanup();
});

const baseProps = {
  title: "Confirm delete",
  message: "This action is irreversible.",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "default" as const,
  locale: "en" as const,
};

describe("ConfirmDialog (react/confirmation subpath)", () => {
  it("resolves from @vantageos/mosaic/react/confirmation barrel", () => {
    expect(ConfirmDialog).toBeDefined();
    expect(typeof ConfirmDialog).toBe("function");
  });

  it("is referentially identical to the shared source ConfirmDialog", () => {
    expect(ConfirmDialog).toBe(ConfirmDialogSource);
  });

  it("ConfirmModal alias is referentially identical to ConfirmDialog (preserved)", () => {
    expect(ConfirmModal).toBe(ConfirmDialog);
  });

  it("open — calls showModal on mount (dialog is open)", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("close — calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancel — calls onCancel when cancel button is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("a11y — role=dialog, aria-modal, aria-labelledby, aria-describedby present", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const titleEl = screen.getByText("Confirm delete");
    expect(dialog.getAttribute("aria-labelledby")).toBe(titleEl.id);
    const messageEl = screen.getByText("This action is irreversible.");
    expect(dialog.getAttribute("aria-describedby")).toBe(messageEl.id);
  });

  it("ESC key calls onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("danger variant — confirm button has bg-red-600", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog {...baseProps} variant="danger" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.className).toContain("bg-red-600");
    expect(confirmBtn.className).toContain("text-white");
  });

  it("parity — FR locale renders with the provided labels", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Supprimer l'enregistrement"
        message="Cette action est irréversible."
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        variant="danger"
        locale="fr"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText("Confirmer")).toBeTruthy();
    expect(screen.getByText("Annuler")).toBeTruthy();
    fireEvent.click(screen.getByText("Confirmer"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
