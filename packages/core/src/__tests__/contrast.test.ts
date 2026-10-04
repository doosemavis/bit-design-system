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

  it.each(['--bit-color-bg', '--bit-color-surface', '--bit-code-bg'])('PR2: the code accent border stands out on %s', (bg) => {
    expect(contrastRatio(resolveColor('--bit-color-accent'), resolveColor(bg))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('PR2: the focus ring stands out on the code panel (CodeBlock pre and copy button)', () => {
    expect(contrastRatio(resolveColor('--bit-focus-ring-color'), resolveColor('--bit-code-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('PR2: the ink outline of an on Switch stands out from the success fill', () => {
    expect(contrastRatio(resolveColor('--bit-color-ink'), resolveColor('--bit-color-success'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  // primary-soft is the hover highlight behind a primary Link, so link text must stay readable on it too.
  it.each(['--bit-color-link', '--bit-color-link-visited'])('PR2: %s is readable on the page, surfaces and the hover highlight', (link) => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface', '--bit-color-primary-soft']) {
      expect(contrastRatio(resolveColor(link), resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('PR2: the Copy button label (ink on the code text color) is readable', () => {
    expect(contrastRatio(resolveColor('--bit-color-ink'), resolveColor('--bit-code-text'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('PR2: field error text is readable on the page and on surfaces', () => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(resolveColor('--bit-color-danger-text'), resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_TEXT);
    }
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
    // PR2 (spec §2). link-visited is #9D82E7, not the spec's #9B7FE6: see the plan's deviation D2.
    ['--bit-color-accent', '#FFC800'], ['--bit-color-link', '#B79BFF'],
    ['--bit-color-link-visited', '#9D82E7'], ['--bit-color-danger-text', '#FF8A8A'],
  ])('%s is %s in dark', (token, value) => {
    expect(dk(token)).toBe(value);
  });

  it('the dark ring keeps the 2px width with a 1px gap; inset shadow darkens instead of fading', () => {
    expect(merged.get('--bit-focus-ring-width')).toBe('2px');
    expect(dark.get('--bit-focus-ring-offset')).toBe('1px');
    expect(dark.get('--bit-shadow-inset')).toBe('inset 3px 3px 0 rgba(0, 0, 0, 0.4)');
  });

  it('dark stripes step off the surface like light does, and keep text readable', () => {
    const stripe = resolveVar(merged, '--bit-color-stripe');
    const surface = resolveVar(merged, '--bit-color-surface');
    expect(stripe).toBe('#353545');
    // Light's stone on white is 1.36:1; dark #353545 on #20202A is 1.34:1.
    expect(contrastRatio(stripe, surface)).toBeGreaterThanOrEqual(1.3);
    expect(contrastRatio(resolveVar(merged, '--bit-color-text'), stripe)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(resolveVar(merged, '--bit-color-text-muted'), stripe)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('PR2 light values (spec §2)', () => {
  const { light } = themeModes(readCss('themes/power-up.css'));

  it.each([
    ['--bit-color-accent', '#7C3AED'],
    ['--bit-color-link', '#7C3AED'],
    ['--bit-color-link-visited', '#5B2BB5'],
    // Not the spec's var(--bit-color-danger) (#D91A1A, 4.41:1 on the page): see the plan's deviation D1.
    ['--bit-color-danger-text', '#D61A1A'],
    ['--bit-color-knob', '#FFFFFF'],
  ])('%s is %s in light', (token, value) => {
    expect(resolveVar(light, token)).toBe(value);
  });

  it('accent and link follow the palette violet, and the knob the palette white', () => {
    expect(light.get('--bit-color-accent')).toBe('var(--bit-palette-violet)');
    expect(light.get('--bit-color-link')).toBe('var(--bit-palette-violet)');
    expect(light.get('--bit-color-knob')).toBe('var(--bit-palette-white)');
  });

  it('light stripes are stone', () => {
    const { light } = themeModes(readCss('themes/power-up.css'));
    expect(resolveVar(light, '--bit-color-stripe')).toBe('#DCDED6');
  });
});

describe('code-text (Code inside a Table)', () => {
  const { light, dark } = themeModes(readCss('themes/power-up.css'));
  const modes: [string, Map<string, string>, string][] = [
    ['light', light, '#6527D4'],
    ['dark', new Map([...light, ...dark]), '#FFC800'],
  ];

  it.each(modes)('%s --bit-color-code-text resolves to its hex', (_mode, map, hex) => {
    expect(resolveVar(map, '--bit-color-code-text')).toBe(hex);
  });

  it.each(modes)('%s --bit-color-code-text is readable on surface, page and stripe', (_mode, map) => {
    const text = resolveVar(map, '--bit-color-code-text');
    for (const bg of ['--bit-color-surface', '--bit-color-bg', '--bit-color-stripe']) {
      expect(contrastRatio(text, resolveVar(map, bg))).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
});
