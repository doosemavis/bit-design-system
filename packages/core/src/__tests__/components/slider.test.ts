import { describe, it, expect } from 'vitest';
import { block, contrastRatio, decl, listCss, readCss, resolveVar, rulesFor, styleRules, themeModes } from '../css';

const css = readCss('components/slider.css');
const reset = readCss('system/reset.css');
const focus = readCss('system/focus.css');

/** The declarations of `selector` inside `@media <media>`, joined. A comma inside :is() doesn't split the list. */
function inMedia(media: string, selector: string): string {
  return styleRules(css)
    .filter((rule) => rule.media === media && rule.selector.split(/,\s*(?![^(]*\))/).includes(selector))
    .map((rule) => rule.body)
    .join('\n');
}

describe('components/slider.css', () => {
  it('is imported into the bit.components layer', () => {
    expect(readCss('index.css')).toContain('@import "./components/slider.css" layer(bit.components);');
  });

  it('the native range input covers the slider, unseen but never removed, so it keeps clicks, keys and screen readers', () => {
    const input = block(css, '.bit-slider__input')!;
    expect(decl(input, 'position')).toBe('absolute');
    expect(decl(input, 'inset')).toBe('0');
    expect(decl(input, 'opacity')).toBe('0');
    expect(input).not.toContain('display: none');
    expect(input).not.toContain('visibility: hidden');
  });

  it('the native thumb is the drawn thumb’s size in both engines, so a drag lands where the thumb is drawn', () => {
    for (const selector of ['.bit-slider__input::-webkit-slider-thumb', '.bit-slider__input::-moz-range-thumb']) {
      const body = block(css, selector)!;
      expect(decl(body, 'width')).toBe('var(--_bit-slider-thumb)');
      expect(decl(body, 'height')).toBe('var(--_bit-slider-thumb)');
    }
  });

  it.each([
    ['sm', '20px', '6px', '12px'],
    ['md', '24px', '8px', '16px'],
    ['lg', '28px', '10px', '20px'],
  ])('%s: a %s thumb, a %s track and %s blocks', (size, thumb, track, blockSize) => {
    const body = block(css, `.bit-slider.bit-${size}`)!;
    expect(decl(body, '--_bit-slider-thumb')).toBe(thumb);
    expect(decl(body, '--_bit-slider-track')).toBe(track);
    expect(decl(body, '--_bit-slider-block')).toBe(blockSize);
  });

  it.each([
    ['sm', '18px', '4px'],
    ['md', '22px', '6px'],
    ['lg', '26px', '8px'],
  ])('round %s is slimmer: a %s thumb on a %s track', (size, thumb, track) => {
    const body = block(css, `.bit-slider.bit-round.bit-${size}`)!;
    expect(decl(body, '--_bit-slider-thumb')).toBe(thumb);
    expect(decl(body, '--_bit-slider-track')).toBe(track);
  });

  it('square: a thick outlined neutral-soft track, filled in the color role up to the middle of the thumb', () => {
    const shared = block(css, '.bit-slider__track,\n.bit-slider__fill')!;
    expect(decl(shared, 'border')).toBe('var(--bit-border-width) solid var(--bit-color-line)');
    expect(decl(shared, 'border-radius')).toBe('var(--bit-radius-full)');
    expect(decl(block(css, '.bit-slider__track')!, 'background')).toBe('var(--bit-color-neutral-soft)');
    const fill = rulesFor(css, '.bit-slider__fill')!;
    expect(decl(fill, 'background')).toBe('var(--_bit-color)');
    expect(decl(fill, 'inline-size')).toBe('calc(var(--_bit-slider-thumb) / 2 + var(--_bit-slider-fill) * (100% - var(--_bit-slider-thumb)))');
  });

  it('square: a 6px-radius surface thumb with the small hard shadow, placed by inset-inline-start so RTL fills from the right', () => {
    const thumb = block(css, '.bit-slider__thumb')!;
    expect(decl(thumb, 'background')).toBe('var(--bit-color-surface)');
    expect(decl(thumb, 'border')).toBe('var(--bit-border-width) solid var(--bit-color-line)');
    expect(decl(thumb, 'border-radius')).toBe('var(--bit-radius-6px)');
    expect(decl(thumb, 'box-shadow')).toBe('var(--bit-shadow-sm)');
    expect(decl(thumb, 'inset-inline-start')).toBe('calc(var(--_bit-slider-fill) * (100% - var(--_bit-slider-thumb)))');
    expect(css).not.toMatch(/(?<![-\w])(left|right)\s*:\s*calc/);
  });

  it('round: a round thumb in the color role', () => {
    const round = block(css, '.bit-slider.bit-round .bit-slider__thumb')!;
    expect(decl(round, 'background')).toBe('var(--_bit-color)');
    expect(decl(round, 'border-radius')).toBe('var(--bit-radius-full)');
    expect(decl(round, '--_bit-lift-radius')).toBe('var(--bit-radius-full)');
  });

  it('round: the bubble is a small inverse pixel-font chip, hidden until it is open', () => {
    const bubble = block(css, '.bit-slider__bubble')!;
    expect(decl(bubble, 'font-family')).toBe('var(--bit-font-pixel)');
    expect(decl(bubble, 'font-size')).toBe('11px');
    expect(decl(bubble, 'background')).toBe('var(--bit-color-text)');
    expect(decl(bubble, 'color')).toBe('var(--bit-color-bg)');
    expect(decl(bubble, 'opacity')).toBe('0');
    expect(decl(block(css, '.bit-slider__bubble[data-open]')!, 'opacity')).toBe('1');
  });

  it('dragging sinks the thumb by the press offset and drops its shadow, moved one included', () => {
    const pressed = rulesFor(css, '.bit-slider[data-dragging] .bit-slider__thumb')!;
    expect(decl(pressed, 'translate')).toBe('var(--bit-press-offset) var(--bit-press-offset)');
    expect(decl(pressed, 'box-shadow')).toBe('none');
    expect(decl(pressed, '--_bit-lift')).toBe('none');
    expect(rulesFor(css, '.bit-slider__input:active:not(:disabled):not([aria-readonly="true"]) ~ .bit-slider__thumb')).toBe(pressed);
  });

  it('blocks: a neutral-soft frame with a line border and the small hard shadow; blocks lit in the color role, the current one warning edged in line', () => {
    const frame = block(css, '.bit-slider__blocks')!;
    expect(decl(frame, 'background')).toBe('var(--bit-color-neutral-soft)');
    expect(decl(frame, 'border')).toBe('var(--bit-border-width) solid var(--bit-color-line)');
    expect(decl(frame, 'box-shadow')).toBe('var(--bit-shadow-sm)');
    expect(decl(frame, '--_bit-lift')).toBe('var(--bit-shadow-sm)');
    expect(decl(block(css, '.bit-slider__block')!, 'background')).toBe('var(--bit-color-surface)');
    expect(decl(block(css, '.bit-slider__block[data-state="on"]')!, 'background')).toBe('var(--_bit-color)');
    const current = block(css, '.bit-slider__block[data-state="current"]')!;
    expect(decl(current, 'background')).toBe('var(--bit-color-warning)');
    expect(decl(current, 'box-shadow')).toBe('0 0 0 2px var(--bit-color-line)');
  });

  it('blocks take the clicks themselves; the input under them only takes keys', () => {
    expect(decl(block(css, '.bit-slider.bit-blocks .bit-slider__input')!, 'pointer-events')).toBe('none');
  });

  it('invalid is a danger edge; read-only is dashed with no shadow, never faded; disabled fades the whole slider', () => {
    expect(decl(block(css, '.bit-slider__input[aria-invalid="true"] ~ :is(.bit-slider__track, .bit-slider__blocks)')!, 'border-color')).toBe(
      'var(--bit-color-danger)',
    );
    const dashed = block(css, '.bit-slider__input[aria-readonly="true"] ~ :is(.bit-slider__track, .bit-slider__fill, .bit-slider__thumb, .bit-slider__blocks)')!;
    expect(decl(dashed, 'border-style')).toBe('dashed');
    const flat = block(css, '.bit-slider__input[aria-readonly="true"] ~ :is(.bit-slider__thumb, .bit-slider__blocks)')!;
    expect(decl(flat, 'box-shadow')).toBe('none');
    expect(decl(flat, '--_bit-lift')).toBe('none');
    expect(css).not.toMatch(/aria-readonly[^{]*\{[^}]*opacity/);
    expect(decl(block(css, '.bit-slider:has(> .bit-slider__input:disabled)')!, 'opacity')).toBe('0.5');
  });

  it('forced colors: the fill and lit blocks keep the highlight, the thumb a button face, the current block the text color, invalid a double edge', () => {
    const media = '(forced-colors: active)';
    const fill = inMedia(media, '.bit-slider__fill');
    expect(decl(fill, 'forced-color-adjust')).toBe('none');
    expect(decl(fill, 'background')).toBe('Highlight');
    expect(decl(inMedia(media, '.bit-slider__block[data-state="on"]'), 'background')).toBe('Highlight');
    const thumb = inMedia(media, '.bit-slider.bit-round .bit-slider__thumb');
    expect(decl(thumb, 'background')).toBe('ButtonFace');
    expect(decl(thumb, 'border-color')).toBe('ButtonText');
    expect(decl(thumb, 'box-shadow')).toBe('none');
    expect(decl(inMedia(media, '.bit-slider__block[data-state="current"]'), 'background')).toBe('CanvasText');
    expect(decl(inMedia(media, '.bit-slider__input[aria-invalid="true"] ~ :is(.bit-slider__track, .bit-slider__blocks)'), 'border-style')).toBe('double');
  });

  it('reduced motion stills the thumb and the bubble', () => {
    const body = inMedia('(prefers-reduced-motion: reduce)', '.bit-slider__thumb');
    expect(decl(body, 'transition')).toBe('none');
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-slider__bubble')).toBe(body);
  });
});

describe('the one focus ring reaches the Slider thumb and blocks frame, and their shadow moves under it', () => {
  it.each(['.bit-slider__input:focus-visible ~ .bit-slider__thumb', '.bit-slider__input:focus-visible ~ .bit-slider__blocks'])('%s', (selector) => {
    expect(rulesFor(reset, selector)).toContain('outline: var(--bit-focus-ring-width) solid');
    expect(rulesFor(reset, selector)).toContain('outline-offset: var(--bit-focus-ring-offset);');
    expect(rulesFor(focus, `${selector}::after`)).toContain('box-shadow: var(--_bit-lift);');
    expect(decl(block(css, selector)!, 'box-shadow')).toBe('none');
  });
});

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

/** Every theme in light, plus light with its dark overrides applied. */
const MODES = listCss('themes').flatMap((file) => {
  const { light, dark } = themeModes(readCss(`themes/${file}`));
  const cases: [string, boolean, Map<string, string>][] = [[`${file} light`, false, light]];
  if (dark.size > 0) cases.push([`${file} dark`, true, new Map([...light, ...dark])]);
  return cases;
});

describe.each(MODES)('%s: Slider contrast', (_name, isDark, map) => {
  const color = (name: string) => resolveVar(map, `--bit-color-${name}`);

  it("the thumb's edge stands out from the track, the frame, a surface and the page", () => {
    for (const behind of ['neutral-soft', 'surface', 'bg']) {
      expect(contrastRatio(color('line'), color(behind)), behind).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('the current block’s line edge stands out from the empty blocks', () => {
    expect(contrastRatio(color('line'), color('surface'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  // The thumb marks the value; the fill and the lit blocks repeat it. In dark, primary is 2.45:1 on the track and
  // 2.83:1 on an empty block, backed by the thumb's line edge and the yellow current block. A palette change that
  // drops light under 3:1 too fails here, so it is a deliberate decision.
  it('the primary fill and lit blocks are under 3:1 on the track and an empty block only in dark', () => {
    const under = ['neutral-soft', 'surface'].filter((behind) => contrastRatio(color('primary'), color(behind)) < AA_NON_TEXT);
    expect(under).toEqual(isDark ? ['neutral-soft', 'surface'] : []);
  });

  it('the yellow current block stands out from the lit primary blocks', () => {
    expect(contrastRatio(color('warning'), color('primary'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it("the round bubble's text is readable on its inverse chip", () => {
    expect(contrastRatio(color('bg'), color('text'))).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
