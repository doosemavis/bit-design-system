import { ModeToggle } from '@bit-ds/react';
import type { Manifest } from './types';

export const modeToggle: Manifest = {
  name: 'ModeToggle',
  slug: 'modetoggle',
  group: 'components',
  related: ['bittheme', 'switch', 'segmentedcontrol'],
  component: ModeToggle,
  description: 'The light/dark switch. It follows your system until you click, then remembers. Try it: it switches this whole site.',
  controls: [
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'boolean', prop: 'iconOnly', default: false },
  ],
  docs: {
    badges: ['Remembers the choice', 'Needs React'],
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
