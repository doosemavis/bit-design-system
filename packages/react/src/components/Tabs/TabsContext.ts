import { createContext, useContext } from 'react';

/** What Tabs tells its parts. Private: not exported from the package. */
export interface TabsContextValue {
  baseId: string;
  /** The chosen value; undefined until a tab is chosen. */
  value: string | undefined;
  activation: 'automatic' | 'manual';
  /** The Tab stop when no tab is chosen (an unknown value): the first enabled tab. */
  stop: string | undefined;
  setStop: (value: string | undefined) => void;
  /** Choose a tab: calls onValueChange when it changes, and updates the own value when uncontrolled. */
  choose: (value: string) => void;
  /** Uncontrolled with nothing chosen yet: take this tab, without calling onValueChange. */
  adopt: (value: string) => void;
  /** '' when idle; 'a' or 'b' while the plug-in animation plays. They alternate so a new choice restarts it. */
  boot: '' | 'a' | 'b';
  endBoot: () => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

/** The surrounding Tabs, or a clear error naming the part that is outside one. */
export function useTabs(partName: string): TabsContextValue {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error(`bit: <${partName}> must be inside <Tabs>.`);
  return tabs;
}

/** An id-safe form of a tab value: whitespace becomes '_'. */
const idPart = (value: string) => value.replace(/\s+/g, '_');
export const tabId = (baseId: string, value: string) => `${baseId}-tab-${idPart(value)}`;
export const panelId = (baseId: string, value: string) => `${baseId}-panel-${idPart(value)}`;
