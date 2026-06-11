/**
 * Pure helpers for FormField. Currently a placeholder for future
 * cross-runtime logic (e.g. ARIA id generation, error aggregation).
 */
export function buildFieldId(formName: string | undefined, fieldName: string): string {
  return formName ? `${formName}-${fieldName}` : fieldName;
}
