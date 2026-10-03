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
  docs: {
    badges: ['Compound', 'Header, body, footer'],
    usage: {
      do: [
        'Group one topic: a title in CardHeader, the content in CardBody, actions in CardFooter.',
        'Use outline when the Card sits on another surface.',
      ],
      dont: [
        'Nest Cards inside Cards. For spacing inside a Card, use Stack or Box.',
        'Wrap a whole page in a Card.',
      ],
    },
    props: [
      {
        name: 'variant',
        className: 'bit-{variant}',
        type: "'solid' | 'outline'",
        default: "'solid'",
        description: 'solid is a filled surface with a hard shadow; outline is a border only.',
      },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'The parts: CardHeader, CardBody and CardFooter, in that order. Each one is optional.',
      },
    ],
    a11y: [
      'A Card is a plain <div> and adds no role.',
      'CardHeader is styled text. When the title belongs in the page outline, put a Heading inside it.',
      'Actions in CardFooter are ordinary Buttons, in the Tab order where you read them.',
    ],
  },
};
