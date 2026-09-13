import { SPACE_STEPS, Stack } from '@bit/react';
import type { Manifest } from './types';

export const stack: Manifest = {
  name: 'Stack',
  slug: 'stack',
  group: 'Components',
  component: Stack,
  description: 'Flex layout on the 4px space scale. Every prop is a data attribute, never a class.',
  controls: [
    { kind: 'select', prop: 'direction', values: ['column', 'row'], default: 'column' },
    { kind: 'select', prop: 'gap', values: SPACE_STEPS.map(String), default: '3', numeric: true },
    { kind: 'select', prop: 'align', values: ['stretch', 'start', 'center', 'end'], default: 'stretch' },
    { kind: 'select', prop: 'justify', values: ['start', 'center', 'end', 'between'], default: 'start' },
    { kind: 'boolean', prop: 'wrap', default: false },
  ],
  children: [
    { component: 'Badge', props: { color: 'primary' }, children: 'One' },
    { component: 'Badge', props: { color: 'success' }, children: 'Two' },
    { component: 'Badge', props: { color: 'danger' }, children: 'Three' },
  ],
  presets: [
    { label: 'Row, centered', state: { direction: 'row', align: 'center', gap: '4' } },
    { label: 'Row, space between', state: { direction: 'row', justify: 'between' } },
  ],
};
