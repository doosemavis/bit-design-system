import { Box, SPACE_STEPS } from '@bit-ds/react';
import type { Manifest } from './types';

/** none leaves the prop off; 0 sets 0. */
const SPACES = ['none', '0', ...SPACE_STEPS.map(String)];

export const box: Manifest = {
  name: 'Box',
  slug: 'box',
  group: 'components',
  component: Box,
  description:
    'Padding and margin on the space scale, for one element. When props overlap, the most specific wins: a side beats an axis beats all four. The gallery draws the dashed outline, so you can see the space.',
  controls: [
    { kind: 'select', prop: 'padding', values: SPACES, default: '16', numeric: true, alwaysPrint: true },
    { kind: 'select', prop: 'paddingX', values: SPACES, default: 'none', numeric: true },
    { kind: 'select', prop: 'paddingY', values: SPACES, default: 'none', numeric: true },
    { kind: 'select', prop: 'margin', values: SPACES, default: 'none', numeric: true },
    { kind: 'select', prop: 'marginTop', values: SPACES, default: 'none', numeric: true },
    {
      kind: 'select',
      prop: 'as',
      values: ['div', 'section', 'article', 'header', 'footer', 'nav', 'span'],
      default: 'div',
    },
  ],
  children: [{ component: 'Badge', props: { color: 'primary' }, children: 'Inside the box' }],
  presets: [
    { label: 'Banner: wide and short', state: { padding: 'none', paddingX: '24', paddingY: '8' } },
    { label: 'Y beats padding', state: { paddingY: '0' } },
    { label: 'Pushed down', state: { marginTop: '32' } },
  ],
  docs: {
    badges: ['Layout', 'Most specific wins'],
    usage: {
      do: [
        'Use Box to pad or offset one element on the space scale.',
        'Use the most specific prop you mean: paddingX={24} for the sides, not padding plus overrides.',
      ],
      dont: [
        'Use Box for the space between siblings. Use Stack and its gap.',
        'Expect vertical margin on as="span": a span is inline, so marginTop does nothing to it.',
      ],
    },
    props: [
      {
        name: 'padding',
        type: '0 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64',
        description: 'All four sides. The same scale goes for paddingTop, paddingRight, paddingBottom and paddingLeft.',
      },
      { name: 'paddingX', type: '0 | 4 | … | 64', description: 'Left and right. Beats padding.' },
      { name: 'paddingY', type: '0 | 4 | … | 64', description: 'Top and bottom. Beats padding; a single side beats it.' },
      {
        name: 'margin',
        type: '0 | 4 | … | 64',
        description: 'All four sides, outside the border. marginX, marginY and the four sides work like padding.',
      },
      { name: 'marginTop', type: '0 | 4 | … | 64', description: 'Space above. Beats marginY and margin.' },
      {
        name: 'as',
        type: "'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav' | 'span'",
        default: "'div'",
        description: 'Which element to render. span is inline, so vertical margins do nothing on it.',
      },
    ],
    a11y: [
      'A Box is the element you pick with as, and adds no role of its own.',
      'as="nav" or as="section" changes what screen readers announce, so pick it for meaning, not looks.',
    ],
  },
};
