import { SIZES, Textarea } from '@bit-ds/react';
import type { Manifest } from './types';
import { TextareaExamples } from '../pages/forms/TextareaExamples';

export const textarea: Manifest = {
  name: 'Textarea',
  slug: 'textarea',
  group: 'forms',
  component: Textarea,
  description: 'A native multi-line text box, recessed like Input. Put it in a Field for a visible label. People can drag it taller.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Message', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'Tell us what happened', alwaysPrint: true },
    { kind: 'number', prop: 'rows', default: 3, min: 2, max: 8, step: 1 },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'readOnly', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  extraSection: { id: 'section-examples', title: 'Examples', Component: TextareaExamples },
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Six rows', state: { rows: '6' } },
    { label: 'Read-only', state: { readOnly: true } },
  ],
  docs: {
    badges: ['Native <textarea>', 'Recessed', 'Grows downward'],
    usage: {
      do: [
        'Use a Textarea for answers longer than a line: a message, a description, feedback.',
        'Put it in a Field for a visible label, a hint and an error.',
        'Set rows to the length of a typical answer.',
      ],
      dont: [
        'Use it for one line of text, such as a name or an email. Use an Input.',
        'Rely on the placeholder for instructions; it disappears as soon as someone types.',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and side padding. The height is rows, never less than the size’s control height.' },
      {
        name: 'aria-label',
        type: 'string',
        description: "Names the textarea when there's no visible label. Inside a Field, leave it off: the Field's label names it.",
      },
      { name: 'placeholder', type: 'string', description: 'An example shown while it is empty.' },
      { name: 'rows', type: 'number', default: '3', description: 'How many lines tall it starts. People can drag it taller, never wider.' },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks the value wrong: aria-invalid="true" and a danger border. A Field with an error does the same.',
      },
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: "The native readonly attribute: the text can be read, selected and copied at full strength, but not edited. A dashed edge, no recess.",
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be edited or focused, and is faded." },
    ],
    a11y: [
      'A real <textarea>, so typing, Enter for a new line, spellcheck and autofill work as browsers intend.',
      "Inside a Field it takes the Field's id, hint and error, so screen readers read all three.",
      'In forced-colors mode (Windows high contrast), the system replaces the red border color, so an invalid textarea shows a thick 10px start edge instead.',
    ],
  },
};
