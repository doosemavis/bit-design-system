import { TEXT_SIZES, Text } from '@bit-ds/react';
import type { Manifest } from './types';

export const text: Manifest = {
  name: 'Text',
  slug: 'text',
  group: 'components',
  component: Text,
  description: 'Typography. The element comes from `as`; the look comes from `size`, in px.',
  controls: [
    { kind: 'select', prop: 'as', values: ['p', 'span', 'div', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], default: 'p' },
    { kind: 'select', prop: 'size', values: TEXT_SIZES.map(String), default: '15', numeric: true },
    { kind: 'select', prop: 'color', values: ['default', 'neutral'], default: 'default', label: 'color' },
    { kind: 'select', prop: 'weight', values: ['normal', 'bold'], default: 'normal' },
  ],
  children: 'The quick brown fox jumps over the lazy dog.',
  presets: [
    { label: 'Display heading', state: { as: 'h2', size: '32' } },
    { label: 'Muted caption', state: { size: '13', color: 'neutral' } },
  ],
  docs: {
    badges: ['Typography', 'size in px'],
    usage: {
      do: [
        'Use Text for body copy, labels and captions; pick the look with size.',
        'Use color="neutral" for hints and captions that should step back.',
      ],
      dont: [
        'Use Text as="h2" for a section title. Use Heading, which requires a level.',
        'Use size to make body text tiny; 13 is the smallest for reading.',
      ],
    },
    props: [
      {
        name: 'as',
        type: "'p' | 'span' | 'div' | 'label' | 'h1' | … | 'h6'",
        default: "'p'",
        description: 'Which element to render. The look comes from size, not from the tag.',
      },
      {
        name: 'size',
        type: '11 | 13 | 15 | 18 | 24 | 32',
        default: '15',
        description: 'Text size in px, from the type scale. Rendered as data-size; reads --bit-text-{size}px. 24 and 32 use the display face.',
      },
      { name: 'color', type: "'neutral'", description: 'neutral renders muted text. Leave it off for the normal text color.' },
      {
        name: 'weight',
        type: "'normal' | 'bold'",
        default: "'normal'",
        description: 'Rendered as data-weight. No effect at 24 and 32, where the display face has one weight.',
      },
      { name: 'children', type: 'ReactNode', description: 'The text.' },
    ],
    a11y: [
      'Text renders the element you choose, so as="p" is a paragraph to screen readers.',
      'A big Text is still not a heading. Screen-reader users move through a page by its headings, so titles need Heading.',
    ],
  },
};
