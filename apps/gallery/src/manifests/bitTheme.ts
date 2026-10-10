import { BitTheme } from '@bit-ds/react';
import type { Manifest } from './types';
import { BitThemeExamples } from '../pages/theme/BitThemeExamples';

export const bitTheme: Manifest = {
  name: 'BitTheme',
  slug: 'bittheme',
  group: 'components',
  component: BitTheme,
  description:
    'Theme and mode for the whole page, or for part of it. On <html>, the classes bit-theme-power-up and bit-light or bit-dark pick them; BitTheme puts the same classes on a subtree, such as a dark sidebar on a light page.',
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
  extraSection: { id: 'section-examples', title: 'Examples', Component: BitThemeExamples },
  docs: {
    badges: ['Theme and mode classes', 'asChild'],
    usage: {
      do: [
        'Set the theme and mode on <html> (class="bit-theme-power-up bit-light"), so they apply before the body paints.',
        'Put one theme class on the page root, once.',
        'Use BitTheme for a section that must keep its own mode: a dark code panel, a promo band, a sidebar.',
        'Let ModeToggle and colorMode own the class on <html> once the page has loaded; they write it and remember the choice.',
      ],
      dont: [
        'Put mode classes on <body>. The page background, the scrollbars and native controls take their colors from <html>.',
        'Mix bit-dark and data-mode="light" on the same element. Use one form per element.',
        'Use BitTheme to change one component’s color. Use its color and variant props.',
        'Call light or dark a theme. power-up is the theme; light and dark are its modes.',
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
