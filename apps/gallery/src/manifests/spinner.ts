import { createElement } from 'react';
import { Box, COLORS, Heading, SIZES, Spinner, Stack, Text } from '@bit-ds/react';
import type { Manifest } from './types';
import { ScenePiece } from '../pages/component/passes/ScenePiece';

export const spinner: Manifest = {
  name: 'Spinner',
  slug: 'spinner',
  group: 'components',
  related: ['button'],
  component: Spinner,
  description: 'Shows that something is loading. Give it an aria-label: it is required, so screen readers announce it.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Loading coins', label: 'aria-label' },
  ],
  presets: [{ label: 'Large neutral', state: { color: 'neutral', size: 'lg' } }],
  anatomy: {
    parts: [
      {
        label: 'Ring',
        selector: '.bit-spinner',
        // Light draws the ring with color-line; dark draws it with color-bg (spinner.css), so both are listed and cleared.
        tokens: ['--bit-color-line', '--bit-color-bg'],
        side: 'right',
        touch: { kind: 'ring', edge: 'right', at: 0.5 },
        off: { '--bit-color-line': 'transparent', '--bit-color-bg': 'transparent' },
        offOn: 'part',
      },
      {
        label: 'Arc',
        selector: '.bit-spinner',
        tokens: ['--bit-color-primary'],
        side: 'left',
        touch: { kind: 'ring', edge: 'top', at: 0.5 },
        off: { '--bit-color-primary': 'transparent' },
      },
      {
        label: 'Size',
        selector: '.bit-spinner',
        tokens: ['--bit-control-height-md'],
        side: 'left',
        touch: { kind: 'bracket', edge: 'left' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Neutral', state: { color: 'neutral' } },
      { label: 'Large', state: { size: 'lg' } },
    ],
    scene: {
      caption: 'In use: a loading panel',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { direction: 'row', gap: 16, align: 'center' },
            instance,
            createElement(
              ScenePiece,
              null,
              createElement(
                Stack,
                { gap: 4 },
                createElement(Heading, { size: 20 }, 'Loading coins'),
                createElement(Text, null, 'Counting your high scores.'),
              ),
            ),
          ),
        ),
    },
  },
  docs: {
    badges: ['role="status"'],
    usage: {
      do: [
        "Show a Spinner when something takes more than a moment and you can't say how long.",
        'Say what is loading in its aria-label: "Loading coins".',
      ],
      dont: [
        'Show a Spinner for a wait under 300ms; it only flashes.',
        "Put a Spinner inside a Button. Use the Button's loading prop.",
      ],
    },
    props: [
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'primary'",
        description: 'The color role.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Diameter.' },
      { name: 'aria-label', type: 'string', description: 'Required. What screen readers announce, such as "Loading coins".' },
    ],
    a11y: [
      'role="status" and the required aria-label, so screen readers announce what is loading.',
      'The spin stops for people who ask their system to reduce motion.',
    ],
  },
};
