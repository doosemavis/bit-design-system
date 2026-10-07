import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { toClasses } from '../../system/toClasses';
import { TabsContext } from './TabsContext';
import type { TabsContextValue } from './TabsContext';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'color'> {
  /** The chosen tab's value, when the parent owns it. */
  value?: string;
  /** The first chosen tab, when Tabs owns it. Default: the first enabled tab. */
  defaultValue?: string;
  /** Called with the new value when a different tab is chosen. */
  onValueChange?: (value: string) => void;
  /** `automatic` (default): moving focus with the arrows chooses. `manual`: Enter or Space chooses. */
  activation?: 'automatic' | 'manual';
  /** One TabList, then the TabPanels. */
  children: ReactNode;
}

/** How long the plug-in animation may run before data-boot clears anyway (reduced motion fires no animationend). */
const BOOT_FALLBACK_MS = 900;

/** Tabs (the WAI-ARIA tabs pattern) with bit's plugged-in cartridges. Compose with TabList, Tab and TabPanel. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, activation = 'automatic', className, children, ...rest },
  ref,
) {
  const baseId = useId();
  const [own, setOwn] = useState(defaultValue);
  const [stop, setStop] = useState<string | undefined>(undefined);
  const [boot, setBoot] = useState<'' | 'a' | 'b'>('');
  const current = value ?? own;

  // Every change after the first chosen value plays the plug-in animation, controlled or not.
  const previous = useRef(current);
  useEffect(() => {
    const before = previous.current;
    previous.current = current;
    if (before !== undefined && before !== current) setBoot((b) => (b === 'a' ? 'b' : 'a'));
  }, [current]);

  useEffect(() => {
    if (!boot) return undefined;
    const timer = setTimeout(() => setBoot(''), BOOT_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [boot]);

  const choose = useCallback(
    (next: string) => {
      if (next === current) return;
      if (value === undefined) setOwn(next);
      onValueChange?.(next);
    },
    [current, value, onValueChange],
  );
  // Only called while nothing is chosen, so Tabs is uncontrolled here (a controlled value is never undefined then).
  const adopt = useCallback((first: string) => setOwn((chosen) => chosen ?? first), []);
  const endBoot = useCallback(() => setBoot(''), []);

  const context = useMemo<TabsContextValue>(
    () => ({ baseId, value: current, activation, stop, setStop, choose, adopt, boot, endBoot }),
    [baseId, current, activation, stop, choose, adopt, boot, endBoot],
  );

  return (
    <TabsContext.Provider value={context}>
      <div ref={ref} className={toClasses('tabs', [], className)} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
