import { Alert, COLORS } from '@bit-ds/react';
import type { Manifest } from './types';

export const alert: Manifest = {
  name: 'Alert',
  slug: 'alert',
  group: 'Components',
  component: Alert,
  description: 'A message with an optional heading. Outline uses the soft background; solid fills.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'variant', values: ['solid', 'outline'], default: 'outline' },
    { kind: 'text', prop: 'title', default: 'Heads up' },
  ],
  children: 'Your changes were saved.',
  presets: [
    { label: 'Danger solid', state: { color: 'danger', variant: 'solid', title: 'Something broke' } },
    { label: 'No title', state: { title: '' } },
  ],
};
