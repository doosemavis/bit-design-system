import { Tooltip } from '@bit-ds/react';
import type { Manifest } from './types';

export const tooltip: Manifest = {
  name: 'Tooltip',
  slug: 'tooltip',
  group: 'components',
  component: Tooltip,
  description: 'A short label that appears above a control on hover or keyboard focus.',
  controls: [
    { kind: 'text', prop: 'content', default: 'Copy link', alwaysPrint: true },
    { kind: 'boolean', prop: 'pinned', default: false, label: 'Keep open', virtual: true },
    { kind: 'boolean', prop: 'describe', default: true },
  ],
  deriveProps: (state): Record<string, boolean> => (state.pinned === true ? { open: true } : {}),
  children: [{ component: 'Button', props: { variant: 'outline', color: 'neutral' }, children: 'Hover or focus me' }],
  interactive: true,
  docs: {
    badges: ['Hover and focus', 'Esc closes'],
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
      { name: 'open', type: 'boolean', description: 'Controlled: true shows it, false keeps it shut. Leave it off for hover and focus.' },
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
      'Esc closes it without moving focus.',
      'It stays open while the pointer is over it, so people can read it with a magnifier (WCAG 1.4.13).',
    ],
  },
};
