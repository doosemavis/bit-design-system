// @vitest-environment node
// Node, not jsdom: under jsdom, Vite rewrites `new URL(..., import.meta.url)` to an http: URL readFileSync rejects.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import { checkCss, declarationKeys } from './cssGuard';
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

  it('Getting started shows code and its result side by side, stacking under 70rem where the code line clips and the Buttons wrap', () => {
    expect(galleryCss).toMatch(/\.gallery-split \{[^}]*grid-template-columns: minmax\(0, 3fr\) minmax\(0, 2fr\);/);
    expect(galleryCss).toMatch(/@media \(max-width: 70rem\) \{\s*\.gallery-split \{\s*grid-template-columns: minmax\(0, 1fr\);\s*\}\s*\}/);
    expect(galleryCss).toMatch(/\.gallery-split__result \{[^}]*flex: 1;[^}]*place-items: center;/);
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

  it('B3: the playground card stretches both halves to one height, and the preview stage takes the spare height', () => {
    const top = ruleIn(galleryCss, '.gallery-playground__top')!;
    expect(top).toContain('display: grid;');
    expect(top).toContain('align-items: stretch;');
    // The halves meet at the divider: no gap, and no paint of its own (the frame is bit Card's).
    expect(top).not.toMatch(/(^|\s)gap:/);
    expect(top).not.toMatch(/background|border|shadow|radius/);
    const preview = ruleIn(galleryCss, '.gallery-preview')!;
    expect(preview).toContain('display: flex;');
    expect(preview).toContain('flex-direction: column;');
    expect(ruleIn(galleryCss, '.gallery-preview__stage')).toContain('flex: 1;');
  });

  it('B3: a divider on the start edge of the controls, which moves to their top edge under 720px', () => {
    const line = 'var(--bit-border-width) solid var(--bit-color-line);';
    expect(ruleIn(galleryCss, '.gallery-controls')).toContain(`border-inline-start: ${line}`);
    const narrow = ruleIn(mediaBody('(max-width: 720px)'), '.gallery-controls')!;
    expect(narrow).toContain('border-inline-start: none;');
    expect(narrow).toContain(`border-top: ${line}`);
  });

  it('B3: the preview bar and the controls bar are one strip: one height, one paint rule, one title face', () => {
    const bars = /\.gallery-preview__bar,\s*\.gallery-controls__bar \{([^}]*)\}/.exec(galleryCss)?.[1] ?? '';
    expect(bars).toContain('min-height: var(--_gallery-bar-height);');
    expect(bars).toContain('box-sizing: border-box;');
    expect(bars).toContain('background: var(--bit-color-bg);');
    expect(bars).toContain('border-bottom: var(--bit-border-width) solid var(--bit-color-line);');
    // The height is the preview bar's own: a small control, the bar's padding and its bottom border.
    expect(galleryCss).toMatch(
      /--_gallery-bar-height: calc\(var\(--bit-control-height-sm\) \+ 2 \* var\(--bit-space-8px\) \+ var\(--bit-border-width\)\);/,
    );
    // The controls bar paints only through the shared list: it appears nowhere else, so it has no colours of its own.
    expect(galleryCss.match(/\.gallery-controls__bar\b/g)).toHaveLength(1);
    const titles = /\.gallery-preview__title,\s*\.gallery-controls__title \{([^}]*)\}/.exec(galleryCss)?.[1] ?? '';
    expect(titles).toContain('font-family: var(--bit-font-pixel);');
    expect(titles).toContain('text-transform: uppercase;');
  });

  it('the presets row and the sidebar scroll in the accent on their own background, with no hover change', () => {
    const body = mediaBody('not (forced-colors: active)');
    expect(ruleIn(body, '.gallery-presets::-webkit-scrollbar')).toContain('height: 14px;');
    expect(ruleIn(body, '.gallery-sidebar::-webkit-scrollbar')).toContain('width: 14px;');
    const both = (part: string) => `.gallery-presets::-webkit-scrollbar-${part}, .gallery-sidebar::-webkit-scrollbar-${part}`;
    expect(ruleIn(body, both('track'))).toContain('background: transparent;');
    const thumb = ruleIn(body, both('thumb'))!;
    expect(thumb).toContain('background: var(--bit-color-accent);');
    expect(thumb).toContain('background-clip: padding-box;');
    expect(thumb).toContain('border: 3px solid transparent;');
    expect(thumb).toContain('border-radius: var(--bit-radius-10px);');
    expect(thumb).not.toContain('box-shadow');
    expect(galleryCss).not.toContain('::-webkit-scrollbar-thumb:hover');
    // Chrome 121+ ignores the pseudo-elements while reset.css's standard properties are not auto.
    const reset = /@supports selector\(::-webkit-scrollbar\) \{\s*\.gallery-presets, \.gallery-sidebar \{([^}]*)\}/.exec(body)![1]!;
    expect(reset).toContain('scrollbar-color: auto;');
    expect(reset).toContain('scrollbar-width: auto;');
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

  it('the import chip centres its text in the Copy-button-tall box, with layout properties only', () => {
    const rule = ruleIn(galleryCss, '.gallery-import-code');
    expect(rule).toContain('display: inline-flex;');
    expect(rule).toContain('align-items: center;');
    // Copy is a small Button; when it wraps below the chip on a phone, the chip still matches its height.
    expect(rule).toContain('min-height: var(--bit-control-height-sm);');
    expect(rule).not.toMatch(/padding|font|margin/);
    expect(galleryCss).not.toMatch(/(^|\n)\.bit-code\b/);
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

  it('the All tokens Copy column is sized by a hidden widest-state button in the header, with no magic width', () => {
    const head = ruleIn(galleryCss, '.gallery-copy-head');
    expect(head).toContain('display: grid;');
    expect(ruleIn(galleryCss, '.gallery-copy-head > *')).toContain('grid-area: 1 / 1;');
    expect(ruleIn(galleryCss, '.gallery-copy-ghost')?.trim()).toBe('visibility: hidden;');
    const cell = ruleIn(galleryCss, '.gallery-copy-cell');
    expect(cell).toContain('display: flex;');
    expect(cell).toContain('justify-content: flex-end;');
    expect(cell).not.toMatch(/width/);
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
  it('inline Code in a caption is a slim chip: no border or vertical padding, so it fits the bold line', () => {
    expect(ruleIn(galleryCss, '.gallery-caption .bit-code')).toMatch(/^\s*padding: 0 5px;\s*border-width: 0;\s*$/);
  });

  it('the disclosure ▸ turns a quarter on open, and only snaps under reduced motion', () => {
    expect(ruleIn(galleryCss, '.gallery-disclosure__glyph')).toMatch(/display: inline-block;[^}]*transition: transform var\(--bit-duration-fast\)/);
    expect(ruleIn(galleryCss, '[aria-expanded="true"] > .gallery-disclosure__glyph')).toMatch(/transform: rotate\(90deg\);/);
    expect(mediaBody('(prefers-reduced-motion: reduce)')).toMatch(/\.gallery-disclosure__glyph \{\s*transition: none;\s*\}/);
  });
});

describe('the animated section underline', () => {
  it('section titles take the full text colour, outranking the muted shade bit Text gives a neutral', () => {
    expect(galleryCss).toMatch(/\.gallery-sidebar__title\.bit-text\.bit-neutral \{[^}]*color: var\(--bit-color-text\);/);
  });

  it('the bar rests at 22px', () => {
    const bar = ruleIn(galleryCss, '.gallery-sidebar__title::after')!;
    expect(bar).toContain('width: 22px;');
    expect(bar).toContain('background: var(--bit-color-accent);');
  });

  it('the current section fills its bar over 450ms', () => {
    const fill = ruleIn(galleryCss, '.gallery-sidebar__group[data-current] .gallery-sidebar__title::after')!;
    expect(fill).toContain('width: 100%;');
    expect(fill).toContain('animation: gallery-section-fill 450ms cubic-bezier(.2,.8,.2,1) both;');
    expect(galleryCss).toMatch(/@keyframes gallery-section-fill \{\s*from \{ width: 22px; \}\s*to \{ width: 100%; \}\s*\}/);
  });

  it('reduced motion turns the animation off', () => {
    const reduced = ruleIn(
      mediaBody('(prefers-reduced-motion: reduce)'),
      '.gallery-sidebar__group[data-current] .gallery-sidebar__title::after',
    );
    expect(reduced).toContain('animation: none;');
  });

  it('the guard keys keyframe declarations, so a keyframe paint property cannot hide', () => {
    const keys = declarationKeys('@keyframes spin { from { color: red; } to { color: blue; } }');
    expect(keys).toEqual([
      { key: '@keyframes spin from', property: 'color' },
      { key: '@keyframes spin to', property: 'color' },
    ]);
  });
});

describe('gallery.css is layout only, apart from the documented exceptions', () => {
  const result = checkCss(galleryCss, GALLERY_CSS_EXCEPTIONS);
  it('every paint declaration has an exception', () => expect(result.unlisted).toEqual([]));
  it('no exception is stale', () => expect(result.stale).toEqual([]));
  it('every exception says why', () => expect(result.unexplained).toEqual([]));
});
