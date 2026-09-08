import { describe, it, expect } from 'vitest';
import { SIZES, TEXT_SIZES, TONES } from '../tokens';
import { listCss, readCss } from './css';

/** Return the body of the first `selector { ... }` block, or null. */
function block(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1]! : null;
}

describe('system/tones.css', () => {
  const css = readCss('system/tones.css');
  it.each(TONES)('.bit-%s remaps the four private tone variables', (tone) => {
    const body = block(css, `.bit-${tone}`);
    expect(body).not.toBeNull();
    for (const suffix of ['', '-contrast', '-hover', '-soft']) {
      expect(body).toContain(`--_bit-tone${suffix}: var(--bit-color-${tone}${suffix});`);
    }
  });
});

describe('system/sizes.css', () => {
  const css = readCss('system/sizes.css');
  it.each(SIZES)('.bit-%s remaps height, padding, and text', (size) => {
    const body = block(css, `.bit-${size}`);
    expect(body).toContain(`--_bit-size-height: var(--bit-control-height-${size});`);
    expect(body).toContain(`--_bit-size-padding: var(--bit-control-padding-${size});`);
    expect(body).toContain(`--_bit-size-text: var(--bit-text-${size});`);
  });
  it.each(TEXT_SIZES.filter((s) => !(SIZES as readonly string[]).includes(s)))('.bit-%s remaps text only', (size) => {
    const body = block(css, `.bit-${size}`);
    expect(body).toContain(`--_bit-size-text: var(--bit-text-${size});`);
    expect(body).not.toContain('--_bit-size-height');
  });
});

describe('system/motion.css', () => {
  const css = readCss('system/motion.css');
  it('defines the power-up grow and the spin keyframes', () => {
    expect(css).toMatch(/@keyframes bit-power-up\s*\{/);
    expect(css).toMatch(/@keyframes bit-spin\s*\{/);
  });
});

describe('index.css', () => {
  const css = readCss('index.css');
  it('imports every system file, in order, before any component file', () => {
    for (const name of ['reset', 'tones', 'sizes', 'motion']) {
      expect(css).toContain(`@import "./system/${name}.css";`);
    }
    const systemEnd = css.lastIndexOf('./system/');
    const firstComponent = css.indexOf('./components/');
    if (firstComponent !== -1) expect(firstComponent).toBeGreaterThan(systemEnd);
  });
  it('imports every file in components/', () => {
    for (const file of listCss('components')) {
      expect(css).toContain(`@import "./components/${file}";`);
    }
  });
});
