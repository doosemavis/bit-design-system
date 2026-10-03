import { SIZES, Select } from '@bit-ds/react';
import type { Manifest } from './types';

export const select: Manifest = {
  name: 'Select',
  slug: 'select',
  group: 'forms',
  component: Select,
  description: 'The browser’s own select, styled like Input. The option list stays native, so every keyboard and screen reader works.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Color', label: 'aria-label' },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: [
    { component: 'option', props: { value: 'primary' }, children: 'primary' },
    { component: 'option', props: { value: 'success' }, children: 'success' },
    { component: 'option', props: { value: 'danger' }, children: 'danger' },
  ],
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
};
