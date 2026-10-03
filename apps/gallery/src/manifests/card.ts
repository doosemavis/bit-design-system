import { Card } from '@bit-ds/react';
import type { Manifest } from './types';

export const card: Manifest = {
  name: 'Card',
  slug: 'card',
  group: 'components',
  component: Card,
  description: 'A surface with header, body, and footer parts. The parts are their own exports.',
  controls: [{ kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'solid' }],
  children: [
    { component: 'CardHeader', children: 'Stats' },
    { component: 'CardBody', children: '3 coins collected' },
    { component: 'CardFooter', children: 'Updated today' },
  ],
  parts: ['CardHeader', 'CardBody', 'CardFooter'],
  presets: [{ label: 'Outline', state: { variant: 'outline' } }],
};
