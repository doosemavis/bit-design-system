import { TEXT_SIZES, Text } from '@bit-ds/react';
import type { Manifest } from './types';

export const text: Manifest = {
  name: 'Text',
  slug: 'text',
  group: 'Components',
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
};
