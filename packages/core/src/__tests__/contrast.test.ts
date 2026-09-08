import { describe, it, expect } from 'vitest';
import { TONES } from '../tokens';
import { contrastRatio, listCss, parseCustomProps, readCss, resolveVar } from './css';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe.each(listCss('themes'))('%s color contrast', (file) => {
  const map = parseCustomProps(readCss(`themes/${file}`));
  const color = (name: string) => resolveVar(map, name);

  it.each(TONES)('tone %s: contrast text readable on fill and on hover fill', (tone) => {
    const text = color(`--bit-color-${tone}-contrast`);
    expect(contrastRatio(text, color(`--bit-color-${tone}`))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(text, color(`--bit-color-${tone}-hover`))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('body text and muted text are readable on the page and on surfaces', () => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(color('--bit-color-text'), color(bg))).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(color('--bit-color-text-muted'), color(bg))).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('focus ring is visible against the page', () => {
    expect(contrastRatio(color('--bit-color-focus'), color('--bit-color-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
