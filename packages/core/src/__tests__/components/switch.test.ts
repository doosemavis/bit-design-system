import { describe, it, expect } from 'vitest';
import { VISUALLY_HIDDEN, block, readCss, rulesFor } from '../css';

describe('components/switch.css', () => {
  const css = readCss('components/switch.css');
  const on = '.bit-switch__input:checked + .bit-switch__track';

  it('hides the native checkbox visually but keeps it focusable and read', () => {
    const input = block(css, '.bit-switch__input')!;
    for (const line of VISUALLY_HIDDEN) expect(input).toContain(line);
    expect(input).not.toContain('display: none');
    expect(input).not.toContain('visibility: hidden');
  });

  it('sizes: md is a 48×28 track with a 16px thumb, sm is 40×24 with 12px', () => {
    const md = block(css, '.bit-switch.bit-md')!;
    expect(md).toContain('--_bit-switch-width: 48px;');
    expect(md).toContain('--_bit-switch-height: 28px;');
    expect(md).toContain('--_bit-switch-thumb: 16px;');
    const sm = block(css, '.bit-switch.bit-sm')!;
    expect(sm).toContain('--_bit-switch-width: 40px;');
    expect(sm).toContain('--_bit-switch-height: 24px;');
    expect(sm).toContain('--_bit-switch-thumb: 12px;');
  });

  it('off: a neutral-soft track with a line border and the small shadow; a surface thumb with a line border', () => {
    const track = block(css, '.bit-switch__track')!;
    expect(track).toContain('background: var(--bit-color-neutral-soft);');
    expect(track).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
    expect(track).toContain('box-shadow: var(--bit-shadow-sm);');
    const thumb = block(css, '.bit-switch__thumb')!;
    expect(thumb).toContain('background: var(--bit-color-surface);');
    expect(thumb).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
  });

  it('on: a success track and a knob thumb, both outlined in ink (decision 2)', () => {
    expect(block(css, on)).toContain('background: var(--bit-color-success);');
    expect(block(css, on)).toContain('border-color: var(--bit-color-ink);');
    const thumb = block(css, `${on} .bit-switch__thumb`)!;
    expect(thumb).toContain('background: var(--bit-color-knob);');
    expect(thumb).toContain('border-color: var(--bit-color-ink);');
  });

  it('the thumb moves by left, never transform', () => {
    expect(block(css, `${on} .bit-switch__thumb`)).toContain(
      'left: calc(var(--_bit-switch-width) - 2 * var(--bit-border-width) - var(--_bit-switch-thumb) - 3px);',
    );
    expect(css).not.toMatch(/(?<![-\w])transform\s*:/);
  });

  it('disabled dims the track and label to half and shows a not-allowed cursor', () => {
    expect(block(css, '.bit-switch__input:disabled + .bit-switch__track,\n.bit-switch__input:disabled ~ .bit-switch__label')).toContain(
      'opacity: 0.5;',
    );
    expect(block(css, '.bit-switch:has(.bit-switch__input:disabled)')).toContain('cursor: not-allowed;');
  });
});

describe('system/reset.css (Switch ring)', () => {
  it('draws the one focus ring on the track when the hidden input has keyboard focus', () => {
    const body = rulesFor(readCss('system/reset.css'), '.bit-switch__input:focus-visible + .bit-switch__track')!;
    expect(body).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(body).toContain('outline-offset: var(--bit-focus-ring-offset);');
  });
});
