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
  });

  it('every face sample is one height and sits on its floor, so the token chips line up across the cards', () => {
    expect(galleryCss).toMatch(
      /\.gallery-face \{\s*min-height: var\(--bit-space-48px\);\s*display: flex;\s*align-items: flex-end;\s*\}/,
    );
  });

  it('script-moved focus on main and on tabIndex -1 targets draws no ring; real controls keep theirs', () => {
    expect(galleryCss).toMatch(/\.gallery-main:focus,\s*\.gallery-main \[tabindex="-1"\]:focus \{\s*outline: none;\s*\}/);
  });

  it('the Matrix is gone: Variants is a bit Table', () => {
    expect(galleryCss).not.toMatch(/gallery-matrix/);
  });

  it('the playground puts the controls beside the preview, and under it below 720px', () => {
    expect(galleryCss).toMatch(/\.gallery-playground__top \{[^}]*grid-template-columns: minmax\(0, 1fr\) 16rem;/);
    expect(galleryCss).toMatch(
      /@media \(max-width: 720px\) \{\s*\.gallery-playground__top \{\s*grid-template-columns: minmax\(0, 1fr\);\s*\}\s*\}/,
    );
  });

  it('the presets scroll sideways in one row instead of widening the page', () => {
    const presets = /\.gallery-presets \{([^}]*)\}/.exec(galleryCss)![1]!;
    expect(presets).toContain('overflow-x: auto;');
    expect(presets).toContain('min-width: 0;');
    expect(presets).not.toContain('flex-wrap');
  });

  it("the presets' scroll box leaves room for the focus ring and the active shadow, without shifting the bar", () => {
    const presets = /\.gallery-presets \{([^}]*)\}/.exec(galleryCss)![1]!;
    expect(presets).toContain('padding: var(--bit-space-4px);');
    expect(presets).toContain('margin: calc(-1 * var(--bit-space-4px));');
  });

  it('below 390px the header logo drops its caption, so Menu, the logo and both mode options fit 360px and 375px phones', () => {
    // Menu (60) + logo (143) + mode toggle (137) + gaps and gutters need 380px before the right gutter: every
    // page scrolled sideways at 360px and 375px, with "Dark" off screen. 390px keeps the full logo. The caption is
    // aria-hidden; the logo keeps its name.
    expect(galleryCss).toMatch(
      /@media \(max-width: 389px\) \{\s*\.gallery-header__brand \.bit-logo__caption \{\s*display: none;\s*\}\s*\}/,
    );
  });
});
