import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, TONES, SIZES, TEXT_SIZES } from '../tokens';

describe('semantic token list', () => {
  it('has the five tones, three sizes, six text sizes', () => {
    expect(TONES).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(SIZES).toEqual(['sm', 'md', 'lg']);
    expect(TEXT_SIZES).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
  });

  it('contains exactly 67 unique names, all prefixed --bit-', () => {
    expect(SEMANTIC_TOKENS).toHaveLength(67);
    expect(new Set(SEMANTIC_TOKENS).size).toBe(67);
    for (const name of SEMANTIC_TOKENS) expect(name).toMatch(/^--bit-[a-z0-9-]+$/);
  });

  it('includes the four color tokens for every tone', () => {
    for (const tone of TONES) {
      for (const suffix of ['', '-contrast', '-hover', '-soft']) {
        expect(SEMANTIC_TOKENS).toContain(`--bit-color-${tone}${suffix}`);
      }
    }
  });

  it('includes the shape, type, space, control, and motion tokens named in the spec', () => {
    const expected = [
      '--bit-color-bg', '--bit-color-surface', '--bit-color-ink', '--bit-color-text', '--bit-color-text-muted', '--bit-color-focus',
      '--bit-border-width', '--bit-radius-sm', '--bit-radius-md', '--bit-radius-lg', '--bit-radius-full',
      '--bit-shadow-sm', '--bit-shadow-md', '--bit-shadow-lg', '--bit-shadow-inset', '--bit-gloss',
      '--bit-font-display', '--bit-font-body', '--bit-font-pixel',
      '--bit-text-xs', '--bit-text-2xl', '--bit-leading-tight', '--bit-leading-normal', '--bit-weight-normal', '--bit-weight-bold',
      '--bit-space-1', '--bit-space-8',
      '--bit-control-height-sm', '--bit-control-height-lg', '--bit-control-padding-sm', '--bit-control-padding-lg',
      '--bit-press-offset', '--bit-duration-fast', '--bit-duration-normal', '--bit-motion-power-up',
    ];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
  });
});
