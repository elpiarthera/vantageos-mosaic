/**
 * T9 v2 — ConfirmModal alias of ConfirmDialog (react runtime).
 *
 * Chi naming bridge: gptpowerups-extension imports `ConfirmModal` from
 * `@vantageos/mosaic/react/confirmation`. The alias is a zero-cost
 * re-export of `ConfirmDialog` (categorised under "input" in the source
 * tree) so the consumer-facing naming contract is honored without
 * duplicating implementation.
 *
 * Tests assert:
 *   1. Import resolution from the `confirmation` runtime barrel.
 *   2. Referential identity: `ConfirmModal === ConfirmDialog`.
 *   3. Behaviour preservation: render sanity using the same DOM contract
 *      as the parent `ConfirmDialog` (a11y role, labels, callbacks).
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../../../../../components/input/ConfirmDialog";
import { ConfirmModal } from "../index";

// jsdom does not implement HTMLDialogElement.showModal / close natively.
// Same patch as the source ConfirmDialog test suite.
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

describe("ConfirmModal alias (react/confirmation)", () => {
  it("resolves from @vantageos/mosaic/react/confirmation barrel", () => {
    expect(ConfirmModal).toBeDefined();
    expect(typeof ConfirmModal).toBe("function");
  });

  it("is referentially identical to ConfirmDialog (zero-cost alias)", () => {
    expect(ConfirmModal).toBe(ConfirmDialog);
  });

  it("render sanity — accepts the same props as ConfirmDialog and fires callbacks", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        title="Confirm delete"
        message="This action is irreversible."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant="default"
        locale="en"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
