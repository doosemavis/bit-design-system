import { BitLogo, ERAS, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';

export const bitLogo: Manifest = {
  name: 'BitLogo',
  slug: 'logo',
  group: 'brand',
  component: BitLogo,
  description: '#-bit. The number cycles 8 → 16 → 32 → 64, each in its era\'s type style. freeze pins one era.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'number', prop: 'interval', default: 5, min: 1, max: 30, step: 1 },
    { kind: 'boolean', prop: 'animated', default: true },
    { kind: 'select', prop: 'freeze', values: ['none', ...ERAS.map(String)], default: 'none', numeric: true },
  ],
  presets: [
    { label: 'Pinned at 32', state: { freeze: '32' } },
    { label: 'Static', state: { animated: false } },
  ],
};
