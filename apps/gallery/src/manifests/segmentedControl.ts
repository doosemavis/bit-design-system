import { COLORS, SIZES, SegmentedControl } from '@bit-ds/react';
import type { Manifest } from './types';

const SEGMENTS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

export const segmentedControl: Manifest = {
  name: 'SegmentedControl',
  slug: 'segmentedcontrol',
  group: 'components',
  related: ['tabs', 'select', 'switch'],
  component: SegmentedControl,
  description: 'Joined segments that pick one option, or several with multiple.',
  controls: [
    { kind: 'text', prop: 'legend', default: 'Range', alwaysPrint: true },
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'legendHidden', default: false },
    { kind: 'select', prop: 'segments', label: 'segments', values: ['2', '3', '4', '5'], default: '3', virtual: true },
    { kind: 'boolean', prop: 'multiple', default: false },
  ],
  deriveProps: (state) => ({ options: SEGMENTS.slice(0, Number(state.segments)) }),
  presets: [
    { label: 'Success, small', state: { color: 'success', size: 'sm' } },
    { label: 'Hidden legend', state: { legendHidden: true } },
    { label: 'Multi-select', state: { multiple: true, segments: '4' } },
  ],
  docs: {
    badges: ['Native radios', 'Arrow keys', 'Native checkboxes (multiple)'],
    usage: {
      do: [
        'Use SegmentedControl to pick one of two to four options that should all be visible.',
        'Give it a legend that names the choice; hide it with legendHidden when the context says it.',
        'Use multiple for filters where any mix of options, or none, is valid.',
      ],
      dont: [
        'Use it for five or more options. Use a Select.',
        'Use it for on and off. Use a Switch.',
        'Use multiple when exactly one answer is required. Leave it off.',
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
      {
        name: 'multiple',
        type: 'boolean',
        default: 'false',
        description: 'Lets several segments be chosen. Each becomes a native checkbox, and nothing is chosen by default.',
      },
      { name: 'options', type: 'readonly { value: string; label: ReactNode; disabled?: boolean }[]', description: 'Required. The choices, in order.' },
      {
        name: 'value',
        type: 'string | readonly string[]',
        description: 'The chosen value (a string[] with multiple), when the parent owns it. Use with onValueChange, or use defaultValue.',
      },
      {
        name: 'onValueChange',
        type: '((value: string) => void) | ((value: string[]) => void)',
        description: 'Called with the new value when the choice changes. With multiple, it gets the array of chosen values.',
      },
      {
        name: 'defaultValue',
        type: 'string | readonly string[]',
        description: 'The first chosen value (a string[] with multiple), when the control owns it. Unset, the first option starts chosen; with multiple, nothing does.',
      },
      {
        name: 'name',
        type: 'string',
        description: 'The name the inputs share (the radios, or the checkboxes with multiple), for form submits. Unset, a unique one is generated.',
      },
    ],
    a11y: [
      'Native radios in a fieldset (a native group box that screen readers announce with its legend), so Tab enters and leaves the group in one stop and the arrow keys move the choice.',
      'With multiple, each segment is a native checkbox: Tab moves between segments and Space toggles one.',
      'The legend names the group for screen readers, even when legendHidden hides it from sight.',
    ],
  },
};
