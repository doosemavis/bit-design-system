import { Switch } from '@bit-ds/react';
import type { Manifest } from './types';

/** `switch` is a reserved word, so this manifest is `switchManifest`. */
export const switchManifest: Manifest = {
  name: 'Switch',
  slug: 'switch',
  group: 'forms',
  related: ['field', 'segmentedcontrol', 'modetoggle'],
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
  docs: {
    badges: ['role="switch"', 'Own label'],
    usage: {
      do: [
        'Use a Switch for a setting that takes effect at once: "Sound", "Wi-Fi".',
        'Write the label as the thing being turned on, not a question.',
      ],
      dont: [
        'Use a Switch in a form that needs a Submit; a checkbox says "this is part of the form" better.',
        'Wrap it in a Field; it carries its own label.',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Track size. The class goes on the label.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be toggled or focused." },
      {
        name: 'checked',
        type: 'boolean',
        description: 'On or off, when the parent owns the value. Pair it with onChange, or use defaultChecked.',
      },
      {
        name: 'defaultChecked',
        type: 'boolean',
        default: 'false',
        description: 'Whether it starts on, when the Switch owns the value.',
      },
      {
        name: 'onChange',
        type: '(event: ChangeEvent<HTMLInputElement>) => void',
        description: 'Called when it is toggled. Read event.target.checked for the new value.',
      },
      { name: 'children', type: 'ReactNode', description: 'The visible label.' },
    ],
    a11y: [
      'A real checkbox with role="switch" (it tells screen readers this is an on/off control, not a tick box), so they say "switch, on" or "switch, off".',
      'Clicking the label toggles it, and Space toggles it from the keyboard.',
    ],
    emptyChildrenError: 'A Switch needs a label, or screen readers announce just "switch, off".',
  },
};
