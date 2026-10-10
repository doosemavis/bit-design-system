import { COLORS, SIZES, Spinner } from '@bit-ds/react';
import type { Manifest } from './types';

export const spinner: Manifest = {
  name: 'Spinner',
  slug: 'spinner',
  group: 'components',
  related: ['button'],
  component: Spinner,
  description: 'A loading indicator. The aria-label is required so screen readers announce it.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Loading coins', label: 'aria-label' },
  ],
  presets: [{ label: 'Large neutral', state: { color: 'neutral', size: 'lg' } }],
  docs: {
    badges: ['role="status"', 'aria-label required'],
    usage: {
      do: [
        "Show a Spinner when something takes more than a moment and you can't say how long.",
        'Say what is loading in its aria-label: "Loading coins".',
      ],
      dont: [
        'Show a Spinner for a wait under 300ms; it only flashes.',
        "Put a Spinner inside a Button. Use the Button's loading prop.",
      ],
    },
    props: [
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'primary'",
        description: 'The color role.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Diameter.' },
      { name: 'aria-label', type: 'string', description: 'Required. What screen readers announce, such as "Loading coins".' },
    ],
    a11y: [
      'role="status" and the required aria-label, so screen readers announce what is loading.',
      'The spin stops for people who ask their system to reduce motion.',
    ],
  },
};
