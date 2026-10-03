import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/select.css', () => {
  const css = readCss('components/select.css');

  it('the control has Input’s recessed look and drops the native arrow', () => {
    const control = block(css, '.bit-select__control')!;
    for (const line of [
      'appearance: none;',
      'height: var(--_bit-size-height);',
      'font-size: var(--_bit-size-text);',
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-inset);',
    ]) {
      expect(control).toContain(line);
    }
  });

  it('leaves room on the right for the chevron', () => {
    expect(block(css, '.bit-select__control')).toContain(
      'padding: 0 calc(var(--_bit-size-padding) * 2 + 12px) 0 var(--_bit-size-padding);',
    );
  });

  it('the wrapper draws the chevron as a text-colored border triangle that ignores the pointer', () => {
    expect(block(css, '.bit-select')).toContain('position: relative;');
    const chevron = block(css, '.bit-select::after')!;
    expect(chevron).toContain('border-top: 7px solid var(--bit-color-text);');
    expect(chevron).toContain('border-left: 6px solid transparent;');
    expect(chevron).toContain('pointer-events: none;');
  });

  it('aria-invalid="true" turns the border danger; disabled dims the control and the chevron', () => {
    expect(block(css, '.bit-select__control[aria-invalid="true"]')).toContain('border-color: var(--bit-color-danger);');
    expect(block(css, '.bit-select__control:disabled')).toContain('opacity: 0.5;');
    expect(block(css, '.bit-select__control:disabled')).toContain('cursor: not-allowed;');
    expect(block(css, '.bit-select:has(.bit-select__control:disabled)::after')).toContain('opacity: 0.5;');
  });
});
