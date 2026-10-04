// @vitest-environment node
// Node, not jsdom: under jsdom, Vite rewrites `new URL(..., import.meta.url)` to an http: URL readFileSync rejects.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import { checkCss } from './cssGuard';
import { GALLERY_CSS_EXCEPTIONS } from './gallery-css.exceptions';

const require = createRequire(import.meta.url);
/** The theme exactly as consumers get it, through @bit-ds/react's exports map (run `pnpm build` first). */
const theme = readFileSync(require.resolve('@bit-ds/react/themes/power-up.css'), 'utf8');
const galleryCss = readFileSync(new URL('./gallery.css', import.meta.url), 'utf8');

const declared = new Set([...theme.matchAll(/(--bit-[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]!));
const reads = [...galleryCss.matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);

/** The bodies of every `@media <query> { … }` block, braces matched, joined into one string. */
function mediaBody(query: string): string {
  const head = `@media ${query} {`;
  const bodies: string[] = [];
  let at = galleryCss.indexOf(head);
  while (at !== -1) {
    const start = at + head.length;
    let depth = 1;
    let end = start;
    for (; depth > 0; end += 1) {
      if (galleryCss[end] === '{') depth += 1;
      if (galleryCss[end] === '}') depth -= 1;
    }
    bodies.push(galleryCss.slice(start, end - 1));
    at = galleryCss.indexOf(head, end);
  }
  return bodies.join('\n');
}

/** The declarations of `selector { … }` in `css` (the whole sheet outside any media block by default). */
function ruleIn(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\n)\\s*${escaped} \\{([^}]*)\\}`).exec(css)?.[1] ?? null;
}

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

  it('never hardcodes a font stack', () => {
    expect(galleryCss).not.toMatch(/monospace/);
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

  it('below 720px the presets take their own full-width row under the title and the Checkerboard switch', () => {
    // At 390px the bar's one row left the presets about 95px, so "Danger outline" never fully showed.
    const narrow = mediaBody('(max-width: 720px)');
    expect(ruleIn(narrow, '.gallery-preview__bar')).toContain('flex-wrap: wrap;');
    const presets = ruleIn(narrow, '.gallery-presets');
    expect(presets).toContain('order: 1;');
    expect(presets).toContain('flex-basis: 100%;');
    // Still one row that scrolls sideways, with the focus-ring padding kept (pinned by the tests above).
    expect(presets).not.toContain('flex-wrap');
    expect(presets).not.toMatch(/padding|margin|overflow/);
  });

  it('a union type in the Props table is one unbreakable chip per member', () => {
    expect(ruleIn(galleryCss, '.gallery-nowrap')?.trim()).toBe('white-space: nowrap;');
  });

  it('the Props Description column keeps 16rem, so on a phone the table scrolls sideways instead of growing tall', () => {
    // calc(4 × 64px) = 256px = 16rem, built from a token. The Table wrapper scrolls inside its border.
    expect(ruleIn(galleryCss, '.gallery-props__description')?.trim()).toBe('min-width: calc(4 * var(--bit-space-64px));');
  });

  it('the Props Type column keeps 14rem, so a short union fits on two lines and the table fits its box at desktop width', () => {
    // calc(7 × 32px) = 224px = 14rem: measured at 1200px, Button's five colors take two lines and the table fits its box.
    expect(ruleIn(galleryCss, '.gallery-props__type')?.trim()).toBe('min-width: calc(7 * var(--bit-space-32px));');
  });

  it('the Tokens color cards: one column on a phone, then 3 + 2, then all five in one row (never 4 + 1)', () => {
    const grid = ruleIn(galleryCss, '.gallery-color-grid');
    expect(grid).toContain('display: grid;');
    expect(grid).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(grid).toContain('gap: var(--bit-space-12px);');
    expect(ruleIn(mediaBody('(min-width: 30rem)'), '.gallery-color-grid')?.trim()).toBe(
      'grid-template-columns: repeat(3, minmax(0, 1fr));',
    );
    expect(ruleIn(mediaBody('(min-width: 70rem)'), '.gallery-color-grid')?.trim()).toBe(
      'grid-template-columns: repeat(5, minmax(0, 1fr));',
    );
  });

  it('below 390px the header logo drops its caption, so Menu, the logo and both mode options fit 360px and 375px phones', () => {
    // Menu (60) + logo (143) + mode toggle (137) + gaps and gutters need 380px before the right gutter: every
    // page scrolled sideways at 360px and 375px, with "Dark" off screen. 390px keeps the full logo. The caption is
    // aria-hidden; the logo keeps its name.
    expect(galleryCss).toMatch(
      /@media \(max-width: 389px\) \{\s*\.gallery-header__brand \.bit-logo__caption \{\s*display: none;\s*\}\s*\}/,
    );
  });

  it('the sidebar link paint outranks bit Link hover and visited, so an active link stays readable', () => {
    expect(galleryCss).toMatch(/\.gallery-sidebar__link\.bit-link[^{,]*\[aria-current="page"\]:hover/);
    expect(galleryCss).toMatch(/\.gallery-sidebar__link\.bit-link[^{,]*\[aria-current="page"\]:visited/);
    expect(galleryCss).toMatch(/\.gallery-sidebar__link\.bit-link[^{,]*:hover \{/);
    // No bare .gallery-sidebar__link rule is left to lose to bit Link on specificity.
    expect(galleryCss).not.toMatch(/\.gallery-sidebar__link(\[aria-current="page"\]|:hover)?\s*[{,]/);
  });
});

describe('gallery.css is layout only, apart from the documented exceptions', () => {
  const result = checkCss(galleryCss, GALLERY_CSS_EXCEPTIONS);
  it('every paint declaration has an exception', () => expect(result.unlisted).toEqual([]));
  it('no exception is stale', () => expect(result.stale).toEqual([]));
  it('every exception says why', () => expect(result.unexplained).toEqual([]));
});
