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
    { kind: 'boolean', prop: 'flat', default: false },
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
  docs: {
    badges: ['Native <table>', 'Scrolls sideways'],
    usage: {
      do: [
        'Use a Table for data people compare across rows: props, prices, scores.',
        'Give every table that may scroll an aria-label (or aria-labelledby), so the scroll area is announced as a named region screen readers can jump to.',
      ],
      dont: [
        'Use a Table for layout. Use Stack or a grid.',
        'Leave out TableHead; the head cells tell screen readers what each column is.',
      ],
    },
    props: [
      { name: 'striped', type: 'boolean', default: 'false', description: 'Shades every other body row. Rendered as data-striped.' },
      { name: 'flat', type: 'boolean', default: 'false', description: 'Drops the hard shadow for a flat look. Class: bit-flat, so className="bit-flat" does the same.' },
      {
        name: 'aria-label',
        type: 'string',
        description: "Names the table. While the table is too wide and scrolls, the name moves to the scroll area, which becomes a named region: a landmark screen readers can list and jump to. Either way it is read once. To name it with a visible heading instead, use aria-labelledby with that heading's id.",
      },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'TableHead and TableBody, with TableRows of TableCells. Cells are th in the head and td in the body.',
      },
    ],
    a11y: [
      'A native <table>, so screen readers announce rows, columns and the head cell for each value.',
      'The scroll wrapper is focusable only when the table is too wide and scrolls; otherwise it adds no extra keyboard stop. While it scrolls, an aria-label or aria-labelledby names it as a region (the stop focus lands on); the rest of the time the name stays on the table. The name is never on both, so it is read once. Without a name the wrapper has no role, so name any table that may scroll.',
    ],
  },
};
