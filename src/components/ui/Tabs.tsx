import React, { KeyboardEvent, ReactNode, useRef } from 'react';

export interface TabItem {
  key: string;
  label: ReactNode;
  content: ReactNode;
  /** Renders a small dot on the tab (a server error attributed to this tab). */
  hasError?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Prefixes the generated `id`s so two `<Tabs>` on one page never collide. */
  idPrefix: string;
  errorLabel?: string;
}

/**
 * Accessible tabs (WAI-ARIA Tabs pattern): `tablist`/`tab`/`tabpanel` roles,
 * `aria-selected`, roving `tabIndex`, and Left/Right/Home/End move focus AND
 * selection together (the "automatic activation" variant, matching a click).
 */
const Tabs: React.FC<TabsProps> = ({ tabs, activeKey, onChange, idPrefix, errorLabel }) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    onChange(tab.key);
    tabRefs.current[tab.key]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-secondary-200">
        {tabs.map((tabItem, index) => {
          const selected = tabItem.key === activeKey;
          return (
            <button
              key={tabItem.key}
              ref={(el) => {
                tabRefs.current[tabItem.key] = el;
              }}
              role="tab"
              type="button"
              id={`${idPrefix}-tab-${tabItem.key}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel-${tabItem.key}`}
              aria-describedby={tabItem.hasError ? `${idPrefix}-tab-${tabItem.key}-error` : undefined}
              title={tabItem.hasError ? errorLabel : undefined}
              tabIndex={selected ? 0 : -1}
              className={`relative px-3 py-2 text-sm ${
                selected
                  ? 'border-b-2 border-primary-600 font-medium text-primary-700'
                  : 'text-secondary-500'
              }`}
              onClick={() => onChange(tabItem.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tabItem.label}
              {tabItem.hasError && (
                <>
                  <span
                    className="absolute right-0 top-1 h-2 w-2 rounded-full bg-red-500"
                    aria-hidden="true"
                  />
                  <span id={`${idPrefix}-tab-${tabItem.key}-error`} hidden>
                    {errorLabel}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tabItem) => (
        <div
          key={tabItem.key}
          role="tabpanel"
          id={`${idPrefix}-panel-${tabItem.key}`}
          aria-labelledby={`${idPrefix}-tab-${tabItem.key}`}
          hidden={tabItem.key !== activeKey}
        >
          {tabItem.key === activeKey && tabItem.content}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
