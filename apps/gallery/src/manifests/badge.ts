import { Badge, COLORS } from '@bit-ds/react';
import type { Manifest } from './types';

export const badge: Manifest = {
  name: 'Badge',
  slug: 'badge',
  group: 'components',
  component: Badge,
  description: 'A small label. Solid or outline, two sizes, pill or square.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'solid' },
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'select', prop: 'shape', values: ['pill', 'square'], default: 'pill' },
  ],
  children: 'New',
  presets: [
    { label: 'Success', state: { color: 'success' } },
    { label: 'Warning outline', state: { color: 'warning', variant: 'outline' } },
    { label: 'Square tag', state: { shape: 'square', variant: 'outline' } },
  ],
};
