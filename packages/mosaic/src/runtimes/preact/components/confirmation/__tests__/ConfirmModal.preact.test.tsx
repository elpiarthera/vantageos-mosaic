/**
 * T9 v2 — ConfirmModal alias of ConfirmDialog (preact runtime, parity smoke).
 *
 * The preact runtime barrel re-exports the same shared `ConfirmDialog`
 * implementation under the `ConfirmModal` name. Because the alias is a
 * pure re-export of the shared (runtime-agnostic) source module, the
 * referential-identity invariant must hold on both runtimes. Rendering
 * is exercised in the react suite (jsdom + @testing-library/react);
 * here we keep the preact smoke import-only to avoid a second renderer
 * dependency for what is structurally the same module.
 */
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "../../../../../components/input/ConfirmDialog";
import { ConfirmModal } from "../index";

describe("ConfirmModal alias (preact/confirmation) — parity smoke", () => {
  it("resolves from @vantageos/mosaic/preact/confirmation barrel", () => {
    expect(ConfirmModal).toBeDefined();
    expect(typeof ConfirmModal).toBe("function");
  });

  it("is referentially identical to the shared ConfirmDialog implementation", () => {
    expect(ConfirmModal).toBe(ConfirmDialog);
  });
});
