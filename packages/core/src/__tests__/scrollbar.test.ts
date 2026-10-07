import { describe, expect, it } from 'vitest';
import { readCss } from './css';

/** Return the body of the first `@media not (forced-colors: active) { ... }` block. */
function guarded(css: string): string {
  const start = css.indexOf('@media not (forced-colors: active)');
  expect(start).toBeGreaterThanOrEqual(0);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error('unbalanced @media block');
}

const cases = [
  { file: 'components/code-block.css', sel: '.bit-code__pre', track: '--bit-code-bg', ring: '--bit-color-accent', size: 'height' },
  { file: 'components/table.css', sel: '.bit-table', track: '--bit-color-surface', ring: '--bit-color-accent', size: 'height' },
  // The Select list scrolls down, so its bar is sized by width (spec 2026-10-07 §2: as Table).
  { file: 'components/select.css', sel: '.bit-select__list', track: '--bit-color-surface', ring: '--bit-color-accent', size: 'width' },
];

describe.each(cases)('scrollbar in $file', ({ file, sel, track, ring, size }) => {
  const block = guarded(readCss(file));

  it('sizes the bar at 14px', () => {
    expect(block).toMatch(new RegExp(`${sel}::-webkit-scrollbar\\s*\\{\\s*${size}: 14px;`));
  });

  it('paints the track', () => {
    expect(block).toMatch(new RegExp(`${sel}::-webkit-scrollbar-track\\s*\\{\\s*background: var\\(${track}\\);`));
  });

  it('draws a solid accent thumb, slimmed by a transparent border that stays part of the grab area', () => {
    const m = new RegExp(`${sel}::-webkit-scrollbar-thumb\\s*\\{([^}]*)\\}`).exec(block);
    expect(m).not.toBeNull();
    const body = m![1]!;
    expect(body).toContain(`background: var(${ring});`);
    expect(body).toContain('border: 3px solid transparent;');
    expect(body).toContain('background-clip: padding-box;');
    expect(body).not.toContain('box-shadow');
  });

  it('does not change on hover, so the bar never looks bigger', () => {
    expect(block).not.toContain('::-webkit-scrollbar-thumb:hover');
  });

  it('hands the scrollbar back to the pseudo-elements where they work (Chrome 121+ ignores them otherwise)', () => {
    const m = /@supports selector\(::-webkit-scrollbar\)\s*\{([\s\S]*?\})\s*\}/.exec(block);
    expect(m).not.toBeNull();
    expect(m![1]).toContain(sel);
    expect(m![1]).toContain('scrollbar-color: auto;');
    expect(m![1]).toContain('scrollbar-width: auto;');
  });

  it('falls back to scrollbar-color where webkit bars are unsupported', () => {
    const m = /@supports not selector\(::-webkit-scrollbar\)\s*\{([\s\S]*?\})\s*\}/.exec(block);
    expect(m).not.toBeNull();
    expect(m![1]).toContain(`scrollbar-color: var(${ring}) var(${track});`);
    expect(m![1]).toContain('scrollbar-width: thin;');
  });

  it('uses no raw colours', () => {
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});
