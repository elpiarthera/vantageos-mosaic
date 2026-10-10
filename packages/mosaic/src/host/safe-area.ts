/**
 * Safe-area insets (H01).
 *
 * Spec: MCP Apps 2026-01-26 (ext-apps-spec.mdx l.582-587) `HostContext.safeAreaInsets`
 * = `{ top, right, bottom, left }` in pixels. Claude design guidelines: apply them as padding on
 * the root container (or as `scroll-padding` on scroll-snap containers). Pure and DOM-free
 * except `applySafeAreaInsets`, which takes its target element explicitly.
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const SIDES = ["top", "right", "bottom", "left"] as const;

/** Reads `hostContext.safeAreaInsets`; `undefined` unless all four sides are finite px >= 0. */
export function readSafeAreaInsets(raw: unknown): SafeAreaInsets | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const v = (raw as Record<string, unknown>).safeAreaInsets;
  if (v === null || typeof v !== "object") return undefined;
  const rec = v as Record<string, unknown>;
  const out = {} as SafeAreaInsets;
  for (const side of SIDES) {
    const n = rec[side];
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return undefined;
    out[side] = n;
  }
  return out;
}

/** CSS padding shorthand (top right bottom left). */
export function safeAreaPadding(insets: SafeAreaInsets): string {
  return SIDES.map((s) => `${insets[s]}px`).join(" ");
}

/**
 * Applies the insets as padding on `root` and exposes them as `--mosaic-safe-area-<side>` for
 * scroll-padding. `undefined` clears both (the host reported none).
 */
export function applySafeAreaInsets(insets: SafeAreaInsets | undefined, root: HTMLElement): void {
  if (!insets) {
    root.style.padding = "";
    for (const s of SIDES) root.style.removeProperty(`--mosaic-safe-area-${s}`);
    return;
  }
  root.style.padding = safeAreaPadding(insets);
  for (const s of SIDES) root.style.setProperty(`--mosaic-safe-area-${s}`, `${insets[s]}px`);
}
