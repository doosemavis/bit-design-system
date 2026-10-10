import { describe, expect, it } from 'vitest';
import { block, decl, readCss } from '../css';

describe('components/theme.css', () => {
  it("BitTheme's root paints its subtree in the page color and text of its own theme and mode", () => {
    const body = block(readCss('components/theme.css'), '.bit-theme')!;
    expect(decl(body, 'background')).toBe('var(--bit-color-bg)');
    expect(decl(body, 'color')).toBe('var(--bit-color-text)');
  });
});
