import { describe, expect, it } from 'vitest';
import { tabs, tabCount } from './tabs';
import { defaultState } from '../engine/state';
import { childSpecs } from '../engine/childSpecs';
import { toJsx } from '../code/toJsx';

describe('Tabs page', () => {
  it('builds 2 to 5 tabs from the tabs control, clamped, with 3 by default', () => {
    const count = (raw: string) => {
      const [list] = childSpecs(tabs, { tabCount: raw })!;
      return (list!.children as readonly unknown[]).length;
    };
    expect(count('3')).toBe(3);
    expect(count('2')).toBe(2);
    expect(count('5')).toBe(5);
    expect(count('1')).toBe(2);
    expect(count('9')).toBe(5);
    expect(count('')).toBe(3);
    expect(tabCount(undefined)).toBe(3);
  });

  it('prints Tabs with defaultValue, a named TabList, the Tabs and the panels', () => {
    expect(toJsx(tabs, defaultState(tabs))).toBe(
      [
        "import { Tab, TabList, TabPanel, Tabs } from '@bit-ds/react';",
        [
          '<Tabs defaultValue="overview">',
          '  <TabList aria-label="Component docs">',
          '    <Tab value="overview">Overview</Tab>',
          '    <Tab value="usage">Usage</Tab>',
          '    <Tab value="props">Props</Tab>',
          '  </TabList>',
          '  <TabPanel value="overview">What the component is for, in a sentence or two.</TabPanel>',
          '  <TabPanel value="usage">When to reach for it, and when not to.</TabPanel>',
          '  <TabPanel value="props">Every prop, its type and its default.</TabPanel>',
          '</Tabs>',
        ].join('\n'),
      ].join('\n\n'),
    );
  });

  it('manual activation prints; the disabled-tab switch disables the last tab', () => {
    const code = toJsx(tabs, { ...defaultState(tabs), activation: 'manual', disabledTab: true });
    expect(code).toContain('<Tabs activation="manual" defaultValue="overview">');
    expect(code).toContain('<Tab value="props" disabled={true}>Props</Tab>');
  });
});
