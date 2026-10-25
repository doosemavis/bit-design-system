import { createElement } from 'react';
import { Box, Card, Heading, Stack, Text } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

export const card: Manifest = {
  name: 'Card',
  slug: 'card',
  group: 'components',
  related: ['stack', 'box', 'table'],
  component: Card,
  description: 'Groups related content on one surface, with an optional header and footer.',
  controls: [
    { kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'solid' },
    { kind: 'boolean', prop: 'flat', default: false },
  ],
  children: [
    { component: 'CardHeader', children: 'Stats' },
    { component: 'CardBody', children: '3 coins collected' },
    { component: 'CardFooter', children: 'Updated today' },
  ],
  parts: ['CardHeader', 'CardBody', 'CardFooter'],
  presets: [{ label: 'Outline', state: { variant: 'outline' } }],
  anatomy: {
    parts: [
      {
        label: 'Edge',
        selector: '.bit-card',
        tokens: ['--bit-border-width', '--bit-radius-14px'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.8 },
        off: { '--bit-border-width': '0px' },
        step: 'Lines',
      },
      {
        label: 'Surface',
        selector: '.bit-card',
        tokens: ['--bit-color-surface'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.5 },
        off: { '--bit-color-surface': 'transparent' },
      },
      {
        label: 'Shadow',
        selector: '.bit-card',
        tokens: ['--bit-shadow-lg'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.72 },
        off: { '--bit-shadow-lg': 'none' },
      },
      {
        label: 'Header divider',
        selector: '.bit-card__header',
        tokens: ['--bit-border-width'],
        side: 'right',
        touch: { kind: 'ring', edge: 'bottom', at: 0.9, leave: 'right' },
        off: { '--bit-border-width': '0px' },
        step: 'Lines',
      },
      {
        label: 'Header text',
        selector: '.bit-card__header',
        tokens: ['--bit-font-display', '--bit-text-18px'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.2, leave: 'left' },
      },
      {
        label: 'Footer divider',
        selector: '.bit-card__footer',
        tokens: ['--bit-border-width'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.9, leave: 'right' },
        off: { '--bit-border-width': '0px' },
        step: 'Lines',
      },
      {
        label: 'Footer fill',
        selector: '.bit-card__footer',
        tokens: ['--bit-color-neutral-soft'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.5 },
        off: { '--bit-color-neutral-soft': 'transparent' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Outline', state: { variant: 'outline' } },
      { label: 'Flat', state: { flat: true } },
    ],
    scene: {
      caption: 'In use: one card in a dashboard row',
      render: (instance) =>
        createElement(
          Stack,
          { direction: 'row', gap: 16, align: 'start' },
          createElement(
            Box,
            { padding: 16, style: { border: '2px solid var(--bit-color-text)' } },
            createElement(
              ScenePiece,
              null,
              createElement(Text, null, 'Visitors'),
              createElement(Heading, { size: 24 }, '12,480'),
            ),
          ),
          createElement(Box, { padding: 16, style: { border: '2px solid var(--bit-color-text)' } }, instance),
          createElement(
            Box,
            { padding: 16, style: { border: '2px solid var(--bit-color-text)' } },
            createElement(
              ScenePiece,
              null,
              createElement(Text, null, 'Sign-ups'),
              createElement(Heading, { size: 24 }, '392'),
            ),
          ),
        ),
    },
  },
  docs: {
    badges: ['Compound: the parts are their own exports', 'Header, body, footer'],
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
      { name: 'flat', type: 'boolean', default: 'false', description: 'Drops the hard shadow for a flat look. Class: bit-flat, so className="bit-flat" does the same.' },
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
