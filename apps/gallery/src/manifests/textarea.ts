import { createElement } from 'react';
import { Box, Button, Field, Heading, Input, SIZES, Stack, Textarea } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';
import { TextareaExamples } from '../pages/forms/TextareaExamples';

export const textarea: Manifest = {
  name: 'Textarea',
  slug: 'textarea',
  related: ['input', 'field'],
  group: 'forms',
  component: Textarea,
  description:
    'A box for longer answers, such as a message or a comment. Put it in a Field for a visible label; people can drag it taller.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Message', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'Tell us what happened', alwaysPrint: true },
    { kind: 'number', prop: 'rows', default: 3, min: 2, max: 8, step: 1 },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'readOnly', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
    { kind: 'boolean', prop: 'showCount', default: false },
  ],
  // The count follows typing, which needs React, so the HTML tab hides while it shows.
  interactive: (state) => state.showCount === true,
  extraSection: { id: 'section-examples', title: 'Examples', Component: TextareaExamples },
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Six rows', state: { rows: '6' } },
    { label: 'Read-only', state: { readOnly: true } },
    { label: 'With a count', state: { showCount: true } },
  ],
  anatomy: {
    // The count only renders with showCount, so every pass builds with it on.
    base: { showCount: true },
    parts: [
      {
        label: 'Edge',
        selector: '.bit-textarea',
        tokens: ['--bit-border-width', '--bit-color-line', '--bit-radius-10px'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.68 },
        off: { '--bit-border-width': '0px' },
      },
      {
        label: 'Face',
        selector: '.bit-textarea',
        tokens: ['--bit-color-surface', '--bit-shadow-inset'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.3, leave: 'top' },
        off: { '--bit-color-surface': 'transparent', '--bit-shadow-inset': 'none' },
      },
      {
        label: 'Count',
        selector: '.bit-textarea__count',
        tokens: ['--bit-color-text-muted', '--bit-text-14px'],
        side: 'right',
        touch: { kind: 'text', edge: 'bottom', at: 0.88, leave: 'right' },
        off: { '--bit-color-text-muted': 'transparent' },
        offOn: 'part',
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Invalid', state: { invalid: true } },
      { label: 'Read-only', state: { readOnly: true } },
      { label: 'Disabled', state: { disabled: true } },
    ],
    scene: {
      caption: 'In use: the message box of a feedback form',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { gap: 16 },
            createElement(ScenePiece, null, createElement(Heading, { size: 20 }, 'Send feedback')),
            createElement(
              ScenePiece,
              null,
              createElement(Field, { label: 'Subject', children: createElement(Input, { placeholder: 'What is this about?' }) }),
            ),
            createElement(Field, { label: 'Message', children: instance }),
            createElement(
              Stack,
              { direction: 'row', gap: 12, justify: 'end' },
              createElement(ScenePiece, null, createElement(Button, null, 'Send')),
            ),
          ),
        ),
    },
  },
  docs: {
    badges: ['Native <textarea>', 'Recessed', 'Grows downward', 'Live count'],
    usage: {
      do: [
        'Use a Textarea for answers longer than a line: a message, a description, feedback.',
        'Put it in a Field for a visible label, a hint and an error.',
        'Set rows to the length of a typical answer.',
        'Add showCount when the length matters: with maxLength for a hard limit, or alone to show a running count.',
      ],
      dont: [
        'Use it for one line of text, such as a name or an email. Use an Input.',
        'Rely on the placeholder for instructions; it disappears as soon as someone types.',
        'Write the limit in the hint as well as the count. showCount already tells screen readers the limit.',
      ],
    },
    props: [
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and side padding. The height is rows, never less than the size’s control height.' },
      {
        name: 'aria-label',
        type: 'string',
        description: "Names the textarea when there's no visible label. Inside a Field, leave it off: the Field's label names it.",
      },
      { name: 'placeholder', type: 'string', description: 'An example shown while it is empty.' },
      {
        name: 'rows',
        type: 'number',
        default: '3',
        description: "How many lines tall it starts. People can drag it taller, never wider. Longer text scrolls inside, on bit's accent scrollbar.",
      },
      {
        name: 'maxLength',
        type: 'number',
        description: 'The native hard limit: typing and pasting stop at this many characters. With showCount, the count reads "136 / 140".',
      },
      {
        name: 'showCount',
        type: 'boolean',
        default: 'false',
        description:
          'Shows a live count under the box, at the right: "136 / 140" with maxLength, "42 characters" without. Inside a Field it shares the hint\'s row. With maxLength it turns warning with 10% left (data-state="near") and danger at the limit (data-state="limit"). Class: bit-textarea__count.',
      },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks the value wrong: aria-invalid="true" and a danger border. A Field with an error does the same.',
      },
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: "The native readonly attribute: the text can be read, selected and copied at full strength, but not edited. A dashed edge, no recess.",
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be edited or focused, and is faded." },
    ],
    a11y: [
      'A real <textarea>, so typing, Enter for a new line, spellcheck and autofill work as browsers intend.',
      "Inside a Field it takes the Field's id, hint and error, so screen readers read all three.",
      'In forced-colors mode (Windows high contrast), the system replaces the red border color, so an invalid textarea shows a thick 10px start edge instead.',
      'With showCount and maxLength, the limit is part of the description: "Up to 140 characters", read after the hint and error.',
      'The count is not read on every key. Screen readers hear it once at 20 characters left, once at 10 left, and at the limit ("Limit reached, 140 characters"), through one shared polite live region. Deleting back past a step lets it speak again.',
      'The visible count is hidden from screen readers, since the description and those announcements carry it. Near the limit it turns bold as well as warning or danger; in forced colors, where those colors are gone, near is underlined and the limit double underlined.',
    ],
  },
};
