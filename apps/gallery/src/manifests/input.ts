import { createElement } from 'react';
import { Box, Button, Field, Heading, Input, SIZES, Stack } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

export const input: Manifest = {
  name: 'Input',
  slug: 'input',
  group: 'forms',
  related: ['field', 'textarea', 'select'],
  component: Input,
  description:
    'A one-line text box for short answers, such as a name or an email. Put it in a Field to give it a visible label.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'select', prop: 'type', values: ['text', 'email', 'search', 'password'], default: 'text' },
    { kind: 'text', prop: 'aria-label', default: 'Email', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'you@example.com', alwaysPrint: true },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'readOnly', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Search', state: { type: 'search', 'aria-label': 'Search', placeholder: 'Search components' } },
    { label: 'Read-only', state: { readOnly: true } },
    { label: 'Disabled', state: { disabled: true } },
  ],
  anatomy: {
    parts: [
      {
        label: 'Edge',
        selector: '.bit-input',
        tokens: ['--bit-border-width', '--bit-color-line', '--bit-radius-10px'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.68 },
        off: { '--bit-border-width': '0px' },
      },
      {
        label: 'Face',
        selector: '.bit-input',
        tokens: ['--bit-color-surface', '--bit-shadow-inset'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.3, leave: 'top' },
        off: { '--bit-color-surface': 'transparent', '--bit-shadow-inset': 'none' },
      },
      {
        label: 'Size',
        selector: '.bit-input',
        tokens: ['--bit-control-height-md'],
        side: 'left',
        touch: { kind: 'bracket', edge: 'left' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Invalid', state: { invalid: true } },
      { label: 'Read-only', state: { readOnly: true } },
      { label: 'Disabled', state: { disabled: true } },
    ],
    scene: {
      caption: 'In use: the email box of a sign-in form',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 16 },
            createElement(ScenePiece, null, createElement(Heading, { size: 20 }, 'Sign in')),
            createElement(Field, { label: 'Email', children: instance }),
            createElement(
              ScenePiece,
              null,
              createElement(Field, { label: 'Password', children: createElement(Input, { type: 'password' }) }),
            ),
            createElement(
              Stack,
              { direction: 'row', gap: 12, justify: 'end' },
              createElement(ScenePiece, null, createElement(Button, null, 'Sign in')),
            ),
          ),
        ),
    },
  },
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
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: 'The native readonly attribute: the value can be read, selected and copied at full strength, and is submitted, but not edited. A dashed edge, no recess.',
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be edited or focused." },
    ],
    a11y: [
      'A real <input>, so typing, autofill and the keyboard work as browsers intend.',
      "Inside a Field it takes the Field's id, hint and error, so screen readers read all three.",
      'A read-only input stays in the Tab order and screen readers say it is read-only; a disabled one is skipped.',
      'In forced-colors mode (Windows high contrast), the system replaces the red border color, so an invalid input shows a thick 10px start edge instead.',
    ],
  },
};
