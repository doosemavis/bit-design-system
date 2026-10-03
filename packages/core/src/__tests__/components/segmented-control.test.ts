import { describe, it, expect } from 'vitest';
import { VISUALLY_HIDDEN, block, readCss } from '../css';

describe('components/segmented-control.css', () => {
  const css = readCss('components/segmented-control.css');
  const checked = '.bit-segmented-control__input:checked + .bit-segmented-control__label';

  it('the fieldset sheds the browser border and padding', () => {
    const root = block(css, '.bit-segmented-control')!;
    expect(root).toContain('border: 0;');
    expect(root).toContain('padding: 0;');
    expect(root).toContain('margin: 0;');
  });

  it('hides the native radios, and the legend when data-hidden, but keeps them read and focusable', () => {
    const hidden = block(css, '.bit-segmented-control__legend[data-hidden],\n.bit-segmented-control__input')!;
    for (const line of VISUALLY_HIDDEN) expect(hidden).toContain(line);
  });

  it('joins the segments: an outer line border, 10px radius, the mid shadow, surface, 3px line dividers', () => {
    const row = block(css, '.bit-segmented-control__options')!;
    for (const line of [
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-md);',
      'background: var(--bit-color-surface);',
      'overflow: hidden;',
    ]) {
      expect(row).toContain(line);
    }
    expect(block(css, '.bit-segmented-control__option + .bit-segmented-control__option')).toContain(
      'border-left: var(--bit-border-width) solid var(--bit-color-line);',
    );
  });

  it('segments take their height, padding and text size from the size scale', () => {
    const label = block(css, '.bit-segmented-control__label')!;
    expect(label).toContain('height: calc(var(--_bit-size-height) - 2 * var(--bit-border-width));');
    expect(label).toContain('padding: 0 var(--_bit-size-padding);');
    expect(label).toContain('font-size: var(--_bit-size-text);');
  });

  it('the chosen segment fills with the color and its contrast text', () => {
    expect(block(css, checked)).toContain('background: var(--_bit-color);');
    expect(block(css, checked)).toContain('color: var(--_bit-color-contrast);');
  });

  it('a ring on the chosen fill takes the contrast color, so violet never sits on violet', () => {
    expect(block(css, checked)).toContain('--_bit-focus-ring: var(--_bit-color-contrast);');
  });

  it('a disabled option is half opacity with a not-allowed cursor', () => {
    const disabled = block(css, '.bit-segmented-control__input:disabled + .bit-segmented-control__label')!;
    expect(disabled).toContain('opacity: 0.5;');
    expect(disabled).toContain('cursor: not-allowed;');
  });
});

describe('system/reset.css (SegmentedControl ring)', () => {
  it('draws the one ring inside the focused segment', () => {
    const body = block(readCss('system/reset.css'), '.bit-segmented-control__input:focus-visible + .bit-segmented-control__label')!;
    expect(body).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(body).toContain('outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);');
  });
});
