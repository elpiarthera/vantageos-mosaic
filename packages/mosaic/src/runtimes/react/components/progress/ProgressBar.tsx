// i18nKeys: ProgressBar.aria.label, ProgressBar.error.invalidProps

import { ProgressBar as BareProgressBar } from "../../../../components/progress/ProgressBar.js";

/**
 * ProgressBar — React 19 runtime wrapper.
 *
 * Delegates entirely to the BARE implementation. The BARE component already:
 * - Validates props via Zod (ProgressBarPropsSchema)
 * - Resolves EN/FR i18n strings via t()
 * - Renders role=progressbar with full WCAG-AA aria attributes
 * - Falls back to role=alert on invalid props instead of throwing
 *
 * Import: `import { ProgressBar } from "@vantageos/mosaic/react/progress"`
 */
export function ProgressBar(raw: Record<string, unknown>) {
  return <BareProgressBar {...raw} />;
}
