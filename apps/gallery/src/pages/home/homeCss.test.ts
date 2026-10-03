// @vitest-environment node
// Node, not jsdom: under jsdom, Vite rewrites `new URL(..., import.meta.url)` to an http: URL readFileSync rejects,
// and a `?raw` CSS import comes back empty.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const galleryCss = readFileSync(new URL('../../gallery.css', import.meta.url), 'utf8');
const home = galleryCss.slice(galleryCss.indexOf('/* ---------- home page ---------- */'));

const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped} \\{([^}]*)\\}`).exec(home)?.[1] ?? null;
};

describe('gallery.css, home page section', () => {
  it('a large tile shows the focus ring around the whole tile while its link has keyboard focus', () => {
    const ring = rule('.gallery-tile:has(.gallery-tile__link:focus-visible)');
    // The same ring reset.css draws, so it matches every other focus state and honours --_bit-focus-ring.
    expect(ring).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(ring).toContain('outline-offset: var(--bit-focus-ring-offset);');
    // One ring, not two: the link's own ring is folded into the tile's.
    expect(rule('.gallery-tile__link:focus-visible')?.trim()).toBe('outline: none;');
  });

  it('the glyph chip border is the theme border width', () => {
    expect(rule('.gallery-chip__glyph')).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
  });

  it('the naming-rule codes never wrap mid-word, scoped to that table', () => {
    expect(rule('.gallery-naming .bit-code')?.trim()).toBe('white-space: nowrap;');
  });
});
