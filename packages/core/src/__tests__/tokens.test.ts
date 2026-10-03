import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, COLORS, SIZES, SPACE_STEPS, TEXT_SIZES } from '../tokens';

describe('semantic token list', () => {
  it('has the five colors, three control sizes, six px text sizes, eight px space steps', () => {
    expect(COLORS).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(SIZES).toEqual(['sm', 'md', 'lg']);
    expect(TEXT_SIZES).toEqual([11, 13, 15, 18, 24, 32]);
    expect(SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
  });

  it('contains exactly 67 unique names, all prefixed --bit-', () => {
    expect(SEMANTIC_TOKENS).toHaveLength(67);
    expect(new Set(SEMANTIC_TOKENS).size).toBe(67);
    for (const name of SEMANTIC_TOKENS) expect(name).toMatch(/^--bit-[a-z0-9-]+$/);
  });

  it('includes the four color tokens for every color', () => {
    for (const color of COLORS) {
      for (const suffix of ['', '-contrast', '-hover', '-soft']) {
        expect(SEMANTIC_TOKENS).toContain(`--bit-color-${color}${suffix}`);
      }
    }
  });

  it('includes the shape, type, space, control, and motion tokens named in the spec', () => {
    const expected = [
      '--bit-color-bg', '--bit-color-surface', '--bit-color-ink', '--bit-color-text', '--bit-color-text-muted', '--bit-color-focus',
      '--bit-border-width', '--bit-radius-6px', '--bit-radius-10px', '--bit-radius-14px', '--bit-radius-full',
      '--bit-shadow-sm', '--bit-shadow-md', '--bit-shadow-lg', '--bit-shadow-inset', '--bit-gloss',
      '--bit-font-display', '--bit-font-body', '--bit-font-pixel',
      '--bit-text-11px', '--bit-text-32px', '--bit-leading-tight', '--bit-leading-normal', '--bit-weight-normal', '--bit-weight-bold',
      '--bit-space-4px', '--bit-space-64px',
      '--bit-control-height-sm', '--bit-control-height-lg', '--bit-control-padding-sm', '--bit-control-padding-lg',
      '--bit-press-offset', '--bit-duration-fast', '--bit-duration-normal', '--bit-motion-power-up',
    ];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
  });
});
