/**
 * Compile-time mirror of `@vantageos/mosaic-i18n` EN/FR locales for all
 * Mosaic components (v0.3.0). Inlined here so that `<Comp>` renderers can
 * resolve `t(key, locale)` without dragging react-i18next into the component
 * runtime (keeps bundle small and tests provider-free). Drift is gated by
 * `mosaic-registry-drift-check.mjs` which validates the canonical
 * `packages/mosaic-i18n/src/locales/{en,fr}.json` against `registry.yaml`.
 *
 * Mosaic standard §8: production JSX MUST resolve user-facing strings via
 * `t()` — no hardcoded English literals.
 *
 * Forms keys added — v0.3.0-C-PR1 (Axis 5/6 i18n pass).
 * Convention: Forms.<Component>.<context>.<id>
 */
export type MosaicLocale = "en" | "fr";

const EN = {
  // ─── Non-forms components ──────────────────────────────────────────────────
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
  // ─── Forms — useMosaicForm ─────────────────────────────────────────────────
  "useMosaicForm.error.invalidProps": "useMosaicForm: invalid options",
  // ─── Forms — FormProvider ──────────────────────────────────────────────────
  "FormProvider.error.invalidProps": "FormProvider: invalid props",
  // ─── Forms — FormField ────────────────────────────────────────────────────
  "FormField.error.invalidProps": "FormField: invalid props",
  // ─── Forms — ErrorDisplay ─────────────────────────────────────────────────
  "ErrorDisplay.error.required": "This field is required",
  "ErrorDisplay.error.min": "Value is below the minimum",
  "ErrorDisplay.error.max": "Value exceeds the maximum",
  "ErrorDisplay.error.minLength": "Input is too short",
  "ErrorDisplay.error.maxLength": "Input is too long",
  "ErrorDisplay.error.pattern": "Invalid format",
  "ErrorDisplay.error.email": "Enter a valid email address",
  "ErrorDisplay.error.url": "Enter a valid URL",
  "ErrorDisplay.error.generic": "Invalid value",
  // ─── Forms — SubmitButton ─────────────────────────────────────────────────
  "SubmitButton.aria.submit": "Submit form",
  "SubmitButton.state.loading": "Submitting…",
  "SubmitButton.error.invalidProps": "SubmitButton: invalid props",
  // ─── Forms — Input ────────────────────────────────────────────────────────
  "Input.aria.label": "Input field",
  "Input.error.required": "This field is required",
  "Input.error.invalid": "Invalid value",
  "Input.error.tooLong": "Input is too long",
  "Input.error.tooShort": "Input is too short",
  "Input.error.invalidProps": "Input: invalid props",
  // ─── Forms — Textarea ─────────────────────────────────────────────────────
  "Textarea.aria.label": "Text area",
  "Textarea.error.required": "This field is required",
  "Textarea.error.tooLong": "Text is too long",
  "Textarea.counter.remaining": "characters remaining",
  "Textarea.error.invalidProps": "Textarea: invalid props",
  // ─── Forms — FieldArray ───────────────────────────────────────────────────
  "FieldArray.aria.list": "List of items",
  "FieldArray.aria.addItem": "Add item",
  "FieldArray.aria.removeItem": "Remove item",
  "FieldArray.error.invalidProps": "FieldArray: invalid props",
  // ─── Forms — Checkbox ─────────────────────────────────────────────────────
  "Checkbox.aria.label": "Checkbox",
  "Checkbox.error.required": "This field must be checked",
  "Checkbox.error.invalidProps": "Checkbox: invalid props",
  // ─── Forms — MultiSelect ──────────────────────────────────────────────────
  "MultiSelect.aria.label": "Multi-select field",
  "MultiSelect.aria.removeChip": "Remove",
  "MultiSelect.error.required": "Select at least one option",
  "MultiSelect.error.maxItems": "Maximum number of selections reached",
  "MultiSelect.placeholder": "Select options…",
  "MultiSelect.search.placeholder": "Search…",
  "MultiSelect.empty": "No options available",
  "MultiSelect.error.invalidProps": "MultiSelect: invalid props",
  // ─── Forms — RadioGroup ───────────────────────────────────────────────────
  "RadioGroup.aria.label": "Radio group",
  "RadioGroup.error.required": "Select one option",
  "RadioGroup.error.invalidProps": "RadioGroup: invalid props",
  // ─── Forms — Select ───────────────────────────────────────────────────────
  "Select.placeholder": "Select an option…",
  "Select.search.placeholder": "Search…",
  "Select.empty": "No options available",
  "Select.error.required": "Select an option",
  "Select.error.invalidProps": "Select: invalid props",
} as const;

