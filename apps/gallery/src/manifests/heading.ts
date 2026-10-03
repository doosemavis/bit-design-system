import { Heading } from '@bit-ds/react';
import type { Manifest } from './types';

const LEVELS = ['1', '2', '3', '4', '5', '6'];

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  component: Heading,
  description: 'A section title. level picks the tag (h1–h6) for the page outline; size picks the look, so an h2 can look like an h3.',
  controls: [
    { kind: 'select', prop: 'level', values: LEVELS, default: '2', numeric: true, alwaysPrint: true },
    { kind: 'select', prop: 'size', values: ['none', ...LEVELS], default: 'none', numeric: true },
  ],
  children: 'Build with bit',
  presets: [{ label: 'h2 that looks like h3', state: { level: '2', size: '3' } }],
  docs: {
    badges: ['h1 to h6', 'level ≠ look'],
    usage: {
      do: [
        'Pick level for the outline: one h1 per page, then h2 for sections, h3 inside them.',
        'Use size when a heading should look smaller than its level.',
      ],
      dont: [
        'Skip levels (an h4 straight after the h1) to get a smaller look. Use size.',
        'Use a bold Text where a heading belongs.',
      ],
    },
    props: [
      { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', description: 'Required. Renders <h{level}>, so the page outline stays correct.' },
      {
        name: 'size',
        type: '1 | 2 | 3 | 4 | 5 | 6',
        description: 'The look, when it differs from level. Rendered as data-level; defaults to level.',
      },
      { name: 'children', type: 'ReactNode', description: 'The title.' },
    ],
    a11y: [
      'Renders a real <h1> to <h6>; screen-reader users jump between headings to scan a page.',
      'size changes only the look, so an h2 that looks like an h3 is still announced as level 2.',
    ],
  },
};
