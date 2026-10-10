import { createElement } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { Alert, COLORS } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { AlertDemo } from '../demos/AlertDemo';

const dismissible = (state: ControlState) => state.dismissible === true;

/** Indent every line of a JSX block by two spaces. */
const indent = (jsx: string) =>
  jsx
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

export const alert: Manifest = {
  name: 'Alert',
  slug: 'alert',
  group: 'components',
  related: ['dialog', 'badge'],
  component: Alert,
  description: 'A message with an optional heading. Outline uses the soft background; solid fills.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'outline' },
    { kind: 'text', prop: 'title', default: 'Heads up', alwaysPrint: true },
    { kind: 'boolean', prop: 'dismissible', default: false, virtual: true },
  ],
  children: 'Your changes were saved.',
  presets: [
    { label: 'Danger solid', state: { color: 'danger', variant: 'solid', title: 'Something broke' } },
    { label: 'No title', state: { title: '' } },
  ],
  // Dismissible: the preview passes onDismiss (the × hides it, and a Button brings it back); the code keeps it in state.
  demo: {
    when: dismissible,
    render: (element) => createElement(AlertDemo, { alert: element as ReactElement<ComponentProps<typeof Alert>> }),
    code: {
      reactImports: ['useState'],
      bitImports: [],
      setup: ['const [shown, setShown] = useState(true);'],
      props: ['onDismiss={() => setShown(false)}'],
      wrap: (jsx) => `<>\n  {shown && (\n${indent(indent(jsx))}\n  )}\n</>`,
    },
  },
  interactive: dismissible,
  docs: {
    badges: ['role="status"', 'Title in the display face'],
    usage: {
      do: [
        'Say what happened and what to do next: "Saved. You can close this tab."',
        'Use outline (the soft fill) for most messages, and solid when it must stand out.',
        'Pass onDismiss for a message people can close, and remove the Alert in it: keep whether it shows in state.',
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
        description:
          'A role tells screen readers what kind of thing an element is. Use "alert" for an urgent error, "note" for guidance that isn\'t news.',
      },
      {
        name: 'onDismiss',
        type: '() => void',
        description:
          'Shows a × button in the top corner that calls this. The Alert does not hide itself: remove it here. Leave it off for no ×.',
      },
      {
        name: 'dismissLabel',
        type: 'string',
        default: "'Dismiss'",
        description: 'The × button\'s accessible name. Say what it closes when there are several ("Dismiss saved message").',
      },
      { name: 'children', type: 'ReactNode', description: 'The message.' },
    ],
    a11y: [
      'role="status" by default, so screen readers announce it politely when it appears, without moving focus.',
      'Use role="alert" only for errors that need attention now: it interrupts whatever is being read.',
      "The title is styled text, not a heading, so it doesn't change the page outline.",
      'With onDismiss, the × is a real button named "Dismiss" (dismissLabel changes it); the × glyph itself is hidden from screen readers.',
      'Dismissing is your app\'s job: remove the Alert in onDismiss. The × had focus, so move focus somewhere sensible (the next control or heading), or keyboard users are left on nothing.',
    ],
  },
};
