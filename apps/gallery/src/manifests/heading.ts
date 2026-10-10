import { Heading } from '@bit-ds/react';
import type { Manifest } from './types';

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const SIZES = ['13', '15', '18', '24', '32'];

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  component: Heading,
  description: 'A section title. as picks the tag (h1–h6) for the page outline; size picks the look, in px, like Text.',
  controls: [
    { kind: 'select', prop: 'as', values: TAGS, default: 'h2', alwaysPrint: true },
    { kind: 'select', prop: 'size', values: SIZES, default: '24', numeric: true, alwaysPrint: true },
  ],
  children: 'Build with bit',
  presets: [
    { label: 'Page title', state: { as: 'h1', size: '32' } },
    { label: 'Small h2', state: { as: 'h2', size: '18' } },
  ],
  docs: {
    badges: ['h1 to h6', 'size in px'],
    usage: {
      do: [
        'Pick as for the outline: one h1 per page, then h2 for sections, h3 inside them.',
        'Pick size for how big it looks, in px. 18 and up use the display face; 15 and 13 the body face in bold.',
      ],
      dont: [
        'Skip tags (an h4 straight after the h1) to get a smaller look. Keep the tag and use size.',
        'Use a bold Text where a heading belongs.',
      ],
    },
    props: [
      {
        name: 'as',
        type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
        default: "'h2'",
        description: 'The tag, for the page outline that screen readers, search engines and reader modes use.',
      },
      {
        name: 'size',
        type: '13 | 15 | 18 | 24 | 32',
        description:
          "The look, in px. Rendered as data-size; reads --bit-text-{size}px. Default: the tag's own size (h1 32, h2 24, h3 18, h4 15, h5 and h6 13). 1 to 6 (a level) is deprecated and will be removed in 0.2.0.",
      },
      {
        name: 'level',
        type: '1 | 2 | 3 | 4 | 5 | 6',
        description: 'Deprecated: use as="h{level}". Still renders the old look, with a dev warning. Removed in 0.2.0.',
      },
      { name: 'children', type: 'ReactNode', description: 'The title.' },
    ],
    a11y: [
      'Renders a real <h1> to <h6>; screen-reader users jump between headings to scan a page.',
      'size changes only the look, so an h2 at 18px is still announced as heading level 2.',
    ],
  },
};
