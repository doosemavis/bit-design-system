import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS } from '../tokens';
import { listCss, parseCustomProps, readCss } from './css';

const themes = listCss('themes');

describe('themes', () => {
  it('has at least one theme file', () => {
    expect(themes.length).toBeGreaterThan(0);
  });

  describe.each(themes)('%s', (file) => {
    const declared = parseCustomProps(readCss(`themes/${file}`));

    it('declares every semantic token', () => {
      const missing = SEMANTIC_TOKENS.filter((name) => !declared.has(name));
      expect(missing).toEqual([]);
    });

    it('declares no unknown --bit- tokens (typos) outside the palette tier', () => {
      const unknown = [...declared.keys()].filter(
        (name) => name.startsWith('--bit-') && !name.startsWith('--bit-palette-') && !SEMANTIC_TOKENS.includes(name),
      );
      expect(unknown).toEqual([]);
    });

    it('applies itself to :root and to its data-theme selector', () => {
      const css = readCss(`themes/${file}`);
      const themeName = file.replace(/\.css$/, '');
      expect(css).toMatch(/:root/);
      expect(css).toContain(`[data-theme="${themeName}"]`);
    });
  });
});
