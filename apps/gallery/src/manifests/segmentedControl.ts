import { COLORS, SIZES, SegmentedControl } from '@bit-ds/react';
import type { Manifest } from './types';

export const segmentedControl: Manifest = {
  name: 'SegmentedControl',
  slug: 'segmentedcontrol',
  group: 'components',
  component: SegmentedControl,
  description: 'Joined segments that pick one option. Real radios underneath: arrow keys move the choice, Tab leaves the group.',
  controls: [
    { kind: 'text', prop: 'legend', default: 'Range', alwaysPrint: true },
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'legendHidden', default: false },
  ],
  fixedProps: {
    options: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
    ],
  },
  presets: [
    { label: 'Success, small', state: { color: 'success', size: 'sm' } },
    { label: 'Hidden legend', state: { legendHidden: true } },
  ],
};
