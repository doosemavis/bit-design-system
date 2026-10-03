import { describe, it, expect } from 'vitest';
import { CODE_KINDS, COLORS } from '../tokens';
import { contrastRatio, listCss, readCss, resolveVar, themeModes } from './css';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;
const CODE_MIN = 5.6;

/** Every theme in light, plus light with its dark overrides applied when the theme has a dark block. */
const MODES: readonly (readonly [name: string, map: Map<string, string>])[] = listCss('themes').flatMap((file) => {
  const { light, dark } = themeModes(readCss(`themes/${file}`));
  const cases: [string, Map<string, string>][] = [[`${file} light`, light]];
  if (dark.size > 0) cases.push([`${file} dark`, new Map([...light, ...dark])]);
  return cases;
});

describe.each(MODES)('%s contrast', (_name, map) => {
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

  it.each(COLORS)('a focus ring inside a solid %s panel (its contrast color) stands out from the fill', (color) => {
    const ring = resolveColor(`--bit-color-${color}-contrast`);
    expect(contrastRatio(ring, resolveColor(`--bit-color-${color}`))).toBeGreaterThanOrEqual(AA_NON_TEXT);
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

describe('dark mode values (owner-locked 2026-10-03)', () => {
  const css = readCss('themes/power-up.css');
  const { light, dark } = themeModes(css);
  const merged = new Map([...light, ...dark]);
  const dk = (name: string) => resolveVar(merged, name);

  it.each([
    ['--bit-color-bg', '#15151C'], ['--bit-color-surface', '#20202A'],
    ['--bit-color-text', '#EDEBE4'], ['--bit-color-text-muted', '#A9A9BC'],
    ['--bit-color-line', '#79798F'], ['--bit-color-shadow', '#464658'],
    ['--bit-color-neutral', '#2B2B37'], ['--bit-color-neutral-contrast', '#EDEBE4'],
    ['--bit-color-neutral-hover', '#343442'], ['--bit-color-neutral-soft', '#2B2B37'],
    ['--bit-color-primary-soft', '#2E2352'], ['--bit-color-success-soft', '#173A25'],
    ['--bit-color-warning-soft', '#3B3212'], ['--bit-color-danger-soft', '#40191B'],
    ['--bit-code-bg', '#0B0B10'], ['--bit-focus-ring-color', '#FFC800'],
  ])('%s is %s in dark', (token, value) => {
    expect(dk(token)).toBe(value);
  });

  it('the dark ring keeps the 2px width with a 1px gap; inset shadow darkens instead of fading', () => {
    expect(merged.get('--bit-focus-ring-width')).toBe('2px');
    expect(dark.get('--bit-focus-ring-offset')).toBe('1px');
    expect(dark.get('--bit-shadow-inset')).toBe('inset 3px 3px 0 rgba(0, 0, 0, 0.4)');
  });
});
