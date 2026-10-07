import { describe, expect, it } from 'vitest';
import { block, readCss, styleRules } from '../css';

describe('components/dialog.css', () => {
  const css = readCss('components/dialog.css');
  const inMedia = (media: string, selector: string) =>
    styleRules(css).find((rule) => rule.media === media && rule.selector.split(', ').includes(selector))?.body ?? null;

  it('the box: surface, line border, 10px radius, large shadow, no padding, kept inside the viewport', () => {
    const box = block(css, '.bit-dialog')!;
    for (const line of [
      'padding: 0;',
      'color: var(--bit-color-text);',
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-lg);',
      'max-width: calc(100vw - var(--bit-space-32px));',
    ]) {
      expect(box).toContain(line);
    }
  });

  it('sizes are 320, 420 and 560px wide', () => {
    expect(block(css, '.bit-dialog.bit-sm')).toContain('width: 320px;');
    expect(block(css, '.bit-dialog.bit-md')).toContain('width: 420px;');
    expect(block(css, '.bit-dialog.bit-lg')).toContain('width: 560px;');
  });

  it('the backdrop dims the page with ink at 55%, and the page does not scroll behind a modal', () => {
    expect(block(css, '.bit-dialog::backdrop')).toContain('background: color-mix(in srgb, var(--bit-color-ink) 55%, transparent);');
    expect(block(css, 'html:has(.bit-dialog:modal)')).toContain('overflow: hidden;');
    expect(block(css, 'html:has(.bit-dialog:modal)')).toContain('scrollbar-gutter: stable;');
  });

  it('the header is the purple title bar; the title is the pixel font, uppercase', () => {
    const header = block(css, '.bit-dialog__header')!;
    expect(header).toContain('background: var(--bit-color-primary);');
    expect(header).toContain('color: var(--bit-color-primary-contrast);');
    expect(header).toContain('border-bottom: var(--bit-border-width) solid var(--bit-color-line);');
    const title = block(css, '.bit-dialog__title')!;
    expect(title).toContain('font-family: var(--bit-font-pixel);');
    expect(title).toContain('text-transform: uppercase;');
  });

  it('opening and closing play the two fold animations, 440ms in hard steps', () => {
    expect(block(css, '.bit-dialog[data-state="opening"]')).toContain('animation: bit-dialog-open 440ms steps(1, end) both;');
    expect(block(css, '.bit-dialog[data-state="closing"]')).toContain('animation: bit-dialog-close 440ms steps(1, end) both;');
    expect(css).toContain('@keyframes bit-dialog-open');
    expect(css).toContain('@keyframes bit-dialog-close');
    expect(css).toContain('var(--_bit-dialog-bar, 46px)');
  });

  it('reduced motion: no animation', () => {
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-dialog[data-state]')).toContain('animation: none;');
  });

  it('forced colours: system colours for the border and title bar', () => {
    expect(inMedia('(forced-colors: active)', '.bit-dialog')).toContain('border-color: CanvasText;');
    const header = inMedia('(forced-colors: active)', '.bit-dialog__header')!;
    expect(header).toContain('background: Canvas;');
    expect(header).toContain('color: CanvasText;');
  });
});
