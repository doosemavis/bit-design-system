import { TEXT_SIZES, Text } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { TextExamples } from '../pages/text/TextExamples';

/** 24, 32 and 40 switch to the display face, which ships one weight (text.css), so weight does nothing there. */
const DISPLAY_SIZES: readonly string[] = ['24', '32', '40'];

function weightLock(state: ControlState): string | undefined {
  return DISPLAY_SIZES.includes(String(state.size))
    ? '24, 32 and 40 use the display face, which has one weight. Pick 14, 16 or 18 to set the weight.'
    : undefined;
}

export const text: Manifest = {
  name: 'Text',
  slug: 'text',
  group: 'components',
  component: Text,
  description: 'Body copy, labels and captions. size is the look, in px. A Text inside another Text renders inline. For titles, use Heading.',
  controls: [
    { kind: 'select', prop: 'size', values: TEXT_SIZES.map(String), default: '16', numeric: true },
    { kind: 'select', prop: 'color', values: ['default', 'neutral'], default: 'default', label: 'color' },
    { kind: 'select', prop: 'weight', values: ['normal', 'bold'], default: 'normal', lock: weightLock },
    { kind: 'boolean', prop: 'italic', default: false },
    { kind: 'boolean', prop: 'underline', default: false },
    { kind: 'boolean', prop: 'strikethrough', default: false },
  ],
  children: 'The quick brown fox jumps over the lazy dog.',
  extraSection: { id: 'section-examples', title: 'Examples', Component: TextExamples },
  presets: [
    { label: 'Display text', state: { size: '32' } },
    { label: 'Muted caption', state: { size: '14', color: 'neutral' } },
  ],
  docs: {
    badges: ['Typography', 'size in px'],
    usage: {
      do: [
        'Use Text for body copy, labels and captions; pick the look with size.',
        'Use color="neutral" for hints and captions that should step back.',
        'Pick out words in a sentence with a Text inside it: weight="bold", italic, underline or strikethrough.',
      ],
      dont: [
        'Use Text for a section title, even a big one. Use Heading: same size prop, and it joins the page outline.',
        'Use size to make body text tiny; 14 is the smallest, for hints and captions.',
        "Underline something people can't click: it reads as a link. A link is Link.",
      ],
    },
    props: [
      {
        name: 'size',
        type: '14 | 16 | 18 | 24 | 32 | 40',
        default: '16',
        description:
          'Text size in px, from the even type scale. Rendered as data-size; reads --bit-text-{size}px. 24, 32 and 40 use the display face. 11, 13 and 15 are deprecated: they render as 14, 14 and 16, and will be removed in 0.2.0.',
      },
      { name: 'color', type: "'neutral'", description: 'neutral renders muted text. Leave it off for the normal text color.' },
      {
        name: 'weight',
        type: "'normal' | 'bold'",
        default: "'normal'",
        description: 'Rendered as data-weight. No effect at 24, 32 and 40, where the display face has one weight.',
      },
      { name: 'italic', type: 'boolean', default: 'false', description: "Italic. Rendered as data-italic. Body sizes use Nunito's own italic; at 24, 32 and 40 the browser slants the display face." },
      { name: 'underline', type: 'boolean', default: 'false', description: "A thin underline, lighter than Link's. Rendered as data-underline. For emphasis, not for something to click." },
      { name: 'strikethrough', type: 'boolean', default: 'false', description: 'A line through the text, for something removed or no longer true. Rendered as data-strikethrough.' },
      { name: 'children', type: 'ReactNode', description: 'The text. A Text inside it renders a <span>, for bold, italic or muted words in a sentence.' },
      {
        name: 'as',
        type: "'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
        description:
          'Deprecated: Text picks its element. It renders a <p>, or a <span> inside a Text, Heading, Button or Link. Still works, with a dev warning. Removed in 0.2.0.',
      },
    ],
    a11y: [
      'Text renders a <p>, a paragraph to screen readers. Inside a Text, Heading, Button or Link it renders a <span>, so it never breaks the sentence or the control.',
      'A big Text is still not a heading. Screen-reader users move through a page by its headings, so titles need Heading.',
    ],
  },
};
