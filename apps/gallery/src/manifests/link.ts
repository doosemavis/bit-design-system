import { createElement } from 'react';
import { Box, Heading, Link, Stack, Text } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

export const link: Manifest = {
  name: 'Link',
  slug: 'link',
  group: 'components',
  related: ['button', 'iconbutton'],
  component: Link,
  description:
    'Takes people to another page or place. Bold and underlined, in primary or neutral; asChild lends the look to a router link.',
  controls: [
    { kind: 'axis', prop: 'color', values: ['primary', 'neutral'], default: 'primary' },
    { kind: 'text', prop: 'href', default: 'https://github.com/doosemavis/bit-design-system', alwaysPrint: true },
  ],
  children: 'Read the install guide',
  presets: [{ label: 'Neutral', state: { color: 'neutral' } }],
  anatomy: {
    parts: [
      {
        label: 'Color',
        selector: '.bit-link',
        tokens: ['--bit-color-link', '--bit-color-link-visited'],
        side: 'right',
        touch: { kind: 'text', edge: 'bottom', at: 0.3 },
        off: { '--bit-color-link': 'transparent', '--bit-color-link-visited': 'transparent' },
      },
      {
        label: 'Weight',
        selector: '.bit-link',
        tokens: ['--bit-weight-bold'],
        side: 'left',
        touch: { kind: 'box', edge: 'left', at: 0.5 },
      },
    ],
    states: [
      { label: 'Primary', state: {} },
      { label: 'Neutral', state: { color: 'neutral' } },
    ],
    scene: {
      caption: 'In use: a link inside a paragraph of text',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 12 },
            createElement(ScenePiece, null, createElement(Heading, { size: 20 }, 'Getting started')),
            createElement(
              Stack,
              { direction: 'row', gap: 4, align: 'center', wrap: true },
              createElement(ScenePiece, null, createElement(Text, null, 'Not sure where to begin?')),
              instance,
              createElement(ScenePiece, null, createElement(Text, null, 'It takes about five minutes.')),
            ),
          ),
        ),
    },
  },
  docs: {
    badges: ['Native <a>'],
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
      "Inside a solid Alert, a Link takes the Alert's text color: white, or ink on yellow. On hover, the underline thickens to 4px with no highlight.",
      "In dark mode, a Link's hover underline turns yellow, except inside a solid Alert, where it stays the Alert's text color.",
    ],
    emptyChildrenError: 'A Link needs text, or screen readers read out the address instead.',
  },
};
