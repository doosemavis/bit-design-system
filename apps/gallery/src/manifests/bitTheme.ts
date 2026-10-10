import { BitTheme } from '@bit-ds/react';
import type { Manifest } from './types';

export const bitTheme: Manifest = {
  name: 'BitTheme',
  slug: 'bittheme',
  group: 'components',
  component: BitTheme,
  description:
    'Themes a subtree: a wrapper with a theme class and a mode class, painted in that theme. A dark sidebar on a light page is one BitTheme.',
  controls: [
    { kind: 'select', prop: 'mode', values: ['none', 'light', 'dark'], default: 'dark', alwaysPrint: true },
    { kind: 'select', prop: 'theme', values: ['none', 'power-up'], default: 'none' },
  ],
  children: [
    {
      component: 'Box',
      props: { padding: 16 },
      children: [
        {
          component: 'Stack',
          props: { gap: 12 },
          children: [
            { component: 'Text', children: 'A dark corner of the page.' },
            { component: 'Button', children: 'Save' },
          ],
        },
      ],
    },
  ],
  presets: [
    { label: 'Light inside dark', state: { mode: 'light' } },
    { label: 'Theme by name', state: { theme: 'power-up' } },
  ],
  docs: {
    badges: ['Theme and mode classes', 'asChild'],
    usage: {
      do: [
        'Wrap a part of the page that needs its own mode: a dark sidebar, a light card in a dark app.',
        'Give it theme="<name>" to show a second theme you have loaded, beside the first.',
        'Use asChild to put the classes on your own element (an <aside>, a router outlet) instead of a <div>.',
      ],
      dont: [
        'Wrap the whole app in BitTheme to pick the page mode. Put the class on <html> (or call colorMode.set), so the page and its scrollbars match.',
        'Nest a mode switch deep inside a second theme that itself sits inside another non-default theme. Put the mode on the BitTheme instead.',
      ],
    },
    props: [
      {
        name: 'mode',
        type: "'light' | 'dark'",
        description: 'Light or dark for this subtree. Class: bit-light or bit-dark, so className="bit-dark" does the same. Left off, it keeps the mode around it.',
      },
      {
        name: 'theme',
        type: "'power-up' | string",
        description:
          "The theme for this subtree, by name; its CSS file must be loaded. Class: bit-theme-{theme}. A theme starts its subtree in its light mode, so add mode to make it dark. Left off, it keeps the theme around it.",
      },
      { name: 'asChild', type: 'boolean', default: 'false', description: 'Puts the classes on its one child element instead of rendering a <div>.' },
      { name: 'children', type: 'ReactNode', description: 'The themed content.' },
    ],
    a11y: [
      'A plain <div> with no role: it changes colors, not meaning. Give it a landmark role (or use asChild on an <aside> or <nav>) when it is one.',
      'Every theme passes the same contrast checks in light and dark, so a themed subtree stays readable.',
      'The focus ring takes the subtree’s own mode: violet in light, yellow in dark.',
    ],
  },
};
