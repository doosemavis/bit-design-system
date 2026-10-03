import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/code.css', () => {
  const css = readCss('components/code.css');

  it('inline code is a mono chip at 0.9em without ligatures, in the regular mono weight', () => {
    const root = block(css, '.bit-code')!;
    for (const line of [
      'font-family: var(--bit-font-mono);',
      'font-size: 0.9em;',
      'font-weight: 400;',
      'font-variant-ligatures: none;',
      'padding: 1px 6px;',
      'border-radius: var(--bit-radius-6px);',
      'background: var(--bit-color-neutral-soft);',
      'color: var(--bit-color-text);',
    ]) {
      expect(root).toContain(line);
    }
  });

  it('the border is 2px in the mode accent (decision 3)', () => {
    expect(block(css, '.bit-code')).toContain('border: 2px solid var(--bit-color-accent);');
  });
});
