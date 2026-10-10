import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, MODE_TOKENS, BRAND_TOKENS, COLORS, SIZES, SPACE_STEPS, TEXT_SIZES, HEADING_SIZES, CODE_KINDS, headingTag } from '../tokens';

describe('semantic token list', () => {
  it('has the five colors, three control sizes, six px text sizes, 13 px heading sizes, eight px space steps', () => {
    expect(COLORS).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(SIZES).toEqual(['sm', 'md', 'lg']);
    expect(TEXT_SIZES).toEqual([14, 16, 18, 24, 32, 40]);
    expect(HEADING_SIZES).toEqual([20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44]);
    expect(SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
  });

  it('contains exactly 109 unique names, all prefixed --bit-', () => {
    // 98 in 0.1.7, plus text 14, 16 and 40 and the 13 heading sizes (114 in 0.1.8), minus the five logo colors,
    // which moved to BRAND_TOKENS. 11, 13 and 15 stay as deprecated aliases until 0.2.0.
    expect(SEMANTIC_TOKENS).toHaveLength(109);
    expect(new Set(SEMANTIC_TOKENS).size).toBe(109);
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
      '--bit-color-bg', '--bit-color-surface', '--bit-color-ink', '--bit-color-text', '--bit-color-text-muted', '--bit-color-line', '--bit-color-shadow',
      '--bit-border-width', '--bit-radius-6px', '--bit-radius-10px', '--bit-radius-14px', '--bit-radius-full',
      '--bit-shadow-sm', '--bit-shadow-md', '--bit-shadow-lg', '--bit-shadow-inset', '--bit-focus-ring-color', '--bit-focus-ring-width', '--bit-focus-ring-offset',
      '--bit-font-display', '--bit-font-body', '--bit-font-pixel',
      '--bit-text-11px', '--bit-text-32px', '--bit-leading-tight', '--bit-leading-normal', '--bit-weight-normal', '--bit-weight-bold',
      '--bit-space-4px', '--bit-space-64px',
      '--bit-control-height-sm', '--bit-control-height-lg', '--bit-control-padding-sm', '--bit-control-padding-lg',
      '--bit-press-offset', '--bit-duration-fast', '--bit-duration-normal',
    ];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
    expect(SEMANTIC_TOKENS).not.toContain('--bit-motion-power-up');
  });

  it('includes the code, mono and selection tokens (amendments §C)', () => {
    expect(CODE_KINDS).toEqual(['text', 'keyword', 'string', 'tag', 'component', 'attr', 'punct', 'comment', 'number', 'prop']);
    const expected = ['--bit-code-bg', ...CODE_KINDS.map((kind) => `--bit-code-${kind}`), '--bit-font-mono', '--bit-color-selection'];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
  });

  it('keeps the five logo colors out of the theme tokens, as BRAND_TOKENS, so a new theme need not declare them', () => {
    expect(BRAND_TOKENS).toEqual(['--bit-logo-coin', '--bit-logo-coin-light', '--bit-logo-coin-shade', '--bit-logo-coin-deep', '--bit-logo-violet']);
    for (const name of BRAND_TOKENS) expect(SEMANTIC_TOKENS).not.toContain(name);
  });

  it('includes the seven PR2 color roles; six change with the mode, the knob is shared', () => {
    const pr2 = ['--bit-color-accent', '--bit-color-link', '--bit-color-link-visited', '--bit-color-danger-text', '--bit-color-knob', '--bit-color-stripe', '--bit-color-code-text'];
    for (const name of pr2) expect(SEMANTIC_TOKENS).toContain(name);
    const sharedAcrossModes = ['--bit-color-knob'];
    for (const name of pr2.filter((n) => !sharedAcrossModes.includes(n))) expect(MODE_TOKENS).toContain(name);
    for (const name of sharedAcrossModes) expect(MODE_TOKENS).not.toContain(name);
  });

  it('has the inline Code pill tokens, and both change with the mode', () => {
    for (const name of ['--bit-code-inline-bg', '--bit-code-inline-bg-on-tint', '--bit-code-inline-text', '--bit-code-inline-selection']) {
      expect(SEMANTIC_TOKENS).toContain(name);
      expect(MODE_TOKENS).toContain(name);
    }
  });

  it('has 28 unique mode tokens (the ones the dark block overrides)', () => {
    expect(MODE_TOKENS).toHaveLength(28);
    expect(new Set(MODE_TOKENS).size).toBe(28);
  });

  it('has no --bit-color-focus (the focus ring has its own tokens)', () => {
    expect(SEMANTIC_TOKENS).not.toContain('--bit-color-focus');
  });

  it('has no --bit-gloss or --bit-focus-band (dark mode spec: flat buttons, one focus ring)', () => {
    expect(SEMANTIC_TOKENS).not.toContain('--bit-gloss');
    expect(SEMANTIC_TOKENS).not.toContain('--bit-focus-band');
  });
});

describe('headingTag', () => {
  it('maps 40 to 44 to h1, 32 to 38 to h2, 26 to 30 to h3, 24 to h4, 22 to h5, 20 to h6', () => {
    const tags = Object.fromEntries(HEADING_SIZES.map((size) => [size, headingTag(size)]));
    expect(tags).toEqual({
      20: 'h6', 22: 'h5', 24: 'h4', 26: 'h3', 28: 'h3', 30: 'h3',
      32: 'h2', 34: 'h2', 36: 'h2', 38: 'h2', 40: 'h1', 42: 'h1', 44: 'h1',
    });
  });
});
