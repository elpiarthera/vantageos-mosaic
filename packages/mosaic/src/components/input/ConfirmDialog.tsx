// i18nKeys: ConfirmDialog.button.confirm, ConfirmDialog.button.cancel, ConfirmDialog.aria.dialog

import { type KeyboardEvent, type MouseEvent, useEffect, useId, useRef } from "react";
import { type ConfirmDialogProps, validateConfirmDialogProps } from "./ConfirmDialog.schema";

function ConfirmDialogInner({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    // The <dialog> renders unconditionally and React attaches refs during commit,
    // before passive effects run: the ref is never null here.
    const dialog = dialogRef.current as HTMLDialogElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onCancel();
    }
  }

  const confirmClassName =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      : "bg-gray-900 text-white hover:bg-gray-700 focus-visible:outline-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    // react-doctor-disable-next-line react-doctor/no-noninteractive-element-interactions -- the modal <dialog> owns two dismiss shortcuts: Escape (keydown bubbling from the focused control inside) and a backdrop click; both duplicate the Cancel button, which stays the operable control
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="rounded-lg shadow-xl p-0 backdrop:bg-black/40 w-full max-w-md mx-auto"
    >
      {/* Inner div stops click propagation so backdrop-click only fires on <dialog> itself.
          Keydown stops here too, except Escape: from any focused control it must reach the dialog. */}
      {/* react-doctor-disable-next-line react-doctor/no-static-element-interactions -- not an interactive element: the handlers only stop event propagation; every action inside is a real button */}
      <div
        className="p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key !== "Escape") e.stopPropagation();
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p id={messageId} className="text-sm text-gray-600">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 transition-colors"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={confirmClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog(
  raw: Omit<ConfirmDialogProps, "variant" | "locale"> &
    Partial<Pick<ConfirmDialogProps, "variant" | "locale">>,
) {
  try {
    const parsed = validateConfirmDialogProps(raw);
    return <ConfirmDialogInner {...parsed} onConfirm={raw.onConfirm} onCancel={raw.onCancel} />;
  } catch (err) {
    console.error("[ConfirmDialog] Invalid props — component will not render.", err);
    return null;
  }
}
