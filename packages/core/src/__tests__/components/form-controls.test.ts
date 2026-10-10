import { describe, it, expect } from 'vitest';
import { VISUALLY_HIDDEN, block, decl, readCss, rulesFor, styleRules } from '../css';

const checkbox = readCss('components/checkbox.css');
const radio = readCss('components/radio.css');
const textarea = readCss('components/textarea.css');
const reset = readCss('system/reset.css');
const focus = readCss('system/focus.css');

/** The declarations of `selector` inside `@media <media>` in `css`, joined. */
function inMedia(css: string, media: string, selector: string): string {
  return styleRules(css)
    // A comma inside :is() doesn't split the list.
    .filter((rule) => rule.media === media && rule.selector.split(/,\s*(?![^(]*\))/).includes(selector))
    .map((rule) => rule.body)
    .join('\n');
}

describe('components/checkbox.css', () => {
  it('hides the native checkbox visually but keeps it focusable and read', () => {
    const input = block(checkbox, '.bit-checkbox__input')!;
    for (const line of VISUALLY_HIDDEN) expect(input).toContain(line);
  });

  it.each([
    ['sm', '16px'],
    ['md', '20px'],
    ['lg', '24px'],
  ])('%s is a %s box, on the icon scale', (size, px) => {
    expect(decl(block(checkbox, `.bit-checkbox.bit-${size}`)!, '--_bit-checkbox-size')).toBe(px);
  });

  it('the box: surface fill, a line border, the 6px radius and the small hard shadow, which moves under the ring', () => {
    const box = block(checkbox, '.bit-checkbox__box')!;
    expect(decl(box, 'background')).toBe('var(--bit-color-surface)');
    expect(decl(box, 'border')).toBe('var(--bit-border-width) solid var(--bit-color-line)');
    expect(decl(box, 'border-radius')).toBe('var(--bit-radius-6px)');
    expect(decl(box, 'box-shadow')).toBe('var(--bit-shadow-sm)');
    expect(decl(box, '--_bit-lift')).toBe('var(--bit-shadow-sm)');
    expect(decl(block(checkbox, '.bit-checkbox__input:focus-visible + .bit-checkbox__box')!, 'box-shadow')).toBe('none');
  });

  it('checked and indeterminate fill with primary; the tick and the bar are drawn in its contrast color', () => {
    expect(decl(block(checkbox, '.bit-checkbox__input:is(:checked, :indeterminate) + .bit-checkbox__box')!, 'background')).toBe('var(--bit-color-primary)');
    expect(decl(block(checkbox, '.bit-checkbox__input:checked + .bit-checkbox__box::before')!, 'border')).toBe('solid var(--bit-color-primary-contrast)');
    expect(decl(block(checkbox, '.bit-checkbox__input:indeterminate + .bit-checkbox__box::before')!, 'background')).toBe('var(--bit-color-primary-contrast)');
  });

  it('the label reads the control text size, so it is never under 14px', () => {
    expect(decl(block(checkbox, '.bit-checkbox')!, 'font-size')).toBe('var(--_bit-size-text)');
  });

  it('invalid is a danger edge; read-only is dashed with no shadow, never faded; disabled is faded', () => {
    expect(decl(block(checkbox, '.bit-checkbox__input[aria-invalid="true"] + .bit-checkbox__box')!, 'border-color')).toBe('var(--bit-color-danger)');
    const readOnly = block(checkbox, '.bit-checkbox__input[aria-readonly="true"] + .bit-checkbox__box')!;
    expect(decl(readOnly, 'border-style')).toBe('dashed');
    expect(decl(readOnly, 'box-shadow')).toBe('none');
    expect(decl(readOnly, 'opacity')).toBeNull();
    expect(rulesFor(checkbox, '.bit-checkbox__input:disabled + .bit-checkbox__box')).toContain('opacity: 0.5;');
  });

  it('forced colors: a ticked box keeps the highlight, its mark the highlight text, and invalid a double edge', () => {
    const media = '(forced-colors: active)';
    const on = inMedia(checkbox, media, '.bit-checkbox__input:is(:checked, :indeterminate) + .bit-checkbox__box');
    expect(decl(on, 'forced-color-adjust')).toBe('none');
    expect(decl(on, 'background')).toBe('Highlight');
    expect(decl(inMedia(checkbox, media, '.bit-checkbox__input:checked + .bit-checkbox__box::before'), 'border-color')).toBe('HighlightText');
    expect(decl(inMedia(checkbox, media, '.bit-checkbox__input[aria-invalid="true"] + .bit-checkbox__box'), 'border-style')).toBe('double');
  });
});

