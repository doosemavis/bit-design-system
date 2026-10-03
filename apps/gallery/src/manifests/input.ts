import { Input, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';

export const input: Manifest = {
  name: 'Input',
  slug: 'input',
  group: 'forms',
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
};
