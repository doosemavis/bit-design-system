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

  it('in forced-colors mode the chosen segment fills with Highlight, since the radio is hidden', () => {
    // block() stops at the first '}', so the media body holds the inner selector and its declarations.
    const forced = block(css, '@media (forced-colors: active)')!;
    expect(forced).toContain(`${checked} {`);
    for (const line of ['forced-color-adjust: none;', 'background: Highlight;', 'color: HighlightText;']) {
      expect(forced).toContain(line);
    }
  });

  describe('press feel: only the segment label moves, never the joined bar', () => {
    const label = '.bit-segmented-control__label';
    const enabled = '.bit-segmented-control__input:not(:disabled) + .bit-segmented-control__label';
    const shade = 'color-mix(in srgb, var(--bit-color-shadow) 35%, transparent)';

    it('hover sinks the label one press-offset with an inset shade of the same depth, enabled only', () => {
      const hover = block(css, `${enabled}:hover`)!;
      expect(hover).toContain('transform: translateY(var(--bit-press-offset));');
      expect(hover).toContain(`box-shadow: inset 0 var(--bit-press-offset) 0 ${shade};`);
    });

    it(':active sinks the full two offsets with a two-offset inset shade, enabled only', () => {
      const active = block(css, `${enabled}:active`)!;
      expect(active).toContain('transform: translateY(calc(var(--bit-press-offset) * 2));');
      expect(active).toContain(`box-shadow: inset 0 calc(var(--bit-press-offset) * 2) 0 ${shade};`);
    });

    it('never moves the bar or a disabled segment', () => {
      expect(css).not.toMatch(/\.bit-segmented-control__options[^{]*:(hover|active)/);
      expect(css).not.toMatch(/:disabled\s*\+[^{]*:(hover|active)/);
    });

    it('eases the label with the fast duration, and reduced motion removes it', () => {
      const base = block(css, label)!;
      expect(base).toContain('transform var(--bit-duration-fast) ease-out');
      expect(base).toContain('box-shadow var(--bit-duration-fast) ease-out');
      const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
      expect(reduced).toContain(`${label} {`);
      expect(reduced).toContain('transition: none;');
    });

    it('uses no raw colours', () => {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    });
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
