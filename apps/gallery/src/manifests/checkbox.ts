import { createElement } from 'react';
import { SIZES, Box, Checkbox, Heading, Stack } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';
import { CheckboxExamples } from '../pages/forms/CheckboxExamples';

export const checkbox: Manifest = {
  name: 'Checkbox',
  slug: 'checkbox',
  related: ['switch', 'radiogroup', 'field'],
  group: 'forms',
  component: Checkbox,
  description:
    'A tick box for a yes or no inside a form, such as agreeing to the terms. Click its label or press Space to tick it.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'indeterminate', default: false },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'readOnly', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: 'Remember me',
  extraSection: { id: 'section-examples', title: 'Examples', Component: CheckboxExamples },
  presets: [
    { label: 'Indeterminate', state: { indeterminate: true } },
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Read-only', state: { readOnly: true } },
    { label: 'Large', state: { size: 'lg' } },
  ],
  anatomy: {
    parts: [
      {
        label: 'Edge',
        selector: '.bit-checkbox__box',
        tokens: ['--bit-border-width', '--bit-radius-6px'],
        side: 'left',
        touch: { kind: 'ring', edge: 'left', at: 0.5 },
        off: { '--bit-border-width': '0px' },
      },
      {
        label: 'Face',
        selector: '.bit-checkbox__box',
        tokens: ['--bit-color-surface'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.5, leave: 'top' },
        off: { '--bit-color-surface': 'transparent' },
      },
      {
        label: 'Shadow',
        selector: '.bit-checkbox__box',
        tokens: ['--bit-shadow-sm'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.7 },
        off: { '--bit-shadow-sm': 'none' },
      },
      {
        label: 'Label',
        selector: '.bit-checkbox__label',
        tokens: ['--bit-color-text', '--bit-weight-normal'],
        side: 'right',
        touch: { kind: 'text', edge: 'bottom', at: 0.5, leave: 'right' },
        off: { '--bit-color-text': 'transparent' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Indeterminate', state: { indeterminate: true } },
      { label: 'Invalid', state: { invalid: true } },
      { label: 'Read-only', state: { readOnly: true } },
      { label: 'Disabled', state: { disabled: true } },
    ],
    scene: {
      caption: 'In use: a settings list',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 16 },
            createElement(ScenePiece, null, createElement(Heading, { size: 20 }, 'Account settings')),
            createElement(ScenePiece, null, createElement(Checkbox, { defaultChecked: true }, 'Show my name')),
            instance,
            createElement(ScenePiece, null, createElement(Checkbox, null, 'Email me updates')),
          ),
        ),
    },
  },
  docs: {
    badges: ['Native <input type="checkbox">', 'Own label', 'Joins a Field'],
    usage: {
      do: [
        'Use a Checkbox for a choice that is sent with a form: "I agree to the terms", "Email me updates".',
        'Write the label as the thing that is true when it is ticked.',
        'Put it in a Field for a hint or an error; the Field label and its own label are both read.',
      ],
      dont: [
        'Use a Checkbox for a setting that takes effect at once. Use a Switch.',
        'Use several Checkboxes for a choice of exactly one. Use a RadioGroup.',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Box and label size: a 16, 20 or 24px box. The class goes on the label.' },
      { name: 'checked', type: 'boolean', description: 'Ticked or not, when the parent owns the value. Pair it with onCheckedChange, or use defaultChecked.' },
      { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Whether it starts ticked, when the Checkbox owns the value.' },
      {
        name: 'indeterminate',
        type: 'boolean',
        default: 'false',
        description: 'Shows a bar instead of a tick: some of what it stands for, not all (a "Select all" over a list). Screen readers say "mixed".',
      },
      { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Called with the new state when it is ticked or cleared.' },
      { name: 'onChange', type: '(event: ChangeEvent<HTMLInputElement>) => void', description: 'The native change event. It runs before onCheckedChange.' },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks it wrong: aria-invalid="true" and a danger edge on the box. A Field with an error does the same.',
      },
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: 'Shows its state at full strength and stays in the Tab order, but a click or Space changes nothing. Rendered as aria-readonly, with a dashed edge.',
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be changed or focused, and is faded." },
      { name: 'children', type: 'ReactNode', description: 'The visible label. Leave it off only with an aria-label, or inside a Field whose label says it all.' },
    ],
    a11y: [
      'A real <input type="checkbox">, so screen readers say "checkbox, checked" or "not checked", and Space toggles it.',
      'Clicking the label toggles it too, so the target is the whole line, not just the box.',
      "Inside a Field it takes the Field's id, hint and error, so screen readers read them, and required.",
      'In forced-colors mode (Windows high contrast) a ticked box keeps a system highlight fill, and an invalid box a double edge.',
    ],
    emptyChildrenError: 'A Checkbox needs a label, or screen readers announce just "checkbox".',
  },
};
