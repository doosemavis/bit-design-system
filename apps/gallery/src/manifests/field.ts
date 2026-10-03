import { Field } from '@bit-ds/react';
import type { Manifest } from './types';

export const field: Manifest = {
  name: 'Field',
  slug: 'field',
  group: 'forms',
  component: Field,
  description: 'A label, an optional hint and an error around one Input or Select. It wires the ids, so screen readers read them.',
  controls: [
    { kind: 'text', prop: 'label', default: 'Email', alwaysPrint: true },
    { kind: 'text', prop: 'hint', default: '' },
    { kind: 'text', prop: 'error', default: '' },
    { kind: 'boolean', prop: 'required', default: false },
  ],
  children: [{ component: 'Input', props: { type: 'email', placeholder: 'you@example.com' } }],
  presets: [
    { label: 'With a hint', state: { hint: 'We never share it.' } },
    { label: 'With an error', state: { error: 'Enter your email.' } },
    { label: 'Required', state: { required: true } },
  ],
  docs: {
    badges: ['Wires the ids', 'One Input or Select'],
    usage: {
      do: [
        'Wrap every Input and Select in a Field, so it has a visible label.',
        'Use hint for help that is always true, and error for what went wrong and how to fix it.',
      ],
      dont: [
        'Wrap a Switch in a Field; Switch carries its own label.',
        'Rely on the placeholder as the label. It disappears as soon as someone types.',
      ],
    },
    props: [
      { name: 'label', type: 'ReactNode', description: 'Required. The visible label, tied to the control with for and id.' },
      { name: 'hint', type: 'ReactNode', description: 'Help text under the control, read as its description.' },
      {
        name: 'error',
        type: 'ReactNode',
        description: 'Shown under the control in danger text. It marks the control invalid and is read as its description.',
      },
      {
        name: 'required',
        type: 'boolean',
        default: 'false',
        description: 'Shows a "*" (hidden from screen readers) and passes required to the control.',
      },
      { name: 'children', type: 'ReactElement', description: 'Exactly one Input or Select.' },
    ],
    a11y: [
      'The label points at the control, so clicking it focuses the control and screen readers read it.',
      'hint and error are linked with aria-describedby, and error also sets aria-invalid on the control.',
      'The ids come from useId, so two Fields on one page never clash.',
    ],
  },
};
