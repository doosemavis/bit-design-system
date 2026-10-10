import { Field } from '@bit-ds/react';
import type { ChildSpec, Manifest } from './types';

/** Field's children, one per control it can wrap. The Select's and RadioGroup's options print as one `const options`. */
const INPUT_CHILD: ChildSpec = { component: 'Input', props: { type: 'email', placeholder: 'you@example.com' } };
const TEXTAREA_CHILD: ChildSpec = { component: 'Textarea', props: { placeholder: 'Tell us more' } };
const CHECKBOX_CHILD: ChildSpec = { component: 'Checkbox', children: 'I agree to the terms' };
const SWITCH_CHILD: ChildSpec = { component: 'Switch', children: 'Email me' };
const RADIO_CHILD: ChildSpec = {
  component: 'RadioGroup',
  props: {
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'express', label: 'Express' },
    ],
  },
};
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

const CHILDREN: Readonly<Record<string, ChildSpec>> = {
  Input: INPUT_CHILD,
  Textarea: TEXTAREA_CHILD,
  Select: SELECT_CHILD,
  Checkbox: CHECKBOX_CHILD,
  RadioGroup: RADIO_CHILD,
  Switch: SWITCH_CHILD,
};

export const field: Manifest = {
  name: 'Field',
  slug: 'field',
  group: 'forms',
  related: ['input', 'select', 'textarea', 'checkbox'],
  component: Field,
  description: 'A label, an optional hint and an error around one form control. It wires the ids, so screen readers read them.',
  controls: [
    {
      kind: 'select',
      prop: 'control',
      label: 'control',
      values: ['Input', 'Textarea', 'Select', 'Checkbox', 'RadioGroup', 'Switch'],
      default: 'Input',
      virtual: true,
    },
    { kind: 'text', prop: 'label', default: 'Email', alwaysPrint: true },
    { kind: 'text', prop: 'hint', default: '' },
    { kind: 'text', prop: 'error', default: '' },
    { kind: 'boolean', prop: 'required', default: false },
  ],
  deriveChildren: (state) => [CHILDREN[String(state.control)] ?? INPUT_CHILD],
  // A Select's markup needs React, so the HTML tab hides while it is the child.
  interactive: (state) => state.control === 'Select',
  presets: [
    { label: 'With a hint', state: { hint: 'We never share it.' } },
    { label: 'With an error', state: { error: 'Enter your email.' } },
    { label: 'Required', state: { required: true } },
    { label: 'Select', state: { control: 'Select', label: 'Favorite color', hint: 'We use it for your avatar.' } },
    { label: 'Radio group', state: { control: 'RadioGroup', label: 'Shipping', error: 'Pick a shipping option.', required: true } },
  ],
  docs: {
    badges: ['Wires the ids', 'One control'],
    usage: {
      do: [
        'Wrap every Input, Textarea, Select and RadioGroup in a Field, so it has a visible label.',
        'Wrap a Checkbox or Switch in a Field when it needs a hint or an error; the Field label and its own are both read.',
        'Use hint for help that is always true, and error for what went wrong and how to fix it.',
      ],
      dont: [
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
      { name: 'children', type: 'ReactElement', description: 'Exactly one control: Input, Textarea, Select, Checkbox, RadioGroup or Switch.' },
    ],
    a11y: [
      'The label points at the control, so clicking it focuses the control and screen readers read it. For a Select, clicking the label also opens the list.',
      "A RadioGroup is a group, which a label can't point at, so the Field's label names it by id (aria-labelledby) instead.",
      "hint and error are linked with aria-describedby, which is how a screen reader finds a control's help text.",
      'error also sets aria-invalid on the control: a flag that tells screen readers the value is wrong.',
      "The ids come from useId, React's unique-id helper, so two Fields on one page never clash.",
    ],
  },
};
