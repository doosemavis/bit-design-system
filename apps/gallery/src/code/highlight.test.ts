import { describe, it, expect } from 'vitest';
import { highlight } from './highlight';

describe('highlight', () => {
  it('splits JSX into tag, attr, string, punct, and text tokens that reassemble to the input', () => {
    const code = `<Button color="danger" loading>Save</Button>`;
    const tokens = highlight(code);
    expect(tokens.map((t) => t.text).join('')).toBe(code);
    expect(tokens).toEqual([
      { kind: 'punct', text: '<' },
      { kind: 'tag', text: 'Button' },
      { kind: 'text', text: ' ' },
      { kind: 'attr', text: 'color' },
      { kind: 'punct', text: '=' },
      { kind: 'string', text: '"danger"' },
      { kind: 'text', text: ' ' },
      { kind: 'attr', text: 'loading' },
      { kind: 'punct', text: '>' },
      { kind: 'text', text: 'Save' },
      { kind: 'punct', text: '</' },
      { kind: 'tag', text: 'Button' },
      { kind: 'punct', text: '>' },
    ]);
  });

  it('handles HTML class attributes, self-closing tags, braces, and import lines', () => {
    const code = `import { Button } from '@bit-ds/react';\n\n<span class="bit-badge bit-md" data-x="" />\n<BitLogo era={32} />`;
    const tokens = highlight(code);
    expect(tokens.map((t) => t.text).join('')).toBe(code);
    expect(tokens.some((t) => t.kind === 'string' && t.text === `'@bit-ds/react'`)).toBe(true);
    expect(tokens.some((t) => t.kind === 'attr' && t.text === 'data-x')).toBe(true);
    expect(tokens.some((t) => t.kind === 'punct' && t.text === '/>')).toBe(true);
    expect(tokens.some((t) => t.kind === 'punct' && t.text === '{')).toBe(true);
  });
});
