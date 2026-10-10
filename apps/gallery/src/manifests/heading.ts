import { Heading } from '@bit-ds/react';
import type { Manifest } from './types';

const LEVELS = ['1', '2', '3', '4', '5', '6'];
const SIZES = ['13', '15', '18', '24', '32'];

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  component: Heading,
  description: 'A section title. level picks the tag (h1–h6) for the page outline and the face; size sets the px size, so an h2 can be 18px.',
  controls: [
    { kind: 'select', prop: 'level', values: LEVELS, default: '2', numeric: true, alwaysPrint: true },
    { kind: 'select', prop: 'size', values: ['none', ...SIZES], default: 'none', numeric: true },
  ],
  children: 'Build with bit',
  presets: [{ label: 'h2 at 18px', state: { level: '2', size: '18' } }],
  docs: {
    badges: ['h1 to h6', 'size in px'],
    usage: {
      do: [
        'Pick level for the outline: one h1 per page, then h2 for sections, h3 inside them.',
        'Use size (in px) when a heading should be smaller than its level: size={18}.',
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
        type: '13 | 15 | 18 | 24 | 32',
        description:
          "The px size, when it differs from the level's own. Rendered as data-size; changes only the size, the face stays the level's. 1 to 6 (a level) is deprecated and will be removed in 0.2.0.",
      },
      { name: 'children', type: 'ReactNode', description: 'The title.' },
    ],
    a11y: [
      'Renders a real <h1> to <h6>; screen-reader users jump between headings to scan a page.',
      'size changes only the px size, so an h2 at 18px is still announced as level 2.',
    ],
  },
};
