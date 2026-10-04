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
  docs: {
    badges: ['Static <span>', 'Pill or square'],
    usage: {
      do: [
        'Use a Badge for a short status or a count: "New", "Beta", "3".',
        'Pick the color for its meaning: success for done, warning for waiting, danger for failed.',
      ],
      dont: [
        "Make a Badge clickable. It's a <span>; use a Button or a Link for actions.",
        'Put a sentence in a Badge. One or two words.',
      ],
    },
    props: [
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'neutral'",
        description: 'The color role.',
      },
      {
        name: 'variant',
        className: 'bit-{variant}',
        type: "'solid' | 'outline'",
        default: "'solid'",
        description: "solid fills with the color; outline sits on the surface with a color border and a color shadow.",
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Text size and padding.' },
      {
        name: 'shape',
        type: "'pill' | 'square'",
        default: "'pill'",
        description: "pill is fully rounded; square uses the 6px radius. Rendered as data-shape, because shape isn't a shared axis.",
      },
      { name: 'children', type: 'ReactNode', description: 'The label.' },
    ],
    a11y: [
      'A Badge is plain text in a <span>, read inline with the text around it.',
      "Color alone doesn't reach everyone, so say it in the words too: \"Failed\", not just red.",
    ],
  },
};
