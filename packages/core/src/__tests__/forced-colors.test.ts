import { describe, expect, it } from 'vitest';
import { decl, readCss, styleRules } from './css';

/** The declarations of `selector` inside `@media (forced-colors: active)` in a component file, joined. */
function forced(file: string, selector: string): string {
  return styleRules(readCss(`components/${file}`))
    .filter((rule) => rule.media === '(forced-colors: active)' && rule.selector.split(/,\s*/).includes(selector))
    .map((rule) => rule.body)
    .join('\n');
}

// Forced colors (Windows high contrast) drop fills and shadows. Any state shown by a fill alone needs a rule
// of its own there, in system colors, as select.css, tabs.css and segmented-control.css already do.
describe('states shown only by a fill get a forced-colors treatment', () => {
  it.each([
    ['mode-toggle.css', '.bit-mode-toggle__option[aria-pressed="true"]', 'Highlight', 'HighlightText'],
    ['switch.css', '.bit-switch__input:checked + .bit-switch__track', 'Highlight', undefined],
    ['button.css', '.bit-button.bit-solid', 'ButtonText', 'ButtonFace'],
    ['badge.css', '.bit-badge.bit-solid', 'CanvasText', 'Canvas'],
  ])('%s: %s keeps its own system colors', (file, selector, background, color) => {
    const body = forced(file, selector);
    expect(decl(body, 'forced-color-adjust')).toBe('none');
    expect(decl(body, 'background')).toBe(background);
    if (color) expect(decl(body, 'color')).toBe(color);
  });

  it("an on Switch's thumb takes the highlight text, so it shows on the highlight track", () => {
    const thumb = forced('switch.css', '.bit-switch__input:checked + .bit-switch__track .bit-switch__thumb');
    expect(decl(thumb, 'background')).toBe('HighlightText');
  });

  it('the rings inside a pressed ModeToggle option and on a solid Button use system colors too', () => {
    expect(decl(forced('mode-toggle.css', '.bit-mode-toggle__option[aria-pressed="true"]'), '--_bit-focus-ring')).toBe('HighlightText');
    expect(decl(forced('button.css', '.bit-button.bit-solid'), '--_bit-focus-ring')).toBe('Highlight');
  });

  it('a disabled solid Button is grey text color, so it never looks active', () => {
    const body = forced('button.css', '.bit-button.bit-solid:disabled');
    expect(decl(body, 'background')).toBe('GrayText');
  });

  it('nothing it keeps casts a hard shadow', () => {
    for (const [file, selector] of [
      ['switch.css', '.bit-switch__input:checked + .bit-switch__track'],
      ['button.css', '.bit-button.bit-solid'],
      ['badge.css', '.bit-badge.bit-solid'],
    ] as const) {
      expect(decl(forced(file, selector), 'box-shadow'), selector).toBe('none');
    }
  });
});
