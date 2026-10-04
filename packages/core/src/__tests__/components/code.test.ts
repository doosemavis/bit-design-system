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

  it('inside a Table, Code drops the pill and is plain mono text in the code-text colour', () => {
    const rule = block(css, '.bit-table .bit-code')!;
    const lines = rule.split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(['padding: 0;', 'background: none;', 'border: 0;', 'color: var(--bit-color-code-text);']);
  });

  it('the base pill is unchanged outside tables', () => {
    const lines = block(css, '.bit-code')!.split('\n').map((l) => l.trim()).filter((l) => l.endsWith(';'));
    expect(lines).toContain('padding: 1px 6px;');
    expect(lines).toContain('border: 2px solid var(--bit-color-accent);');
    expect(lines).toContain('background: var(--bit-color-neutral-soft);');
    expect(lines).toContain('color: var(--bit-color-text);');
  });
});
