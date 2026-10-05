import { describe, it, expect } from 'vitest';
import { listCss, readCss } from './css';

/** Font sizes that resolve to 13px or more: the 13px, 15px, 18px, 24px and 32px steps, and the control sizes. */
const AT_LEAST_13 = /^var\(--bit-text-(13|15|18|24|32)px\)$|^var\(--_bit-size-text\)$/;

/**
 * Below the 13px floor on purpose, by file, each with its reason (owner, 2026-10-05). Anything else under 13px
 * fails, so new small text is a choice someone writes down here.
 */
const EXEMPT: Readonly<Record<string, { sizes: readonly string[]; why: string }>> = {
  'badge.css': { sizes: ['7px', '8px'], why: 'Badges are compact pixel-font micro-labels; the owner kept them small.' },
  'logo.css': {
    sizes: ['0.26em', '0.82em', '0.955em', 'calc(var(--bit-text-32px) * 1.5)', 'calc(var(--bit-text-32px) * 2.25)'],
    why: 'Logo artwork: sizes match the "bit" lettering, not reading text. The two calc() sizes are the md and lg logo (48px, 72px).',
  },
  'code.css': {
    sizes: ['max(0.9em, var(--bit-text-13px))'],
    why: 'Inline Code is 0.9em of the text around it, but max() holds it at 13px or more inside 13px text.',
  },
  'text.css': { sizes: ['var(--bit-text-11px)'], why: 'Text keeps its public size={11} step; nothing in bit uses it.' },
};

const fontSizes = (css: string) => [...css.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]!.trim());

describe('the 13px floor', () => {
  it.each(listCss('components'))('%s draws no text under 13px unless exempt', (file) => {
    // Every size that isn't a plain 13px-or-larger step must be listed, calc() included.
    const small = fontSizes(readCss(`components/${file}`)).filter((size) => !AT_LEAST_13.test(size));
    expect([...new Set(small)].sort()).toEqual([...(EXEMPT[file]?.sizes ?? [])].sort());
  });

  it('every exemption says why', () => {
    for (const { why } of Object.values(EXEMPT)) expect(why.length).toBeGreaterThan(20);
  });

  it('no component reads the 11px step any more', () => {
    const readers = listCss('components').filter((file) => file !== 'text.css' && readCss(`components/${file}`).includes('--bit-text-11px'));
    expect(readers).toEqual([]);
  });

  it('every control size step (system/sizes.css) is 13px or larger', () => {
    const steps = [...readCss('system/sizes.css').matchAll(/--_bit-size-text:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(steps).toEqual(['var(--bit-text-13px)', 'var(--bit-text-15px)', 'var(--bit-text-18px)']);
  });

  it('no system stylesheet reads the 11px step', () => {
    expect(listCss('system').filter((file) => readCss(`system/${file}`).includes('--bit-text-11px'))).toEqual([]);
  });
});
