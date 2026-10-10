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

  describe('dismissible (data-dismissible and the × button)', () => {
    it('reserves inline-end room for the ×, so the title and body never run under it', () => {
      const root = block(css, '.bit-alert[data-dismissible]')!;
      expect(decl(root, 'position')).toBe('relative');
      expect(decl(root, 'padding-inline-end')).toBe('calc(var(--bit-space-12px) * 2 + var(--bit-control-height-sm))');
    });

    it('the × sits in the inline-end corner with logical insets (so it flips in RTL), square like the Dialog ×', () => {
      const dismiss = block(css, '.bit-alert__dismiss')!;
      expect(decl(dismiss, 'position')).toBe('absolute');
      expect(decl(dismiss, 'inset-inline-end')).toBe('var(--bit-space-12px)');
      expect(decl(dismiss, 'width')).toBe('var(--_bit-size-height)');
      expect(decl(dismiss, 'padding')).toBe('0');
      expect(dismiss).not.toMatch(/(?<![-\w])(left|right|top)\s*:/);
    });

    it("the × is centred on the body's first line, and on the title line when there is a title", () => {
      expect(decl(block(css, '.bit-alert__dismiss')!, 'inset-block-start')).toBe(
        'calc(var(--bit-space-16px) + (var(--bit-text-16px) * var(--bit-leading-normal) - var(--_bit-size-height)) / 2)',
      );
      expect(decl(block(css, '.bit-alert__title ~ .bit-alert__dismiss')!, 'inset-block-start')).toBe(
        'calc(var(--bit-space-16px) + (var(--bit-text-18px) * var(--bit-leading-tight) - var(--_bit-size-height)) / 2)',
      );
    });

    it('is keyed on the attribute, never a class', () => {
      expect(css).not.toMatch(/\.bit-alert\.(is-)?dismissible/);
    });
  });

  // A solid Alert can't swap system colors as a solid Button does: its body holds links, buttons and code, which
  // would keep their own colors. The severity icon carries the meaning that the fill carried.
  it('has no forced-colors rule: the browser keeps the border in a system color, and the icon carries the severity', () => {
    expect(styleRules(css).filter((rule) => rule.media?.includes('forced-colors'))).toEqual([]);
  });
});
