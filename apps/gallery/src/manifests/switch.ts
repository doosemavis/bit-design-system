import { Switch } from '@bit-ds/react';
import type { Manifest } from './types';

/** `switch` is a reserved word, so this manifest is `switchManifest`. */
export const switchManifest: Manifest = {
  name: 'Switch',
  slug: 'switch',
  group: 'forms',
  component: Switch,
  description: 'An on/off switch. A real checkbox announced as a switch: click the label or press Space. Green when on.',
  controls: [
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: 'Wi-Fi',
  presets: [
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
};
