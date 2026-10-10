import { describe, it, expect } from 'vitest';
import { listCss, readCss } from './css';

/** Font sizes that resolve to 14px or more: the 14 to 40px text steps, the 20 to 44px heading sizes, and the control sizes. */
const AT_LEAST_14 = /^var\(--bit-text-(14|16|18|24|32|40)px\)$|^var\(--bit-heading-(2[02468]|3[02468]|4[024])px\)$|^var\(--_bit-size-text\)$/;

/**
 * Below the 14px floor on purpose, by file, each with its reason (owner, 2026-10-05). Anything else under 14px
 * fails, so new small text is a choice someone writes down here.
 */
const EXEMPT: Readonly<Record<string, { sizes: readonly string[]; why: string }>> = {
  'badge.css': { sizes: ['7px', '8px'], why: 'Badges are compact pixel-font micro-labels; the owner kept them small.' },
  'logo.css': {
    sizes: ['0.26em', '0.82em', '0.955em', 'calc(var(--bit-text-32px) * 1.5)', 'calc(var(--bit-text-32px) * 2.25)'],
    why: 'Logo artwork: sizes match the "bit" lettering, not reading text. The two calc() sizes are the md and lg logo (48px, 72px).',
  },
  'code.css': {
    sizes: ['max(0.9em, var(--bit-text-14px))'],
    why: 'Inline Code is 0.9em of the text around it, but max() holds it at 14px or more inside 14px text.',
  },
  'dialog.css': { sizes: ['11px'], why: 'The Retro window title is the pixel font, which reads large; 11px is its sub-scale, as Badge (owner pick D2).' },
  'slider.css': {
    sizes: ['11px'],
    why: "The round Slider's value bubble is the pixel font, which reads large, at Dialog's 11px; it is hidden from screen readers, which read the input's value.",
  },
  'text.css': {
    sizes: ['var(--bit-text-11px)', 'var(--bit-text-13px)', 'var(--bit-text-15px)'],
    why: 'Deprecated data-size 11, 13 and 15 (removed in 0.2.0). Their tokens alias 14 and 16, so they render at the floor or above.',
  },
};

const fontSizes = (css: string) => [...css.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]!.trim());

describe('the 14px floor', () => {
  it.each(listCss('components'))('%s draws no text under 14px unless exempt', (file) => {
    // Every size that isn't a plain 14px-or-larger step must be listed, calc() included.
    const small = fontSizes(readCss(`components/${file}`)).filter((size) => !AT_LEAST_14.test(size));
    expect([...new Set(small)].sort()).toEqual([...(EXEMPT[file]?.sizes ?? [])].sort());
  });

  it('every exemption says why', () => {
    for (const { why } of Object.values(EXEMPT)) expect(why.length).toBeGreaterThan(20);
  });

  it('no component reads the 11px step any more', () => {
    const readers = listCss('components').filter((file) => file !== 'text.css' && readCss(`components/${file}`).includes('--bit-text-11px'));
    expect(readers).toEqual([]);
  });

  it('every control size step (system/sizes.css) is 14px or larger', () => {
    const steps = [...readCss('system/sizes.css').matchAll(/--_bit-size-text:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(steps).toEqual(['var(--bit-text-14px)', 'var(--bit-text-16px)', 'var(--bit-text-18px)']);
  });

  it('no system stylesheet reads the 11px step', () => {
    expect(listCss('system').filter((file) => readCss(`system/${file}`).includes('--bit-text-11px'))).toEqual([]);
  });
});
