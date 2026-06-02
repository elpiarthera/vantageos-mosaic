"use client";

// i18nKeys: TokenDisplayOnceModal.button.copy, TokenDisplayOnceModal.button.close,
//           TokenDisplayOnceModal.warning.once, TokenDisplayOnceModal.copied

import { type KeyboardEvent, type MouseEvent, useEffect, useId, useRef, useState } from "react";
import {
  type TokenDisplayOnceModalProps,
  validateTokenDisplayOnceModalProps,
} from "./TokenDisplayOnceModal.schema";

function TokenDisplayOnceModalInner({
  token,
  title,
  warningMessage,
  copyLabel,
  closeLabel,
  onClose,
}: TokenDisplayOnceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const warningId = useId();
  const [copied, setCopied] = useState(false);
  // Security: token is held only in this useState — on unmount, released by React GC.
  // NEVER logged, NEVER stored in data-*, NEVER written to innerHTML.
  const [secureToken] = useState<string>(token);

  useEffect(() => {
    const dialog = dialogRef.current;
    /* v8 ignore next 2 */
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(secureToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed — do not leak token in error message
      setCopied(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={warningId}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="rounded-lg shadow-xl p-0 backdrop:bg-black/40 w-full max-w-lg mx-auto"
    >
      {/* Inner div stops click propagation so backdrop-click only fires on <dialog> itself */}
      <div
        className="p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p
          id={warningId}
          className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
        >
          {warningMessage}
        </p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
          <code className="flex-1 text-sm font-mono text-gray-800 break-all select-all">
            {secureToken}
          </code>
        </div>
        {/* Ephemeral "Copied" toast — aria-live polite, no token text */}
        <output aria-live="polite" aria-atomic="true" className="min-h-[1.25rem] block">
          {copied && <span className="text-sm text-green-700 font-medium">Copied</span>}
        </output>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 transition-colors"
          >
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function TokenDisplayOnceModal(
  raw: Omit<TokenDisplayOnceModalProps, "locale"> &
    Partial<Pick<TokenDisplayOnceModalProps, "locale">>,
) {
  try {
    const parsed = validateTokenDisplayOnceModalProps(raw);
    return <TokenDisplayOnceModalInner {...parsed} onClose={raw.onClose} />;
  } catch (err) {
    // Security: use console.warn (not console.error) and do not expose token value in log
    console.warn("[TokenDisplayOnceModal] Invalid props — component will not render.", err);
    return null;
  }
}
