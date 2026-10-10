import { ModeToggle } from '@bit-ds/react';
import type { Manifest } from './types';

export const modeToggle: Manifest = {
  name: 'ModeToggle',
  slug: 'modetoggle',
  group: 'components',
  related: ['switch', 'segmentedcontrol'],
  component: ModeToggle,
  description: 'The light/dark switch. It follows your system until you click, then remembers. Try it: it switches this whole site.',
  controls: [{ kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' }],
  docs: {
    badges: ['Remembers the choice', 'Needs React'],
    usage: {
      do: [
        'Put one ModeToggle in your header. Every ModeToggle on the page shares one store, so they always agree.',
        'Set data-mode="system" on <html> so the page follows the visitor\'s OS from the first paint, with no script.',
        "Switch from code: colorMode.set('dark'), colorMode.toggle() or colorMode.set('system'). It works from any file, not just React.",
      ],
      dont: [
        'Build your own light/dark switch beside it. Call useColorMode() when you need the mode in code.',
        "Use it to switch themes. Light and dark are modes of one theme; themes are separate CSS files.",
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Control size.' },
      {
        name: 'aria-label',
        type: 'string',
        default: "'Color mode'",
        description: "Names the group for screen readers. Change it only when the page's language isn't English.",
      },
    ],
    a11y: [
      'A labelled group of two real buttons, Light and Dark; the current one has aria-pressed="true", which screen readers announce as "pressed".',
      "It follows the visitor's system setting until they click, then remembers their choice.",
    ],
  },
  interactive: true,
};
