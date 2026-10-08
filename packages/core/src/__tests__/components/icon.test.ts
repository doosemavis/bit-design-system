import { describe, expect, it } from 'vitest';
import { block, readCss } from '../css';
import { COLORS } from '../../tokens';

describe('components/icon.css', () => {
  const css = readCss('components/icon.css');

  it('sizes the icon from --_bit-icon-size, 20px by default, and never reads the control size scale', () => {
    const base = block(css, '.bit-icon')!;
    expect(base).toContain('--_bit-icon-size: 20px;');
    expect(base).toContain('width: var(--_bit-icon-size);');
    expect(base).toContain('height: var(--_bit-icon-size);');
    expect(base).toContain('fill: currentColor;');
    expect(css).not.toContain('var(--_bit-size-');
  });

  it.each([['sm', 16], ['md', 20], ['lg', 24]] as const)('.bit-icon.bit-%s is %ipx', (size, px) => {
    expect(block(css, `.bit-icon.bit-${size}`)).toContain(`--_bit-icon-size: ${px}px;`);
  });

  it('takes a colour only from its own colour class, so an icon inside a primary Button keeps the text colour', () => {
    const selector = `.bit-icon:is(${COLORS.map((c) => `.bit-${c}`).join(', ')})`;
    expect(block(css, selector)).toContain('color: var(--_bit-color);');
    expect(block(css, '.bit-icon')).not.toContain('--_bit-color');
  });

  it('the class form draws the --_bit-icon mask in currentColor', () => {
    const span = block(css, 'span.bit-icon')!;
    expect(span).toContain('background-color: currentColor;');
    expect(span).toContain('-webkit-mask: var(--_bit-icon) center / contain no-repeat;');
    expect(span).toContain('  mask: var(--_bit-icon) center / contain no-repeat;');
  });

  it('in forced colours the mask icon is CanvasText with forced-color-adjust off, so it never disappears', () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*span\.bit-icon\s*\{[^}]*background-color: CanvasText;[^}]*forced-color-adjust: none;/);
  });
});

describe('icons/icons.generated.css', () => {
  const css = readCss('icons/icons.generated.css');
  it('has 600 rules that only set --_bit-icon, and index.css never imports it', () => {
    const rules = css.split('\n').filter((line) => line.startsWith('.bit-icon-'));
    expect(rules).toHaveLength(600);
    for (const rule of rules) expect(rule).toMatch(/^\.bit-icon-[a-z0-9-]+\{--_bit-icon:url\("data:image\/svg\+xml,[^"]+"\)\}$/);
    expect(readCss('index.css')).not.toContain('icons/');
  });
});
