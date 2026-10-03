import { Button, COLORS, SIZES, VARIANTS } from '@bit-ds/react';
import type { Manifest } from './types';

export const button: Manifest = {
  name: 'Button',
  slug: 'button',
  group: 'components',
  component: Button,
  description: 'The primary action. Three axes, two booleans, and asChild for links.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'variant', values: VARIANTS, default: 'solid' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'loading', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: 'Save',
  presets: [
    { label: 'Danger outline', state: { color: 'danger', variant: 'outline' } },
    { label: 'Ghost small', state: { variant: 'ghost', size: 'sm' } },
    { label: 'Loading', state: { loading: true } },
  ],
};
