import { describe, it, expect } from 'vitest';
import { withSystemMode } from '../../../react/scripts/system-mode.mjs';
import { readCss, listCss, parseCustomProps, themeModes, styleRules } from './css';

const css = readCss('themes/power-up.css');
/** The theme as it ships: build-css.mjs adds the data-mode="system" copy of the dark block. */
const shipped = withSystemMode(css);

const DARK_OS = '(prefers-color-scheme: dark)';
const MODES = ['.bit-light', '.bit-dark', '[data-mode="light"]', '[data-mode="dark"]', '[data-mode="system"]'];

/** The one top-level rule of `source` whose selector list includes `selector`, alone or inside :is() or :where(). */
function ruleWith(source: string, selector: string, media: string | null = null) {
  return styleRules(source).filter((rule) => rule.media === media && rule.selector.includes(selector));
}

function parseCustomPropsAndScheme(body: string): Map<string, string> {
  const map = parseCustomProps(body);
  const scheme = /(?<![-\w])color-scheme\s*:\s*([^;]+);/.exec(body);
  if (scheme) map.set('color-scheme', scheme[1]!.trim());
  return map;
}

/** Property names in a rule body that are not custom properties (`--*`). Comments are ignored. */
function plainProperties(body: string): string[] {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map((declaration) => /^\s*([-\w]+)\s*:/.exec(declaration)?.[1])
    .filter((name): name is string => name !== undefined && !name.startsWith('--'));
}

const darkRule = () => ruleWith(css, '.bit-dark, [data-mode="dark"])').find((rule) => !rule.selector.includes('.bit-light'))!;
const systemRule = () => ruleWith(shipped, '[data-mode="system"]', DARK_OS)[0]!;

describe('data-mode="system" follows the OS in CSS', () => {
  it('the source writes the dark block once: no prefers-color-scheme query of its own', () => {
    expect(css).not.toContain('prefers-color-scheme');
    expect(darkRule()).toBeDefined();
  });

  it('every mode is in the shared selector list, so any element set to one re-declares the shared tokens', () => {
    const shared = styleRules(css).find((rule) => rule.media === null && rule.selector.includes(':where(:root)'))!;
    for (const mode of MODES) expect(shared.selector).toContain(mode);
  });

  it('the shipped theme has the dark-OS copy, scoped to elements set to system, never :root or html', () => {
    expect(systemRule()).toBeDefined();
    expect(systemRule().layer).toBe('bit.tokens');
    expect(systemRule().selector).not.toMatch(/:root|(^|[\s,(])html\b/);
    expect(styleRules(shipped).filter((rule) => rule.media === DARK_OS)).toHaveLength(1);
  });

  it("the copy's selectors are the dark block's, reading [data-mode=\"system\"] where the dark block reads the two dark switches", () => {
    expect(systemRule().selector).toBe(darkRule().selector.replaceAll('.bit-dark, [data-mode="dark"]', '[data-mode="system"]'));
  });

  it('declares the same properties and values as the dark block, including color-scheme', () => {
    const system = parseCustomPropsAndScheme(systemRule().body);
    const dark = parseCustomPropsAndScheme(darkRule().body);
    expect(system.size).toBeGreaterThan(0);
    expect(system.get('color-scheme')).toBe('dark');
    expect(Object.fromEntries(system)).toEqual(Object.fromEntries(dark));
  });

  it('neither body declares a plain property other than color-scheme, so parity sees everything', () => {
    expect(plainProperties(systemRule().body)).toEqual(['color-scheme']);
    expect(plainProperties(darkRule().body)).toEqual(['color-scheme']);
  });

  it('does not leak dark values into the light theme', () => {
    const { light, dark } = themeModes(shipped);
    expect(light.get('--bit-color-bg')).not.toBe(dark.get('--bit-color-bg'));
    expect(light.get('--bit-color-text')).toBe('var(--bit-palette-ink)');
    expect(themeModes(shipped)).toEqual(themeModes(css));
  });
});

/** Normalised declarations of a rule body, so two bodies compare equal regardless of whitespace. */
function declarations(body: string): string[] {
  return body
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort();
}

const DARK_SWITCH = ':is(.bit-dark, [data-mode="dark"])';
const DARK_OS_MEDIA = /^\(prefers-color-scheme:\s*dark\)$/;

describe('every dark-mode component or system rule has a system twin behind a dark-OS query', () => {
  const files = [...listCss('components').map((f) => `components/${f}`), ...listCss('system').map((f) => `system/${f}`)];
  const rules = files.flatMap((file) => styleRules(readCss(file)).map((rule) => ({ ...rule, file })));
  const darkRules = rules.filter((r) => r.media === null && r.selector.startsWith(`${DARK_SWITCH} `));

  it('finds the dark rules it checks (the scan is not empty)', () => {
    expect(darkRules.length).toBeGreaterThan(0);
  });

  it('every dark descendant rule turns on with the bit-dark class as well as data-mode="dark"', () => {
    const bare = rules.filter((r) => r.media === null && /(^|,\s*)\[data-mode="dark"\]\s+\S/.test(r.selector));
    expect(bare.map((r) => `${r.file}: ${r.selector}`)).toEqual([]);
  });

  for (const dark of darkRules) {
    const systemSelector = dark.selector.replaceAll(DARK_SWITCH, '[data-mode="system"]');
    it(`${dark.file}: ${dark.selector} → @media (prefers-color-scheme: dark) { ${systemSelector} }`, () => {
      const twin = rules.find((r) => r.file === dark.file && r.media !== null && DARK_OS_MEDIA.test(r.media) && r.selector === systemSelector);
      expect(twin, `no system twin for ${dark.selector}`).toBeDefined();
      expect(declarations(twin!.body)).toEqual(declarations(dark.body));
    });
  }
});
