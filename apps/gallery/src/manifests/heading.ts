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
};
