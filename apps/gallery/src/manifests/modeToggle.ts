import { ModeToggle } from '@bit-ds/react';
import type { Manifest } from './types';

export const modeToggle: Manifest = {
  name: 'ModeToggle',
  slug: 'modetoggle',
  group: 'components',
  component: ModeToggle,
  description: 'The light/dark switch. It follows your system until you click, then remembers. Try it: it switches this whole site.',
  controls: [{ kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' }],
};
