import { describe, it, expect } from 'vitest';
import { COLORS } from '../tokens';
import { contrastRatio, listCss, parseCustomProps, readCss, resolveVar } from './css';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe.each(listCss('themes'))('%s color contrast', (file) => {
  const map = parseCustomProps(readCss(`themes/${file}`));
  const resolveColor = (name: string) => resolveVar(map, name);

  it.each(COLORS)('color %s: contrast text readable on fill and on hover fill', (color) => {
    const text = resolveColor(`--bit-color-${color}-contrast`);
    expect(contrastRatio(text, resolveColor(`--bit-color-${color}`))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(text, resolveColor(`--bit-color-${color}-hover`))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('body text and muted text are readable on the page and on surfaces', () => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(resolveColor('--bit-color-text'), resolveColor(bg))).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(resolveColor('--bit-color-text-muted'), resolveColor(bg))).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('focus ring is visible against the page', () => {
    expect(contrastRatio(resolveColor('--bit-color-focus'), resolveColor('--bit-color-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(COLORS)('color %s: body text is readable on the soft background', (color) => {
    expect(contrastRatio(resolveColor('--bit-color-text'), resolveColor(`--bit-color-${color}-soft`))).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
