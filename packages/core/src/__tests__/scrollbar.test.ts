import { describe, expect, it } from 'vitest';
import { decl, readCss, styleRules } from './css';

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

const FILE = 'system/scrollbar.css';
const css = readCss(FILE);
const block = guarded(css);
/** The style rules inside the forced-colors guard, each with its selector list split out. */
const rules = styleRules(css)
  .filter((rule) => rule.media === 'not (forced-colors: active)')
  .map((rule) => ({ ...rule, selectors: rule.selector.split(',').map((s) => s.trim()) }));

/** The body of the guarded rule whose selector list includes `selector`, and that sets `prop`. */
function ruleFor(selector: string, prop: string): string {
  const rule = rules.find((r) => r.selectors.includes(selector) && decl(r.body, prop) !== null);
  expect(rule, `no rule for ${selector} sets ${prop}`).toBeDefined();
  return rule!.body;
}

/** The selectors inside an `@supports <condition> { … }` block of the guarded block. */
function supportsSelectors(condition: string): { selectors: string[]; body: string } {
  const escaped = condition.replace(/[()$^.+?*|[\]\\]/g, '\\$&');
  const m = new RegExp(`@supports ${escaped}\\s*\\{\\s*([^{]+)\\{([^}]*)\\}\\s*\\}`).exec(block);
  expect(m, `no @supports ${condition} block`).not.toBeNull();
  return { selectors: m![1]!.split(',').map((s) => s.trim()), body: m![2]! };
}

const cases = [
  { owner: 'components/code-block.css', sel: '.bit-code__pre', track: 'var(--bit-code-bg)', size: 'height' },
  { owner: 'components/table.css', sel: '.bit-table', track: 'var(--bit-color-surface)', size: 'height' },
  // The Select list scrolls down, so its bar is sized by width (spec 2026-10-07 §2: as Table).
  { owner: 'components/select.css', sel: '.bit-select__list', track: 'var(--bit-color-surface)', size: 'width' },
  // The Tabs list scrolls horizontally; the track is transparent since it sits on the page background.
  { owner: 'components/tabs.css', sel: '.bit-tabs__list', track: 'transparent', size: 'height' },
];

describe.each(cases)('scrollbar on $sel', ({ owner, sel, track, size }) => {
  it('sizes the bar at 14px', () => {
    expect(decl(ruleFor(`${sel}::-webkit-scrollbar`, size), size)).toBe('14px');
  });

  it('picks its track color and paints the track with it', () => {
    expect(decl(ruleFor(sel, '--_bit-scroll-track'), '--_bit-scroll-track')).toBe(track);
    expect(decl(ruleFor(`${sel}::-webkit-scrollbar-track`, 'background'), 'background')).toBe('var(--_bit-scroll-track)');
  });

  it('draws a solid accent thumb, slimmed by a transparent border that stays part of the grab area', () => {
    const body = ruleFor(`${sel}::-webkit-scrollbar-thumb`, 'background');
    expect(body).toContain('background: var(--bit-color-accent);');
    expect(body).toContain('border: 3px solid transparent;');
    expect(body).toContain('background-clip: padding-box;');
    expect(body).not.toContain('box-shadow');
  });

  it('hands the scrollbar back to the pseudo-elements where they work (Chrome 121+ ignores them otherwise)', () => {
    const { selectors, body } = supportsSelectors('selector(::-webkit-scrollbar)');
    expect(selectors).toContain(sel);
    expect(body).toContain('scrollbar-color: auto;');
    expect(body).toContain('scrollbar-width: auto;');
  });

  it('falls back to scrollbar-color where webkit bars are unsupported', () => {
    const { selectors, body } = supportsSelectors('not selector(::-webkit-scrollbar)');
    expect(selectors).toContain(sel);
    expect(body).toContain('scrollbar-color: var(--bit-color-accent) var(--_bit-scroll-track);');
    expect(body).toContain('scrollbar-width: thin;');
  });

  it(`${owner} keeps no copy of its own`, () => {
    expect(readCss(owner)).not.toContain('::-webkit-scrollbar');
  });
});

describe(FILE, () => {
  it("thins bit's own scroll areas, the Dialog body included, outside the forced-colors guard", () => {
    const thin = styleRules(css).find((rule) => rule.media === null && decl(rule.body, 'scrollbar-width') === 'thin');
    expect(thin?.selector.split(/,\s*/)).toEqual(['.bit-code__pre', '.bit-table', '.bit-select__list', '.bit-tabs__list', '.bit-dialog__body']);
  });

  it('does not change on hover, so the bar never looks bigger', () => {
    expect(block).not.toContain('::-webkit-scrollbar-thumb:hover');
  });

  it('uses no raw colors', () => {
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it('is imported by index.css', () => {
    expect(readCss('index.css')).toContain('@import "./system/scrollbar.css" layer(bit.components);');
  });
});
