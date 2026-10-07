import { describe, it, expect } from 'vitest';
import { CODE_KINDS, COLORS } from '../tokens';
import { contrastRatio, listCss, luminance, readCss, resolveVar, themeModes } from './css';

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

  it('inline Code text is readable on the code background', () => {
    expect(contrastRatio(resolveColor('--bit-code-text'), resolveColor('--bit-code-bg'))).toBeGreaterThanOrEqual(AA_TEXT);
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

  // Owner decision 2026-10-04 (outline option A): the outline border is always the solid colour. These two
  // edges are under 3:1 against the surface by choice; any new colour or palette change that adds one fails
  // here, so it is a deliberate decision.
  it('outline: the colours whose edge is under 3:1 on the surface are exactly the accepted ones', () => {
    const isDark = resolveColor('--bit-color-surface').toLowerCase() !== '#ffffff';
    const surface = resolveColor('--bit-color-surface');
    const under = COLORS.filter((color) => {
      const edge = color === 'neutral' ? '--bit-color-line' : `--bit-color-${color}`;
      return contrastRatio(resolveColor(edge), surface) < AA_NON_TEXT;
    });
    expect(under).toEqual(isDark ? ['primary'] : ['warning']);
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
    ['--bit-color-neutral', '#9A9EB0'], ['--bit-color-neutral-contrast', '#151515'],
    ['--bit-color-neutral-hover', '#ADB1C2'], ['--bit-color-neutral-soft', '#2B2B37'],
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

describe('inline Code pill', () => {
  const { light, dark } = themeModes(readCss('themes/power-up.css'));
  const darkMap = new Map([...light, ...dark]);
  const modes: [string, Map<string, string>, string, string][] = [
    ['light', light, '#B79BFF', '#151515'],
    ['dark', darkMap, '#FFC800', '#2B2B37'],
  ];

  it.each(modes)('%s text and background resolve to their hexes', (_mode, map, text, bg) => {
    expect(resolveVar(map, '--bit-code-inline-text')).toBe(text);
    expect(resolveVar(map, '--bit-code-inline-bg')).toBe(bg);
  });

  it.each(modes)('%s text is readable on the pill', (_mode, map) => {
    expect(contrastRatio(resolveVar(map, '--bit-code-inline-text'), resolveVar(map, '--bit-code-inline-bg'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each([
    ['light', light, '#FFC800'],
    ['dark', darkMap, '#B79BFF'],
  ] as const)('%s selection resolves to its hex, and selected ink text on it is readable', (_mode, map, hex) => {
    const selection = resolveVar(map, '--bit-code-inline-selection');
    expect(selection).toBe(hex);
    expect(contrastRatio(resolveVar(map, '--bit-color-ink'), selection)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each([
    ['light', light, '#151515'],
    ['dark', darkMap, '#0B0B10'],
  ] as const)('%s on-tint background resolves to its hex, and the chip text stays readable on it', (_mode, map, hex) => {
    const bg = resolveVar(map, '--bit-code-inline-bg-on-tint');
    expect(bg).toBe(hex);
    expect(contrastRatio(resolveVar(map, '--bit-code-inline-text'), bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('light: the pill reads the CodeBlock background token, so a --bit-code-bg override still reaches it', () => {
    expect(light.get('--bit-code-inline-bg')).toBe('var(--bit-code-bg)');
    expect(light.get('--bit-code-inline-bg-on-tint')).toBe('var(--bit-code-inline-bg)');
  });

  it('dark: on every tinted surface the borderless pill stands apart, so it still reads as a chip there', () => {
    const pill = resolveVar(darkMap, '--bit-code-inline-bg-on-tint');
    const tints = ['--bit-color-neutral', ...['primary', 'success', 'warning', 'danger', 'neutral'].map((c) => `--bit-color-${c}-soft`)];
    for (const bg of tints) expect(contrastRatio(pill, resolveVar(darkMap, bg)), bg).toBeGreaterThan(1.25);
  });

  it('dark: with no border, the pill is lighter than the page and the surface, so it still reads as a chip', () => {
    const pill = resolveVar(darkMap, '--bit-code-inline-bg');
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(pill, resolveVar(darkMap, bg)), bg).toBeGreaterThan(1.1);
      expect(luminance(pill), bg).toBeGreaterThan(luminance(resolveVar(darkMap, bg)));
    }
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

describe('neutral colour (N1 steel, 0.1.4)', () => {
  const css = readCss('themes/power-up.css');
  const { light, dark } = themeModes(css);
  const modes: [string, Map<string, string>, string, string, string][] = [
    ['light', light, '#5F6372', '#4E5260', '#FFFFFF'],
    ['dark', new Map([...light, ...dark]), '#9A9EB0', '#ADB1C2', '#151515'],
  ];

  it.each(modes)('%s fill, hover and contrast resolve to their hexes', (_m, map, fill, hover, text) => {
    expect(resolveVar(map, '--bit-color-neutral')).toBe(fill);
    expect(resolveVar(map, '--bit-color-neutral-hover')).toBe(hover);
    expect(resolveVar(map, '--bit-color-neutral-contrast')).toBe(text);
  });

  it.each(modes)('%s fill and hover carry their contrast text at 4.5:1', (_m, map) => {
    const text = resolveVar(map, '--bit-color-neutral-contrast');
    expect(contrastRatio(text, resolveVar(map, '--bit-color-neutral'))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(text, resolveVar(map, '--bit-color-neutral-hover'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(modes)('%s fill stands out from the page and the surface at 3:1', (_m, map) => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(resolveVar(map, '--bit-color-neutral'), resolveVar(map, bg)), bg).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('neutral-soft is unchanged: stone in light, night-raised in dark', () => {
    expect(resolveVar(light, '--bit-color-neutral-soft')).toBe('#DCDED6');
    expect(resolveVar(new Map([...light, ...dark]), '--bit-color-neutral-soft')).toBe('#2B2B37');
  });

  it('the system-mode dark block carries the same neutral values as [data-mode="dark"]', () => {
    const sys = css.slice(css.indexOf('prefers-color-scheme'));
    for (const [name, value] of [['', '#9A9EB0'], ['-hover', '#ADB1C2'], ['-contrast', '#151515']]) {
      const m = sys.match(new RegExp(`--bit-color-neutral${name}:\\s*var\\((--bit-palette-[a-z-]+)\\)`));
      expect(m, name).not.toBeNull();
      expect(resolveVar(new Map([...light, ...dark]), m![1]!).toUpperCase()).toBe(value);
    }
  });

  it('the palette carries the four steel entries', () => {
    expect(resolveVar(light, '--bit-palette-steel')).toBe('#5F6372');
    expect(resolveVar(light, '--bit-palette-steel-hover')).toBe('#4E5260');
    expect(resolveVar(light, '--bit-palette-steel-light')).toBe('#9A9EB0');
    expect(resolveVar(light, '--bit-palette-steel-light-hover')).toBe('#ADB1C2');
  });

  // Neutral contrast is white in light, so it may only paint on the solid fill. Every contrast read in
  // the component CSS must sit beside a solid fill rule; the soft, outline and ghost looks use text.
  it('component CSS only reads the contrast colour on solid fills', () => {
    for (const file of listCss('components')) {
      const src = readCss(`components/${file}`);
      for (const [, selector] of src.matchAll(/([^{}]+)\{[^{}]*color:\s*var\(--_bit-color-contrast\)/g)) {
        expect(selector ?? '', `${file}: ${(selector ?? '').trim()}`).toMatch(/solid|:checked|\.bit-segmented-control__label/);
      }
    }
  });
});
