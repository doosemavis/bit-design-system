import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, SIZES, COLORS } from '../tokens';
import { OUTLINE_DECLARATION, block, decl, listCss, readCss, resolveVar, themeModes, withoutBlocks } from './css';

/**
 * The only places a component may read --bit-color-ink, by file and exact selector. Everything else
 * draws lines with --bit-color-line so they lift in dark mode. Each entry is an owner decision.
 */
const INK_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {
  // Decision 2: an on Switch outlines its track and thumb in ink so it stays crisp in dark mode.
  'switch.css': [
    '.bit-switch__input:checked + .bit-switch__track',
    '.bit-switch__input:checked + .bit-switch__track .bit-switch__thumb',
  ],
  // The Copy button is a light button on the dark code bar, edged and labelled in ink (board 1).
  'code-block.css': ['.bit-code__copy'],
  // Selected Code text is ink on the highlight, like the page's own ::selection in system/reset.css.
  'code.css': ['.bit-code::selection'],
  // The dimmed page behind a modal Dialog is ink at 55%, in both modes (owner pick D2, board dialog-tabs).
  'dialog.css': ['.bit-dialog::backdrop'],
};

describe('system/colors.css', () => {
  const css = readCss('system/colors.css');
  it.each(COLORS)('.bit-%s sets the outline edge and outline shadow', (color) => {
    const body = block(css, `.bit-${color}`);
    const edge = color === 'neutral' ? 'line' : color;
    expect(body).toContain(`--_bit-color-edge: var(--bit-color-${edge});`);
    const shadow = color === 'neutral' ? 'shadow' : color;
    expect(body).toContain(`--_bit-color-outline-shadow: var(--bit-color-${shadow});`);
  });
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
  /** Control text sizes in px: sm 14px, md 16px, lg 18px (the even scale, 0.1.8; 13 and 15 before). */
  const CONTROL_TEXT = { sm: 14, md: 16, lg: 18 } as const;

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
  it('defines the spin keyframes and no power-up grow (the logo no longer levels up)', () => {
    expect(css).toMatch(/@keyframes bit-spin\s*\{/);
    expect(css).not.toContain('bit-power-up');
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

  it('the root and any mode element set text, a primary caret, and a line-on-neutral-soft scrollbar', () => {
    const root = block(css, ':root,\n[data-mode="light"],\n[data-mode="dark"],\n[data-mode="system"]');
    expect(root).not.toBeNull();
    expect(root).toContain('caret-color: var(--bit-color-primary);');
    expect(root).toContain('scrollbar-color: var(--bit-color-line) var(--bit-color-neutral-soft);');
    expect(root).toContain('color: var(--bit-color-text);');
    expect(block(css, '*')).toContain('scrollbar-width: thin;');
  });

  it('a nested system subtree recomputes its text, caret and scrollbar too', () => {
    expect(block(css, ':root,\n[data-mode="light"],\n[data-mode="dark"],\n[data-mode="system"]')).toContain('color: var(--bit-color-text);');
  });
});

describe('components/logo.css', () => {
  const css = readCss('components/logo.css');
  const word = (era: number) => block(css, `.bit-logo[data-era="${era}"] .bit-logo__word`);

  it('the eras read the logo tokens, never primary or warning, so the palette swap leaves the logo gold and violet', () => {
    expect(css).not.toMatch(/--bit-color-(primary|warning)/);
    for (const name of [
      '--bit-logo-coin',
      '--bit-logo-coin-light',
      '--bit-logo-coin-shade',
      '--bit-logo-coin-deep',
      '--bit-logo-violet',
    ]) {
      expect(css).toContain(`var(${name})`);
    }
  });

  it('64-bit keeps its gold face, line stroke and gold extrusion, over a violet hard drop (Amendment 3, C2)', () => {
    const body = word(64)!;
    expect(body).toContain('color: var(--bit-logo-coin);');
    expect(body).toContain('-webkit-text-stroke: 1.5px var(--bit-color-line);');
    expect(body).toContain('paint-order: stroke fill;');
    for (const px of [1, 2, 3, 4]) expect(body).toContain(`${px}px ${px}px 0 var(--bit-logo-coin-shade)`);
    for (const px of [5, 6]) expect(body).toContain(`${px}px ${px}px 0 var(--bit-logo-violet)`);
    expect(body).not.toContain('var(--bit-color-shadow)');
  });

  it('the wordmark reads the text color, so it stays visible on a dark page', () => {
    expect(block(css, '.bit-logo')).toContain('color: var(--bit-color-text);');
  });

  it('era outlines read line and era shadows read shadow, never ink', () => {
    expect(css).not.toContain('var(--bit-color-ink)');
  });

  it('nothing moves: no animation, keyframes, or transform declarations', () => {
    expect(css).not.toMatch(/(?<![-\w])animation(-[a-z]+)?\s*:/);
    expect(css).not.toContain('@keyframes');
    expect(css).not.toMatch(/(?<![-\w])transform\s*:/);
    expect(css).not.toContain('data-animated');
  });

  it('sets the caption beside the word, centred', () => {
    const root = block(css, '.bit-logo')!;
    expect(root).toContain('display: inline-flex;');
    expect(root).toContain('flex-direction: row;');
    expect(root).toContain('align-items: center;');
    expect(root).toContain('gap: 0.4em;');
  });

  it('sizes the mark from the 32px type step', () => {
    expect(block(css, '.bit-logo.bit-sm')).toContain('font-size: var(--bit-text-32px);');
    expect(block(css, '.bit-logo.bit-md')).toContain('font-size: calc(var(--bit-text-32px) * 1.5);');
    expect(block(css, '.bit-logo.bit-lg')).toContain('font-size: calc(var(--bit-text-32px) * 2.25);');
  });

  it('draws each era on the word, with the agreed sizes', () => {
    // 8 and 16 are the reference box: Press Start 2P "bit" at 0.82em, tightened by -0.11em tracking; the
    // margin-right takes back the trailing tracking after "t" (owner fix 2, round 2, option B).
    for (const era of [8, 16]) {
      expect(word(era)).toContain('font-size: 0.82em;');
      expect(word(era)).toContain('letter-spacing: -0.11em;');
      expect(word(era)).toContain('margin-right: 0.11em;');
    }
    // 32 and 64 match its ink height (font-size), ink right edge (letter-spacing) and box width (margin-right),
    // so the caption starts at the same x in every era. Values measured in a browser (Amendment 2, B1).
    expect(word(32)).toContain('font-size: 0.955em;');
    expect(word(32)).toContain('letter-spacing: 0.4em;');
    expect(word(32)).toContain('margin-right: -0.317em;');
    // 64 is set in the same font as 32, so it takes 32's fitted values exactly (Amendment 3, C1).
    for (const prop of ['font-size', 'letter-spacing', 'margin-right', 'line-height']) {
      expect(decl(word(64)!, prop)).toBe(decl(word(32)!, prop));
    }
  });

  it('keeps the word box 0.82em tall in every era, so nothing below the logo moves between page loads', () => {
    // line-height × font-size ≈ 0.82: 0.859 × 0.955 (8 and 16 inherit line-height: 1).
    expect(word(32)).toContain('line-height: 0.859;');
    expect(word(64)).toContain('line-height: 0.859;');
  });

  it('sits on the top of its line, not the word baseline, so a heading around it is the same height in every era', () => {
    // Each era's font puts its baseline at a different height in the word box; baseline alignment
    // made the Home <h1> 65.5px tall for 8-bit and 59.5px for 32-bit at lg.
    expect(block(css, '.bit-logo')).toContain('vertical-align: top;');
  });

  it('32-bit uses Audiowide (lowercase), never the caps-only Bungee', () => {
    expect(word(32)).toContain('font-family: "Audiowide", var(--bit-font-display);');
    expect(css).not.toContain('Bungee');
  });

  it('64-bit uses Audiowide too, no longer Lilita One (Amendment 3, C1)', () => {
    expect(word(64)).toContain('font-family: "Audiowide", var(--bit-font-display);');
    expect(css).not.toContain('Lilita');
  });

  it('the caption is small muted pixel type in capitals, wrapping to two lines at its one space', () => {
    const caption = block(css, '.bit-logo__caption')!;
    for (const line of [
      'font-family: var(--bit-font-pixel);',
      'font-size: 0.26em;',
      'letter-spacing: 0.14em;',
      'line-height: 1.3;',
      'text-transform: uppercase;',
      'color: var(--bit-color-text-muted);',
      'width: min-content;',
      'white-space: normal;',
    ]) {
      expect(caption).toContain(line);
    }
  });
});

describe('themes/power-up.css (logo)', () => {
  const css = readCss('themes/power-up.css');
  it('loads Audiowide instead of Bungee and drops the power-up motion token', () => {
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family: "Audiowide";/);
    expect(css).not.toContain('Bungee');
    expect(css).not.toContain('--bit-motion-power-up');
  });

  it('the logo violet is a fixed brand colour, the palette violet in both modes (Amendment 3, C2)', () => {
    const { light, dark } = themeModes(css);
    expect(light.get('--bit-logo-violet')).toBe('var(--bit-palette-violet)');
    expect(resolveVar(light, '--bit-logo-violet')).toBe('#7C3AED');
    expect(dark.has('--bit-logo-violet')).toBe(false);
  });
});

describe('focus ring (dark mode spec: one ring, no band)', () => {
  const reset = readCss('system/reset.css');

  it('reset.css draws the ring from the three focus-ring tokens, unless a colored container overrides its color', () => {
    const body = block(reset, ':focus-visible');
    expect(body).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(body).toContain('outline-offset: var(--bit-focus-ring-offset);');
  });

  it('a solid alert draws rings inside it in its contrast color, so they stay visible on the fill', () => {
    expect(block(readCss('components/alert.css'), '.bit-alert.bit-solid')).toContain(
      '--_bit-focus-ring: var(--_bit-color-contrast);',
    );
  });

  // Owner pick A (2026-10-10): on a control with a hard shadow, the shadow moves out under the ring, so the gap
  // between control and ring is the same on every side instead of filling with shadow at the bottom-right.
  describe('the shadow moves out under the ring', () => {
    const lifted = '.bit-button:is(.bit-solid, .bit-outline):focus-visible:not(:disabled):not([aria-disabled="true"])::after,\n.bit-switch__input:focus-visible + .bit-switch__track::after';
    const button = readCss('components/button.css');
    const track = readCss('components/switch.css');

    it("::after is a box exactly the ring's outer edge, casting the control's own shadow and catching no clicks", () => {
      const body = block(reset, lifted)!;
      expect(body).not.toBeNull();
      expect(decl(body, 'content')).toBe('""');
      expect(decl(body, 'position')).toBe('absolute');
      expect(decl(body, 'inset')).toBe('calc(-1 * (var(--bit-border-width) + var(--bit-focus-ring-offset) + var(--bit-focus-ring-width)))');
      expect(decl(body, 'border-radius')).toBe('calc(var(--_bit-lift-radius) + var(--bit-focus-ring-offset) + var(--bit-focus-ring-width))');
      expect(decl(body, 'box-shadow')).toBe('var(--_bit-lift)');
      expect(decl(body, 'pointer-events')).toBe('none');
    });

    it('a focused Button drops its own shadow; the moved one follows hover and press', () => {
      const focused = block(button, '.bit-button:is(.bit-solid, .bit-outline):focus-visible:not(:disabled):not([aria-disabled="true"])')!;
      expect(decl(focused, 'box-shadow')).toBe('none');
      expect(decl(focused, 'position')).toBe('relative');
      // After the hover and press rules, at their weight, so a focused, hovered button never shows two shadows.
      expect(button.indexOf(':focus-visible:not(:disabled)')).toBeGreaterThan(button.indexOf('.bit-button.bit-ghost:active'));
      // The lift is each variant's own resting shadow.
      expect(button).toMatch(/\.bit-button \{\s*--_bit-lift: var\(--bit-shadow-md\);\s*--_bit-lift-radius: var\(--bit-radius-10px\);\s*\}/);
      expect(button).toMatch(/\.bit-button\.bit-outline \{\s*--_bit-lift: 4px 4px 0 var\(--_bit-color-outline-shadow\);\s*\}/);
      expect(button).toMatch(/\.bit-button\.bit-solid:hover:not\(:disabled\):not\(\[aria-disabled="true"\]\) \{\s*--_bit-lift: var\(--bit-shadow-sm\);\s*\}/);
      expect(decl(block(button, '.bit-button:is(.bit-solid, .bit-outline):active:not(:disabled):not([aria-disabled="true"])')!, '--_bit-lift')).toBe('none');
    });

    it("a focused Switch's track drops its shadow, and the moved one is the track's", () => {
      expect(decl(block(track, '.bit-switch__input:focus-visible + .bit-switch__track')!, 'box-shadow')).toBe('none');
      expect(track).toContain('--_bit-lift: var(--bit-shadow-sm);');
      expect(track).toContain('--_bit-lift-radius: var(--bit-radius-full);');
    });

    it("Table's scrolling wrapper paints gap, ring and moved shadow as box-shadow, keeping a transparent outline for forced colors", () => {
      const body = block(reset, '.bit-table:not(.bit-flat):focus-visible')!;
      expect(decl(body, 'outline-color')).toBe('transparent');
      expect(body).toContain('0 0 0 var(--bit-focus-ring-offset) var(--_bit-focus-gap, var(--bit-color-bg))');
      expect(body).toContain('4px 4px 0 calc(var(--bit-focus-ring-offset) + var(--bit-focus-ring-width)) var(--bit-color-shadow)');
      expect(decl(block(reset, '.bit-card')!, '--_bit-focus-gap')).toBe('var(--bit-color-surface)');
    });

    it("a ModeToggle option's ring sits inside it, on the pressed fill in that fill's contrast color", () => {
      expect(decl(block(reset, '.bit-mode-toggle__option:focus-visible')!, 'outline-offset')).toBe('calc(-1 * var(--bit-focus-ring-width) - 2px)');
      expect(block(readCss('components/mode-toggle.css'), '.bit-mode-toggle__option[aria-pressed="true"]')).toContain(
        '--_bit-focus-ring: var(--bit-color-warning-contrast);',
      );
    });
  });

  it('programmatic focus targets (tabindex="-1", e.g. a page heading) show no ring', () => {
    expect(block(reset, ':is(h1, h2, h3, h4, h5, h6, main, section)[tabindex="-1"]:focus')).toContain(
      'outline: none;',
    );
  });

  it('roving-tabindex widgets keep their ring: no bare [tabindex="-1"]:focus rule', () => {
    expect(reset).not.toMatch(/(^|\n)\[tabindex="-1"\]:focus\s*\{/);
  });

  it.each(listCss('components'))('%s never sets outline or its longhands, so nothing can override the ring', (file) => {
    expect(readCss(`components/${file}`)).not.toMatch(OUTLINE_DECLARATION);
  });

  it('the outline guard catches the shorthand and every longhand, and allows outline-offset', () => {
    for (const css of ['a {\n  outline: none;\n}', 'a { outline-color: red; }', 'a{outline-style:none}', 'a { color: red; outline-width: 0; }']) {
      expect(css).toMatch(OUTLINE_DECLARATION);
    }
    for (const css of ['a { outline-offset: 2px; }', '.bit-outline { color: red; }', '.bit-button.bit-outline:hover { color: red; }']) {
      expect(css).not.toMatch(OUTLINE_DECLARATION);
    }
  });

  it.each(listCss('components'))('%s has no focus band and no gloss', (file) => {
    const css = readCss(`components/${file}`);
    expect(css).not.toContain('focus-band');
    expect(css).not.toContain('--bit-gloss');
  });

  it.each(listCss('components'))('%s draws lines with --bit-color-line; ink only where the owner chose it', (file) => {
    const css = withoutBlocks(readCss(`components/${file}`), INK_EXCEPTIONS[file] ?? []);
    expect(css).not.toContain('var(--bit-color-ink)');
  });
});

describe('components/button.css outline', () => {
  const css = readCss('components/button.css');
  it('fills with the surface, edges with the color edge, and casts the color outline shadow', () => {
    const body = block(css, '.bit-button.bit-outline') ?? '';
    expect(decl(body, 'background')).toBe('var(--bit-color-surface)');
    expect(decl(body, 'color')).toBe('var(--bit-color-text)');
    expect(decl(body, 'border-color')).toBe('var(--_bit-color-edge)');
    expect(decl(body, 'box-shadow')).toBe('4px 4px 0 var(--_bit-color-outline-shadow)');
  });
  it('hover shrinks the shadow to the small offset, keeping its color', () => {
    const body = block(css, '.bit-button.bit-outline:hover:not(:disabled):not([aria-disabled="true"])') ?? '';
    expect(decl(body, 'box-shadow')).toBe('2px 2px 0 var(--_bit-color-outline-shadow)');
  });
  it('the ghost hover still uses the soft tint', () => {
    const body = block(css, '.bit-button.bit-ghost:hover:not(:disabled):not([aria-disabled="true"])') ?? '';
    expect(decl(body, 'background')).toBe('var(--_bit-color-soft)');
  });
});

describe('components/badge.css', () => {
  const css = readCss('components/badge.css');
  it('outline fills with the surface, edges with the color edge, and casts the small color shadow', () => {
    const body = block(css, '.bit-badge.bit-outline') ?? '';
    expect(decl(body, 'background')).toBe('var(--bit-color-surface)');
    expect(decl(body, 'color')).toBe('var(--bit-color-text)');
    expect(decl(body, 'border-color')).toBe('var(--_bit-color-edge)');
    expect(decl(body, 'box-shadow')).toBe('2px 2px 0 var(--_bit-color-outline-shadow)');
  });
  it('a pill reads radius-full; data-shape="square" reads the 6px radius', () => {
    expect(block(css, '.bit-badge')).toContain('border-radius: var(--bit-radius-full);');
    expect(block(css, '.bit-badge[data-shape="square"]')).toContain('border-radius: var(--bit-radius-6px);');
  });
  it('centers its label when made wider than its text (a stretched Stack child, a grid cell), like Button', () => {
    expect(decl(block(css, '.bit-badge') ?? '', 'justify-content')).toBe('center');
  });
});

describe('components/stack.css: children too big for the Stack spill past its end, never off its start', () => {
  const css = readCss('components/stack.css');
  // Plain end or center pushes overflow off the start side, where no scroll can reach it. safe falls back to
  // start when the children don't fit. The plain value comes first for browsers that don't know safe.
  it.each([
    ['[data-justify="end"]', 'justify-content', 'flex-end'],
    ['[data-justify="center"]', 'justify-content', 'center'],
    ['[data-align="end"]', 'align-items', 'flex-end'],
    ['[data-align="center"]', 'align-items', 'center'],
  ])('.bit-stack%s: %s safe %s, after the plain value', (attr, property, value) => {
    expect(block(css, `.bit-stack${attr}`)).toBe(` ${property}: ${value}; ${property}: safe ${value}; `);
  });
});

describe('components/badge.css lg', () => {
  const css = readCss('components/badge.css');
  const body = block(css, '.bit-badge.bit-lg') ?? '';
  it('lg reads in the body font at 16px bold, not uppercase', () => {
    expect(decl(body, 'font-family')).toBe('var(--bit-font-body)');
    expect(decl(body, 'font-size')).toBe('var(--bit-text-16px)');
    expect(decl(body, 'font-weight')).toBe('var(--bit-weight-bold)');
    expect(decl(body, 'text-transform')).toBe('none');
    expect(decl(body, 'letter-spacing')).toBe('0');
    expect(decl(body, 'padding')).toBe('6px 12px');
  });
});

/** Body of the first rule whose comma-separated selector list includes `selector`. */
function ruleWith(css: string, selector: string): string {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of bare.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (m[1]!.split(',').some((part) => part.trim() === selector)) return m[2]!;
  }
  return '';
}

describe('bit-flat drops the hard shadow and beats every shadow rule of its component', () => {
  const cases: Array<[string, string, string[]]> = [
    ['components/badge.css', '.bit-badge', ['.bit-badge.bit-flat', '.bit-badge.bit-flat.bit-outline', '.bit-badge.bit-flat.bit-solid']],
    ['components/card.css', '.bit-card', ['.bit-card.bit-flat', '.bit-card.bit-flat.bit-solid']],
    ['components/table.css', '.bit-table', ['.bit-table.bit-flat']],
  ];
  for (const [file, root, selectors] of cases) {
    it(`${file}: every flat selector sets box-shadow: none`, () => {
      const css = readCss(file);
      for (const selector of selectors) {
        expect(decl(ruleWith(css, selector), 'box-shadow'), selector).toBe('none');
      }
      // The class alone is covered too, and it is more specific than the bare root rule.
      expect(css).toContain(`${root}.bit-flat`);
    });
  }
  it('flat comes after the shadow rules it overrides (same or higher specificity)', () => {
    const badge = readCss('components/badge.css');
    expect(badge.indexOf('.bit-badge.bit-flat.bit-outline')).toBeGreaterThan(badge.indexOf('.bit-badge.bit-outline {'));
    const card = readCss('components/card.css');
    expect(card.indexOf('.bit-card.bit-flat.bit-solid')).toBeGreaterThan(card.indexOf('.bit-card.bit-solid {'));
  });
});

describe('components/mode-toggle.css', () => {
  const css = readCss('components/mode-toggle.css');
  it('the pressed option takes the warning fill and its contrast text', () => {
    const body = block(css, '.bit-mode-toggle__option[aria-pressed="true"]');
    expect(body).toContain('background: var(--bit-color-warning);');
    expect(body).toContain('color: var(--bit-color-warning-contrast);');
  });
  it('the pill is outlined with the line color and has the small hard shadow', () => {
    const body = block(css, '.bit-mode-toggle');
    expect(body).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
    expect(body).toContain('box-shadow: var(--bit-shadow-sm);');
  });
});
