import { Table } from '@bit-ds/react';
import type { ChildSpec, Manifest } from './types';

/** One body row: a prop name, its type and its default. */
function row(prop: string, type: string, defaultValue: string): ChildSpec {
  return {
    component: 'TableRow',
    children: [
      { component: 'TableCell', children: prop },
      { component: 'TableCell', children: type },
      { component: 'TableCell', children: defaultValue },
    ],
  };
}

export const table: Manifest = {
  name: 'Table',
  slug: 'table',
  group: 'components',
  component: Table,
  description: 'A native table in a card frame. Head cells are th, body cells td. Wide tables scroll sideways, from the keyboard too.',
  controls: [
    { kind: 'boolean', prop: 'striped', default: false },
    { kind: 'text', prop: 'aria-label', default: 'Button props', label: 'aria-label' },
  ],
  children: [
    {
      component: 'TableHead',
      children: [
        {
          component: 'TableRow',
          children: [
            { component: 'TableCell', children: 'Prop' },
            { component: 'TableCell', children: 'Type' },
            { component: 'TableCell', children: 'Default' },
          ],
        },
      ],
    },
    {
      component: 'TableBody',
      children: [
        row('color', 'primary | danger …', 'primary'),
        row('size', 'sm | md | lg', 'md'),
        row('disabled', 'boolean', 'false'),
      ],
    },
  ],
  parts: ['TableHead', 'TableBody', 'TableRow', 'TableCell'],
  presets: [{ label: 'Striped', state: { striped: true } }],
};
