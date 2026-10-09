import { createElement } from 'react';
import type { ReactElement } from 'react';
import { SPACE_STEPS, Stack } from '@bit-ds/react';
import type { StackProps } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { StackDemo } from '../demos/StackDemo';

/** The Box's width: px as a number, or the string '100%'. */
const containerWidth = (state: ControlState): number | string => {
  const width = String(state.containerWidth);
  return width.endsWith('%') ? width : Number(width);
};

/** The Box's height in px, or undefined for auto: as tall as the children. */
const containerHeight = (state: ControlState): number | undefined =>
  state.containerHeight === undefined || state.containerHeight === 'auto' ? undefined : Number(state.containerHeight);

/** The Box's style as JSX: `{ width: 240, height: 80 }`, with '100%' as a string. */
const boxStyle = (state: ControlState): string => {
  const width = containerWidth(state);
  const height = containerHeight(state);
  const sizes = [`width: ${typeof width === 'string' ? `'${width}'` : width}`, ...(height === undefined ? [] : [`height: ${height}`])];
  return `{ ${sizes.join(', ')} }`;
};

const indent = (jsx: string) =>
  jsx
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

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
    // The page's own: the width of the Box the Stack sits in. The stage outlines that Box, so stretch shows its edge.
    { kind: 'select', prop: 'containerWidth', label: 'container width', values: ['160', '240', '360', '100%'], default: '240', virtual: true },
    // Its height: auto by default. With one, the Stack fills it, so stretch shows in a row and justify in a column.
    { kind: 'select', prop: 'containerHeight', label: 'container height', values: ['auto', '80', '120', '200'], default: 'auto', virtual: true },
  ],
  children: [
    { component: 'Badge', props: { color: 'primary' }, children: 'One' },
    { component: 'Badge', props: { color: 'success' }, children: 'Two' },
    { component: 'Badge', props: { color: 'danger' }, children: 'Three' },
  ],
  // A Stack is as wide as its container; in the stage alone it would shrink to its widest child. The Box gives it
  // a set width to fill, and the stage's dashed Box outline shows where that edge is. A row too wide for the Box
  // wraps in the preview (StackDemo), so nothing spills past the outline; so does a column too tall for a set height.
  demo: {
    render: (element, state) =>
      createElement(StackDemo, { stack: element as ReactElement<StackProps>, width: containerWidth(state), height: containerHeight(state) }),
    code: {
      reactImports: [],
      bitImports: ['Box'],
      setup: [],
      props: (state) => (containerHeight(state) === undefined ? [] : ["style={{ height: '100%' }}"]),
      wrap: (jsx, state) => `<Box padding={4} style={${boxStyle(state)}}>\n${indent(jsx)}\n</Box>`,
    },
  },
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
        default: "'stretch'",
        description:
          'Cross-axis alignment: left to right in a column, top to bottom in a row. The default is the CSS fallback when you leave the prop off; Stack sets no default in JS.',
      },
      {
        name: 'justify',
        type: "'start' | 'center' | 'end' | 'between'",
        default: "'start'",
        description:
          'Main-axis alignment. between pushes the first and last children to the ends. The default is the CSS fallback when you leave the prop off; Stack sets no default in JS.',
      },
      { name: 'wrap', type: 'boolean', default: 'false', description: 'Lets a row wrap onto more lines when it runs out of room.' },
    ],
    a11y: [
      'A Stack is a plain <div> and adds no role; screen readers read the children in source order.',
      'direction="row" never reorders anything, so the Tab order always matches what people see.',
    ],
  },
};
