import { describe, expect, it } from 'vitest';
import { block, readCss, styleRules } from '../css';
import { OUTLINE_DECLARATION } from '../css';

describe('components/tabs.css', () => {
  const css = readCss('components/tabs.css');
  const inMedia = (media: string, selector: string) =>
    styleRules(css).find((rule) => rule.media === media && rule.selector.split(', ').includes(selector))?.body ?? null;

  it('a tab is a cartridge: line border on all four sides (an unchosen tab draws the slot line under itself), top radius, the notch, neutral-soft and muted', () => {
    const tab = block(css, '.bit-tabs__tab')!;
    expect(tab).not.toMatch(/border-bottom/);
    for (const line of [
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-6px) var(--bit-radius-6px) 0 0;',
      'clip-path: polygon(0 0, 36% 0, 40% 6px, 60% 6px, 64% 0, 100% 0, 100% calc(100% + 1px), 0 calc(100% + 1px));',
      'background: var(--bit-color-neutral-soft);',
      'color: var(--bit-color-text-muted);',
    ]) {
      expect(tab).toContain(line);
    }
  });

  it('the chosen tab is taller and purple: its fill layer is open and its text is primary-contrast', () => {
    const chosen = block(css, '.bit-tabs__tab[aria-selected="true"]')!;
    expect(chosen).toContain('padding-top: var(--bit-space-16px);');
    expect(chosen).toContain('color: var(--bit-color-primary-contrast);');
    expect(block(css, '.bit-tabs__tab::before')).toContain('background: var(--bit-color-primary);');
    expect(block(css, '.bit-tabs__tab[aria-selected="true"]::before')).toContain('clip-path: inset(-1px);');
  });

  it('the list overlaps the slot by one border width and sits above it, so the tabs stand on the slot line', () => {
    const list = block(css, '.bit-tabs__list')!;
    expect(list).toContain('position: relative;');
    expect(list).toContain('z-index: 1;');
    expect(list).toContain('margin-bottom: calc(var(--bit-border-width) * -1);');
  });

  it('the chosen tab opens into the slot: no bottom border (not a transparent one), and the same height', () => {
    const chosen = block(css, '.bit-tabs__tab[aria-selected="true"]')!;
    expect(chosen).toContain('border-bottom-width: 0;');
    expect(chosen).toContain('padding-bottom: calc(var(--bit-space-8px) + var(--bit-border-width));');
    expect(css).not.toMatch(/border-bottom(-color)?:[^;]*transparent/);
    expect(block(css, '.bit-tabs__tab::before')).toContain('inset: 0;');
  });

  it('no clip edge lies on the chosen tab\'s bottom edge (an unsnapped clip there draws a hairline seam into the slot)', () => {
    // The notch clip's bottom points sit below the box, and the purple layer, chosen or at the end of the pour,
    // is open past every edge.
    expect(block(css, '.bit-tabs__tab')).toContain('100% calc(100% + 1px), 0 calc(100% + 1px))');
    expect(block(css, '.bit-tabs__tab[aria-selected="true"]::before')).toContain('clip-path: inset(-1px);');
    for (const name of ['a', 'b']) {
      expect(css).toContain(`@keyframes bit-tabs-pour-${name} { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(-1px); } }`);
    }
  });

  it('hover only changes the text colour, and never on the chosen tab; nothing in tabs ever moves up', () => {
    // The hover rule outranks [aria-selected], so it must skip the chosen tab or a hovered chosen label turns
    // ink on purple (about 3:1 in light mode).
    const hover = block(css, '.bit-tabs__tab:hover:not(:disabled):not([aria-selected="true"])')!;
    expect(hover).toContain('color: var(--bit-color-text);');
    expect(hover).not.toContain('transform');
    expect(block(css, '.bit-tabs__tab:hover:not(:disabled)')).toBeNull();
    expect(css).not.toMatch(/translateY\(\s*-/);
  });

  it('the list never shows a vertical scrollbar, even during the seat animation', () => {
    expect(block(css, '.bit-tabs__list')).toContain('overflow-y: hidden;');
  });

  it('the slot is a strip with a purple layer; the panel sits under it with no top border', () => {
    expect(block(css, '.bit-tabs__slot')).toContain('background: var(--bit-color-neutral-soft);');
    expect(block(css, '.bit-tabs__slot::before')).toContain('background: var(--bit-color-primary);');
    const panel = block(css, '.bit-tabs__panel')!;
    expect(panel).toContain('border-top: 0;');
    expect(panel).toContain('background: var(--bit-color-surface);');
  });

  it('the slot and the panel share one shadow, from the top of the slot to the bottom of the panel', () => {
    const shadow = 'box-shadow: var(--bit-shadow-md);';
    expect(block(css, '.bit-tabs__slot')).toContain(shadow);
    const panel = block(css, '.bit-tabs__panel')!;
    expect(panel).toContain(shadow);
    // The panel paints over the slot's downward shadow, so only the outside edge shows.
    expect(panel).toContain('position: relative;');
  });

  it('the plug-in animation: seat, pour, spread, under alternating a and b names', () => {
    for (const name of ['a', 'b']) {
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]`)).toContain(`animation: bit-tabs-seat-${name} 120ms steps(2) both, bit-tabs-unfilled-${name} 300ms steps(1, end) none;`);
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]::before`)).toContain(`animation: bit-tabs-pour-${name} 180ms steps(4) 120ms both;`);
      expect(block(css, `.bit-tabs__slot[data-boot="${name}"]::before`)).toContain(`animation: bit-tabs-spread-${name} 240ms steps(6) 300ms both;`);
    }
    expect(css).toContain('var(--_bit-tabs-x, 50%)');
  });

  it('until the purple has poured (300ms) the chosen tab keeps its unfilled colours, with no forwards fill', () => {
    for (const name of ['a', 'b']) {
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]`)).toMatch(new RegExp(`bit-tabs-unfilled-${name} 300ms steps\\(1, end\\) none;`));
      const keyframes = css.match(new RegExp(`@keyframes bit-tabs-unfilled-${name} \\{([^}]*)\\}`))?.[1] ?? '';
      expect(keyframes).toContain('color: var(--bit-color-text-muted);');
      expect(keyframes).toContain('--_bit-focus-ring: var(--bit-focus-ring-color);');
    }
  });

  it('reduced motion: no animation', () => {
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-tabs__tab[data-boot]')).toContain('animation: none;');
  });

  it('forced colours: CanvasText borders, Highlight fills, HighlightText on the chosen tab', () => {
    expect(inMedia('(forced-colors: active)', '.bit-tabs__tab')).toContain('border-color: CanvasText;');
    expect(inMedia('(forced-colors: active)', '.bit-tabs__tab::before')).toContain('background: Highlight;');
    const chosen = inMedia('(forced-colors: active)', '.bit-tabs__tab[aria-selected="true"]');
    expect(chosen).toContain('color: HighlightText;');
    expect(chosen).toContain('--_bit-focus-ring: HighlightText;');
  });

  it('forced colours: no rule brings a shadow back (the browser drops the slot and panel shadows there)', () => {
    const forced = styleRules(css).filter((rule) => rule.media === '(forced-colors: active)');
    expect(forced.length).toBeGreaterThan(0);
    for (const rule of forced) expect(rule.body).not.toContain('box-shadow');
  });
});

describe('system/reset.css (Tabs ring)', () => {
  it('draws the one ring inside the focused label', () => {
    const focusVisible = block(readCss('system/reset.css'), '.bit-tabs__tab:focus-visible')!;
    expect(focusVisible).toContain('outline: none;');
    const label = block(readCss('system/reset.css'), '.bit-tabs__tab:focus-visible > .bit-tabs__label')!;
    expect(label).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(label).toContain('outline-offset: var(--bit-space-4px);');
  });

  it('uses no raw outlines outside reset.css', () => {
    const css = readCss('components/tabs.css');
    expect(css).not.toMatch(OUTLINE_DECLARATION);
  });
});
