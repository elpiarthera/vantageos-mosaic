/**
 * Compile-time mirror of `@vantageos/mosaic-i18n` EN/FR locales for the 6
 * v0.1.0 components. Inlined here so that `<Comp>` renderers can resolve
 * `t(key, locale)` without dragging react-i18next into the component runtime
 * (keeps bundle small and tests provider-free). Drift is gated by
 * `mosaic-registry-drift-check.mjs` which validates the canonical
 * `packages/mosaic-i18n/src/locales/{en,fr}.json` against `registry.yaml`.
 *
 * Mosaic standard §8: production JSX MUST resolve user-facing strings via
 * `t()` — no hardcoded English literals.
 */
export type MosaicLocale = "en" | "fr";

const EN = {
  "ProgressBar.aria.label": "Progress",
  "ProgressBar.error.invalidProps": "ProgressBar: invalid props",
  "ConfirmDialog.button.confirm": "Confirm",
  "ConfirmDialog.button.cancel": "Cancel",
  "ConfirmDialog.aria.dialog": "Confirmation dialog",
  "TableView.aria.table": "Data table",
  "TableView.pagination.next": "Next page",
  "TableView.pagination.prev": "Previous page",
  "TableView.empty.message": "No data to display",
  "TableView.error.invalidProps": "TableView: invalid props",
  "MarkdownRenderer.aria.content": "Rendered Markdown content",
  "MarkdownRenderer.error.invalidProps": "MarkdownRenderer: invalid props",
  "MarkdownRenderer.error.tooLong": "Content exceeds maximum length",
  "TokenDisplayOnceModal.button.copy": "Copy token",
  "TokenDisplayOnceModal.button.close": "Close",
  "TokenDisplayOnceModal.warning.once": "This token will only be shown once. Copy it now.",
  "TokenDisplayOnceModal.copied": "Copied",
  "StatusBadge.aria.status": "Status",
  "StatusBadge.error.invalidProps": "StatusBadge: invalid props",
  "EmptyState.error.invalidProps": "EmptyState: invalid props",
  "Toast.aria.close": "Close notification",
  "Toast.error.invalidProps": "Toast: invalid props",
  "Alert.aria.dismiss": "Dismiss alert",
  "Alert.error.invalidProps": "Alert: invalid props",
  "VirtualList.empty.message": "No items to display",
  "VirtualList.error.invalidProps": "VirtualList: invalid props",
  "Skeleton.aria.label": "Loading",
  "Skeleton.error.invalidProps": "Skeleton: invalid props",
} as const;

const FR: Record<keyof typeof EN, string> = {
  "ProgressBar.aria.label": "Progression",
  "ProgressBar.error.invalidProps": "ProgressBar : propriétés invalides",
  "ConfirmDialog.button.confirm": "Confirmer",
  "ConfirmDialog.button.cancel": "Annuler",
  "ConfirmDialog.aria.dialog": "Boîte de dialogue de confirmation",
  "TableView.aria.table": "Tableau de données",
  "TableView.pagination.next": "Page suivante",
  "TableView.pagination.prev": "Page précédente",
  "TableView.empty.message": "Aucune donnée à afficher",
  "TableView.error.invalidProps": "TableView : propriétés invalides",
  "MarkdownRenderer.aria.content": "Contenu Markdown rendu",
  "MarkdownRenderer.error.invalidProps": "MarkdownRenderer : propriétés invalides",
  "MarkdownRenderer.error.tooLong": "Le contenu dépasse la longueur maximale",
  "TokenDisplayOnceModal.button.copy": "Copier le jeton",
  "TokenDisplayOnceModal.button.close": "Fermer",
  "TokenDisplayOnceModal.warning.once":
    "Ce jeton ne sera affiché qu'une seule fois. Copiez-le maintenant.",
  "TokenDisplayOnceModal.copied": "Copié",
  "StatusBadge.aria.status": "Statut",
  "StatusBadge.error.invalidProps": "StatusBadge : propriétés invalides",
  "EmptyState.error.invalidProps": "EmptyState : propriétés invalides",
  "Toast.aria.close": "Fermer la notification",
  "Toast.error.invalidProps": "Toast : propriétés invalides",
  "Alert.aria.dismiss": "Fermer l'alerte",
  "Alert.error.invalidProps": "Alert : propriétés invalides",
  "VirtualList.empty.message": "Aucun élément à afficher",
  "VirtualList.error.invalidProps": "VirtualList : propriétés invalides",
  "Skeleton.aria.label": "Chargement",
  "Skeleton.error.invalidProps": "Skeleton : propriétés invalides",
};

export type MosaicI18nKey = keyof typeof EN;

const TABLE: Record<MosaicLocale, Record<MosaicI18nKey, string>> = {
  en: EN,
  fr: FR,
};

/** Resolves a Mosaic i18n key for the given locale, falling back to EN. */
export function t(key: MosaicI18nKey, locale: MosaicLocale = "en"): string {
  return TABLE[locale]?.[key] ?? TABLE.en[key];
}
