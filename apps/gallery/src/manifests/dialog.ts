import { createElement } from 'react';
import type { ReactElement } from 'react';
import { Dialog, SIZES } from '@bit-ds/react';
import type { DialogProps } from '@bit-ds/react';
import type { ChildSpec, ControlState, Manifest } from './types';
import { DialogDemo } from '../demos/DialogDemo';

/** The two dialogs the page shows: a calm save, and an alert that deletes. */
function parts(state: ControlState): readonly ChildSpec[] {
  const alert = state.alert === true;
  return [
    { component: 'DialogHeader', children: String(state.title) },
    {
      component: 'DialogBody',
      children: alert ? 'This deletes "Q3 report" for everyone on the team. You can\'t undo it.' : 'Your edits will be saved to the project.',
    },
    {
      component: 'DialogFooter',
      children: [
        { component: 'DialogClose', props: { 'data-autofocus': true }, children: 'Cancel' },
        alert
          ? { component: 'DialogClose', props: { variant: 'solid', color: 'danger' }, children: 'Delete' }
          : { component: 'DialogClose', props: { variant: 'solid', color: 'primary' }, children: 'Save' },
      ],
    },
  ];
}

/** Indent every line of a JSX block by two spaces, to sit inside the demo's fragment. */
const indent = (jsx: string) =>
  jsx
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

export const dialog: Manifest = {
  name: 'Dialog',
  slug: 'dialog',
  group: 'components',
  component: Dialog,
  description: 'A modal window in the Retro window style. It opens over a dimmed page, keeps focus inside, and folds away when closed.',
  controls: [
    { kind: 'text', prop: 'title', label: 'title', default: 'Save changes?', virtual: true },
    { kind: 'boolean', prop: 'alert', default: false },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
  ],
  deriveChildren: parts,
  parts: ['DialogHeader', 'DialogBody', 'DialogFooter', 'DialogClose'],
  presets: [{ label: 'Alert', state: { alert: true, title: 'Delete report?' } }],
  demo: {
    render: (element) => createElement(DialogDemo, { dialog: element as ReactElement<DialogProps> }),
    code: {
      reactImports: ['useState'],
      bitImports: ['Button'],
      setup: ['const [open, setOpen] = useState(false);'],
      props: ['open={open}', 'onOpenChange={setOpen}'],
      wrap: (jsx) => `<>\n  <Button onClick={() => setOpen(true)}>Open dialog</Button>\n${indent(jsx)}\n</>`,
    },
  },
  interactive: true,
  docs: {
    badges: ['Native <dialog>', 'Focus kept inside', 'Pixel fold'],
    usage: {
      do: [
        'Use a Dialog for a short task or a decision that needs an answer before going on.',
        'Put data-autofocus on the safest action (usually Cancel), so focus starts there.',
        'Use alert for a confirmation that destroys something; a click on the dimmed page then does not close it.',
      ],
      dont: ['Use a Dialog for information that could sit on the page. Use an Alert.', 'Open a Dialog from another Dialog.'],
    },
    props: [
      { name: 'open', type: 'boolean', description: 'Required. Whether the dialog is open. Dialog is controlled: keep this in state.' },
      {
        name: 'onOpenChange',
        type: '(open: boolean) => void',
        description: 'Required. Called with false on Esc, the ×, a DialogClose, or a click on the dimmed page (not for alert).',
      },
      { name: 'alert', type: 'boolean', default: 'false', description: 'An alertdialog for confirmations: a click on the dimmed page does not close it.' },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Width: 320, 420 or 560px, never wider than the screen.' },
      { name: 'closeLabel', type: 'string', default: "'Close'", description: "DialogHeader's × button name. DialogHeader's children are the title, which names the dialog." },
      { name: 'DialogClose', type: 'ButtonProps', description: 'A Button (outline neutral by default) that closes the dialog. The × is one too.' },
      { name: 'ref', type: 'Ref<HTMLDialogElement>', description: 'Goes to the native <dialog>.' },
    ],
    a11y: [
      "Built on the native <dialog> with showModal(): the browser shows it above everything and makes the page behind inert, so it can't be clicked, focused or read by a screen reader until the dialog closes.",
      'On open, focus moves to the element with data-autofocus, or else the first focusable element (the ×). Tab and Shift+Tab stay inside the dialog.',
      'Esc closes it, as do the × and any DialogClose. When it closes, focus goes back to whatever opened it.',
      'The title (DialogHeader) names it and DialogBody describes it, so a screen reader reads both when it opens. With alert it is an alertdialog.',
      'The page behind does not scroll while it is open.',
      'The fold-out and fold-in are visual only; with reduced motion turned on, the dialog simply appears and disappears.',
      'In forced-colors mode (Windows high contrast), the title bar and border use the system colors.',
    ],
  },
};
