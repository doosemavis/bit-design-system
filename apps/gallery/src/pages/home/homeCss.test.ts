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

  it('a large tile is a flex column whose preview grows, so every link row sits at the bottom of equal-height tiles', () => {
    // As a two-row grid, the stretched tile split its spare height between preview and link: Card's link sat ~26px low.
    const tile = rule('.gallery-tile');
    expect(tile).toContain('display: flex;');
    expect(tile).toContain('flex-direction: column;');
    expect(tile).not.toContain('grid-template-rows');
    const preview = rule('.gallery-tile__preview');
    // Grows into the spare height and never shrinks below its content, so a tall preview still sets the row height.
    expect(preview).toContain('flex: 1 0 auto;');
    expect(preview).toContain('min-height: 8rem;');
    // The tiles in a row stretch to one height (the grid default, never overridden).
    expect(rule('.gallery-tiles')).not.toMatch(/align-items|align-self/);
  });

  it('a tile draws no paint of their own: Card does; the old compact chip rows are gone', () => {
    for (const paint of ['background', 'border:', 'border-radius', 'box-shadow']) {
      expect(rule('.gallery-tile')).not.toContain(paint);
    }
    expect(rule('.gallery-chips')).toBeNull();
    expect(rule('.gallery-chip')).toBeNull();
  });

  it('the tiles: as many 14rem columns as fit, so a desktop shows 20 components as five even rows of four', () => {
    expect(rule('.gallery-tiles')).toContain('grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr));');
  });

  it('the hero: one column on a narrow screen, then the intro beside the quick start card', () => {
    expect(rule('.gallery-hero')).toContain('display: grid;');
    expect(rule('.gallery-hero')).toContain('grid-template-columns: minmax(0, 1fr);');
    const wide = /@media \(min-width: 70rem\) \{\s*\.gallery-hero \{([^}]*)\}/.exec(home)?.[1] ?? '';
    expect(wide).toContain('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);');
  });

  it('the facts: two by two under the buttons, each count in the pixel face and the link color, its label beside it', () => {
    const facts = rule('.gallery-facts');
    expect(facts).toContain('display: grid;');
    expect(facts).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    // A list for screen readers, with no bullets.
    expect(facts).toContain('padding: 0;');
    expect(rule('.gallery-fact')).toContain('align-items: baseline;');
    const count = rule('.gallery-fact__count');
    expect(count).toContain('font-family: var(--bit-font-pixel);');
    expect(count).toContain('font-size: var(--bit-text-24px);');
    expect(count).toContain('color: var(--bit-color-link);');
  });

  it('the naming-rule codes never wrap mid-word, scoped to that table', () => {
    expect(rule('.gallery-naming .bit-code')?.trim()).toBe('white-space: nowrap;');
  });
});
