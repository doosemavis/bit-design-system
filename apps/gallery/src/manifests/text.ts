import { TEXT_SIZES, Text } from '@bit-ds/react';
import type { Manifest } from './types';

export const text: Manifest = {
  name: 'Text',
  slug: 'text',
  group: 'Components',
  component: Text,
  description: 'Typography. The element comes from `as`; the look comes from `size`.',
  controls: [
    { kind: 'select', prop: 'as', values: ['p', 'span', 'div', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], default: 'p' },
    { kind: 'axis', prop: 'size', values: TEXT_SIZES, default: 'md' },
    { kind: 'select', prop: 'color', values: ['default', 'neutral'], default: 'default', label: 'color' },
    { kind: 'select', prop: 'weight', values: ['normal', 'bold'], default: 'normal' },
  ],
  children: 'The quick brown fox jumps over the lazy dog.',
  presets: [
    { label: 'Display heading', state: { as: 'h2', size: '2xl' } },
    { label: 'Muted caption', state: { size: 'sm', color: 'neutral' } },
  ],
};
