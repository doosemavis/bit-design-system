import { Field } from '@bit-ds/react';
import type { ChildSpec, Manifest } from './types';

/** Field's two children. The Select's options print as one `const options`. */
const INPUT_CHILD: ChildSpec = { component: 'Input', props: { type: 'email', placeholder: 'you@example.com' } };
const SELECT_CHILD: ChildSpec = {
  component: 'Select',
  props: {
    placeholder: 'Pick a color',
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'neutral', label: 'Neutral' },
      { value: 'success', label: 'Success' },
      { value: 'warning', label: 'Warning' },
      { value: 'danger', label: 'Danger' },
    ],
  },
};

export const field: Manifest = {
  name: 'Field',
  slug: 'field',
  group: 'forms',
  component: Field,
  description: 'A label, an optional hint and an error around one Input or Select. It wires the ids, so screen readers read them.',
  controls: [
    { kind: 'select', prop: 'control', label: 'control', values: ['Input', 'Select'], default: 'Input', virtual: true },
    { kind: 'text', prop: 'label', default: 'Email', alwaysPrint: true },
    { kind: 'text', prop: 'hint', default: '' },
    { kind: 'text', prop: 'error', default: '' },
    { kind: 'boolean', prop: 'required', default: false },
  ],
  deriveChildren: (state) => [state.control === 'Select' ? SELECT_CHILD : INPUT_CHILD],
  // A Select's markup needs React, so the HTML tab hides while it is the child.
  interactive: (state) => state.control === 'Select',
  presets: [
    { label: 'With a hint', state: { hint: 'We never share it.' } },
    { label: 'With an error', state: { error: 'Enter your email.' } },
    { label: 'Required', state: { required: true } },
    { label: 'Select', state: { control: 'Select', label: 'Favorite color', hint: 'We use it for your avatar.' } },
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
      'The label points at the control, so clicking it focuses the control and screen readers read it. For a Select, clicking the label also opens the list.',
      "hint and error are linked with aria-describedby, which is how a screen reader finds a control's help text.",
      'error also sets aria-invalid on the control: a flag that tells screen readers the value is wrong.',
      "The ids come from useId, React's unique-id helper, so two Fields on one page never clash.",
    ],
  },
};
