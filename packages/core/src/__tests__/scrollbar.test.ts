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
  { file: 'components/code-block.css', sel: '.bit-code__pre', track: '--bit-code-bg', ring: '--bit-color-accent' },
  { file: 'components/table.css', sel: '.bit-table', track: '--bit-color-surface', ring: '--bit-color-line' },
];

describe.each(cases)('scrollbar in $file', ({ file, sel, track, ring }) => {
  const block = guarded(readCss(file));

  it('sizes the bar at 14px', () => {
    expect(block).toMatch(new RegExp(`${sel}::-webkit-scrollbar\\s*\\{\\s*height: 14px;`));
  });

  it('paints the track', () => {
    expect(block).toMatch(new RegExp(`${sel}::-webkit-scrollbar-track\\s*\\{\\s*background: var\\(${track}\\);`));
  });

  it('draws an outlined thumb inset by a transparent border', () => {
    const m = new RegExp(`${sel}::-webkit-scrollbar-thumb\\s*\\{([^}]*)\\}`).exec(block);
    expect(m).not.toBeNull();
    const body = m![1]!;
    expect(body).toContain(`background: var(${track});`);
    expect(body).toContain('border: 3px solid transparent;');
    expect(body).toContain('background-clip: padding-box;');
    expect(body).toContain(`box-shadow: inset 0 0 0 2px var(${ring});`);
  });

  it('fills the thumb on hover', () => {
    expect(block).toMatch(new RegExp(`${sel}::-webkit-scrollbar-thumb:hover\\s*\\{\\s*background: var\\(${ring}\\);`));
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
