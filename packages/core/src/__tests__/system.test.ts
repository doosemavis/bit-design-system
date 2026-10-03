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

describe('system/reset.css browser surfaces (amendments §C)', () => {
  const css = readCss('system/reset.css');

  it('selection is the selection color with ink text', () => {
    const body = block(css, '::selection');
    expect(body).toContain('background: var(--bit-color-selection);');
    expect(body).toContain('color: var(--bit-color-ink);');
  });

  it('the caret is primary and scrollbars are an ink thumb on a neutral-soft track', () => {
    const root = block(css, ':root');
    expect(root).toContain('caret-color: var(--bit-color-primary);');
    expect(root).toContain('scrollbar-color: var(--bit-color-ink) var(--bit-color-neutral-soft);');
    expect(block(css, '*')).toContain('scrollbar-width: thin;');
  });
});

describe('components/logo.css', () => {
  const css = readCss('components/logo.css');

  it('the eras read the logo coin tokens, never primary or warning, so the palette swap leaves the logo gold', () => {
    expect(css).not.toMatch(/--bit-color-(primary|warning)/);
    for (const name of ['--bit-logo-coin', '--bit-logo-coin-light', '--bit-logo-coin-shade', '--bit-logo-coin-deep']) {
      expect(css).toContain(`var(${name})`);
    }
  });
});

describe('focus ring (D9)', () => {
  const reset = readCss('system/reset.css');

  it('reset.css draws a 3px ink outline at a 3px offset on :focus-visible', () => {
    const body = block(reset, ':focus-visible');
    expect(body).toContain('outline: 3px solid var(--bit-color-ink);');
    expect(body).toContain('outline-offset: 3px;');
  });

  it('programmatic focus targets (tabindex="-1", e.g. a page heading) show no ring', () => {
    expect(block(reset, ':is(h1, h2, h3, h4, h5, h6, main, section)[tabindex="-1"]:focus')).toContain(
      'outline: none;',
    );
  });

  it('roving-tabindex widgets keep their ring: no bare [tabindex="-1"]:focus rule', () => {
    expect(reset).not.toMatch(/(^|\n)\[tabindex="-1"\]:focus\s*\{/);
  });

  it.each(listCss('components'))('%s never sets outline, so nothing can override the ink ring', (file) => {
    expect(readCss(`components/${file}`)).not.toMatch(/^\s*outline\s*:/m);
  });

  /** Interactive components carry the yellow band. PR2 adds link, input, select, switch, segmented-control, code. */
  const INTERACTIVE = ['button.css'] as const;

  describe.each(INTERACTIVE)('%s', (file) => {
    const css = readCss(`components/${file}`);
    const blockName = file.replace(/\.css$/, '');

    it('every box-shadow starts with the band, so no variant, hover, or active state can drop it', () => {
      const shadows = [...css.matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1]!.trim());
      expect(shadows.length).toBeGreaterThan(0);
      for (const shadow of shadows) expect(shadow.startsWith('var(--_bit-focus-band)')).toBe(true);
    });

    it('the block resets the band, so a focused ancestor cannot leak it into this component', () => {
      expect(block(css, `.bit-${blockName}`)).toContain('--_bit-focus-band: 0 0 #0000;');
    });

    it(':focus-visible turns the band on from the theme token', () => {
      expect(block(css, `.bit-${blockName}:focus-visible`)).toContain('--_bit-focus-band: var(--bit-focus-band);');
    });
  });
});

describe('components/badge.css', () => {
  const css = readCss('components/badge.css');
  it('a pill reads radius-full; data-shape="square" reads the 6px radius', () => {
    expect(block(css, '.bit-badge')).toContain('border-radius: var(--bit-radius-full);');
    expect(block(css, '.bit-badge[data-shape="square"]')).toContain('border-radius: var(--bit-radius-6px);');
  });
});
