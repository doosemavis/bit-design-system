import { createElement } from 'react';
import { Box, Button, Stack, Tooltip } from '@bit-ds/react';
import type { Manifest } from './types';
import { ScenePiece } from '../pages/component/passes/ScenePiece';

/** The bubble draws in the top layer, above the stage's diagram, so a line, dot or highlight on it would be hidden. */
const UNSEEN = 'Draws in the top layer, above the diagram, so a line can\'t reach it';

export const tooltip: Manifest = {
  name: 'Tooltip',
  slug: 'tooltip',
  group: 'components',
  related: ['dialog', 'iconbutton'],
  component: Tooltip,
  description: 'A short hint that appears above a control on hover or keyboard focus, such as the name of an icon.',
  controls: [
    { kind: 'text', prop: 'content', default: 'Copy link', alwaysPrint: true },
    { kind: 'boolean', prop: 'pinned', default: false, label: 'Keep open', virtual: true },
    { kind: 'boolean', prop: 'describe', default: true },
  ],
  deriveProps: (state): Record<string, boolean> => (state.pinned === true ? { open: true } : {}),
  children: [{ component: 'Button', props: { variant: 'outline', color: 'neutral' }, children: 'Hover or focus me' }],
  interactive: true,
  anatomy: {
    root: '.bit-button',
    base: { pinned: true },
    parts: [
      {
        label: 'Bubble',
        selector: '.bit-tooltip',
        tokens: ['--bit-color-text', '--bit-color-bg'],
        side: 'right',
        touch: { kind: 'fill', edge: 'top', at: 0.85, leave: 'top' },
        unseen: UNSEEN,
      },
      {
        label: 'Type',
        selector: '.bit-tooltip',
        tokens: ['--bit-text-14px', '--bit-weight-bold'],
        side: 'right',
        touch: { kind: 'bracket', edge: 'right', at: 0.5 },
      },
      {
        label: 'Corner',
        selector: '.bit-tooltip',
        tokens: ['--bit-radius-6px'],
        side: 'left',
        touch: { kind: 'ring', edge: 'top', at: 0.15 },
        unseen: UNSEEN,
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Longer hint', state: { content: 'Copy the link to this page' } },
      { label: 'No description', state: { describe: false } },
    ],
    scene: {
      caption: 'In use: a hint on a toolbar button',
      render: (instance) =>
        createElement(
          Box,
          { padding: 16, paddingTop: 48, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { direction: 'row', gap: 12, align: 'center' },
            createElement(ScenePiece, null, createElement(Button, { variant: 'outline', color: 'neutral' }, 'Edit')),
            instance,
            createElement(ScenePiece, null, createElement(Button, { variant: 'outline', color: 'neutral' }, 'Share')),
          ),
        ),
    },
  },
  docs: {
    badges: ['Esc closes'],
    usage: {
      do: [
        "Label an icon-only control's action, such as \"Delete\" on a trash-can button.",
        'Keep it to a few words.',
      ],
      dont: [
        'Put links or buttons inside it. It disappears when the pointer leaves the trigger and the tooltip.',
        'Use it for information people need to finish a task. Put that on the page.',
      ],
    },
    props: [
      { name: 'content', type: 'ReactNode', description: 'What the tooltip says. Required.' },
      { name: 'children', type: 'ReactElement', description: 'Exactly one element: the trigger. It must be focusable.' },
      { name: 'open', type: 'boolean', description: 'Controlled: true shows it, false keeps it shut. Leave it off for hover and focus. While controlled, Esc does nothing.' },
      {
        name: 'describe',
        type: 'boolean',
        default: 'true',
        description: "Adds aria-describedby to the trigger. Turn off when the trigger's name already says the same.",
      },
    ],
    a11y: [
      'The tooltip has role="tooltip", and the trigger points to it with aria-describedby.',
      'It opens on keyboard focus as well as hover.',
      'Esc closes it without moving focus (not while `open` is controlled).',
      'It stays open while the pointer is over it, so people can read it with a magnifier (WCAG 1.4.13).',
    ],
  },
};
