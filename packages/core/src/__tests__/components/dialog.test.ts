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

  it('alert: the title bar is red (danger, with danger-contrast text), keyed on the data-alert attribute', () => {
    const header = block(css, '.bit-dialog[data-alert] .bit-dialog__header')!;
    expect(header).toContain('background: var(--bit-color-danger);');
    expect(header).toContain('color: var(--bit-color-danger-contrast);');
  });

  it('alert: data-shake plays a 300ms hard-step shake, only while open', () => {
    expect(block(css, '.bit-dialog[data-state="open"][data-shake]')).toContain('animation: bit-dialog-shake 300ms steps(1, end);');
    expect(block(css, '.bit-dialog[data-shake]')).toBeNull();
  });

  it('the shake keyframes swing left and right, smaller each time, with translate only (never transform or clip-path)', () => {
    const keyframes = css.match(/@keyframes bit-dialog-shake \{([\s\S]*?)\n\}/)?.[1] ?? '';
    for (const frame of [
      '0% { translate: 0; }',
      '16% { translate: -8px 0; }',
      '33% { translate: 8px 0; }',
      '50% { translate: -6px 0; }',
      '66% { translate: 6px 0; }',
      '83% { translate: -3px 0; }',
      '100% { translate: 0; }',
    ]) {
      expect(keyframes).toContain(frame);
    }
    expect(keyframes).not.toContain('transform');
    expect(keyframes).not.toContain('clip-path');
    expect(css).not.toMatch(/(?<![-\w])transform\s*:/);
  });

  it('opening and closing play the two fold animations, 440ms in hard steps', () => {
    expect(block(css, '.bit-dialog[data-state="opening"]')).toContain('animation: bit-dialog-open 440ms steps(1, end) both;');
    expect(block(css, '.bit-dialog[data-state="closing"]')).toContain('animation: bit-dialog-close 440ms steps(1, end) both;');
    expect(css).toContain('@keyframes bit-dialog-open');
    expect(css).toContain('@keyframes bit-dialog-close');
    expect(css).toContain('var(--_bit-dialog-bar, 46px)');
  });

  it('reduced motion: no animation, and no shake', () => {
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-dialog[data-state]')).toContain('animation: none;');
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-dialog[data-state="open"][data-shake]')).toContain('animation: none;');
  });

  it('forced colours: system colours for the border and title bar', () => {
    expect(inMedia('(forced-colors: active)', '.bit-dialog')).toContain('border-color: CanvasText;');
    const header = inMedia('(forced-colors: active)', '.bit-dialog__header')!;
    expect(header).toContain('background: Canvas;');
    expect(header).toContain('color: CanvasText;');
    // The red alert bar outranks the plain header rule, so it is listed too.
    const alertHeader = inMedia('(forced-colors: active)', '.bit-dialog[data-alert] .bit-dialog__header')!;
    expect(alertHeader).toContain('background: Canvas;');
    expect(alertHeader).toContain('color: CanvasText;');
  });
});
