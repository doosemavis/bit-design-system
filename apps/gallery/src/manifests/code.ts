import { createElement } from 'react';
import { Box, Code, Stack, Text } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

const BORDER = { border: '2px solid var(--bit-color-text)' };

export const code: Manifest = {
  name: 'Code',
  slug: 'code',
  group: 'components',
  related: ['text', 'codeblock'],
  component: Code,
  description: 'Marks a bit of code inside a sentence, such as a prop name or a file path.',
  controls: [],
  children: 'color="danger"',
  anatomy: {
    parts: [
      {
        label: 'Pill',
        selector: '.bit-code',
        tokens: ['--bit-code-inline-bg', '--bit-radius-6px'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.08, leave: 'left' },
        off: { '--bit-code-inline-bg': 'transparent' },
      },
      {
        label: 'Text color',
        selector: '.bit-code',
        tokens: ['--bit-code-inline-text'],
        side: 'right',
        touch: { kind: 'text', edge: 'bottom', at: 0.75 },
        off: { '--bit-code-inline-text': 'transparent' },
      },
      {
        label: 'Font',
        selector: '.bit-code',
        tokens: ['--bit-font-mono'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.25 },
      },
      {
        label: 'Size',
        selector: '.bit-code',
        tokens: ['--bit-text-14px'],
        side: 'right',
        touch: { kind: 'bracket', edge: 'right' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'A file path', state: { children: 'src/index.css' } },
    ],
    scene: {
      caption: 'In use: a prop name inside a sentence',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: BORDER },
          createElement(
            Stack,
            { direction: 'row', gap: 8, align: 'center', wrap: true },
            createElement(ScenePiece, null, createElement(Text, null, 'To make a delete button red, pass')),
            instance,
            createElement(ScenePiece, null, createElement(Text, null, 'to Button.')),
          ),
        ),
    },
  },
  docs: {
    badges: ['Inline <code>', 'Mono', 'Light violet in light mode, yellow in dark'],
    usage: {
      do: [
        'Use Code for a prop, a value or a file name inside a sentence: color="danger".',
        'Keep it to a few words.',
        'Inside a Table, Code shows as plain colored mono text, without the pill; in running text it keeps the pill.',
      ],
      dont: [
        'Use Code for more than one line. Use CodeBlock.',
        'Use Code for emphasis.',
      ],
    },
    props: [{ name: 'children', type: 'ReactNode', description: 'The code, shown exactly as written.' }],
    a11y: [
      'A real <code> element; screen readers read it as part of the sentence.',
      'The text keeps at least 4.5:1 contrast on the pill in both modes. In forced-colors mode the pill gets a system outline.',
    ],
  },
};
