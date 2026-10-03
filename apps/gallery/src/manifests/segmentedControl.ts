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
  docs: {
    badges: ['Native radios', 'Arrow keys'],
    usage: {
      do: [
        'Use SegmentedControl to pick one of two to four options that should all be visible.',
        'Give it a legend that names the choice; hide it with legendHidden when the context says it.',
      ],
      dont: [
        'Use it for five or more options. Use a Select.',
        'Use it for on and off. Use a Switch.',
      ],
    },
    props: [
      { name: 'legend', type: 'ReactNode', description: 'Required. Names the group; read by screen readers even when hidden.' },
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'primary'",
        description: 'The fill of the chosen option.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Segment height.' },
      { name: 'legendHidden', type: 'boolean', default: 'false', description: 'Hides the legend from sight. It is still read.' },
      { name: 'options', type: 'readonly { value: string; label: ReactNode; disabled?: boolean }[]', description: 'Required. The choices, in order.' },
      {
        name: 'value',
        type: 'string',
        description: 'The chosen value, when the parent owns it. Use with onValueChange, or use defaultValue.',
      },
      { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new value when the choice changes.' },
    ],
    a11y: [
      'Native radios in a fieldset, so Tab enters and leaves the group in one stop and the arrow keys move the choice.',
      'The legend names the group for screen readers, even when legendHidden hides it from sight.',
    ],
  },
};
