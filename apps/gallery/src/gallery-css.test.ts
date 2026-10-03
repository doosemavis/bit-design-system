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

  it.each(['display', 'body', 'pixel', 'mono'])('a %s face sample reads its own font token', (face) => {
    const rule = new RegExp(`\\.gallery-face\\[data-face="${face}"\\]\\s*\\{[^}]*font-family: var\\(--bit-font-${face}\\);`);
    expect(galleryCss).toMatch(rule);
  });

  it('the ruler bar is drawn in the accent, and its width comes only from Box padding', () => {
    const bar = /\.gallery-ruler__bar \{([^}]*)\}/.exec(galleryCss)![1]!;
    expect(bar).toContain('background: var(--bit-color-accent);');
    expect(bar).not.toMatch(/(^|\s)(width|padding)/);
    expect(galleryCss).toMatch(/\.bit-box\.gallery-outline \{\s*outline: 2px dashed var\(--bit-color-accent\);\s*\}/);
  });

  it('in forced colours the ruler bar keeps a visible fill: CanvasText, with forced-color-adjust off', () => {
    expect(galleryCss).toMatch(
      /@media \(forced-colors: active\) \{\s*\.gallery-ruler__bar \{\s*forced-color-adjust: none;\s*background: CanvasText;\s*\}\s*\}/,
    );
  });

  it('never hardcodes a font stack: mono labels read --bit-font-mono', () => {
    expect(galleryCss).not.toMatch(/monospace/);
    expect(galleryCss).toMatch(/\.gallery-control__label\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
    expect(galleryCss).toMatch(/\.gallery-matrix__table th\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
  });

  it('every face sample is one height and sits on its floor, so the token chips line up across the cards', () => {
    expect(galleryCss).toMatch(
      /\.gallery-face \{\s*min-height: var\(--bit-space-48px\);\s*display: flex;\s*align-items: flex-end;\s*\}/,
    );
  });

  it('script-moved focus on main and on tabIndex -1 targets draws no ring; real controls keep theirs', () => {
    expect(galleryCss).toMatch(/\.gallery-main:focus,\s*\.gallery-main \[tabindex="-1"\]:focus \{\s*outline: none;\s*\}/);
  });
});
