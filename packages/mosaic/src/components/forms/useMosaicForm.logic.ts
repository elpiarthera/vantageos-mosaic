import type { MosaicFormMode } from "./useMosaicForm.schema.js";

/**
 * Map Mosaic public mode → react-hook-form `mode` config value.
 *
 * RHF accepts the same three strings (`"onBlur" | "onChange" | "onSubmit"`)
 * but a future Mosaic mode could be aliased here (e.g. `"realtime"` →
 * `"onChange"`). Keeping the mapping in pure logic makes the hook itself
 * trivial and unit-testable without a renderer.
 */
export function toRhfMode(mode: MosaicFormMode): "onBlur" | "onChange" | "onSubmit" {
  return mode;
}
