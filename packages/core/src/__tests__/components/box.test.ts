import { describe, it, expect } from 'vitest';
import { SPACE_STEPS } from '../../tokens';
import { block, readCss } from '../css';

/** 0, then the space scale: the nine values every Box prop takes. */
const VALUES = [0, ...SPACE_STEPS] as const;

/** Spec §2: each attribute and the properties it sets, in the three precedence tiers. */
const TIERS: readonly (readonly (readonly [attribute: string, properties: readonly string[]])[])[] = [
  [
    ['p', ['padding']],
    ['m', ['margin']],
  ],
  [
    ['px', ['padding-left', 'padding-right']],
    ['py', ['padding-top', 'padding-bottom']],
    ['mx', ['margin-left', 'margin-right']],
    ['my', ['margin-top', 'margin-bottom']],
  ],
  [
    ['pt', ['padding-top']],
    ['pr', ['padding-right']],
    ['pb', ['padding-bottom']],
    ['pl', ['padding-left']],
    ['mt', ['margin-top']],
    ['mr', ['margin-right']],
    ['mb', ['margin-bottom']],
    ['ml', ['margin-left']],
  ],
];

const ATTRIBUTES = TIERS.flat();

/** Every `selector { body }` rule in the file, comments removed. */
function rules(css: string): { selector: string; body: string }[] {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...bare.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]!.trim() }));
}

describe('components/box.css', () => {
  const css = readCss('components/box.css');

  it.each(ATTRIBUTES)('data-%s has a rule for 0 and each space step, setting %j', (attribute, properties) => {
    for (const n of VALUES) {
      const value = n === 0 ? '0' : `var(--bit-space-${n}px)`;
      const expected = properties.map((property) => `${property}: ${value};`).join(' ');
      expect(block(css, `.bit-box[data-${attribute}="${n}"]`)?.trim(), `${attribute}=${n}`).toBe(expected);
    }
  });

  it('has exactly one rule per attribute and value: 14 × 9 = 126', () => {
    expect(rules(css)).toHaveLength(ATTRIBUTES.length * VALUES.length);
    expect(ATTRIBUTES).toHaveLength(14);
  });

  it('orders the tiers all sides, then axes, then single sides, so the most specific prop wins', () => {
    const positions = TIERS.map((tier) =>
      tier.flatMap(([attribute]) => VALUES.map((n) => css.indexOf(`.bit-box[data-${attribute}="${n}"]`))),
    );
    for (let i = 1; i < positions.length; i += 1) {
      expect(Math.max(...positions[i - 1]!)).toBeLessThan(Math.min(...positions[i]!));
    }
  });

  it('sets nothing on .bit-box itself, and nothing but padding and margin anywhere', () => {
    expect(block(css, '.bit-box')).toBeNull();
    for (const { selector, body } of rules(css)) {
      expect(selector).toMatch(/^\.bit-box\[data-[pm][xytrbl]?="\d+"\]$/);
      const properties = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]!);
      for (const property of properties) expect(property).toMatch(/^(padding|margin)(-(top|right|bottom|left))?$/);
    }
  });
});
