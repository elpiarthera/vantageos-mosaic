/**
 * ConfirmDialog — preact/confirmation subpath parity smoke (v0.3.0 T5).
 *
 * The preact runtime barrel re-exports the same shared ConfirmDialog
 * implementation via a thin alias file. The tsup preact pass aliases
 * react → preact/compat at build time, so the shared source compiles to
 * Preact hooks/JSX automatically (per spec §1.4 + §18.1).
 *
 * Rendering is exercised in the react suite (jsdom + @testing-library/react).
 * Here we assert import resolution + referential identity across runtimes.
 */
import { describe, expect, it } from "vitest";
import { ConfirmDialog as ConfirmDialogSource } from "../../../../../components/input/ConfirmDialog";
import { ConfirmDialog, ConfirmModal } from "../index";

describe("ConfirmDialog (preact/confirmation subpath) — parity smoke", () => {
  it("resolves from @vantageos/mosaic/preact/confirmation barrel", () => {
    expect(ConfirmDialog).toBeDefined();
    expect(typeof ConfirmDialog).toBe("function");
  });

  it("is referentially identical to the shared source ConfirmDialog", () => {
    expect(ConfirmDialog).toBe(ConfirmDialogSource);
  });

  it("ConfirmModal alias is referentially identical to ConfirmDialog (preserved)", () => {
    expect(ConfirmModal).toBe(ConfirmDialog);
  });
});
