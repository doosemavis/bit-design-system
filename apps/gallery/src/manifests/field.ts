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
};
