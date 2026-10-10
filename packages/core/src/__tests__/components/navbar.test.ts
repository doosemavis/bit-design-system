import { describe, expect, it } from 'vitest';
import { VISUALLY_HIDDEN, block, contrastRatio, decl, readCss, resolveVar, rulesFor, styleRules, themeModes } from '../css';

const css = readCss('components/navbar.css');
const theme = themeModes(readCss('themes/power-up.css'));
const MODES = [
  ['light', theme.light],
  ['dark', new Map([...theme.light, ...theme.dark])],
] as const;

/** Every top-level rule whose selector names a variant: `.bit-navbar.bit-pill …` or `.bit-navbar.bit-bar …`. */
const variantRules = (variant: 'pill' | 'bar') =>
  styleRules(css).filter((rule) => rule.selector.split(/,\s*/).some((s) => s.startsWith(`.bit-navbar.bit-${variant}`)));

describe('components/navbar.css: the two variants are exactly the same height', () => {
  it('the root height comes from the size row alone: row + 2 × 8px + 2 borders, border-box', () => {
    const root = block(css, '.bit-navbar')!;
    expect(root).toContain('box-sizing: border-box;');
    expect(root).toContain('height: calc(var(--_bit-navbar-row) + 2 * var(--bit-space-8px) + 2 * var(--bit-border-width));');
    expect(root).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
    expect(root).toContain('padding: 0 var(--bit-space-16px);');
  });

  it.each([
    ['md', '.bit-navbar', 'var(--bit-control-height-lg)', 48 + 16 + 6],
    ['sm', '.bit-navbar.bit-sm', 'var(--bit-control-height-md)', 40 + 16 + 6],
  ])('%s: the row is %s, so both variants are %ipx tall', (_size, selector, row, px) => {
    expect(decl(block(css, selector)!, '--_bit-navbar-row')).toBe(row);
    const resolved = Number.parseInt(resolveVar(theme.light, row.slice(4, -1)), 10);
    const border = Number.parseInt(resolveVar(theme.light, '--bit-border-width'), 10);
    const space = Number.parseInt(resolveVar(theme.light, '--bit-space-8px'), 10);
    expect(resolved + 2 * space + 2 * border).toBe(px);
  });

  it.each(['pill', 'bar'] as const)('no %s rule sets a size: height, padding, border width or the row', (variant) => {
    const rules = variantRules(variant);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules.filter((r) => /^\.bit-navbar\.bit-(pill|bar)$/.test(r.selector))) {
      for (const prop of ['height', 'min-height', 'max-height', 'padding', 'padding-block', 'border', 'border-width', '--_bit-navbar-row']) {
        expect(decl(rule.body, prop), `${rule.selector} ${prop}`).toBeNull();
      }
    }
  });

  it('a link is the same height in both: row less four borders, set once on the base link', () => {
    expect(block(css, '.bit-navbar__link')).toContain('height: calc(var(--_bit-navbar-row) - 4 * var(--bit-border-width));');
    for (const variant of ['pill', 'bar'] as const) {
      for (const rule of variantRules(variant)) expect(decl(rule.body, 'height'), rule.selector).toBeNull();
    }
  });
});

