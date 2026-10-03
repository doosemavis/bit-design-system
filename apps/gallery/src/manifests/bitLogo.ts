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
  docs: {
    badges: ['role="img"', 'Four eras'],
    usage: {
      do: [
        'Use the logo once per page, in the header or as the home page title.',
        'Pin an era with era when a screenshot or a print must look the same every time.',
      ],
      dont: [
        "Recolor or stretch it. Each era's colors and proportions are part of the mark.",
        'Use it as decoration beside the name "bit"; it already says "bit Design System".',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Overall size.' },
      {
        name: 'era',
        type: '8 | 16 | 32 | 64',
        description: 'Pin one era. Leave it off and each page load shows the next: 8 → 16 → 32 → 64.',
      },
    ],
    a11y: [
      'role="img" with the name "bit Design System"; the letters inside are hidden from screen readers.',
      'Inside a link, the link takes that name too. To add context such as "gallery home", put aria-label on the link.',
      'Nothing moves on screen: the era changes only between page loads, so there is no animation to pause.',
    ],
  },
};
