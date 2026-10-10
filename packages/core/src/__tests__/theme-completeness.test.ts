import { describe, it, expect } from 'vitest';
import { MODE_TOKENS, SEMANTIC_TOKENS } from '../tokens';
import { listCss, readCss, themeModes } from './css';

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

    it('applies itself to :root and to its data-theme selector', () => {
      const themeName = file.replace(/\.css$/, '');
      expect(css).toMatch(/:root/);
      expect(css).toContain(`[data-theme="${themeName}"]`);
    });

    it('its dark block overrides exactly the mode tokens', () => {
      expect([...dark.keys()].sort()).toEqual([...MODE_TOKENS].sort());
    });

    it('dark block is attribute-only, so any element (not just <html>) can be dark', () => {
      expect(css).toMatch(/(^|\n)\s*\[data-mode="dark"\] \{/);
    });

    it('the shared block also applies to [data-mode="light"], [data-mode="dark"] and [data-mode="system"] elements, so derived tokens (shadows) re-resolve in a dark subtree', () => {
      expect(css).toMatch(/:root,\s*\[data-theme="[^"]+"\],\s*\[data-mode="light"\],\s*\[data-mode="dark"\],\s*\[data-mode="system"\]\s*\{/);
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
