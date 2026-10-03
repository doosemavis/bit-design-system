import { Link } from '@bit-ds/react';
import type { Manifest } from './types';

export const link: Manifest = {
  name: 'Link',
  slug: 'link',
  group: 'components',
  component: Link,
  description: 'A bold, underlined text link. primary or neutral; asChild lends the look to a router link.',
  controls: [
    { kind: 'axis', prop: 'color', values: ['primary', 'neutral'], default: 'primary' },
    { kind: 'text', prop: 'href', default: 'https://github.com/doosemavis/bit-design-system', alwaysPrint: true },
  ],
  children: 'Read the install guide',
  presets: [{ label: 'Neutral', state: { color: 'neutral' } }],
};
