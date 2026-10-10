import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { decl, readCss } from './css';

/**
 * Security audit A1: the theme used to @import Google Fonts, so every consumer app sent its visitors' IPs to
 * Google. The fonts now ship in the package (owner decision 2026-10-06): power-up.css declares one @font-face
 * per family, weight and subset, pointing at woff2 files that packages/react's build copies from @fontsource
 * into dist/themes/fonts/. The faces, weights and subsets are exactly what the Google import served: every
 * subset each family has, so Cyrillic, Greek and Vietnamese text keeps its face instead of a system fallback.
 */
const FAMILIES: readonly (readonly [family: string, id: string, weights: readonly number[], subsets: readonly string[]])[] = [
  ['Lilita One', 'lilita-one', [400], ['latin-ext', 'latin']],
  ['Nunito', 'nunito', [600, 700, 800], ['cyrillic-ext', 'cyrillic', 'vietnamese', 'latin-ext', 'latin']],
  ['Press Start 2P', 'press-start-2p', [400], ['cyrillic-ext', 'cyrillic', 'greek', 'latin-ext', 'latin']],
  ['Audiowide', 'audiowide', [400], ['latin-ext', 'latin']],
  ['JetBrains Mono', 'jetbrains-mono', [400, 700], ['cyrillic-ext', 'cyrillic', 'greek', 'vietnamese', 'latin-ext', 'latin']],
];

/** Italic weights, beside the upright ones: Nunito's two weight tokens, for Text italic (0.1.8). */
const ITALICS: Readonly<Record<string, readonly number[]>> = { Nunito: [600, 800] };

/**
 * Google's (and @fontsource's) ranges, so a page fetches a subset only when it shows one of its characters.
 * Listed in Google's order: where ranges overlap (U+0304, U+0308, U+0329) the later rule wins, so latin is last.
 */
const UNICODE_RANGES: Readonly<Record<string, string>> = {
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  greek: 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF',
  vietnamese:
    'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
};
const SUBSET_ORDER = Object.keys(UNICODE_RANGES);

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allCss = (readdirSync(srcDir, { recursive: true }) as string[]).filter((f) => f.endsWith('.css')).sort();

const theme = readCss('themes/power-up.css');
const faces = [...theme.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]!);
const familyOf = (body: string) => decl(body, 'font-family')?.replace(/^"|"$/g, '');

describe('no shipped CSS loads anything from a third party (security audit A1)', () => {
  it('finds the CSS it checks', () => {
    expect(allCss).toContain('themes/power-up.css');
    expect(allCss).toContain('index.css');
  });

  it.each(allCss)('%s has no remote @import, no http(s) url() and no Google Fonts host', (file) => {
    const css = readCss(file);
    expect(css).not.toMatch(/@import\s*(url\()?\s*["']?(https?:)?\/\//i);
    expect(css).not.toMatch(/url\(\s*["']?(https?:)?\/\//i);
    expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });
});

describe('power-up self-hosts its fonts', () => {
  const expected = FAMILIES.flatMap(([family, id, weights, subsets]) =>
    [...weights.map((weight) => [weight, 'normal'] as const), ...(ITALICS[family] ?? []).map((weight) => [weight, 'italic'] as const)].flatMap(
      ([weight, style]) => subsets.map((subset) => ({ family, weight, style, subset, file: `${id}-${subset}-${weight}-${style}.woff2` })),
    ),
  );

  it('declares exactly one @font-face per family, style, weight and subset the family has: 46 in all', () => {
    const declared = faces.map((body) => `${familyOf(body)} ${decl(body, 'font-weight')} ${decl(body, 'src')}`).sort();
    const wanted = expected.map(({ family, weight, file }) => `${family} ${weight} url("./fonts/${file}") format("woff2")`).sort();
    expect(declared).toEqual(wanted);
    expect(faces).toHaveLength(46);
  });

  it("orders each family and weight's subsets as Google does, latin last, so latin wins the shared code points", () => {
    for (const [family, , weights] of FAMILIES) {
      const styled = [...weights.map((w) => [w, 'normal'] as const), ...(ITALICS[family] ?? []).map((w) => [w, 'italic'] as const)];
      for (const [weight, style] of styled) {
        const order = faces
          .filter((b) => familyOf(b) === family && decl(b, 'font-weight') === String(weight) && decl(b, 'font-style') === style)
          .map((b) => SUBSET_ORDER.find((s) => decl(b, 'src')?.includes(`-${s}-${weight}-${style}.woff2`)) ?? '');
        expect(order, `${family} ${weight} ${style}`).toEqual([...order].sort((a, b) => SUBSET_ORDER.indexOf(a) - SUBSET_ORDER.indexOf(b)));
        expect(order.at(-1), `${family} ${weight} ${style}`).toBe('latin');
      }
    }
  });

  it.each(expected)('$family $weight $style $subset: its style, swap, woff2 only, its own unicode-range', ({ family, weight, style, subset, file }) => {
    const body = faces.find((b) => decl(b, 'src')?.includes(`/${file}"`));
    expect(body, file).toBeDefined();
    expect(decl(body!, 'font-family')).toBe(`"${family}"`);
    expect(decl(body!, 'font-style')).toBe(style);
    expect(decl(body!, 'font-weight')).toBe(String(weight));
    expect(decl(body!, 'font-display')).toBe('swap');
    expect(decl(body!, 'src')).toBe(`url("./fonts/${file}") format("woff2")`);
    expect(decl(body!, 'unicode-range')).toBe(UNICODE_RANGES[subset]);
  });

  it('every family a font token or component asks for first is one of the self-hosted families', () => {
    const tokens = [...theme.matchAll(/--bit-font-[\w-]+\s*:\s*([^;]+);/g)].map((m) => m[1]!);
    const declarations = allCss.flatMap((f) => [...readCss(f).matchAll(/font-family\s*:\s*([^;]+);/g)].map((m) => m[1]!));
    const firstNamed = [...tokens, ...declarations]
      .map((value) => /^"([^"]+)"/.exec(value.trim())?.[1])
      .filter((name): name is string => Boolean(name));
    expect(firstNamed).toEqual(expect.arrayContaining(['Lilita One', 'Nunito', 'Press Start 2P', 'JetBrains Mono', 'Audiowide']));
    const hosted = new Set(faces.map(familyOf));
    expect(firstNamed.filter((name) => !hosted.has(name))).toEqual([]);
  });

  it('the token weights are weights it ships for the body face', () => {
    const nunito = FAMILIES.find(([family]) => family === 'Nunito')![2];
    for (const token of ['--bit-weight-normal', '--bit-weight-bold']) {
      const value = new RegExp(`${token}\\s*:\\s*(\\d+);`).exec(theme)?.[1];
      expect(nunito, token).toContain(Number(value));
    }
  });
});
