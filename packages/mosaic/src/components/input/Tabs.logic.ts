/**
 * Tabs.logic.ts — pure, framework-agnostic logic.
 * No JSX here — shared between React 19 and Preact 10 runtimes.
 *
 * WCAG-AA ARIA + roving tabindex spec:
 * - role="tablist" on container
 * - role="tab" + aria-selected + aria-controls on each button
 * - role="tabpanel" + aria-labelledby on each panel
 * - Roving tabindex: active tab = tabIndex 0, all others = tabIndex -1
 * - ArrowLeft/Right (horizontal) or ArrowUp/Down (vertical) moves focus between tabs
 * - Home → first enabled tab, End → last enabled tab
 * - Tab key moves focus INTO the active panel content (no tabIndex manipulation needed — natural DOM order)
 * - Disabled tabs are skipped during keyboard nav
 */

export type TabOrientation = "horizontal" | "vertical";

/**
 * Returns the prev/next key pair for the given orientation.
 */
export function getNavKeys(orientation: TabOrientation): {
  prev: string;
  next: string;
} {
  return orientation === "horizontal"
    ? { prev: "ArrowLeft", next: "ArrowRight" }
    : { prev: "ArrowUp", next: "ArrowDown" };
}

/**
 * Finds the next focusable (non-disabled) tab index in direction.
 * Wraps around at boundaries.
 */
export function findNextEnabledIndex(
  tabs: Array<{ id: string; disabled?: boolean }>,
  currentIndex: number,
  direction: 1 | -1,
): number {
  const len = tabs.length;
  let i = (currentIndex + direction + len) % len;
  // Guard: prevent infinite loop if all tabs are disabled (shouldn't happen but defensive)
  for (let tries = 0; tries < len; tries++) {
    if (!tabs[i]?.disabled) return i;
    i = (i + direction + len) % len;
  }
  return currentIndex;
}

/**
 * Finds the first enabled tab index.
 */
export function findFirstEnabledIndex(tabs: Array<{ id: string; disabled?: boolean }>): number {
  const idx = tabs.findIndex((t) => !t.disabled);
  return idx === -1 ? 0 : idx;
}

/**
 * Finds the last enabled tab index.
 */
export function findLastEnabledIndex(tabs: Array<{ id: string; disabled?: boolean }>): number {
  for (let i = tabs.length - 1; i >= 0; i--) {
    if (!tabs[i]?.disabled) return i;
  }
  return tabs.length - 1;
}

/**
 * Generates stable DOM IDs for tab + panel linking.
 */
export function getTabId(instanceId: string, tabId: string): string {
  return `${instanceId}-tab-${tabId}`;
}

export function getPanelId(instanceId: string, tabId: string): string {
  return `${instanceId}-panel-${tabId}`;
}

/**
 * Resolves the initial active tab ID.
 * Priority: value (controlled) > defaultValue > first enabled tab.
 */
export function resolveInitialActive(
  tabs: Array<{ id: string; disabled?: boolean }>,
  value?: string,
  defaultValue?: string,
): string {
  if (value !== undefined) {
    const found = tabs.find((t) => t.id === value && !t.disabled);
    if (found) return found.id;
  }
  if (defaultValue !== undefined) {
    const found = tabs.find((t) => t.id === defaultValue && !t.disabled);
    if (found) return found.id;
  }
  const firstEnabled = tabs.find((t) => !t.disabled);
  return firstEnabled?.id ?? tabs[0]?.id ?? "";
}

/**
 * Tailwind class helpers for the tablist container.
 */
export function getTablistClasses(orientation: TabOrientation): string {
  return orientation === "horizontal"
    ? "flex flex-row border-b border-slate-200"
    : "flex flex-col border-r border-slate-200 self-start";
}

/**
 * Tailwind class helpers for a single tab button.
 */
export function getTabClasses(
  isSelected: boolean,
  isDisabled: boolean,
  orientation: TabOrientation,
): string {
  const base =
    "relative px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none";

  const orientationCls =
    orientation === "horizontal" ? "border-b-2 -mb-px" : "border-r-2 -mr-px text-left";

  const stateCls = isDisabled
    ? "text-slate-400 cursor-not-allowed border-transparent"
    : isSelected
      ? "border-blue-600 text-blue-700 bg-slate-50"
      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50";

  return [base, orientationCls, stateCls].join(" ");
}

/**
 * Tailwind class helpers for the tab panel wrapper.
 */
export function getPanelClasses(orientation: TabOrientation): string {
  return orientation === "horizontal" ? "pt-4" : "pl-4 flex-1";
}

/**
 * Tailwind class helpers for the root container.
 */
export function getRootClasses(orientation: TabOrientation): string {
  return orientation === "horizontal" ? "flex flex-col" : "flex flex-row";
}
