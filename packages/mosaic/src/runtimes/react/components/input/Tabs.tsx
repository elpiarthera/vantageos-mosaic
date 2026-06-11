"use client";

// i18nKeys: Tabs.error.invalidProps

import { type KeyboardEvent, useId, useRef, useState } from "react";
import {
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  getNavKeys,
  getPanelClasses,
  getPanelId,
  getRootClasses,
  getTabClasses,
  getTabId,
  getTablistClasses,
  resolveInitialActive,
} from "../../../../components/input/Tabs.logic.js";
import {
  type TabItem,
  type TabsProps,
  validateTabsProps,
} from "../../../../components/input/Tabs.schema.js";

// ─── Inner component (validated props) ────────────────────────────────────────

function TabsInner({
  tabs,
  value: controlledValue,
  defaultValue,
  orientation,
  onValueChange,
}: TabsProps) {
  const instanceId = useId();
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState<string>(() =>
    resolveInitialActive(tabs, controlledValue, defaultValue),
  );

  const activeId = isControlled
    ? (controlledValue ?? resolveInitialActive(tabs, undefined, defaultValue))
    : internalValue;

  function handleSelect(tabId: string) {
    if (!isControlled) {
      setInternalValue(tabId);
    }
    onValueChange?.(tabId);
  }

  function focusTabByIndex(index: number) {
    const tab = tabs[index];
    if (!tab) return;
    const btn = tabButtonRefs.current.get(tab.id);
    btn?.focus();
    handleSelect(tab.id);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const { prev, next } = getNavKeys(orientation);

    switch (e.key) {
      case next: {
        e.preventDefault();
        focusTabByIndex(findNextEnabledIndex(tabs, currentIndex, 1));
        break;
      }
      case prev: {
        e.preventDefault();
        focusTabByIndex(findNextEnabledIndex(tabs, currentIndex, -1));
        break;
      }
      case "Home": {
        e.preventDefault();
        focusTabByIndex(findFirstEnabledIndex(tabs));
        break;
      }
      case "End": {
        e.preventDefault();
        focusTabByIndex(findLastEnabledIndex(tabs));
        break;
      }
    }
  }

  const rootCls = getRootClasses(orientation);
  const tablistCls = getTablistClasses(orientation);
  const panelCls = getPanelClasses(orientation);

  return (
    <div className={rootCls}>
      {/* Tab list */}
      <div role="tablist" aria-orientation={orientation} className={tablistCls}>
        {tabs.map((tab: TabItem, index: number) => {
          const isSelected = tab.id === activeId;
          const tabDomId = getTabId(instanceId, tab.id);
          const panelDomId = getPanelId(instanceId, tab.id);
          const isDisabled = tab.disabled ?? false;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabButtonRefs.current.set(tab.id, el);
              }}
              id={tabDomId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelDomId}
              aria-disabled={isDisabled || undefined}
              disabled={isDisabled}
              tabIndex={isSelected ? 0 : -1}
              className={getTabClasses(isSelected, isDisabled, orientation)}
              onClick={() => {
                if (!isDisabled) handleSelect(tab.id);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels — tabIndex={0} required by WAI-ARIA Tabs pattern for keyboard focus entry */}
      {tabs.map((tab: TabItem) => {
        const isSelected = tab.id === activeId;
        const tabDomId = getTabId(instanceId, tab.id);
        const panelDomId = getPanelId(instanceId, tab.id);

        return (
          <div
            key={tab.id}
            id={panelDomId}
            role="tabpanel"
            aria-labelledby={tabDomId}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA Tabs pattern requires tabIndex=0 on tabpanel to allow Tab key entry into panel content
            tabIndex={0}
            hidden={!isSelected}
            className={panelCls}
          >
            {tab.content as React.ReactNode}
          </div>
        );
      })}
    </div>
  );
}

// ─── Public export with Zod guard ─────────────────────────────────────────────

/**
 * Tabs — cross-runtime tab navigation component.
 *
 * Supports controlled (value + onValueChange) and uncontrolled (defaultValue) modes.
 * WCAG-AA: role=tablist/tab/tabpanel, aria-selected, aria-controls, aria-labelledby,
 * roving tabindex, ArrowLeft/Right/Up/Down, Home/End keyboard navigation.
 */
export function Tabs(raw: Record<string, unknown>) {
  try {
    const parsed = validateTabsProps(raw);
    return <TabsInner {...parsed} onValueChange={(raw as TabsProps).onValueChange} />;
  } catch (err) {
    console.error("[Tabs] Invalid props — component will not render.", err);
    return null;
  }
}
