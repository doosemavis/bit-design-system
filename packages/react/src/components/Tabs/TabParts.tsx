import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { composeRefs } from '../../system/Slot';
import { panelId, tabId, useTabs } from './TabsContext';

export type TabListProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'>;
export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'color'> {
  value: string;
  disabled?: boolean;
}
export interface TabPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  value: string;
}

/** Which way a key moves along the tabs, or undefined. In right-to-left pages the arrows swap. */
function direction(key: string, rtl: boolean): 'next' | 'previous' | 'first' | 'last' | undefined {
  if (key === (rtl ? 'ArrowLeft' : 'ArrowRight')) return 'next';
  if (key === (rtl ? 'ArrowRight' : 'ArrowLeft')) return 'previous';
  if (key === 'Home') return 'first';
  if (key === 'End') return 'last';
  return undefined;
}

/** The row of tabs, and under it the slot the chosen cartridge plugs into. Needs aria-label or aria-labelledby. */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList({ className, onKeyDown, children, ...rest }, ref) {
  const tabs = useTabs('TabList');
  const listRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const setRef = useMemo(() => composeRefs(ref, listRef), [ref]);
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;

  useEffect(() => {
    if (named || process.env.NODE_ENV === 'production') return;
    console.warn('[bit] <TabList> needs aria-label or aria-labelledby, so screen readers can name the tabs.');
  }, [named]);

  const enabledTabs = () => [...listRef.current!.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')];

  // Before paint: with nothing chosen yet, take the first enabled tab; with no enabled chosen tab (an unknown
  // value, or a disabled one), the first enabled tab is the Tab stop.
  useLayoutEffect(() => {
    const first = enabledTabs()[0]?.dataset.value;
    if (tabs.value === undefined && first !== undefined) tabs.adopt(first);
    const chosen = listRef.current!.querySelector('[role="tab"][aria-selected="true"]:not(:disabled)');
    tabs.setStop(chosen ? undefined : first);
  });

  // The slot lights up from under the chosen cartridge: keep its centre in --_bit-tabs-x.
  useLayoutEffect(() => {
    const list = listRef.current!;
    const slot = slotRef.current!;
    const place = () => {
      const chosen = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!chosen) return;
      const box = chosen.getBoundingClientRect();
      slot.style.setProperty('--_bit-tabs-x', `${box.left + box.width / 2 - slot.getBoundingClientRect().left}px`);
    };
    place();
    list.addEventListener('scroll', place);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    observer?.observe(list);
    return () => {
      list.removeEventListener('scroll', place);
      observer?.disconnect();
    };
  }, [tabs.value]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const all = enabledTabs();
    const at = all.indexOf(event.target as HTMLButtonElement);
    // The computed direction, so CSS `direction: rtl` and `dir="auto"` count as well as a dir attribute.
    const way = direction(event.key, getComputedStyle(listRef.current!).direction === 'rtl');
    if (at === -1 || !way) return;
    const index = { next: (at + 1) % all.length, previous: (at - 1 + all.length) % all.length, first: 0, last: all.length - 1 }[way];
    const target = all[index]!;
    event.preventDefault();
    target.focus();
    if (tabs.activation === 'automatic') tabs.choose(target.dataset.value!);
  }

  return (
    <div className={element('tabs', 'bar')}>
      <div ref={setRef} role="tablist" className={withClassName(element('tabs', 'list'), className)} {...rest} onKeyDown={handleKeyDown}>
        {children}
      </div>
      <span ref={slotRef} className={element('tabs', 'slot')} aria-hidden="true" data-boot={tabs.boot || undefined} onAnimationEnd={tabs.endBoot} />
    </div>
  );
});

/** One cartridge. The chosen one is purple and seated in the slot. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab({ value, disabled, className, children, onClick, onKeyDown, ...rest }, ref) {
  const tabs = useTabs('Tab');
  const chosen = tabs.value === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={tabId(tabs.baseId, value)}
      aria-selected={chosen}
      aria-controls={panelId(tabs.baseId, value)}
      tabIndex={chosen || tabs.stop === value ? 0 : -1}
      disabled={disabled}
      data-value={value}
      data-boot={chosen && tabs.boot ? tabs.boot : undefined}
      className={withClassName(element('tabs', 'tab'), className)}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.choose(value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || tabs.activation !== 'manual') return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          tabs.choose(value);
        }
      }}
    >
      <span className={element('tabs', 'label')}>{children}</span>
    </button>
  );
});

/** The content for one tab. Every panel stays mounted; the others are hidden, so their state is kept. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel({ value, className, ...rest }, ref) {
  const tabs = useTabs('TabPanel');
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId(tabs.baseId, value)}
      aria-labelledby={tabId(tabs.baseId, value)}
      tabIndex={0}
      hidden={tabs.value !== value}
      className={withClassName(element('tabs', 'panel'), className)}
      {...rest}
    />
  );
});
