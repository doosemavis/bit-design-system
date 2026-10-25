import { createElement } from 'react';
import { Box, HEADING_SIZES, Heading, Stack, Text } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

const BORDER = { border: '2px solid var(--bit-color-text)' };

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  related: ['text'],
  component: Heading,
  description:
    'A title for a page or a section. Pick a size from 20 to 44px; the size picks the tag too, h1 to h6, so the page outline follows the look.',
  controls: [{ kind: 'select', prop: 'size', values: HEADING_SIZES.map(String), default: '32', numeric: true, alwaysPrint: true }],
  children: 'Build with bit',
  // The sample is a picture of a title, not one of this page's: it stays out of the outline (and its h1 preset
  // never competes with the page's own h1). The code shows the plain Heading.
  sampleProps: { role: 'presentation' },
  presets: [
    { label: 'Page title', state: { size: '40' } },
    { label: 'Card title', state: { size: '26' } },
  ],
  anatomy: {
    parts: [
      {
        label: 'Color',
        selector: '.bit-heading',
        tokens: ['--bit-color-text'],
        side: 'right',
        touch: { kind: 'text', edge: 'bottom', at: 0.7 },
        off: { '--bit-color-text': 'transparent' },
      },
      {
        label: 'Face',
        selector: '.bit-heading',
        tokens: ['--bit-font-display'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.3 },
      },
      {
        label: 'Size',
        selector: '.bit-heading',
        tokens: ['--bit-heading-32px'],
        side: 'left',
        touch: { kind: 'bracket', edge: 'left' },
      },
      {
        label: 'Line height',
        selector: '.bit-heading',
        tokens: ['--bit-leading-tight'],
        side: 'right',
        touch: { kind: 'bracket', edge: 'right' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Page title', state: { size: '40' } },
      { label: 'Card title', state: { size: '26' } },
    ],
    scene: {
      caption: 'In use: the top of an article',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: BORDER },
          createElement(
            Stack,
            { gap: 12 },
            createElement(ScenePiece, null, createElement(Text, { color: 'neutral' }, 'Guides, 6 min read')),
            instance,
            createElement(ScenePiece, null, createElement(Text, { size: 18, color: 'neutral' }, 'Start from one color, then let every component follow it.')),
          ),
        ),
    },
  },
  docs: {
    badges: ['Every 2px from 20 to 44', 'Display face'],
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
