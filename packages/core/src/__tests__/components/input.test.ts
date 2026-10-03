import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/input.css', () => {
  const css = readCss('components/input.css');

  it('is recessed: surface fill, line border, 10px radius and the inset shadow', () => {
    const root = block(css, '.bit-input')!;
    for (const line of [
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-inset);',
    ]) {
      expect(root).toContain(line);
    }
  });

  it('takes height, padding and text size from the size decorator', () => {
    const root = block(css, '.bit-input')!;
    expect(root).toContain('height: var(--_bit-size-height);');
    expect(root).toContain('padding: 0 var(--_bit-size-padding);');
    expect(root).toContain('font-size: var(--_bit-size-text);');
    expect(root).toContain('font-family: var(--bit-font-body);');
  });

  it('the placeholder is muted text', () => {
    expect(block(css, '.bit-input::placeholder')).toContain('color: var(--bit-color-text-muted);');
  });

  it('aria-invalid="true" turns the border danger', () => {
    expect(block(css, '.bit-input[aria-invalid="true"]')).toContain('border-color: var(--bit-color-danger);');
  });

  it('disabled is half opacity with a not-allowed cursor, as in Button', () => {
    const body = block(css, '.bit-input:disabled')!;
    expect(body).toContain('opacity: 0.5;');
    expect(body).toContain('cursor: not-allowed;');
  });

  it('leaves the native search cancel button alone', () => {
    expect(css).not.toContain('search-cancel-button');
    expect(css).not.toContain('[type="search"]');
  });
});
