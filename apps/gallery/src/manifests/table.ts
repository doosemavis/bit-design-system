import { createElement } from 'react';
import { Box, Heading, Stack, Table, Text } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
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
  related: ['card'],
  component: Table,
  description: 'Shows data in rows and columns, in a card frame. A wide table scrolls sideways, from the keyboard too.',
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
  anatomy: {
    // The stripe shows only on a striped table, so every pass renders striped.
    base: { striped: true },
    parts: [
      {
        label: 'Edge',
        selector: '.bit-table',
        tokens: ['--bit-border-width', '--bit-radius-10px'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.8 },
        off: { '--bit-border-width': '0px' },
        step: 'Lines',
      },
      {
        label: 'Surface',
        selector: '.bit-table',
        tokens: ['--bit-color-surface'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.9, leave: 'left' },
        off: { '--bit-color-surface': 'transparent' },
      },
      {
        label: 'Shadow',
        selector: '.bit-table',
        tokens: ['--bit-shadow-md'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.72 },
        off: { '--bit-shadow-md': 'none' },
      },
      {
        label: 'Header divider',
        selector: '.bit-table__head .bit-table__cell:last-child',
        tokens: ['--bit-border-width'],
        side: 'right',
        touch: { kind: 'ring', edge: 'bottom', at: 0.9, leave: 'right' },
        off: { '--bit-border-width': '0px' },
        step: 'Lines',
      },
      {
        label: 'Header text',
        selector: '.bit-table__head .bit-table__cell',
        tokens: ['--bit-font-pixel', '--bit-text-14px'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.3, leave: 'left' },
      },
      {
        label: 'Row divider',
        selector: '.bit-table__body .bit-table__row:nth-child(2) .bit-table__cell:last-child',
        tokens: ['--bit-color-line'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.9, leave: 'right' },
        off: { '--bit-color-line': 'transparent' },
        step: 'Lines',
      },
      {
        label: 'Stripe',
        selector: '.bit-table__body .bit-table__row:nth-child(2)',
        tokens: ['--bit-color-stripe'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.5 },
        off: { '--bit-color-stripe': 'transparent' },
      },
      {
        label: 'Cell padding',
        selector: '.bit-table__body .bit-table__cell',
        tokens: ['--bit-space-12px', '--bit-space-16px'],
        side: 'left',
        touch: { kind: 'bracket', edge: 'left' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Plain', state: { striped: false } },
      { label: 'Flat', state: { flat: true } },
    ],
    scene: {
      caption: 'In use: a data page',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 16 },
            createElement(
              ScenePiece,
              null,
              createElement(Heading, { size: 24 }, 'Button props'),
              createElement(Text, null, 'What a Button takes, and its defaults.'),
            ),
            instance,
          ),
        ),
    },
  },
  docs: {
    badges: ['Native <table>', 'Head cells th, body cells td'],
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
