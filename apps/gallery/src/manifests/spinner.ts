import { COLORS, SIZES, Spinner } from '@bit-ds/react';
import type { Manifest } from './types';

export const spinner: Manifest = {
  name: 'Spinner',
  slug: 'spinner',
  group: 'Components',
  component: Spinner,
  description: 'A loading indicator. The aria-label is required so screen readers announce it.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Loading coins', label: 'aria-label' },
  ],
  presets: [{ label: 'Large neutral', state: { color: 'neutral', size: 'lg' } }],
};
