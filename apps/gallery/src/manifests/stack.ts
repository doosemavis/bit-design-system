import { SPACE_STEPS, Stack } from '@bit-ds/react';
import type { Manifest } from './types';

export const stack: Manifest = {
  name: 'Stack',
  slug: 'stack',
  group: 'components',
  component: Stack,
  description: 'Flex layout. gap is a px value on the space scale. Every prop is a data attribute, never a class.',
  controls: [
    { kind: 'select', prop: 'direction', values: ['column', 'row'], default: 'column' },
    { kind: 'select', prop: 'gap', values: SPACE_STEPS.map(String), default: '12', numeric: true },
    { kind: 'select', prop: 'align', values: ['stretch', 'start', 'center', 'end'], default: 'stretch' },
    { kind: 'select', prop: 'justify', values: ['start', 'center', 'end', 'between'], default: 'start' },
    { kind: 'boolean', prop: 'wrap', default: false },
  ],
  children: [
    { component: 'Badge', props: { color: 'primary' }, children: 'One' },
    { component: 'Badge', props: { color: 'success' }, children: 'Two' },
    { component: 'Badge', props: { color: 'danger' }, children: 'Three' },
  ],
  presets: [
    { label: 'Row, centered', state: { direction: 'row', align: 'center', gap: '16' } },
    { label: 'Row, space between', state: { direction: 'row', justify: 'between' } },
  ],
  docs: {
    badges: ['Layout', 'Layout props'],
    usage: {
      do: [
        'Use Stack for the space between things: a column of fields, a row of Buttons.',
        'Pick gap from the space scale: 8 inside a group, 16 to 24 between groups.',
      ],
      dont: [
        "Add margins to the children to space them. That's what gap is for.",
        'Use Stack to pad one element. Use Box.',
      ],
    },
    props: [
      { name: 'direction', type: "'column' | 'row'", default: "'column'", description: 'Which way the children run.' },
      {
        name: 'gap',
        type: '4 | 8 | 12 | 16 | 24 | 32 | 48 | 64',
        default: '12',
        description: 'Space between children in px, from the space scale. Rendered as data-gap; reads --bit-space-{gap}px.',
      },
      {
        name: 'align',
        type: "'stretch' | 'start' | 'center' | 'end'",
        description: 'Cross-axis alignment: left to right in a column, top to bottom in a row. Unset, children stretch.',
      },
      {
        name: 'justify',
        type: "'start' | 'center' | 'end' | 'between'",
        description: 'Main-axis alignment. between pushes the first and last children to the ends.',
      },
      { name: 'wrap', type: 'boolean', default: 'false', description: 'Lets a row wrap onto more lines when it runs out of room.' },
    ],
    a11y: [
      'A Stack is a plain <div> and adds no role; screen readers read the children in source order.',
      'direction="row" never reorders anything, so the Tab order always matches what people see.',
    ],
  },
};
