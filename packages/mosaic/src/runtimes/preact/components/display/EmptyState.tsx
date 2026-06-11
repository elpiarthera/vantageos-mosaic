// i18nKeys: EmptyState.error.invalidProps
/** @jsxImportSource preact */
import type { ComponentChildren } from "preact";
import { ACTION_VARIANT_CLASSES } from "../../../../components/display/EmptyState.logic.js";
import {
  type EmptyStateProps,
  validateEmptyStateProps,
} from "../../../../components/display/EmptyState.schema.js";
import { t } from "../../../../i18n/strings.js";

// ─── Inner (validated props) ──────────────────────────────────────────────────

function EmptyStateInner({
  icon,
  title,
  description,
  action,
  locale: _locale,
}: EmptyStateProps & { icon?: ComponentChildren }) {
  const variant = action?.variant ?? "primary";

  return (
    <section
      aria-label={title}
      class="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      {icon && (
        <span aria-hidden="true" class="text-slate-400">
          {icon}
        </span>
      )}
      <h2 class="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p class="max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && (
        <button type="button" onClick={action.onClick} class={ACTION_VARIANT_CLASSES[variant]}>
          {action.label}
        </button>
      )}
    </section>
  );
}

/**
 * EmptyState — cross-runtime empty-set display primitive (Preact 10 implementation).
 *
 * Accepts `Record<string, unknown>` for MCP postMessage injection safety.
 * Zod validation narrows before render. Invalid props → accessible error span.
 *
 * WCAG-AA:
 * - <section aria-label={title}> → role="region" landmark (no Biome lint, correct semantics)
 * - heading hierarchy: h2 (title) — caller manages the h1 context
 * - action button is keyboard-accessible (tab + enter/space)
 */
export function EmptyState(
  raw: Omit<EmptyStateProps, "locale"> &
    Partial<Pick<EmptyStateProps, "locale">> & { icon?: ComponentChildren },
) {
  try {
    const parsed = validateEmptyStateProps(raw);
    return (
      <EmptyStateInner
        {...parsed}
        icon={raw.icon}
        action={
          parsed.action && raw.action?.onClick
            ? { ...parsed.action, onClick: raw.action.onClick }
            : undefined
        }
      />
    );
  } catch (err) {
    console.error("[EmptyState] Invalid props — component will not render.", err);
    const locale = (raw as Record<string, unknown>).locale === "fr" ? "fr" : "en";
    return <span role="alert">{t("EmptyState.error.invalidProps", locale)}</span>;
  }
}
