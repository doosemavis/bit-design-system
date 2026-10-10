import { Text } from '@bit-ds/react';
import { SUPPORTED_TEXT_SIZES } from '../content/textSizes';
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
  description: 'Typography. The element comes from `as`; the look comes from `size`, in px. Heading works the same way, for titles.',
  controls: [
    // No h1 to h6: the API takes them, but a title belongs to Heading, so the playground doesn't offer them.
    {
      kind: 'select',
      prop: 'as',
      values: ['p', 'span', 'div', 'label'],
      default: 'p',
      hint: 'For a title, use Heading: as="h2" and the same size.',
    },
    { kind: 'select', prop: 'size', values: SUPPORTED_TEXT_SIZES.map(String), default: '16', numeric: true },
    { kind: 'select', prop: 'color', values: ['default', 'neutral'], default: 'default', label: 'color' },
    { kind: 'select', prop: 'weight', values: ['normal', 'bold'], default: 'normal', lock: weightLock },
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
      ],
      dont: [
        'Use Text for a section title, even a big one. Use Heading as="h2": same size prop, and it joins the page outline.',
        'Use size to make body text tiny; 14 is the smallest, for hints and captions.',
      ],
    },
    props: [
      {
        name: 'as',
        type: "'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
        default: "'p'",
        description:
          'Which element to render. The look comes from size, not from the tag. h1 to h6 work, but a title belongs in Heading, which takes the same as and size.',
      },
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
      { name: 'children', type: 'ReactNode', description: 'The text.' },
    ],
    a11y: [
      'Text renders the element you choose, so as="p" is a paragraph to screen readers.',
      'A big Text is still not a heading. Screen-reader users move through a page by its headings, so titles need Heading.',
    ],
  },
};
