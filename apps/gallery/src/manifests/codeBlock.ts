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
};
