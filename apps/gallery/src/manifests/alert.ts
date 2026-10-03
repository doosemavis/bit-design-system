import { Alert, COLORS } from '@bit-ds/react';
import type { Manifest } from './types';

export const alert: Manifest = {
  name: 'Alert',
  slug: 'alert',
  group: 'components',
  component: Alert,
  description: 'A message with an optional heading. Outline uses the soft background; solid fills.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'outline' },
    { kind: 'text', prop: 'title', default: 'Heads up' },
  ],
  children: 'Your changes were saved.',
  presets: [
    { label: 'Danger solid', state: { color: 'danger', variant: 'solid', title: 'Something broke' } },
    { label: 'No title', state: { title: '' } },
  ],
  docs: {
    badges: ['role="status"', 'Title in the display face'],
    usage: {
      do: [
        'Say what happened and what to do next: "Saved. You can close this tab."',
        'Use outline (the soft fill) for most messages, and solid when it must stand out.',
      ],
      dont: [
        'Stack several Alerts at the top of a page. Merge them, or show the most important one.',
        'Use the default role for guidance that never changes: it is announced as news. Give it role="note".',
      ],
    },
    props: [
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'neutral'",
        description: 'The color role: success for done, warning for take care, danger for failed.',
      },
      {
        name: 'variant',
        className: 'bit-{variant}',
        type: "'solid' | 'outline'",
        default: "'outline'",
        description: "outline uses the color's soft background; solid fills with the color.",
      },
      {
        name: 'title',
        type: 'string',
        description: "The alert's own heading, in the display face. It is not the native title tooltip.",
      },
      {
        name: 'role',
        type: 'string',
        default: "'status'",
        description: 'Use "alert" for an urgent error, "note" for guidance that isn\'t news.',
      },
      { name: 'children', type: 'ReactNode', description: 'The message.' },
    ],
    a11y: [
      'role="status" by default, so screen readers announce it politely when it appears, without moving focus.',
      'Use role="alert" only for errors that need attention now: it interrupts whatever is being read.',
      "The title is styled text, not a heading, so it doesn't change the page outline.",
    ],
  },
};
