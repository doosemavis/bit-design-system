import { describe, it, expect } from 'vitest';
import { CODE_KINDS, COLORS } from '../tokens';
import { contrastRatio, listCss, parseCustomProps, readCss, resolveVar } from './css';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;
const CODE_MIN = 5.6;

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

  it('focus: the ink outline stands out from the page, surfaces, and every color fill', () => {
    const ink = resolveColor('--bit-color-ink');
    for (const bg of ['--bit-color-bg', '--bit-color-surface', ...COLORS.map((c) => `--bit-color-${c}`)]) {
      expect(contrastRatio(ink, resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('focus: the band is 3px of warning yellow, which stands out from the ink ring around it', () => {
    expect(map.get('--bit-focus-band')).toBe('0 0 0 3px var(--bit-color-warning)');
    expect(contrastRatio(resolveColor('--bit-color-warning'), resolveColor('--bit-color-ink'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
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
