import { describe, expect, it } from 'vitest';
import { block, readCss, styleRules } from '../css';
import { OUTLINE_DECLARATION } from '../css';

describe('components/tabs.css', () => {
  const css = readCss('components/tabs.css');
  const inMedia = (media: string, selector: string) =>
    styleRules(css).find((rule) => rule.media === media && rule.selector.split(', ').includes(selector))?.body ?? null;

  it('a tab is a cartridge: line border without a bottom edge, top radius, the notch, neutral-soft and muted', () => {
    const tab = block(css, '.bit-tabs__tab')!;
    for (const line of [
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-bottom: 0;',
      'border-radius: var(--bit-radius-6px) var(--bit-radius-6px) 0 0;',
      'clip-path: polygon(0 0, 36% 0, 40% 6px, 60% 6px, 64% 0, 100% 0, 100% 100%, 0 100%);',
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
    expect(block(css, '.bit-tabs__tab[aria-selected="true"]::before')).toContain('clip-path: inset(0);');
  });

  it('hover only changes the text colour; nothing in tabs ever moves up', () => {
    expect(block(css, '.bit-tabs__tab:hover:not(:disabled)')).toContain('color: var(--bit-color-text);');
    expect(block(css, '.bit-tabs__tab:hover:not(:disabled)')).not.toContain('transform');
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

  it('the plug-in animation: seat, pour, spread, under alternating a and b names', () => {
    for (const name of ['a', 'b']) {
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]`)).toContain(`animation: bit-tabs-seat-${name} 120ms steps(2) both;`);
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]::before`)).toContain(`animation: bit-tabs-pour-${name} 180ms steps(4) 120ms both;`);
      expect(block(css, `.bit-tabs__slot[data-boot="${name}"]::before`)).toContain(`animation: bit-tabs-spread-${name} 240ms steps(6) 300ms both;`);
    }
    expect(css).toContain('var(--_bit-tabs-x, 50%)');
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
