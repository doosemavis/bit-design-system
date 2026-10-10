import { describe, it, expect } from 'vitest';
import { block, decl, readCss, styleRules } from '../css';

describe('components/select.css', () => {
  const css = readCss('components/select.css');
  /** The body of the rule for exactly `selector` inside `@media {media}`, or null. */
  const inMedia = (media: string, selector: string) =>
    styleRules(css).find((rule) => rule.media === media && rule.selector.split(', ').includes(selector))?.body ?? null;

  describe('the closed trigger keeps today’s look', () => {
    it('the control has Input’s recessed look and no native appearance', () => {
      const control = block(css, '.bit-select__control')!;
      for (const line of [
        'appearance: none;',
        'height: var(--_bit-size-height);',
        'font-size: var(--_bit-size-text);',
        'background: var(--bit-color-surface);',
        'border: var(--bit-border-width) solid var(--bit-color-line);',
        'border-radius: var(--bit-radius-10px);',
        'box-shadow: var(--bit-shadow-inset);',
      ]) {
        expect(control).toContain(line);
      }
    });

    it('the button lays its value out like the old select: centred vertically, from the start edge', () => {
      const control = block(css, '.bit-select__control')!;
      expect(decl(control, 'display')).toBe('flex');
      expect(decl(control, 'align-items')).toBe('center');
      expect(decl(control, 'text-align')).toBe('start');
    });

    it('leaves room on the right for the chevron', () => {
      expect(block(css, '.bit-select__control')).toContain(
        'padding: 0 calc(var(--_bit-size-padding) * 2 + 12px) 0 var(--_bit-size-padding);',
      );
    });

    it('a long value is cut with an ellipsis; the placeholder is muted text', () => {
      const value = block(css, '.bit-select__value')!;
      expect(decl(value, 'overflow')).toBe('hidden');
      expect(decl(value, 'text-overflow')).toBe('ellipsis');
      expect(decl(value, 'white-space')).toBe('nowrap');
      expect(block(css, '.bit-select__value[data-placeholder]')).toContain('color: var(--bit-color-text-muted);');
    });

    it('the wrapper draws the chevron as a text-colored border triangle that ignores the pointer', () => {
      expect(block(css, '.bit-select')).toContain('position: relative;');
      const chevron = block(css, '.bit-select::after')!;
      expect(chevron).toContain('border-top: 7px solid var(--bit-color-text);');
      expect(chevron).toContain('border-left: 6px solid transparent;');
      expect(chevron).toContain('pointer-events: none;');
    });

    it('aria-invalid="true" turns the border danger; disabled dims the control and the chevron', () => {
      expect(block(css, '.bit-select__control[aria-invalid="true"]')).toContain('border-color: var(--bit-color-danger);');
      expect(block(css, '.bit-select__control:disabled')).toContain('opacity: 0.5;');
      expect(block(css, '.bit-select__control:disabled')).toContain('cursor: not-allowed;');
      expect(block(css, '.bit-select:has(.bit-select__control:disabled)::after')).toContain('opacity: 0.5;');
    });
  });

  describe('open', () => {
    it('the chevron turns 180° while open, over the normal duration', () => {
      expect(block(css, '.bit-select[data-open]::after')).toContain('transform: rotate(180deg);');
      expect(block(css, '.bit-select::after')).toContain('transition: transform var(--bit-duration-normal) ease-out;');
    });

    it('the list is a fixed panel: surface, line border, 10px corners, md shadow, 4px padding, body text', () => {
      const panel = block(css, '.bit-select__list')!;
      for (const line of [
        'position: fixed;',
        'inset: auto;',
        'margin: 0;',
        'padding: var(--bit-space-4px);',
        'background: var(--bit-color-surface);',
        'color: var(--bit-color-text);',
        'border: var(--bit-border-width) solid var(--bit-color-line);',
        'border-radius: var(--bit-radius-10px);',
        'box-shadow: var(--bit-shadow-md);',
        'font-family: var(--bit-font-body);',
        'font-size: var(--_bit-size-text);',
      ]) {
        expect(panel).toContain(line);
      }
    });

    it('the fallback z-index says why it is a raw number: there is no z-index token', () => {
      expect(css).toMatch(/z-index: 10;\s*\/\*[^*]*no z-index token[^*]*\*\//);
    });

    it('never sets display on the list, so the hidden attribute and the popover UA rule can hide it', () => {
      expect(decl(block(css, '.bit-select__list')!, 'display')).toBeNull();
    });

    it('a long list scrolls after about 16rem, or less when the viewport has less room', () => {
      const panel = block(css, '.bit-select__list')!;
      expect(decl(panel, 'max-height')).toBe('min(16rem, var(--_bit-select-room, 16rem))');
      expect(decl(panel, 'overflow-y')).toBe('auto');
    });

    it('slides down 8px and fades in; opened above, it slides up instead', () => {
      const panel = block(css, '.bit-select__list')!;
      expect(decl(panel, 'opacity')).toBe('0');
      expect(decl(panel, 'transform')).toBe('translateY(-8px)');
      expect(decl(block(css, '.bit-select__list[data-placement="top"]')!, 'transform')).toBe('translateY(8px)');
      const entered = block(css, '.bit-select__list[data-entered]')!;
      expect(decl(entered, 'opacity')).toBe('1');
      expect(decl(entered, 'transform')).toBe('none');
      expect(decl(entered, 'transition')).toBe(
        'opacity var(--bit-duration-normal) ease-out, transform var(--bit-duration-normal) ease-out',
      );
      expect(css.indexOf('.bit-select__list[data-entered]')).toBeGreaterThan(css.indexOf('.bit-select__list[data-placement="top"]'));
    });

    it('option rows are 8px by 12px with 6px corners', () => {
      const row = block(css, '.bit-select__option')!;
      expect(decl(row, 'padding')).toBe('var(--bit-space-8px) var(--bit-space-12px)');
      expect(decl(row, 'border-radius')).toBe('var(--bit-radius-6px)');
      expect(decl(row, 'cursor')).toBe('pointer');
    });

    it('the active row is primary-soft; the chosen row is solid primary with bold contrast text, and wins', () => {
      expect(block(css, '.bit-select__option[data-active]')).toContain('background: var(--bit-color-primary-soft);');
      const chosen = block(css, '.bit-select__option[aria-selected="true"]')!;
      expect(chosen).toContain('background: var(--bit-color-primary);');
      expect(chosen).toContain('color: var(--bit-color-primary-contrast);');
      expect(chosen).toContain('font-weight: var(--bit-weight-bold);');
      expect(css.indexOf('.bit-select__option[aria-selected="true"]')).toBeGreaterThan(css.indexOf('.bit-select__option[data-active]'));
    });

    it('a disabled row is at half opacity and not-allowed', () => {
      const disabled = block(css, '.bit-select__option[aria-disabled="true"]')!;
      expect(disabled).toContain('opacity: 0.5;');
      expect(disabled).toContain('cursor: not-allowed;');
    });
  });

  describe('modes and conventions', () => {
    it('reduced motion makes the slide and the chevron turn instant', () => {
      for (const selector of ['.bit-select::after', '.bit-select__list[data-entered]']) {
        expect(inMedia('(prefers-reduced-motion: reduce)', selector)).toContain('transition: none;');
      }
    });

    it('in forced colours an invalid field gets a 10px start edge, since the red border is gone (Q2-A)', () => {
      expect(css).toMatch(
        /@media \(forced-colors: active\) \{[^@]*\.bit-select__control\[aria-invalid="true"\] \{\s*border-inline-start-width: 10px;\s*\}/,
      );
    });

    it('forced colours: the chevron stays a CanvasText triangle (its transparent sides would otherwise be painted)', () => {
      const chevron = inMedia('(forced-colors: active)', '.bit-select::after')!;
      expect(chevron).toContain('forced-color-adjust: none;');
      expect(chevron).toContain('border-top-color: CanvasText;');
      expect(chevron).toContain('border-left-color: transparent;');
      expect(chevron).toContain('border-right-color: transparent;');
    });

    it('forced colours: a CanvasText border on the list', () => {
      expect(inMedia('(forced-colors: active)', '.bit-select__list')).toContain('border-color: CanvasText;');
    });

    it('forced colours: the active row is ringed in Highlight on Canvas; the chosen row is filled Highlight', () => {
      const activeRow = inMedia('(forced-colors: active)', '.bit-select__option[data-active]')!;
      expect(activeRow).toContain('forced-color-adjust: none;');
      expect(activeRow).toContain('background: Canvas;');
      expect(activeRow).toContain('color: CanvasText;');
      expect(activeRow).toContain('box-shadow: inset 0 0 0 2px Highlight;');
      const chosenRow = inMedia('(forced-colors: active)', '.bit-select__option[aria-selected="true"]')!;
      expect(chosenRow).toContain('forced-color-adjust: none;');
      expect(chosenRow).toContain('background: Highlight;');
      expect(chosenRow).toContain('color: HighlightText;');
    });

    it('forced colours: the chosen row while active keeps its fill and gets a HighlightText ring inside it', () => {
      const both = inMedia('(forced-colors: active)', '.bit-select__option[data-active][aria-selected="true"]')!;
      expect(both).toContain('box-shadow: inset 0 0 0 2px HighlightText;');
      const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
      expect(forced.indexOf('.bit-select__option[aria-selected="true"] {')).toBeGreaterThan(forced.indexOf('.bit-select__option[data-active] {'));
    });

    it('the native form input lies invisibly over the trigger, so the browser’s validation message points at the Select', () => {
      const input = block(css, '.bit-select__input')!;
      for (const [prop, value] of [
        ['position', 'absolute'],
        ['inset', '0'],
        ['width', '100%'],
        ['height', '100%'],
        ['margin', '0'],
        ['padding', '0'],
        ['border', '0'],
        ['opacity', '0'],
        ['pointer-events', 'none'],
      ]) {
        expect(decl(input, prop!), prop).toBe(value);
      }
      expect(input).not.toContain('clip-path');
    });

    it('states are attributes: the only classes are the block and its elements', () => {
      const classes = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]!));
      for (const name of classes) expect(name).toMatch(/^bit-select(__(control|value|list|option|input|count))?$/);
    });

    it('uses no raw colours', () => {
      const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(withoutComments).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    });
  });

  describe('multi-select (0.1.5)', () => {
    const MULTI = '.bit-select__list[aria-multiselectable="true"] .bit-select__option';

    it('multi rows are flex rows with a gap, and lead with an 18px checkbox drawn in tokens', () => {
      const rowRule = block(css, MULTI)!;
      expect(decl(rowRule, 'display')).toBe('flex');
      expect(decl(rowRule, 'align-items')).toBe('center');
      expect(decl(rowRule, 'gap')).toBe('var(--bit-space-8px)');
      expect(decl(rowRule, 'position')).toBe('relative');
      const box = block(css, `${MULTI}::before`)!;
      for (const line of [
        'content: "";',
        'width: 18px;',
        'height: 18px;',
        'border: var(--bit-border-width) solid var(--bit-color-line);',
        'border-radius: var(--bit-radius-6px);',
        'background: var(--bit-color-surface);',
      ]) {
        expect(box).toContain(line);
      }
    });

    it('a chosen multi row is not filled or bold; its checkbox fills primary and shows a contrast tick', () => {
      const chosen = block(css, `${MULTI}[aria-selected="true"]`)!;
      expect(chosen).toContain('background: transparent;');
      expect(chosen).toContain('color: var(--bit-color-text);');
      expect(chosen).toContain('font-weight: var(--bit-weight-normal);');
      expect(block(css, `${MULTI}[aria-selected="true"]::before`)).toContain('background: var(--bit-color-primary);');
      const tick = block(css, `${MULTI}[aria-selected="true"]::after`)!;
      expect(tick).toContain('border: solid var(--bit-color-primary-contrast);');
      expect(tick).toContain('transform: rotate(45deg);');
    });

    it('an active multi row gets the soft fill, after the chosen override so it wins', () => {
      expect(block(css, `${MULTI}[data-active]`)).toContain('background: var(--bit-color-primary-soft);');
      expect(css.indexOf(`${MULTI}[data-active] {`)).toBeGreaterThan(css.indexOf(`${MULTI}[aria-selected="true"] {`));
    });

    it('the "N selected" pill is primary, bold, body text 14px, fully rounded', () => {
      const pill = block(css, '.bit-select__count')!;
      for (const line of [
        'background: var(--bit-color-primary);',
        'color: var(--bit-color-primary-contrast);',
        'font-weight: var(--bit-weight-bold);',
        'font-size: var(--bit-text-14px);',
        'border-radius: var(--bit-radius-full);',
        'padding: 0 var(--bit-space-8px);',
      ]) {
        expect(pill).toContain(line);
      }
    });

    it('forced colours: the pill gets a CanvasText ring; the checkbox is CanvasText, Highlight when chosen; chosen rows are not filled', () => {
      expect(inMedia('(forced-colors: active)', '.bit-select__count')).toContain('border: 1px solid CanvasText;');
      expect(inMedia('(forced-colors: active)', `${MULTI}::before`)).toContain('border-color: CanvasText;');
      const chosenBox = inMedia('(forced-colors: active)', `${MULTI}[aria-selected="true"]::before`)!;
      expect(chosenBox).toContain('background: Highlight;');
      expect(inMedia('(forced-colors: active)', `${MULTI}[aria-selected="true"]::after`)).toContain('border-color: HighlightText;');
      const chosenRow = inMedia('(forced-colors: active)', `${MULTI}[aria-selected="true"]`)!;
      expect(chosenRow).toContain('background: Canvas;');
      expect(chosenRow).toContain('color: CanvasText;');
      expect(inMedia('(forced-colors: active)', `${MULTI}[data-active]`)).toContain('box-shadow: inset 0 0 0 2px Highlight;');
    });
  });
});
