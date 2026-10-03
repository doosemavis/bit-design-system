import { CodeBlock } from '@bit-ds/react';
import type { CodeLanguage } from '@bit-ds/react';
import type { Manifest } from './types';

const LANGUAGES: readonly CodeLanguage[] = ['jsx', 'html', 'css', 'shell'];

export const codeBlock: Manifest = {
  name: 'CodeBlock',
  slug: 'codeblock',
  group: 'components',
  component: CodeBlock,
  description: 'A dark code panel with editor colors, a language label and a Copy button. JSX, HTML, CSS and shell.',
  controls: [
    { kind: 'select', prop: 'language', values: LANGUAGES, default: 'jsx', alwaysPrint: true },
    { kind: 'text', prop: 'code', default: 'const coins = 42; // collected', alwaysPrint: true },
    { kind: 'boolean', prop: 'copy', default: true },
  ],
  presets: [
    { label: 'CSS', state: { language: 'css', code: '.bit-button { height: 40px; }' } },
    { label: 'Shell', state: { language: 'shell', code: 'pnpm add @bit-ds/react' } },
    { label: 'No Copy button', state: { copy: false } },
  ],
  docs: {
    badges: ['Copy button', 'jsx · html · css · shell'],
    usage: {
      do: [
        'Use CodeBlock for anything people should copy: install commands, snippets, config.',
        'Give each CodeBlock a unique label when a page has several in the same language.',
      ],
      dont: [
        'Use CodeBlock for a word or two in a sentence. Use Code.',
        'Turn copy off on a snippet people are meant to paste.',
      ],
    },
    props: [
      { name: 'code', type: 'string', description: 'Required. The code, exactly as written; it is also what Copy copies.' },
      {
        name: 'language',
        type: "'jsx' | 'html' | 'css' | 'shell'",
        description: 'Required. Picks the syntax colors and the label in the bar.',
      },
      { name: 'copy', type: 'boolean', default: 'true', description: 'Shows the Copy button.' },
      {
        name: 'label',
        type: 'string',
        default: '`${language} code`',
        description: 'The name of the code area, which is a region. Make it unique on the page.',
      },
      {
        name: 'actions',
        type: 'ReactNode',
        description: "Extra controls in the bar, between the language label and Copy, such as the gallery's package-manager switcher.",
      },
    ],
    a11y: [
      'The code area is a named, focusable region, so keyboard users can scroll long lines.',
      'Copy announces "Copied" or "Copy failed" through a hidden status line.',
    ],
  },
  interactive: true,
};
