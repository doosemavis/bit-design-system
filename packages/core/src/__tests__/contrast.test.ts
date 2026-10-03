import { describe, it, expect } from 'vitest';
import { CODE_KINDS, COLORS } from '../tokens';
import { contrastRatio, listCss, readCss, resolveVar, themeModes } from './css';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;
const CODE_MIN = 5.6;

describe.each(listCss('themes'))('%s color contrast', (file) => {
  const map = themeModes(readCss(`themes/${file}`)).light;
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

  it('focus: the ring stands out from the page and from surfaces', () => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(resolveColor('--bit-focus-ring-color'), resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('borders (line) stand out from the page', () => {
    expect(contrastRatio(resolveColor('--bit-color-line'), resolveColor('--bit-color-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(COLORS)('color %s: body text is readable on the soft background', (color) => {
    expect(contrastRatio(resolveColor('--bit-color-text'), resolveColor(`--bit-color-${color}-soft`))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(CODE_KINDS)('code %s is at least 5.6:1 on the code background (Ink night)', (kind) => {
    expect(contrastRatio(resolveColor(`--bit-code-${kind}`), resolveColor('--bit-code-bg'))).toBeGreaterThanOrEqual(CODE_MIN);
  });

  it('selected text (ink on the selection color) is readable', () => {
    expect(contrastRatio(resolveColor('--bit-color-ink'), resolveColor('--bit-color-selection'))).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
