import { Heading } from '@bit-ds/react';
import type { Manifest } from './types';

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const SIZES = ['14', '16', '18', '24', '32', '40'];

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  component: Heading,
  description: 'A section title. as picks the tag (h1–h6) for the page outline; size picks the look, in px, like Text.',
  controls: [
    { kind: 'select', prop: 'as', values: TAGS, default: 'h2', alwaysPrint: true },
    { kind: 'select', prop: 'size', values: SIZES, default: '32', numeric: true, alwaysPrint: true },
  ],
  children: 'Build with bit',
  presets: [
    { label: 'Page title', state: { as: 'h1', size: '40' } },
    { label: 'Small h2', state: { as: 'h2', size: '24' } },
  ],
  docs: {
    badges: ['h1 to h6', 'size in px'],
    usage: {
      do: [
        'Pick as for the outline: one h1 per page, then h2 for sections, h3 inside them.',
        'Pick size for how big it looks, in px. 18 and up use the display face; 16 and 14 the body face in bold.',
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
        type: '14 | 16 | 18 | 24 | 32 | 40',
        description:
          "The look, in px. Rendered as data-size; reads --bit-text-{size}px. Default: the tag's own size (h1 40, h2 32, h3 24, h4 18, h5 16, h6 14). 1 to 6 (a level) is deprecated and will be removed in 0.2.0.",
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
