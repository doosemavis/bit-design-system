import { SIZES, Select } from '@bit-ds/react';
import type { Manifest } from './types';

export const select: Manifest = {
  name: 'Select',
  slug: 'select',
  group: 'forms',
  component: Select,
  description: 'The browser’s own select, styled like Input. The option list stays native, so every keyboard and screen reader works.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Color', label: 'aria-label' },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: [
    { component: 'option', props: { value: 'primary' }, children: 'primary' },
    { component: 'option', props: { value: 'success' }, children: 'success' },
    { component: 'option', props: { value: 'danger' }, children: 'danger' },
  ],
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
  docs: {
    badges: ['Native <select>', 'Native options list'],
    usage: {
      do: [
        'Use Select to pick one of five or more options. Put it in a Field for a visible label.',
        'Use SegmentedControl instead when there are two to four options and all should show.',
      ],
      dont: [
        'Use a Select for yes or no. Use a Switch.',
        'Use a Select to navigate to another page.',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height. The class goes on the wrapper.' },
      {
        name: 'aria-label',
        type: 'string',
        description: "Names the select when there's no visible label. Inside a Field, leave it off.",
      },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks the choice wrong: aria-invalid="true" and a danger border.',
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'The native disabled attribute.' },
      { name: 'children', type: 'ReactNode', description: 'The <option> elements.' },
    ],
    a11y: [
      "The browser's own <select> and options list, so every keyboard and screen reader already knows it.",
      "Inside a Field it takes the Field's id, hint and error.",
    ],
  },
};
