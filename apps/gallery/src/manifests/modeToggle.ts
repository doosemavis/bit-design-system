import { createElement } from 'react';
import { Box, Heading, ModeToggle, Stack, Text } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

export const modeToggle: Manifest = {
  name: 'ModeToggle',
  slug: 'modetoggle',
  group: 'components',
  related: ['bittheme', 'switch', 'segmentedcontrol'],
  component: ModeToggle,
  description:
    'Lets people switch between light and dark. It follows their system until they click, then remembers. Try it: it switches this whole site.',
  controls: [
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'boolean', prop: 'iconOnly', default: false },
  ],
  anatomy: {
    parts: [
      {
        label: 'Size',
        selector: '.bit-mode-toggle',
        tokens: ['--bit-control-height-md'],
        side: 'left',
        touch: { kind: 'bracket', edge: 'left' },
      },
      {
        label: 'Pressed',
        selector: '.bit-mode-toggle__option[aria-pressed="true"]',
        tokens: ['--bit-color-warning', '--bit-color-warning-contrast'],
        side: 'left',
        touch: { kind: 'fill', edge: 'top', at: 0.2, leave: 'top' },
        off: { '--bit-color-warning': 'transparent', '--bit-color-warning-contrast': 'transparent' },
      },
      {
        label: 'Label',
        selector: '.bit-mode-toggle__option',
        tokens: ['--bit-font-body', '--bit-weight-bold', '--bit-color-text'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.5, leave: 'bottom' },
        off: { '--bit-color-text': 'transparent' },
      },
      {
        label: 'Edge',
        selector: '.bit-mode-toggle',
        tokens: ['--bit-border-width', '--bit-color-line'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.85 },
        off: { '--bit-border-width': '0px' },
      },
      {
        label: 'Surface',
        selector: '.bit-mode-toggle__option[aria-pressed="false"]',
        tokens: ['--bit-color-surface'],
        side: 'right',
        touch: { kind: 'fill', edge: 'bottom', at: 0.7, leave: 'bottom' },
        off: { '--bit-color-surface': 'transparent' },
      },
      {
        label: 'Shadow',
        selector: '.bit-mode-toggle',
        tokens: ['--bit-shadow-sm'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.5 },
        off: { '--bit-shadow-sm': 'none' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Small', state: { size: 'sm' } },
      { label: 'Icons only', state: { iconOnly: true } },
    ],
    scene: {
      caption: 'In use: the corner of a page header',
      render: (instance) =>
        createElement(
          Box,
          { padding: 16, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 16 },
            createElement(
              Stack,
              { direction: 'row', gap: 12, align: 'center', justify: 'between' },
              createElement(ScenePiece, null, createElement(Heading, { size: 20 }, 'Arcade')),
              instance,
            ),
            createElement(ScenePiece, null, createElement(Text, null, 'Pick light or dark. It switches the whole page and remembers.')),
          ),
        ),
    },
  },
  docs: {
    badges: ['Needs React'],
    usage: {
      do: [
        'Put one ModeToggle in your header. Every ModeToggle on the page shares one store, so they always agree.',
        'Start the page in a mode with class="bit-theme-power-up bit-light" (or bit-dark) on <html>; a click writes the other class there and remembers it. The BitTheme page shows every form.',
        'Or set data-mode="system" on <html> so the page follows the visitor\'s OS from the first paint, with no script, until they pick.',
        "Switch from code: colorMode.set('dark'), colorMode.toggle() or colorMode.set('system'). It works from any file, not just React.",
      ],
      dont: [
        'Build your own light/dark switch beside it. Call useColorMode() when you need the mode in code.',
        'Use it to switch themes. power-up is the theme; light and dark are its modes, and other themes are separate CSS files (bit-theme-<name>).',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Control size.' },
      {
        name: 'iconOnly',
        type: 'boolean',
        default: 'false',
        description: 'Just the sun and moon, as square buttons with bigger icons, for a tight header. Each keeps its name (Light, Dark) for screen readers. Rendered as data-icon-only.',
      },
      {
        name: 'aria-label',
        type: 'string',
        default: "'Color mode'",
        description: "Names the group for screen readers. Change it only when the page's language isn't English.",
      },
    ],
    a11y: [
      'A labelled group of two real buttons, Light and Dark; the current one has aria-pressed="true", which screen readers announce as "pressed".',
      'With iconOnly the words go, but each button keeps its name (aria-label Light or Dark), and the icons are hidden from screen readers.',
      "It follows the visitor's system setting until they click, then remembers their choice and writes bit-light or bit-dark (and data-mode) on <html>.",
    ],
  },
  interactive: true,
};
