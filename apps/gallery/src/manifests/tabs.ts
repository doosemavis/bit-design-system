import { Tabs } from '@bit-ds/react';
import type { ChildSpec, ControlState, ControlValue, Manifest } from './types';

/** The playground's tabs: the first N of these, with one line of panel text each. */
const TABS = [
  { value: 'overview', label: 'Overview', panel: 'What the component is for, in a sentence or two.' },
  { value: 'usage', label: 'Usage', panel: 'When to reach for it, and when not to.' },
  { value: 'props', label: 'Props', panel: 'Every prop, its type and its default.' },
  { value: 'accessibility', label: 'Accessibility', panel: 'What it does for keyboard and screen-reader users.' },
  { value: 'examples', label: 'Examples', panel: 'Copyable code for common cases.' },
] as const;
const TAB_COUNT = { min: 2, max: TABS.length, default: 3 } as const;

/** How many tabs to show: floored and clamped to 2–5, or 3 when the field isn't a number. */
export function tabCount(raw: ControlValue | undefined): number {
  const n = Math.floor(Number(raw));
  if (raw === undefined || String(raw).trim() === '' || !Number.isFinite(n)) return TAB_COUNT.default;
  return Math.min(TAB_COUNT.max, Math.max(TAB_COUNT.min, n));
}

function parts(state: ControlState): readonly ChildSpec[] {
  const shown = TABS.slice(0, tabCount(state.tabCount));
  const last = shown.length - 1;
  return [
    {
      component: 'TabList',
      props: { 'aria-label': 'Component docs' },
      children: shown.map((tab, index): ChildSpec => ({
        component: 'Tab',
        props: state.disabledTab === true && index === last ? { value: tab.value, disabled: true } : { value: tab.value },
        children: tab.label,
      })),
    },
    ...shown.map((tab) => ({ component: 'TabPanel', props: { value: tab.value }, children: tab.panel })),
  ];
}

export const tabs: Manifest = {
  name: 'Tabs',
  slug: 'tabs',
  group: 'components',
  component: Tabs,
  description: 'Tabs that plug in like game cartridges: choose one and it seats into the slot, powers up, and shows its panel.',
  controls: [
    { kind: 'number', prop: 'tabCount', label: 'tabs', default: TAB_COUNT.default, min: TAB_COUNT.min, max: TAB_COUNT.max, step: 1, virtual: true },
    { kind: 'select', prop: 'activation', values: ['automatic', 'manual'], default: 'automatic' },
    { kind: 'boolean', prop: 'disabledTab', label: 'disabled tab', default: false, virtual: true },
  ],
  fixedProps: { defaultValue: 'overview' },
  deriveChildren: parts,
  parts: ['TabList', 'Tab', 'TabPanel'],
  presets: [
    { label: 'Five tabs', state: { tabCount: '5' } },
    { label: 'Manual', state: { activation: 'manual' } },
  ],
  interactive: true,
  docs: {
    badges: ['WAI-ARIA tabs', 'Arrow keys', 'Plug-in animation'],
    usage: {
      do: [
        "Use Tabs to switch between views of the same thing, like a component's overview, usage and props.",
        'Keep tab names short: one or two words.',
        'Give TabList an aria-label (or aria-labelledby) that says what the tabs are about.',
      ],
      dont: ['Use Tabs to step through a sequence (a checkout). Use separate pages.', 'Use Tabs to pick a value for a form. Use SegmentedControl.'],
    },
    props: [
      { name: 'defaultValue', type: 'string', description: 'The first chosen tab, when Tabs owns it. Unset, the first enabled tab.' },
      { name: 'value', type: 'string', description: 'The chosen tab, when the parent owns it. Use with onValueChange.' },
      { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new value when a different tab is chosen.' },
      {
        name: 'activation',
        type: "'automatic' | 'manual'",
        default: "'automatic'",
        description: 'automatic: moving focus with the arrows chooses the tab. manual: Enter or Space chooses it, for panels that are slow to show.',
      },
    ],
    a11y: [
      'The WAI-ARIA tabs pattern: a tablist of tabs, each controlling a tabpanel that it labels. Every TabPanel names its Tab by value, and the others stay mounted but hidden.',
      'Only the chosen tab is in the Tab order. The left and right arrows move between tabs (wrapping), Home and End jump to the first and last; in a right-to-left page the arrows swap.',
      'With automatic activation, moving to a tab shows its panel; with manual, Enter or Space does. Disabled tabs are skipped and cannot be chosen.',
      'Tab moves from the tabs into the panel, which is focusable so its content can be scrolled from the keyboard.',
      'The focus ring is drawn inside the tab, because the cartridge shape would cut it off outside.',
      'The plug-in animation is visual only: the panel changes at once, and with reduced motion turned on nothing animates.',
      'In forced-colors mode, the chosen tab and the slot fill with the system highlight color.',
    ],
  },
};
