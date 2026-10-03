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
      values: ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'span'],
      default: 'div',
    },
  ],
  children: [{ component: 'Badge', props: { color: 'primary' }, children: 'Inside the box' }],
  presets: [
    { label: 'Banner: wide and short', state: { padding: 'none', paddingX: '24', paddingY: '8' } },
    { label: 'Y beats padding', state: { paddingY: '0' } },
    { label: 'Pushed down', state: { marginTop: '32' } },
  ],
};
