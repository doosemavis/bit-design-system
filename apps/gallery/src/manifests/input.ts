import { Input, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';

export const input: Manifest = {
  name: 'Input',
  slug: 'input',
  group: 'forms',
  related: ['field', 'select', 'switch'],
  component: Input,
  description: 'A native text input, recessed into the page. Put it in a Field for a visible label.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'select', prop: 'type', values: ['text', 'email', 'search', 'password'], default: 'text' },
    { kind: 'text', prop: 'aria-label', default: 'Email', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'you@example.com', alwaysPrint: true },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Search', state: { type: 'search', 'aria-label': 'Search', placeholder: 'Search components' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
  docs: {
    badges: ['Native <input>', 'Recessed'],
    usage: {
      do: [
        'Put Input in a Field for a visible label, a hint and an error.',
        'Pick the type that matches the data (email, search, password), so phones show the right keyboard.',
      ],
      dont: [
        'Use an Input with no Field and no aria-label: screen readers would announce just "edit text".',
        'Use the placeholder for instructions; it disappears as soon as someone types.',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height.' },
      { name: 'type', type: "'text' | 'email' | 'search' | 'password' | …", default: "'text'", description: 'The native input type.' },
      {
        name: 'aria-label',
        type: 'string',
        description: "Names the input when there's no visible label. Inside a Field, leave it off: the Field's label names it.",
      },
      { name: 'placeholder', type: 'string', description: 'An example value shown while the input is empty.' },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks the value wrong: aria-invalid="true" (a flag that tells screen readers the value is wrong) and a danger border. A Field with an error does the same.',
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be edited or focused." },
    ],
    a11y: [
      'A real <input>, so typing, autofill and the keyboard work as browsers intend.',
      "Inside a Field it takes the Field's id, hint and error, so screen readers read all three.",
      'In forced-colors mode (Windows high contrast), the system replaces the red border color, so an invalid input shows a thick 10px start edge instead.',
    ],
  },
};
