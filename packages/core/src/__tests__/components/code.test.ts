import { describe, it, expect } from 'vitest';
import { block, decl, readCss } from '../css';

describe('components/code.css', () => {
  const css = readCss('components/code.css');

  it('inline code is a mono chip at 0.9em (never under 13px) without ligatures, in the regular mono weight', () => {
    const root = block(css, '.bit-code')!;
    for (const line of [
      'font-family: var(--bit-font-mono);',
      'font-size: max(0.9em, var(--bit-text-13px));',
      'font-weight: 400;',
      'font-variant-ligatures: none;',
      'padding: 1px 6px;',
      'border-radius: var(--bit-radius-6px);',
      'background: var(--bit-code-inline-bg, var(--bit-code-bg));',
      'color: var(--bit-code-inline-text, var(--bit-code-text));',
    ]) {
      expect(root).toContain(line);
    }
  });

  it('the accent moves from the border to the text: the border is transparent, so it only shows in forced colours', () => {
    const root = block(css, '.bit-code')!;
    expect(root).toContain('border: 2px solid transparent;');
    expect(root).not.toContain('--bit-color-accent');
  });

  it('selected Code text is ink on the inline selection colour (lilac in dark, where the text is yellow)', () => {
    const rule = block(css, '.bit-code::selection')!;
    expect(rule).toContain('background: var(--bit-code-inline-selection, var(--bit-color-selection));');
    expect(rule).toContain('color: var(--bit-color-ink);');
  });

  it('inside a Table, Code drops the pill and is plain mono text in the code-text colour', () => {
    const rule = block(css, '.bit-table .bit-code')!;
    const lines = rule.split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(['padding: 0;', 'background: none;', 'border: 0;', 'color: var(--bit-color-code-text);']);
  });

  it('the base pill is unchanged outside tables', () => {
    const lines = block(css, '.bit-code')!.split('\n').map((l) => l.trim()).filter((l) => l.endsWith(';'));
    expect(lines).toContain('padding: 1px 6px;');
    expect(lines).toContain('border: 2px solid transparent;');
    expect(lines).toContain('background: var(--bit-code-inline-bg, var(--bit-code-bg));');
    expect(lines).toContain('color: var(--bit-code-inline-text, var(--bit-code-text));');
  });

  it('the pill has its own colours, so it can differ from the CodeBlock panel', () => {
    const panel = block(readCss('components/code-block.css'), '.bit-code__block')!;
    const pill = block(css, '.bit-code')!;
    expect(decl(panel, 'background')).toBe('var(--bit-code-bg)');
    expect(decl(pill, 'background')).toBe('var(--bit-code-inline-bg, var(--bit-code-bg))');
    expect(decl(pill, 'color')).toBe('var(--bit-code-inline-text, var(--bit-code-text))');
  });

  it('every read of a token added in 0.1.2, nested ones included, falls back to a 0.1.1 token, so a custom theme from 0.1.1 still draws the chip', () => {
    // Declarations only: comments mention the token names too.
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
    // Each inline-token name is followed by a comma (it has a fallback), never directly by ')'.
    const names = [...rules.matchAll(/var\((--bit-code-inline-[a-z-]+)\s*([,)])/g)];
    expect(names.length).toBeGreaterThanOrEqual(5);
    for (const [read, , next] of names) expect(next, read).toBe(',');
    // Every declaration reading one bottoms out in a token that is not --bit-code-inline-*.
    for (const [, value] of rules.matchAll(/:\s*([^;]*--bit-code-inline-[^;]*);/g)) {
      const innermost = [...value!.matchAll(/var\((--bit-[a-z0-9-]+)/g)].at(-1)![1];
      expect(innermost, value).not.toMatch(/^--bit-code-inline-/);
    }
  });

  it('on tinted surfaces (every Alert, Card footers, a hovered Link) the pill takes the on-tint background', () => {
    const rule = block(css, '.bit-alert .bit-code,\n.bit-card__footer .bit-code,\n.bit-link:hover .bit-code')!;
    expect(rule.trim()).toBe('background: var(--bit-code-inline-bg-on-tint, var(--bit-code-inline-bg, var(--bit-code-bg)));');
  });

  it('muted Text is not a surface: a chip inside Text color="neutral" keeps the normal pill', () => {
    expect(css).not.toMatch(/\.bit-neutral\s+\.bit-code/);
  });

  it('a hovered Link inside a Table keeps the plain table Code (no pill, which would fail contrast there)', () => {
    expect(block(css, '.bit-table .bit-link:hover .bit-code')!.trim()).toBe('background: none;');
    expect(css.indexOf('.bit-table .bit-link:hover .bit-code')).toBeGreaterThan(css.indexOf('.bit-link:hover .bit-code {'));
  });
});