describe('components/radio.css', () => {
  it('hides the native radio visually but keeps it focusable and read; the legend can be hidden the same way', () => {
    const hidden = block(radio, '.bit-radio-group__legend[data-hidden],\n.bit-radio__input')!;
    for (const line of VISUALLY_HIDDEN) expect(hidden).toContain(line);
  });

  it('the group is a bare fieldset; its options stack 8px apart', () => {
    const group = block(radio, '.bit-radio-group')!;
    for (const prop of ['margin', 'padding', 'border']) expect(decl(group, prop)).toBe('0');
    const options = block(radio, '.bit-radio-group__options')!;
    expect(decl(options, 'flex-direction')).toBe('column');
    expect(decl(options, 'gap')).toBe('var(--bit-space-8px)');
  });

  it.each([
    ['sm', '16px'],
    ['md', '20px'],
    ['lg', '24px'],
  ])('the group size %s makes %s dots', (size, px) => {
    expect(decl(rulesFor(radio, `.bit-radio-group.bit-${size}`)!, '--_bit-radio-size')).toBe(px);
  });

  it('the dot: round, surface fill, line border and the small hard shadow, which moves under the ring', () => {
    const dot = block(radio, '.bit-radio__dot')!;
    expect(decl(dot, 'border-radius')).toBe('var(--bit-radius-full)');
    expect(decl(dot, 'border')).toBe('var(--bit-border-width) solid var(--bit-color-line)');
    expect(decl(dot, 'box-shadow')).toBe('var(--bit-shadow-sm)');
    expect(decl(dot, '--_bit-lift-radius')).toBe('var(--bit-radius-full)');
  });

  it('chosen fills with primary and draws a centre dot in its contrast color', () => {
    expect(decl(block(radio, '.bit-radio__input:checked + .bit-radio__dot')!, 'background')).toBe('var(--bit-color-primary)');
    expect(decl(block(radio, '.bit-radio__input:checked + .bit-radio__dot::before')!, 'background')).toBe('var(--bit-color-primary-contrast)');
  });

  it('invalid and read-only come from the group, so every dot shows them', () => {
    expect(decl(block(radio, '.bit-radio-group[aria-invalid="true"] .bit-radio__dot')!, 'border-color')).toBe('var(--bit-color-danger)');
    expect(decl(block(radio, '.bit-radio-group[aria-readonly="true"] .bit-radio__dot')!, 'border-style')).toBe('dashed');
  });

  it('forced colors: the chosen dot keeps the highlight, and an invalid group double edges', () => {
    const media = '(forced-colors: active)';
    expect(decl(inMedia(radio, media, '.bit-radio__input:checked + .bit-radio__dot'), 'background')).toBe('Highlight');
    expect(decl(inMedia(radio, media, '.bit-radio-group[aria-invalid="true"] .bit-radio__dot'), 'border-style')).toBe('double');
  });
});

describe('components/textarea.css', () => {
  it("is Input's recessed look over several lines, growing only downward", () => {
    const root = block(textarea, '.bit-textarea')!;
    expect(decl(root, 'background')).toBe('var(--bit-color-surface)');
    expect(decl(root, 'border')).toBe('var(--bit-border-width) solid var(--bit-color-line)');
    expect(decl(root, 'box-shadow')).toBe('var(--bit-shadow-inset)');
    expect(decl(root, 'resize')).toBe('vertical');
    expect(decl(root, 'min-height')).toBe('var(--_bit-size-height)');
    expect(decl(root, 'font-size')).toBe('var(--_bit-size-text)');
  });

  it('invalid is a danger border, and a 10px start edge in forced colors, as Input', () => {
    expect(decl(block(textarea, '.bit-textarea[aria-invalid="true"]')!, 'border-color')).toBe('var(--bit-color-danger)');
    expect(decl(inMedia(textarea, '(forced-colors: active)', '.bit-textarea[aria-invalid="true"]'), 'border-inline-start-width')).toBe('10px');
  });

  it('read-only: dashed, flat, not resizable, never faded; disabled: faded', () => {
    const readOnly = block(textarea, '.bit-textarea[readonly]')!;
    expect(decl(readOnly, 'border-style')).toBe('dashed');
    expect(decl(readOnly, 'box-shadow')).toBe('none');
    expect(decl(readOnly, 'opacity')).toBeNull();
    expect(decl(block(textarea, '.bit-textarea:disabled')!, 'opacity')).toBe('0.5');
  });
});

describe('read-only Input and Select look like read-only Textarea, never like disabled', () => {
  it.each([
    ['components/input.css', '.bit-input[readonly]'],
    ['components/select.css', '.bit-select__control[aria-readonly="true"]'],
  ])('%s: %s is dashed and flat, at full strength', (file, selector) => {
    const body = block(readCss(file), selector)!;
    expect(decl(body, 'border-style')).toBe('dashed');
    expect(decl(body, 'box-shadow')).toBe('none');
    expect(decl(body, 'opacity')).toBeNull();
  });

  it('a read-only Select hides its chevron, since it never opens', () => {
    expect(decl(block(readCss('components/select.css'), '.bit-select:has(> .bit-select__control[aria-readonly="true"])::after')!, 'display')).toBe('none');
  });
});

describe('the one focus ring reaches the drawn box and dot, and their shadow moves under it', () => {
  it.each(['.bit-checkbox__input:focus-visible + .bit-checkbox__box', '.bit-radio__input:focus-visible + .bit-radio__dot'])('%s', (selector) => {
    expect(rulesFor(reset, selector)).toContain('outline: var(--bit-focus-ring-width) solid');
    expect(rulesFor(reset, selector)).toContain('outline-offset: var(--bit-focus-ring-offset);');
    expect(rulesFor(focus, `${selector}::after`)).toContain('box-shadow: var(--_bit-lift);');
  });
});
