import { Code } from '@bit-ds/react';
import type { Manifest } from './types';

export const code: Manifest = {
  name: 'Code',
  slug: 'code',
  group: 'components',
  component: Code,
  description: 'Inline code: a small mono chip inside running text. The border follows the mode accent.',
  controls: [],
  children: 'color="danger"',
};
