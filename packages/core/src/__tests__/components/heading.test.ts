import { describe, it, expect } from 'vitest';
import { block, decl, readCss } from '../css';

/** Spec §1's table, one row per data-level. Every level declares all five, so none inherits another's. */
const LEVELS = {
  1: { 'font-family': 'var(--bit-font-display)', 'font-size': 'var(--bit-text-32px)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' },
  2: { 'font-family': 'var(--bit-font-display)', 'font-size': 'var(--bit-text-24px)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' },
  3: { 'font-family': 'var(--bit-font-display)', 'font-size': 'var(--bit-text-18px)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' },
  4: { 'font-family': 'var(--bit-font-body)', 'font-size': 'var(--bit-text-15px)', 'font-weight': 'var(--bit-weight-bold)', 'line-height': '1.3', 'letter-spacing': 'normal' },
  5: { 'font-family': 'var(--bit-font-body)', 'font-size': 'var(--bit-text-13px)', 'font-weight': 'var(--bit-weight-bold)', 'line-height': '1.3', 'letter-spacing': 'normal' },
  6: { 'font-family': 'var(--bit-font-pixel)', 'font-size': 'var(--bit-text-13px)', 'font-weight': '400', 'line-height': '1.4', 'letter-spacing': '0.08em' },
} as const;

const TYPE_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing'] as const;

describe('components/heading.css', () => {
  const css = readCss('components/heading.css');
  const level = (n: number) => block(css, `.bit-heading[data-level="${n}"]`);

  it('has no margin, because Stack and Box do the spacing, and reads the text color', () => {
    const root = block(css, '.bit-heading')!;
    expect(root).toContain('margin: 0;');
    expect(root).toContain('color: var(--bit-color-text);');
  });

  it.each(Object.entries(LEVELS))('data-level="%s" matches the spec table', (n, expected) => {
    const body = level(Number(n))!;
    expect(body).not.toBeNull();
    for (const prop of TYPE_PROPS) expect(decl(body, prop), prop).toBe(expected[prop]);
  });

  it('display levels (1–3) use weight 400, because the display face ships one weight', () => {
    for (const n of [1, 2, 3]) {
      expect(decl(level(n)!, 'font-family')).toBe('var(--bit-font-display)');
      expect(decl(level(n)!, 'font-weight')).toBe('400');
    }
  });

  it('level 6 is pixel caps; no other level transforms its text', () => {
    expect(decl(level(6)!, 'text-transform')).toBe('uppercase');
    for (const n of [1, 2, 3, 4, 5]) expect(decl(level(n)!, 'text-transform')).toBeNull();
    expect(decl(block(css, '.bit-heading')!, 'text-transform')).toBeNull();
  });

  // The face follows the size, like Text: 18 and up are the display face (one weight, so 400), 15 and 13 the
  // body face in bold. Each size sets all five, so it never inherits a deprecated data-level's look.
  const DISPLAY = { 'font-family': 'var(--bit-font-display)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' };
  const BODY = { 'font-family': 'var(--bit-font-body)', 'font-weight': 'var(--bit-weight-bold)', 'line-height': '1.3', 'letter-spacing': 'normal' };
  it.each([
    [32, DISPLAY],
    [24, DISPLAY],
    [18, DISPLAY],
    [15, BODY],
    [13, BODY],
  ] as const)('data-size="%i" sets its px size and the face that goes with it', (px, face) => {
    const body = block(css, `.bit-heading[data-size="${px}"]`)!;
    expect(body).not.toBeNull();
    expect(decl(body, 'font-size')).toBe(`var(--bit-text-${px}px)`);
    for (const [prop, value] of Object.entries(face)) expect(decl(body, prop), prop).toBe(value);
    expect(decl(body, 'text-transform')).toBeNull();
  });

  it('every data-size rule comes after every data-level rule, so the size wins at the same specificity', () => {
    const lastLevel = Math.max(...[1, 2, 3, 4, 5, 6].map((n) => css.indexOf(`.bit-heading[data-level="${n}"]`)));
    const firstSize = Math.min(...[13, 15, 18, 24, 32].map((n) => css.indexOf(`.bit-heading[data-size="${n}"]`)));
    expect(firstSize).toBeGreaterThan(lastLevel);
  });

  it('with no data-level, the base rule is the h2 look', () => {
    const root = block(css, '.bit-heading')!;
    for (const prop of TYPE_PROPS) expect(decl(root, prop), prop).toBe(LEVELS[2][prop]);
  });
});
