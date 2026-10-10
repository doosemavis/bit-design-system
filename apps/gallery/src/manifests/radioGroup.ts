import { RadioGroup, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';
import { RadioGroupExamples } from '../pages/forms/RadioGroupExamples';

const SHIPPING = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
  { value: 'pickup', label: 'Pick up in store' },
];

export const radioGroup: Manifest = {
  name: 'RadioGroup',
  slug: 'radiogroup',
  group: 'forms',
  component: RadioGroup,
  description: 'Pick exactly one of a few choices, all in view. Real radios in a fieldset: the arrow keys move the choice.',
  controls: [
    { kind: 'text', prop: 'legend', default: 'Shipping', alwaysPrint: true },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'legendHidden', default: false },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'required', default: false },
    { kind: 'boolean', prop: 'readOnly', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  fixedProps: { options: SHIPPING, defaultValue: 'standard' },
  parts: ['Radio'],
  extraSection: { id: 'section-examples', title: 'Examples', Component: RadioGroupExamples },
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Read-only', state: { readOnly: true } },
    { label: 'Small', state: { size: 'sm' } },
  ],
  docs: {
    badges: ['Native radios', 'Arrow keys', 'Joins a Field'],
    usage: {
      do: [
        'Use a RadioGroup for one choice out of two to six that people should compare side by side.',
        'Put it in a Field for a label, a hint and an error; leave legend off there, the Field label names the group.',
        'Leave nothing chosen when there is no safe default, and mark it required.',
      ],
      dont: [
        'Use it for more than about six choices. Use a Select.',
        'Use it for a yes or no. Use a Checkbox, or a Switch for a setting that applies at once.',
      ],
    },
    props: [
      { name: 'legend', type: 'ReactNode', description: 'Names the group, read by screen readers. Inside a Field, leave it off: the Field label names the group.' },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Dot and label size: a 16, 20 or 24px dot.' },
      { name: 'legendHidden', type: 'boolean', default: 'false', description: 'Hides the legend from sight. It is still read.' },
      { name: 'options', type: 'readonly { value: string; label: ReactNode; disabled?: boolean }[]', description: 'The choices, in order. Or pass <Radio value> children instead.' },
      { name: 'value', type: 'string', description: 'The chosen value, when the parent owns it. Use with onValueChange, or use defaultValue.' },
      { name: 'defaultValue', type: 'string', description: 'The first chosen value, when the group owns it. Unset, nothing is chosen.' },
      { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new value when the choice changes.' },
      { name: 'name', type: 'string', description: 'The name the radios share, submitted with the chosen value. Unset, a unique one is generated.' },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks the choice wrong: aria-invalid="true" on the group and a danger edge on every dot. A Field with an error does the same.',
      },
      { name: 'required', type: 'boolean', default: 'false', description: 'One must be chosen before the form submits: required on every radio, aria-required on the group.' },
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: 'Shows the choice at full strength and stays in the Tab order, but clicks and the arrow keys change nothing. Rendered as aria-readonly on the group, with dashed dots.',
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'The fieldset’s native disabled attribute: every radio is faded and out of the Tab order.' },
      { name: 'children', type: 'ReactNode', description: 'Radio elements, each with a value and its label, when there is no options.' },
    ],
    a11y: [
      'Native radios in a fieldset with role="radiogroup", so Tab enters and leaves the group in one stop and the arrow keys move the choice.',
      'The legend, or the Field label around it, names the group; each radio is named by its own label.',
      "Inside a Field the hint and error describe the group, the error marks it invalid, and required reaches every radio. The Field's label names the group by id, since a label can't point at a group.",
      'In forced-colors mode (Windows high contrast) the chosen dot keeps a system highlight fill, and an invalid group double-edged dots.',
    ],
  },
};
