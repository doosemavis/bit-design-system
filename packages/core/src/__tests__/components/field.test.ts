import { describe, it, expect } from 'vitest';
import { block, decl, readCss } from '../css';

describe('components/field.css', () => {
  const css = readCss('components/field.css');

  it('stacks label, control, hint and error with an 8px gap', () => {
    const root = block(css, '.bit-field')!;
    expect(root).toContain('display: flex;');
    expect(root).toContain('flex-direction: column;');
    expect(root).toContain('gap: var(--bit-space-8px);');
  });

  it('the label is bold body text', () => {
    const label = block(css, '.bit-field__label')!;
    expect(label).toContain('font-family: var(--bit-font-body);');
    expect(label).toContain('font-weight: var(--bit-weight-bold);');
  });

  it('the hint is muted at 14px', () => {
    const hint = block(css, '.bit-field__hint')!;
    expect(hint).toContain('font-size: var(--bit-text-14px);');
    expect(hint).toContain('color: var(--bit-color-text-muted);');
  });

  it('the error is bold danger text at 14px, and so is the required star', () => {
    const error = block(css, '.bit-field__error')!;
    expect(error).toContain('font-size: var(--bit-text-14px);');
    expect(error).toContain('font-weight: var(--bit-weight-bold);');
    expect(error).toContain('color: var(--bit-color-danger-text);');
    expect(block(css, '.bit-field__required')).toContain('color: var(--bit-color-danger-text);');
  });

  describe("with a Textarea's count, the hint and the count share a row", () => {
    const has = '.bit-field:has(> .bit-textarea__count)';

    it('becomes a two-column grid: the hint takes the room, the count its own width', () => {
      const grid = block(css, has)!;
      expect(decl(grid, 'display')).toBe('grid');
      expect(decl(grid, 'grid-template-columns')).toBe('minmax(0, 1fr) auto');
      expect(decl(grid, 'column-gap')).toBe('var(--bit-space-12px)');
      // Dense packing lets the hint, which comes after the count, fill the cell to its left.
      expect(decl(grid, 'grid-auto-flow')).toBe('row dense');
    });

    it('everything spans both columns but the hint (left) and the count (right)', () => {
      expect(decl(block(css, `${has} > *`)!, 'grid-column')).toBe('1 / -1');
      expect(decl(block(css, `${has} > .bit-field__hint`)!, 'grid-column')).toBe('1');
      const count = block(css, `${has} > .bit-textarea__count`)!;
      expect(decl(count, 'grid-column')).toBe('2');
      expect(decl(count, 'margin-block-start')).toBe('0');
    });
  });
});
