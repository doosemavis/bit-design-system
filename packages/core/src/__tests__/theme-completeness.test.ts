import { describe, it, expect } from 'vitest';
import { MODE_TOKENS, SEMANTIC_TOKENS } from '../tokens';
import { listCss, readCss, styleRules, themeModes } from './css';

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

    it('never uses the bare [data-mode] selector (without a value)', () => {
      expect(css).not.toMatch(/\[data-mode\]\s*[,{]/);
    });

    it('each mode tells the browser its color scheme, so native controls match', () => {
      expect(css).toContain('color-scheme: light;');
      expect(css).toContain('color-scheme: dark;');
    });
  });
});
