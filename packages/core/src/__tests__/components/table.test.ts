import { describe, it, expect } from 'vitest';
import { block, decl, readCss } from '../css';

describe('components/table.css', () => {
  const css = readCss('components/table.css');

  it('the wrapper is the card frame and scrolls sideways', () => {
    const wrapper = block(css, '.bit-table')!;
    for (const line of [
      'overflow-x: auto;',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-md);',
      'background: var(--bit-color-surface);',
    ]) {
      expect(wrapper).toContain(line);
    }
  });

  it('the table fills the wrapper with collapsed borders', () => {
    const table = block(css, '.bit-table__table')!;
    expect(table).toContain('width: 100%;');
    expect(table).toContain('border-collapse: collapse;');
  });

  it('cells are padded 12px by 16px', () => {
    expect(block(css, '.bit-table__cell')).toContain('padding: var(--bit-space-12px) var(--bit-space-16px);');
  });

  it('cells centre their content vertically (PR3a §2), so a Button or Badge lines up with a text cell', () => {
    const cell = block(css, '.bit-table__cell')!;
    expect(decl(cell, 'vertical-align')).toBe('middle');
    expect(css).not.toContain('vertical-align: top;');
  });

  it('head cells are 14px pixel type in capitals over a 3px line rule (14px is the floor)', () => {
    const head = block(css, '.bit-table__head .bit-table__cell')!;
    expect(head).toContain('font-family: var(--bit-font-pixel);');
    expect(head).toContain('font-size: var(--bit-text-14px);');
    expect(head).toContain('text-transform: uppercase;');
    expect(head).toContain('border-bottom: var(--bit-border-width) solid var(--bit-color-line);');
  });

  it('body rows are split by a soft 1px line at 30% of the line color, none above the first row', () => {
    expect(block(css, '.bit-table__body .bit-table__cell')).toContain(
      'border-top: 1px solid color-mix(in srgb, var(--bit-color-line) 30%, transparent);',
    );
    expect(block(css, '.bit-table__body .bit-table__row:first-child .bit-table__cell')).toContain('border-top: 0;');
  });

  it('stripes read the stripe token, not neutral-soft (Q3a-A)', () => {
    const body = block(css, '.bit-table[data-striped] .bit-table__body .bit-table__row:nth-child(even)')!;
    expect(body).toContain('background: var(--bit-color-stripe);');
  });
});
