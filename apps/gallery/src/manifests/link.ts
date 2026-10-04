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
  docs: {
    badges: ['Native <a>', 'asChild for router links'],
    usage: {
      do: [
        'Use a Link to go somewhere: another page, a section, a site.',
        'Write link text that makes sense alone: "Read the install guide", not "click here".',
      ],
      dont: [
        'Use a Link for an action that changes something. Use a Button.',
        'Use color="neutral" for the only link in a paragraph; it hides among the text.',
      ],
    },
    props: [
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral'",
        default: "'primary'",
        description: 'primary reads the link tokens (with a visited color); neutral is body text. Only these two pass contrast in both modes.',
      },
      { name: 'href', type: 'string', description: 'Where it goes.' },
      {
        name: 'asChild',
        type: 'boolean',
        default: 'false',
        description: "Puts Link's classes on its one child, such as your router's link, instead of rendering an <a>.",
      },
      { name: 'children', type: 'ReactNode', description: 'The link text.' },
    ],
    a11y: [
      'A real <a href>, so Enter follows it and screen readers list it with the other links.',
      'Underlined as well as colored, so it reads as a link without relying on color.',
      "Inside a solid Alert, a Link takes the Alert's text colour (white on dark colors, or ink on yellow). On hover, the underline thickens to 4px with no highlight. In dark mode, a Link's hover underline turns yellow, except inside a solid Alert where it stays the Alert's text colour.",
    ],
    emptyChildrenError: 'A Link needs text, or screen readers read out the address instead.',
  },
};
