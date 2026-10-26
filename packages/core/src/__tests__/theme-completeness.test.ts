import { describe, it, expect } from 'vitest';
import { MODE_TOKENS, ROLE_TOKENS, SEMANTIC_TOKENS } from '../tokens';
import { listCss, readCss, resolveVar, styleRules, themeModes } from './css';

const themes = listCss('themes');

describe('themes', () => {
  it('has at least one theme file', () => {
    expect(themes.length).toBeGreaterThan(0);
  });

  describe.each(themes)('%s', (file) => {
    const css = readCss(`themes/${file}`);
    const { light, dark } = themeModes(css);

    it('declares every semantic token in its light (default) block', () => {
      expect(SEMANTIC_TOKENS.filter((name) => !light.has(name))).toEqual([]);
    });

    it('declares no unknown --bit- tokens (typos) outside the palette tier', () => {
      const unknown = [...light.keys(), ...dark.keys()].filter(
        (name) => name.startsWith('--bit-') && !name.startsWith('--bit-palette-') && !SEMANTIC_TOKENS.includes(name),
      );
      expect(unknown).toEqual([]);
    });

    const themeName = file.replace(/\.css$/, '');
    const isDefault = themeName === 'power-up';
    const scope = `:is(.bit-theme-${themeName}, [data-theme="${themeName}"])`;
    const inside = `:where(.bit-theme-${themeName}, [data-theme="${themeName}"])`;
    const MODES = ':is(.bit-light, .bit-dark, [data-mode="light"], [data-mode="dark"], [data-mode="system"])';
    const DARK = ':is(.bit-dark, [data-mode="dark"])';
    const rules = styleRules(css).filter((rule) => rule.media === null);
    const shared = rules.find((rule) => rule.selector.includes(`${scope}${MODES}`))!;
    const darkRule = rules.find((rule) => rule.selector.includes(`${scope}${DARK}`))!;

    it('applies itself to its class (bit-theme-<name>) and its data-theme attribute, and to a mode on that element', () => {
      expect(shared).toBeDefined();
      expect(shared.selector.split(/,\s*(?![^(]*\))/)).toContain(scope);
    });

    it('only power-up is the default on the page root and on bare modes, at zero specificity so any other theme wins', () => {
      expect(shared.selector.includes(':where(:root)')).toBe(isDefault);
      expect(shared.selector.includes(`:where(.bit-light, .bit-dark, [data-mode="light"], [data-mode="dark"], [data-mode="system"])`)).toBe(isDefault);
      expect(darkRule.selector.includes(':where(.bit-dark, [data-mode="dark"])')).toBe(isDefault);
      expect(css).not.toMatch(/(^|[\s,])(:root|html)\s*[,{]/);
    });

    it('any other theme also reaches a mode anywhere inside it, at one class, over the default', () => {
      expect(shared.selector.includes(`${inside} ${MODES}`)).toBe(!isDefault);
      expect(darkRule.selector.includes(`${inside} ${DARK}`)).toBe(!isDefault);
    });

    it('dark mode works on any element (the bit-dark class or data-mode="dark"), and on the theme element itself at two classes', () => {
      expect(darkRule).toBeDefined();
      expect(darkRule.selector).toContain(`${scope}${DARK}`);
      expect(darkRule.selector).not.toMatch(/:root|html/);
    });

    it('its dark block overrides exactly the mode tokens', () => {
      expect([...dark.keys()].sort()).toEqual([...MODE_TOKENS].sort());
    });

    it('the shared block also applies to every mode element, so derived tokens (shadows) re-resolve in a dark subtree', () => {
      const modes = isDefault ? `:where(.bit-light, .bit-dark, [data-mode="light"], [data-mode="dark"], [data-mode="system"])` : `${inside} ${MODES}`;
      expect(shared.selector).toContain(modes);
    });

    it('never uses the bare [data-mode] selector (without a value)', () => {
      expect(css).not.toMatch(/\[data-mode\]\s*[,{]/);
    });

    it('each mode tells the browser its color scheme, so native controls match', () => {
      expect(css).toContain('color-scheme: light;');
      expect(css).toContain('color-scheme: dark;');
    });
  });
});

describe('power-up role tokens', () => {
  const { light, dark: darkOverrides } = themeModes(readCss('themes/power-up.css'));
  const dark = new Map([...light, ...darkOverrides]);
  // Each role points at today's step of the scale, so switching components onto roles moves nothing.
  const POINTS_AT: readonly (readonly [role: string, step: string])[] = [
    ['--bit-radius-control', '--bit-radius-10px'],
    ['--bit-radius-surface', '--bit-radius-10px'],
    ['--bit-radius-card', '--bit-radius-14px'],
    ['--bit-radius-chip', '--bit-radius-6px'],
    ['--bit-shadow-control', '--bit-shadow-md'],
    ['--bit-shadow-control-hover', '--bit-shadow-sm'],
    ['--bit-shadow-surface', '--bit-shadow-md'],
    ['--bit-shadow-raised', '--bit-shadow-lg'],
    ['--bit-shadow-chip', '--bit-shadow-sm'],
  ];

  /**
   * The role tokens a theme leaves out of the block that also matches mode elements. Declared on the root alone, a
   * role would keep the root's computed shadow inside a dark subtree (a light shadow on a dark Card); declared in
   * the shared block, it re-resolves on the mode element, as the scale shadows do.
   */
  const rolesOutsideModeBlock = (css: string) => {
    const shared = styleRules(css).filter((rule) => rule.media === null && rule.selector.includes('.bit-light'));
    const declared = new Set(shared.flatMap((rule) => [...rule.body.matchAll(/(--bit-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!)));
    return ROLE_TOKENS.filter((role) => !declared.has(role));
  };

  it('declares every role in the block that also matches mode elements, so a dark subtree re-resolves it', () => {
    const css = readCss('themes/power-up.css');
    expect(rolesOutsideModeBlock(css)).toEqual([]);
    // The failure this guards against: the same declarations moved to a root-only rule.
    const rootOnly = css.replace(/    --bit-radius-control:[\s\S]*?--bit-shadow-chip: var\(--bit-shadow-sm\);\n/, '');
    expect(rolesOutsideModeBlock(`${rootOnly}\n:where(:root) { --bit-radius-control: 10px; }`)).toEqual([...ROLE_TOKENS]);
  });

  it.each(POINTS_AT)('%s points at %s', (role, step) => {
    expect(light.get(role)).toBe(`var(${step})`);
    expect(resolveVar(light, role)).toBe(resolveVar(light, step));
    expect(resolveVar(dark, role)).toBe(resolveVar(dark, step));
  });
});
