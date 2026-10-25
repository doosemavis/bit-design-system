import { createElement } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { Alert, Box, COLORS, Field, Heading, Input, Stack } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
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
  description:
    'A message people should notice, from good news to an error. Each color but neutral leads with its own icon; add a title when the message needs a heading.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'outline' },
    { kind: 'text', prop: 'title', default: 'Heads up', alwaysPrint: true },
    { kind: 'boolean', prop: 'icon', default: true },
    { kind: 'boolean', prop: 'dismissible', default: false, virtual: true },
  ],
  children: 'Your changes were saved.',
  presets: [
    { label: 'Danger solid', state: { color: 'danger', variant: 'solid', title: 'Something broke' } },
    { label: 'No title', state: { title: '' } },
    { label: 'Success', state: { color: 'success', title: 'Saved' } },
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
  anatomy: {
    parts: [
      {
        label: 'Edge',
        selector: '.bit-alert',
        tokens: ['--bit-border-width', '--bit-color-line', '--bit-radius-10px'],
        side: 'left',
        touch: { kind: 'ring', edge: 'top', at: 0.2 },
        off: { '--bit-border-width': '0px' },
      },
      {
        label: 'Fill',
        selector: '.bit-alert',
        tokens: ['--bit-color-neutral-soft'],
        side: 'right',
        touch: { kind: 'fill', edge: 'right', at: 0.3 },
        off: { '--bit-color-neutral-soft': 'transparent' },
      },
      {
        label: 'Shadow',
        selector: '.bit-alert',
        tokens: ['--bit-color-shadow'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.72 },
        off: { '--bit-color-shadow': 'transparent' },
      },
      {
        label: 'Title',
        selector: '.bit-alert__title',
        tokens: ['--bit-font-display', '--bit-text-18px'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.05, leave: 'left' },
      },
      {
        label: 'Message',
        selector: '.bit-alert__body',
        tokens: ['--bit-text-16px'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.3 },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Danger solid', state: { color: 'danger', variant: 'solid', title: 'Something broke' } },
      { label: 'No title', state: { title: '' } },
    ],
    scene: {
      caption: 'In use: a notice at the top of a form',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 16 },
            createElement(ScenePiece, null, createElement(Heading, { size: 20 }, 'Create your account')),
            instance,
            createElement(
              ScenePiece,
              null,
              createElement(Field, { label: 'Email', children: createElement(Input, { placeholder: 'you@example.com' }) }),
            ),
          ),
        ),
    },
  },
  docs: {
    badges: ['role="status"', 'Outline or solid', 'Title in the display face'],
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
        name: 'icon',
        type: 'boolean | IconData',
        default: 'true',
        description:
          "The leading icon. true shows the color's own: info for primary, a check for success, a warning sign for warning, an error mark for danger; neutral has none. false hides it, and an icon export (iconCelebration) replaces it.",
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
      'The icon shows the severity without relying on color, which matters in forced-colors mode (Windows high contrast) and for color-blind readers. It is hidden from screen readers: say the severity in the title or text ("Payment failed").',
      'With onDismiss, the × is a real button named "Dismiss" (dismissLabel changes it); the × glyph itself is hidden from screen readers.',
      'Dismissing is your app\'s job: remove the Alert in onDismiss. The × had focus, so move focus somewhere sensible (the next control or heading), or keyboard users are left on nothing.',
    ],
  },
};
