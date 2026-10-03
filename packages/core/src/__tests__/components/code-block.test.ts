import { describe, it, expect } from 'vitest';
import { CODE_KINDS } from '../../tokens';
import { VISUALLY_HIDDEN, block, readCss } from '../css';

describe('components/code-block.css', () => {
  const css = readCss('components/code-block.css');

  it('the panel is Ink night with a 3px accent border, the mid shadow and a 10px radius', () => {
    const panel = block(css, '.bit-code__block')!;
    for (const line of [
      'background: var(--bit-code-bg);',
      'color: var(--bit-code-text);',
      'border: var(--bit-border-width) solid var(--bit-color-accent);',
      'box-shadow: var(--bit-shadow-md);',
      'border-radius: var(--bit-radius-10px);',
      'overflow: hidden;',
    ]) {
      expect(panel).toContain(line);
    }
  });

  it('resets the inherited ring colour, so a solid Alert around it cannot paint an ink ring on code-bg', () => {
    // A solid Alert sets --_bit-focus-ring to its contrast colour. For neutral (light), success and
    // warning that is ink, about 1:1 on code-bg, so the pre and Copy rings would vanish. `initial`
    // makes var() fall back to --bit-focus-ring-color, which is contrast-tested on code-bg.
    expect(block(css, '.bit-code__block')).toContain('--_bit-focus-ring: initial;');
  });

  it('the bar has a 2px accent rule; the language is pixel type at 11px in the punct color', () => {
    expect(block(css, '.bit-code__bar')).toContain('border-bottom: 2px solid var(--bit-color-accent);');
    const lang = block(css, '.bit-code__lang')!;
    expect(lang).toContain('font-family: var(--bit-font-pixel);');
    expect(lang).toContain('font-size: var(--bit-text-11px);');
    expect(lang).toContain('color: var(--bit-code-punct);');
  });

  it('the pre scrolls sideways in 13px mono at line-height 1.6, without ligatures', () => {
    const pre = block(css, '.bit-code__pre')!;
    for (const line of [
      'overflow-x: auto;',
      'font-family: var(--bit-font-mono);',
      'font-size: var(--bit-text-13px);',
      'font-weight: 400;',
      'line-height: 1.6;',
      'font-variant-ligatures: none;',
    ]) {
      expect(pre).toContain(line);
    }
    expect(block(css, '.bit-code__pre code')).toContain('font: inherit;');
  });

  it.each(CODE_KINDS)('tokens of kind %s read --bit-code-%s', (kind) => {
    expect(block(css, `.bit-code__token[data-kind="${kind}"]`)).toContain(`color: var(--bit-code-${kind});`);
  });

  it('comments are italic', () => {
    expect(block(css, '.bit-code__token[data-kind="comment"]')).toContain('font-style: italic;');
  });

  it('the Copy button is light with a 2px ink border and a 6px radius; failed is a solid danger button', () => {
    const copy = block(css, '.bit-code__copy')!;
    expect(copy).toContain('border: 2px solid var(--bit-color-ink);');
    expect(copy).toContain('border-radius: var(--bit-radius-6px);');
    expect(copy).toContain('background: var(--bit-code-text);');
    expect(copy).toContain('color: var(--bit-color-ink);');
    // Amendment 1, P2 (board-3 F1): solid danger red with its contrast text, in both modes.
    const failed = block(css, '.bit-code__copy[data-state="failed"]')!;
    expect(failed).toContain('background: var(--bit-color-danger);');
    expect(failed).toContain('color: var(--bit-color-danger-contrast);');
  });

  it('the status line is visually hidden but still announced', () => {
    const status = block(css, '.bit-code__status')!;
    for (const line of VISUALLY_HIDDEN) expect(status).toContain(line);
  });
});

describe('system/reset.css (CodeBlock ring)', () => {
  it('pulls the pre’s ring 2px inside it, so the panel’s overflow: hidden cannot clip it', () => {
    expect(block(readCss('system/reset.css'), '.bit-code__pre:focus-visible')).toContain(
      'outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);',
    );
  });
});