const FR: Record<keyof typeof EN, string> = {
  // ─── Non-forms components ──────────────────────────────────────────────────
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
  // ─── Forms — useMosaicForm ─────────────────────────────────────────────────
  "useMosaicForm.error.invalidProps": "useMosaicForm : options invalides",
  // ─── Forms — FormProvider ──────────────────────────────────────────────────
  "FormProvider.error.invalidProps": "FormProvider : propriétés invalides",
  // ─── Forms — FormField ────────────────────────────────────────────────────
  "FormField.error.invalidProps": "FormField : propriétés invalides",
  // ─── Forms — ErrorDisplay ─────────────────────────────────────────────────
  "ErrorDisplay.error.required": "Ce champ est obligatoire",
  "ErrorDisplay.error.min": "La valeur est inférieure au minimum",
  "ErrorDisplay.error.max": "La valeur dépasse le maximum",
  "ErrorDisplay.error.minLength": "La saisie est trop courte",
  "ErrorDisplay.error.maxLength": "La saisie est trop longue",
  "ErrorDisplay.error.pattern": "Format invalide",
  "ErrorDisplay.error.email": "Saisissez une adresse e-mail valide",
  "ErrorDisplay.error.url": "Saisissez une URL valide",
  "ErrorDisplay.error.generic": "Valeur invalide",
  // ─── Forms — SubmitButton ─────────────────────────────────────────────────
  "SubmitButton.aria.submit": "Soumettre le formulaire",
  "SubmitButton.state.loading": "Envoi en cours…",
  "SubmitButton.error.invalidProps": "SubmitButton : propriétés invalides",
  // ─── Forms — Input ────────────────────────────────────────────────────────
  "Input.aria.label": "Champ de saisie",
  "Input.error.required": "Ce champ est obligatoire",
  "Input.error.invalid": "Valeur invalide",
  "Input.error.tooLong": "La saisie est trop longue",
  "Input.error.tooShort": "La saisie est trop courte",
  "Input.error.invalidProps": "Input : propriétés invalides",
  // ─── Forms — Textarea ─────────────────────────────────────────────────────
  "Textarea.aria.label": "Zone de texte",
  "Textarea.error.required": "Ce champ est obligatoire",
  "Textarea.error.tooLong": "Le texte est trop long",
  "Textarea.counter.remaining": "caractères restants",
  "Textarea.error.invalidProps": "Textarea : propriétés invalides",
  // ─── Forms — FieldArray ───────────────────────────────────────────────────
  "FieldArray.aria.list": "Liste d'éléments",
  "FieldArray.aria.addItem": "Ajouter un élément",
  "FieldArray.aria.removeItem": "Supprimer l'élément",
  "FieldArray.error.invalidProps": "FieldArray : propriétés invalides",
  // ─── Forms — Checkbox ─────────────────────────────────────────────────────
  "Checkbox.aria.label": "Case à cocher",
  "Checkbox.error.required": "Ce champ doit être coché",
  "Checkbox.error.invalidProps": "Checkbox : propriétés invalides",
  // ─── Forms — MultiSelect ──────────────────────────────────────────────────
  "MultiSelect.aria.label": "Champ de sélection multiple",
  "MultiSelect.aria.removeChip": "Retirer",
  "MultiSelect.error.required": "Sélectionnez au moins une option",
  "MultiSelect.error.maxItems": "Nombre maximum de sélections atteint",
  "MultiSelect.placeholder": "Sélectionner des options…",
  "MultiSelect.search.placeholder": "Rechercher…",
  "MultiSelect.empty": "Aucune option disponible",
  "MultiSelect.error.invalidProps": "MultiSelect : propriétés invalides",
  // ─── Forms — RadioGroup ───────────────────────────────────────────────────
  "RadioGroup.aria.label": "Groupe de boutons radio",
  "RadioGroup.error.required": "Sélectionnez une option",
  "RadioGroup.error.invalidProps": "RadioGroup : propriétés invalides",
  // ─── Forms — Select ───────────────────────────────────────────────────────
  "Select.placeholder": "Sélectionner une option…",
  "Select.search.placeholder": "Rechercher…",
  "Select.empty": "Aucune option disponible",
  "Select.error.required": "Sélectionnez une option",
  "Select.error.invalidProps": "Select : propriétés invalides",
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