describe('components/navbar.css: looks', () => {
  it('pill: one outlined neutral-soft pill, the current link filled primary with its ring in the contrast color', () => {
    const pill = block(css, '.bit-navbar.bit-pill .bit-navbar__links')!;
    expect(pill).toContain('background: var(--bit-color-neutral-soft);');
    expect(pill).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
    expect(pill).toContain('border-radius: var(--bit-radius-full);');
    const current = block(css, '.bit-navbar.bit-pill .bit-navbar__link[aria-current="page"]')!;
    expect(current).toContain('background: var(--bit-color-primary);');
    expect(current).toContain('color: var(--bit-color-primary-contrast);');
    expect(current).toContain('--_bit-focus-ring: var(--bit-color-primary-contrast);');
  });

  it("bar: primary fill, rings in its contrast color; links are Dialog's pixel title type", () => {
    const bar = block(css, '.bit-navbar.bit-bar')!;
    expect(bar).toContain('background: var(--bit-color-primary);');
    expect(bar).toContain('color: var(--bit-color-primary-contrast);');
    expect(bar).toContain('--_bit-focus-ring: var(--bit-color-primary-contrast);');
    const link = block(css, '.bit-navbar.bit-bar .bit-navbar__link')!;
    const title = block(readCss('components/dialog.css'), '.bit-dialog__title')!;
    for (const prop of ['font-family', 'font-size', 'letter-spacing', 'text-transform']) expect(decl(link, prop), prop).toBe(decl(title, prop));
  });

  it('bar: the current link is a raised chip in the page color with a small hard shadow and the theme ring', () => {
    const chip = block(css, '.bit-navbar.bit-bar .bit-navbar__link[aria-current="page"]')!;
    expect(chip).toContain('background: var(--bit-color-bg);');
    expect(chip).toContain('color: var(--bit-color-text);');
    expect(chip).toContain('box-shadow: var(--bit-shadow-sm);');
    expect(chip).toContain('--_bit-focus-ring: var(--bit-focus-ring-color);');
  });

  it('bar: a ghost Button in the actions takes the contrast color, and primary-hover on hover', () => {
    expect(block(css, '.bit-navbar.bit-bar .bit-navbar__actions .bit-button.bit-ghost')).toContain('color: var(--bit-color-primary-contrast);');
  });

  it('the Menu button reaches a 44px tap target', () => {
    expect(block(css, '.bit-navbar__toggle::before')).toContain('max(0px, (44px - var(--_bit-size-height)) / 2)');
  });

  it('very narrow, the Menu button is its icon alone: its words are visually hidden, still read', () => {
    const narrow = css.slice(css.indexOf('@container (max-width: 24rem)'));
    for (const line of VISUALLY_HIDDEN) expect(narrow).toContain(line);
    expect(narrow).toContain('.bit-navbar__toggle-label {');
  });

  it('the brand gives way first, shrinking to an ellipsis', () => {
    const brand = block(css, '.bit-navbar__brand')!;
    expect(brand).toContain('min-width: 0;');
    expect(brand).toContain('text-overflow: ellipsis;');
  });

  it('auto folds by a container query on the Navbar’s own width, below 40rem', () => {
    expect(block(css, '.bit-navbar')).toContain('container-type: inline-size;');
    expect(css).toContain('@container (max-width: 40rem)');
    expect(block(css, '.bit-navbar[data-collapse="auto"] .bit-navbar__menu')).toContain('display: none;');
  });

  it('forced colors: the current link takes Highlight in both variants', () => {
    const rule = styleRules(css).find((r) => r.media === '(forced-colors: active)' && r.selector.includes('.bit-navbar.bit-bar .bit-navbar__link[aria-current="page"]'))!;
    expect(rule.selector).toContain('.bit-navbar.bit-pill .bit-navbar__link[aria-current="page"]');
    expect(decl(rule.body, 'background')).toBe('Highlight');
    expect(decl(rule.body, 'color')).toBe('HighlightText');
    expect(decl(rule.body, 'forced-color-adjust')).toBe('none');
  });
});

describe('system/reset.css (Navbar link ring)', () => {
  it('draws the one ring inside the link', () => {
    const body = rulesFor(readCss('system/reset.css'), '.bit-navbar__link:focus-visible')!;
    expect(body).toContain('outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);');
  });
});

describe.each(MODES)('Navbar contrast, %s', (_mode, map) => {
  const c = (name: string) => resolveVar(map, name);
  const AA_TEXT = 4.5;
  const AA_NON_TEXT = 3;

  it('bar: links and the brand (contrast on primary, and on the hover fill) read at 4.5:1', () => {
    expect(contrastRatio(c('--bit-color-primary-contrast'), c('--bit-color-primary'))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c('--bit-color-primary-contrast'), c('--bit-color-primary-hover'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('bar: the current chip’s text reads at 4.5:1, and the chip stands out from the bar at 3:1', () => {
    expect(contrastRatio(c('--bit-color-text'), c('--bit-color-bg'))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c('--bit-color-bg'), c('--bit-color-primary'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('bar: a ring on the purple (its contrast color) and inside the chip (the theme ring) stand out at 3:1', () => {
    expect(contrastRatio(c('--bit-color-primary-contrast'), c('--bit-color-primary'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrastRatio(c('--bit-focus-ring-color'), c('--bit-color-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('pill: links read on the pill and on the hover surface; the current link on primary', () => {
    expect(contrastRatio(c('--bit-color-text'), c('--bit-color-neutral-soft'))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c('--bit-color-text'), c('--bit-color-surface'))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c('--bit-color-primary-contrast'), c('--bit-color-primary'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('pill: the ring inside a link stands out from the pill at 3:1', () => {
    expect(contrastRatio(c('--bit-focus-ring-color'), c('--bit-color-neutral-soft'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
