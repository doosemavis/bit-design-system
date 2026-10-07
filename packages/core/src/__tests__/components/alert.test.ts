import { describe, expect, it } from 'vitest';
import { block, decl, readCss, styleRules } from '../css';

describe('components/alert.css', () => {
  const css = readCss('components/alert.css');
  const button = readCss('components/button.css');

  it('the panel: a line border, 10px radius and 16px padding', () => {
    const body = block(css, '.bit-alert')!;
    expect(body).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
    expect(body).toContain('border-radius: var(--bit-radius-10px);');
    expect(body).toContain('padding: var(--bit-space-16px);');
  });

  it('solid is unchanged: the colour fill, contrast text and ring, the medium shadow, and the line border', () => {
    const body = block(css, '.bit-alert.bit-solid')!;
    expect(decl(body, 'background')).toBe('var(--_bit-color)');
    expect(decl(body, 'color')).toBe('var(--_bit-color-contrast)');
    expect(decl(body, '--_bit-focus-ring')).toBe('var(--_bit-color-contrast)');
    expect(decl(body, 'box-shadow')).toBe('var(--bit-shadow-md)');
    expect(decl(body, 'border-color')).toBeNull();
  });

  it('outline (O2): keeps the soft tint and the text colour', () => {
    const body = block(css, '.bit-alert.bit-outline')!;
    expect(decl(body, 'background')).toBe('var(--_bit-color-soft)');
    expect(decl(body, 'color')).toBe('var(--bit-color-text)');
  });

  it("outline (O2): edges with the colour's edge and casts its outline shadow, exactly as an outline Button", () => {
    const alert = block(css, '.bit-alert.bit-outline')!;
    const outlineButton = block(button, '.bit-button.bit-outline')!;
    expect(decl(alert, 'border-color')).toBe('var(--_bit-color-edge)');
    expect(decl(alert, 'box-shadow')).toBe('4px 4px 0 var(--_bit-color-outline-shadow)');
    expect(decl(alert, 'border-color')).toBe(decl(outlineButton, 'border-color'));
    expect(decl(alert, 'box-shadow')).toBe(decl(outlineButton, 'box-shadow'));
  });

  it('the raw 4px offset carries its comment', () => {
    expect(css).toMatch(/\/\* raw:[^*]*\*\/\s*\n\s*box-shadow: 4px 4px 0 var\(--_bit-color-outline-shadow\);/);
  });

  it('has no forced-colours rule, like Button: the browser keeps the border in a system colour and drops the shadow', () => {
    expect(styleRules(css).filter((rule) => rule.media?.includes('forced-colors'))).toEqual([]);
    expect(styleRules(button).filter((rule) => rule.media?.includes('forced-colors'))).toEqual([]);
  });
});
