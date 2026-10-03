import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

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

  it('the hint is muted at 13px', () => {
    const hint = block(css, '.bit-field__hint')!;
    expect(hint).toContain('font-size: var(--bit-text-13px);');
    expect(hint).toContain('color: var(--bit-color-text-muted);');
  });

  it('the error is bold danger text at 13px, and so is the required star', () => {
    const error = block(css, '.bit-field__error')!;
    expect(error).toContain('font-size: var(--bit-text-13px);');
    expect(error).toContain('font-weight: var(--bit-weight-bold);');
    expect(error).toContain('color: var(--bit-color-danger-text);');
    expect(block(css, '.bit-field__required')).toContain('color: var(--bit-color-danger-text);');
  });
});
