import { Code } from '@bit-ds/react';
import type { Manifest } from './types';

export const code: Manifest = {
  name: 'Code',
  slug: 'code',
  group: 'components',
  component: Code,
  description: 'Inline code: a small mono chip inside running text. The border follows the mode accent.',
  controls: [],
  children: 'color="danger"',
  docs: {
    badges: ['Inline <code>', 'Mono'],
    usage: {
      do: [
        'Use Code for a prop, a value or a file name inside a sentence: color="danger".',
        'Keep it to a few words.',
        'Inside a Table, Code shows as plain colored mono text, without the pill; in running text it keeps the pill.',
      ],
      dont: [
        'Use Code for more than one line. Use CodeBlock.',
        'Use Code for emphasis.',
      ],
    },
    props: [{ name: 'children', type: 'ReactNode', description: 'The code, shown exactly as written.' }],
    a11y: [
      'A real <code> element; screen readers read it as part of the sentence.',
      'The accent border follows the mode, and the text keeps full contrast in both modes.',
    ],
  },
};
