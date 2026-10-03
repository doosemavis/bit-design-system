import { BitLogo, ERAS, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';

export const bitLogo: Manifest = {
  name: 'BitLogo',
  slug: 'logo',
  group: 'brand',
  component: BitLogo,
  description: 'bit, with "Design System" in two lines to its right. Each page load shows the next era: 8 → 16 → 32 → 64. era pins one.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'select', prop: 'era', values: ['none', ...ERAS.map(String)], default: 'none', numeric: true },
  ],
  presets: [{ label: 'Pinned at 32-bit', state: { era: '32' } }],
};
