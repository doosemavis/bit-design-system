// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { formatValue } from './formatValue';

describe('formatValue', () => {
  it('writes an rgba() color as 8-digit hex, so a shadow value fits on one line', () => {
    expect(formatValue('inset 3px 3px 0 rgba(21, 21, 21, 0.12)')).toBe('inset 3px 3px 0 #1515151F');
    expect(formatValue('inset 3px 3px 0 rgba(0, 0, 0, 0.4)')).toBe('inset 3px 3px 0 #00000066');
  });

  it('writes an rgb() color, or an opaque rgba(), as 6-digit hex', () => {
    expect(formatValue('2px 2px 0 rgb(70, 70, 88)')).toBe('2px 2px 0 #464658');
    expect(formatValue('rgba(124, 58, 237, 1)')).toBe('#7C3AED');
  });

  it('upper-cases hex the browser already gave, like the color cards', () => {
    expect(formatValue('4px 4px 0 #464658')).toBe('4px 4px 0 #464658');
    expect(formatValue('#7c3aed')).toBe('#7C3AED');
  });

  it('leaves everything else alone', () => {
    expect(formatValue('16px')).toBe('16px');
    expect(formatValue('80ms')).toBe('80ms');
    expect(formatValue('"Nunito", "Segoe UI", sans-serif')).toBe('"Nunito", "Segoe UI", sans-serif');
    expect(formatValue('')).toBe('');
  });
});
