// @vitest-environment node
// Node, not jsdom: under jsdom, Vite rewrites `new URL(..., import.meta.url)` to an http: URL readFileSync rejects.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

const require = createRequire(import.meta.url);
/** The theme exactly as consumers get it, through @bit-ds/react's exports map (run `pnpm build` first). */
const theme = readFileSync(require.resolve('@bit-ds/react/themes/power-up.css'), 'utf8');
const galleryCss = readFileSync(new URL('./gallery.css', import.meta.url), 'utf8');

const declared = new Set([...theme.matchAll(/(--bit-[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]!));
const reads = [...galleryCss.matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);

describe('gallery.css', () => {
  it('reads only tokens the theme declares (a browser would silently ignore a renamed one)', () => {
    expect(reads.filter((name) => !declared.has(name))).toEqual([]);
  });

  it('never reads tier-1 palette values', () => {
    expect(reads.filter((name) => name.startsWith('--bit-palette-'))).toEqual([]);
  });

  it('has no code panel of its own: CodeBlock from @bit-ds/react draws every snippet', () => {
    // .gallery-preview and .gallery-presets stay; only the old .gallery-pre panel is gone.
    expect(galleryCss).not.toMatch(/\.gallery-pre[\s{,]/);
  });

  it('outlines a previewed Box, dashed in the mode accent, and only the Box the stage shows', () => {
    expect(galleryCss).toMatch(/\.gallery-preview__stage > \.bit-box \{\s*outline: 2px dashed var\(--bit-color-accent\);\s*\}/);
  });

  it('never hardcodes a font stack: mono labels read --bit-font-mono', () => {
    expect(galleryCss).not.toMatch(/monospace/);
    expect(galleryCss).toMatch(/\.gallery-control__label\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
    expect(galleryCss).toMatch(/\.gallery-matrix__table th\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
  });
});
