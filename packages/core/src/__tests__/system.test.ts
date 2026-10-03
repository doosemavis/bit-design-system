import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, SIZES, COLORS } from '../tokens';
import { listCss, readCss } from './css';

/** Return the body of the first `selector { ... }` block, or null. */
function block(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1]! : null;
}

describe('system/colors.css', () => {
  const css = readCss('system/colors.css');
  it.each(COLORS)('.bit-%s remaps the four private color variables', (color) => {
    const body = block(css, `.bit-${color}`);
    expect(body).not.toBeNull();
    for (const suffix of ['', '-contrast', '-hover', '-soft']) {
      expect(body).toContain(`--_bit-color${suffix}: var(--bit-color-${color}${suffix});`);
    }
  });
});

describe('system/sizes.css', () => {
  const css = readCss('system/sizes.css');
  /** Control text sizes in px. Frozen with the rename: sm 13px, md 15px, lg 18px. */
  const CONTROL_TEXT = { sm: 13, md: 15, lg: 18 } as const;

  it.each(SIZES)('.bit-%s remaps height, padding, and text', (size) => {
    const body = block(css, `.bit-${size}`);
    expect(body).toContain(`--_bit-size-height: var(--bit-control-height-${size});`);
    expect(body).toContain(`--_bit-size-padding: var(--bit-control-padding-${size});`);
    expect(body).toContain(`--_bit-size-text: var(--bit-text-${CONTROL_TEXT[size]}px);`);
  });

  it.each(['xs', 'xl', '2xl'])('declares no .bit-%s decorator (Text sizes are data-size now)', (name) => {
    expect(block(css, `.bit-${name}`)).toBeNull();
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
    for (const name of ['reset', 'colors', 'sizes', 'motion']) {
      expect(css).toContain(`@import "./system/${name}.css";`);
    }
    const systemEnd = css.lastIndexOf('./system/');
    const firstComponent = css.indexOf('./components/');
    expect(firstComponent).toBeGreaterThan(systemEnd);
  });
  it('imports every file in components/', () => {
    for (const file of listCss('components')) {
      expect(css).toContain(`@import "./components/${file}";`);
    }
  });
});

describe('system/*.css conventions', () => {
  for (const file of listCss('system')) {
    it(`${file}: every var(--bit-…) it reads is a semantic token`, () => {
      const reads = [...readCss(`system/${file}`).matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);
      for (const name of reads) expect(SEMANTIC_TOKENS).toContain(name);
    });
  }
});

describe('components/*.css conventions', () => {
  for (const file of listCss('components')) {
    const css = readCss(`components/${file}`);

    it(`${file}: every var(--bit-…) it reads is a semantic token`, () => {
      const reads = [...css.matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);
      for (const name of reads) {
        expect(SEMANTIC_TOKENS).toContain(name);
      }
    });

    it(`${file}: contains no --bit-palette- reference`, () => {
      expect(css).not.toContain('--bit-palette-');
    });

    it(`${file}: every custom property it declares starts with --_bit-`, () => {
      const declared = [...css.matchAll(/^\s*(--[a-zA-Z0-9_-]+)\s*:/gm)].map((m) => m[1]!);
      for (const name of declared) {
        expect(name.startsWith('--_bit-')).toBe(true);
      }
    });
  }
});
