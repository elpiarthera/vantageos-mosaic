/**
 * Type declarations for derive-tailwind-theme.mjs, consumed by
 * src/__tests__/tailwind-theme.test.ts. The script itself stays plain JS
 * (consistent with the sibling derive-naming-contract.mjs) since it only
 * ever runs standalone via `node scripts/derive-tailwind-theme.mjs` or is
 * imported by the test suite — this file exists purely so that import gets
 * type information instead of an implicit `any`.
 */

export type CategoryNamespaceMap = Readonly<Record<string, string | null>>;
export type ErrorSentinelByNamespace = Readonly<Record<string, string>>;

export const CATEGORY_NAMESPACE_MAP: CategoryNamespaceMap;
export const ERROR_SENTINEL_BY_NAMESPACE: ErrorSentinelByNamespace;

export function extractDeclaredNames(cssSource: string): string[];

export function parseName(name: string): { category: string; key: string };

export interface GeneratedTheme {
  css: string;
  entries: string[];
  skippedCategories: Set<string>;
}

export function generateThemeCss(cssSource: string): GeneratedTheme;
