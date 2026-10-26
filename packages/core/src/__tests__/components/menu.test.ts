import { describe, expect, it } from 'vitest';
import { block, contrastRatio, decl, readCss, resolveVar, rulesFor, styleRules, themeModes } from '../css';

const css = readCss('components/menu.css');
const forced = (selector: string) =>
  styleRules(css)
    .filter((rule) => rule.media === '(forced-colors: active)' && rule.selector.split(/,\s*/).includes(selector))
    .map((rule) => rule.body)
    .join('\n');

describe('components/menu.css', () => {
  it('the window: surface, line border, 10px radius, mid hard shadow, fixed in the top layer, capped to its room', () => {
    const body = block(css, '.bit-menu')!;
    for (const line of [
      'position: fixed;',
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-surface);',
      'box-shadow: var(--bit-shadow-surface);',
      'max-height: min(24rem, var(--_bit-menu-room, 24rem));',
      'font-size: var(--_bit-size-text);',
    ]) {
      expect(body).toContain(line);
    }
    // No display: the hidden attribute and the popover's own rule hide it.
    expect(decl(body, 'display')).toBeNull();
  });

  it('a ring inside the window takes the theme color, even inside a colored bar', () => {
    expect(block(css, '.bit-menu')).toContain('--_bit-focus-ring: initial;');
  });

  it("the title strip is Dialog's title bar: primary, contrast text, pixel font, 11px uppercase, line under it", () => {
    const title = block(css, '.bit-menu__title')!;
    const dialogTitle = block(readCss('components/dialog.css'), '.bit-dialog__title')!;
    for (const prop of ['font-family', 'font-size', 'letter-spacing', 'text-transform', 'font-weight']) {
      expect(decl(title, prop), prop).toBe(decl(dialogTitle, prop));
    }
    expect(title).toContain('background: var(--bit-color-primary);');
    expect(title).toContain('color: var(--bit-color-primary-contrast);');
    expect(title).toContain('border-bottom: var(--bit-border-width) solid var(--bit-color-line);');
    expect(title).toContain('position: sticky;');
  });

  it('the active row is primary-soft with a 2px line edge drawn as an inset shadow, never an outline', () => {
    const active = block(css, '.bit-menu__item:focus')!;
    expect(active).toContain('background: var(--bit-color-primary-soft);');
    expect(active).toContain('box-shadow: inset 0 0 0 2px var(--bit-color-line);');
  });

  it('shortcuts are mono and muted, and turn full text on the active row', () => {
    const shortcut = block(css, '.bit-menu__shortcut')!;
    expect(shortcut).toContain('font-family: var(--bit-font-mono);');
    expect(shortcut).toContain('color: var(--bit-color-text-muted);');
    expect(block(css, '.bit-menu__item:focus .bit-menu__shortcut')).toContain('color: var(--bit-color-text);');
  });

  it('danger and disabled are attributes: red text (a solid danger fill when active), half opacity', () => {
    expect(block(css, '.bit-menu__item[data-danger]')).toContain('color: var(--bit-color-danger-text);');
    const active = block(css, '.bit-menu__item[data-danger]:focus')!;
    expect(active).toContain('background: var(--bit-color-danger);');
    expect(active).toContain('color: var(--bit-color-danger-contrast);');
    expect(active).toContain('--_bit-focus-ring: var(--bit-color-danger-contrast);');
    expect(block(css, '.bit-menu__item[aria-disabled="true"]')).toContain('opacity: 0.5;');
    expect(css).not.toMatch(/\.bit-menu__item\.bit-/);
  });

  it('a current-page link item is filled primary, its ring in the contrast color', () => {
    const current = block(css, '.bit-menu__item[aria-current="page"]')!;
    expect(current).toContain('background: var(--bit-color-primary);');
    expect(current).toContain('color: var(--bit-color-primary-contrast);');
    expect(current).toContain('--_bit-focus-ring: var(--bit-color-primary-contrast);');
  });

  it('sizes: sm narrows the padding and the icon slot', () => {
    expect(block(css, '.bit-menu.bit-sm')).toContain('--_bit-menu-pad-y: var(--bit-space-4px);');
    expect(block(css, '.bit-menu.bit-sm')).toContain('--_bit-menu-icon: 16px;');
  });

  it('reduced motion stills the entrance', () => {
    const reduced = styleRules(css).filter((rule) => rule.media === '(prefers-reduced-motion: reduce)');
    expect(reduced.map((rule) => rule.selector).join(',')).toContain('.bit-menu[data-entered]');
    expect(reduced.map((rule) => rule.body).join('\n')).toContain('transition: none;');
  });

  it('forced colors: the active row is Highlight, the strip and frame system colors, the separator kept', () => {
    const active = forced('.bit-menu__item:focus');
    expect(decl(active, 'forced-color-adjust')).toBe('none');
    expect(decl(active, 'background')).toBe('Highlight');
    expect(decl(active, 'color')).toBe('HighlightText');
    expect(decl(active, '--_bit-focus-ring')).toBe('HighlightText');
    expect(decl(forced('.bit-menu__title'), 'background')).toBe('Canvas');
    expect(decl(forced('.bit-menu'), 'border-color')).toBe('CanvasText');
    expect(decl(forced('.bit-menu__separator'), 'background')).toBe('CanvasText');
  });
});

describe('system/reset.css (Menu item ring)', () => {
  it('draws the one ring inside the item, within its 2px edge', () => {
    const body = rulesFor(readCss('system/reset.css'), '.bit-menu__item:focus-visible')!;
    expect(body).toContain('outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);');
  });
});

describe('Menu contrast', () => {
  const { light, dark } = themeModes(readCss('themes/power-up.css'));
  const modes = [
    ['light', light],
    ['dark', new Map([...light, ...dark])],
  ] as const;

  it.each(modes)('%s: text on every row look reads at 4.5:1', (_mode, map) => {
    const c = (name: string) => resolveVar(map, name);
    const pairs: [string, string][] = [
      ['--bit-color-text', '--bit-color-surface'],
      ['--bit-color-text', '--bit-color-primary-soft'],
      ['--bit-color-text-muted', '--bit-color-surface'],
      ['--bit-color-danger-text', '--bit-color-surface'],
      ['--bit-color-danger-contrast', '--bit-color-danger'],
      ['--bit-color-primary-contrast', '--bit-color-primary'],
      ['--bit-color-primary-contrast', '--bit-color-primary-hover'],
    ];
    for (const [text, bg] of pairs) expect(contrastRatio(c(text), c(bg)), `${text} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(modes)('%s: the active row edge and the ring stand out from primary-soft at 3:1', (_mode, map) => {
    const c = (name: string) => resolveVar(map, name);
    expect(contrastRatio(c('--bit-color-line'), c('--bit-color-primary-soft'))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c('--bit-focus-ring-color'), c('--bit-color-primary-soft'))).toBeGreaterThanOrEqual(3);
  });
});
