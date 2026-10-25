import { createElement } from 'react';
import { Box, CodeBlock, Heading, Stack, Text } from '@bit-ds/react';
import type { CodeLanguage } from '@bit-ds/react';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import type { Manifest } from './types';

const BORDER = { border: '2px solid var(--bit-color-text)' };

const LANGUAGES: readonly CodeLanguage[] = ['jsx', 'tsx', 'ts', 'html', 'css', 'shell'];

export const codeBlock: Manifest = {
  name: 'CodeBlock',
  slug: 'codeblock',
  group: 'components',
  related: ['code'],
  component: CodeBlock,
  description:
    'Shows a snippet people can read and copy: a dark panel with editor colors, a language label and a Copy button.',
  controls: [
    { kind: 'select', prop: 'language', values: LANGUAGES, default: 'jsx', alwaysPrint: true },
    { kind: 'text', prop: 'code', default: 'const coins = 42; // collected', alwaysPrint: true },
    { kind: 'boolean', prop: 'copy', default: true },
  ],
  presets: [
    { label: 'TSX', state: { language: 'tsx', code: 'const [coins, setCoins] = useState<number>(42);' } },
    { label: 'CSS', state: { language: 'css', code: '.bit-button { height: 40px; }' } },
    { label: 'Shell', state: { language: 'shell', code: 'pnpm add @bit-ds/react' } },
    { label: 'No Copy button', state: { copy: false } },
  ],
  anatomy: {
    parts: [
      {
        label: 'Panel',
        selector: '.bit-code__block',
        tokens: ['--bit-code-bg', '--bit-radius-10px'],
        side: 'right',
        touch: { kind: 'fill', edge: 'right', at: 0.8, leave: 'right' },
        off: { '--bit-code-bg': 'transparent' },
      },
      {
        label: 'Edge',
        selector: '.bit-code__block',
        tokens: ['--bit-border-width', '--bit-color-accent'],
        side: 'left',
        step: 'Accent',
        touch: { kind: 'ring', edge: 'top', at: 0.12 },
        off: { '--bit-border-width': '0px' },
      },
      {
        label: 'Bar rule',
        selector: '.bit-code__bar',
        tokens: ['--bit-color-accent'],
        side: 'left',
        step: 'Accent',
        touch: { kind: 'ring', edge: 'bottom', at: 0.12, leave: 'left' },
        off: { '--bit-color-accent': 'transparent' },
      },
      {
        label: 'Shadow',
        selector: '.bit-code__block',
        tokens: ['--bit-shadow-md'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.6 },
        off: { '--bit-shadow-md': 'none' },
      },
      {
        label: 'Language label',
        selector: '.bit-code__lang',
        tokens: ['--bit-font-pixel'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.5 },
      },
      {
        label: 'Code text',
        selector: '.bit-code__pre',
        tokens: ['--bit-code-text'],
        side: 'right',
        step: 'Text',
        touch: { kind: 'text', edge: 'bottom', at: 0.45 },
        off: { '--bit-code-text': 'transparent' },
      },
      {
        label: 'Copy button',
        selector: '.bit-code__copy',
        tokens: ['--bit-color-ink', '--bit-code-text'],
        side: 'right',
        step: 'Text',
        touch: { kind: 'box', edge: 'bottom', at: 0.5 },
        off: { '--bit-color-ink': 'transparent' },
      },
      {
        label: 'Syntax',
        selector: '.bit-code__token[data-kind="keyword"]',
        tokens: ['--bit-code-keyword', '--bit-code-number', '--bit-code-comment'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.5 },
        off: { '--bit-code-keyword': 'transparent', '--bit-code-number': 'transparent', '--bit-code-comment': 'transparent' },
      },
      {
        label: 'Code font and size',
        selector: '.bit-code__pre',
        tokens: ['--bit-font-mono', '--bit-text-14px'],
        side: 'left',
        touch: { kind: 'text', edge: 'bottom', at: 0.2 },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'No Copy button', state: { copy: false } },
      { label: 'CSS', state: { language: 'css', code: '.bit-button { height: 40px; }' } },
    ],
    scene: {
      caption: 'In use: a snippet on a docs page',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: BORDER },
          createElement(
            Stack,
            { gap: 16 },
            createElement(
              ScenePiece,
              null,
              createElement(Stack, { gap: 8 }, createElement(Heading, { size: 24 }, 'Count your coins'), createElement(Text, null, 'Keep the total in a constant, then show it.')),
            ),
            instance,
            createElement(ScenePiece, null, createElement(Text, { color: 'neutral' }, 'Paste it anywhere in your component.')),
          ),
        ),
    },
  },
  docs: {
    badges: ['jsx, tsx, ts, html, css, shell'],
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
        type: "'jsx' | 'tsx' | 'ts' | 'html' | 'css' | 'shell'",
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
      'The Copy button is named "Copy <label>" (or "Copy <language> code" if there is no label), so screen readers distinguish several code blocks on a page. Copy results ("Copied" or "Copy failed") are announced through a shared, visually hidden live region.',
    ],
  },
  interactive: true,
};
