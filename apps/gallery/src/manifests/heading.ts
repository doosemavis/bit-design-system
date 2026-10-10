import { HEADING_SIZES, Heading } from '@bit-ds/react';
import type { Manifest } from './types';

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  related: ['text'],
  component: Heading,
  description: 'A section title. size is the look, in px, every 2px from 20 to 44, and it picks the tag (h1 to h6) for the page outline.',
  controls: [{ kind: 'select', prop: 'size', values: HEADING_SIZES.map(String), default: '32', numeric: true, alwaysPrint: true }],
  children: 'Build with bit',
  // The sample is a picture of a title, not one of this page's: it stays out of the outline (and its h1 preset
  // never competes with the page's own h1). The code shows the plain Heading.
  sampleProps: { role: 'presentation' },
  presets: [
    { label: 'Page title', state: { size: '40' } },
    { label: 'Card title', state: { size: '26' } },
  ],
  docs: {
    badges: ['size in px', 'size picks h1 to h6'],
    usage: {
      do: [
        'Pick size by where the title sits: 40 and up for the page title (one per page), 32 to 38 for sections, 26 to 30 inside them.',
        'Every size is the display face, so a title looks the same family at any size.',
      ],
      dont: [
        'Jump from a page title straight to 24 or under: that skips tags in the outline (h1, then h4).',
        'Use a bold Text where a heading belongs.',
      ],
    },
    props: [
      {
        name: 'size',
        type: '20 | 22 | 24 | 26 | 28 | 30 | 32 | 34 | 36 | 38 | 40 | 42 | 44',
        default: '32',
        description:
          'The look, in px. Rendered as data-size; reads --bit-heading-{size}px. It picks the tag too: 40 to 44 h1, 32 to 38 h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6. 1 to 6 (a level) is deprecated and will be removed in 0.2.0.',
      },
      {
        name: 'level',
        type: '1 | 2 | 3 | 4 | 5 | 6',
        description: 'Deprecated: use size, which picks the tag. Still renders the old tag and look, with a dev warning. Removed in 0.2.0.',
      },
      { name: 'children', type: 'ReactNode', description: 'The title.' },
    ],
    a11y: [
      'Renders a real <h1> to <h6>; screen-reader users jump between headings to scan a page.',
      'The size picks the tag, so bigger titles always rank higher in the outline than smaller ones.',
    ],
  },
};
