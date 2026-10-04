import { describe, expect, it } from 'vitest';
import { checkCss, declarationKeys, isLayoutProperty } from './cssGuard';

describe('isLayoutProperty', () => {
  it.each(['display', 'grid-template-columns', 'gap', 'margin-inline', 'padding', 'inset-block-start', 'overflow-x', '--_gallery-x', 'scroll-margin-top'])(
    '%s is layout',
    (p) => expect(isLayoutProperty(p)).toBe(true),
  );
  it.each(['color', 'background', 'border', 'font-family', 'outline', 'box-shadow', 'transition', 'text-decoration', '--x', '--bit-color-text'])(
    '%s is not layout',
    (p) => expect(isLayoutProperty(p)).toBe(false),
  );
});

describe('declarationKeys', () => {
  it('keys a comma selector list as written, and prefixes at-rules', () => {
    const css = `.a,\n.b { color: red; }\n@media (forced-colors: active) { .c { background: Canvas; } }`;
    expect(declarationKeys(css)).toEqual([
      { key: '.a, .b', property: 'color' },
      { key: '@media (forced-colors: active) .c', property: 'background' },
    ]);
  });
});

describe('checkCss', () => {
  const css = `.x { display: grid; color: red; }\n@media (forced-colors: active) { .x { color: CanvasText; } }`;

  it('layout passes, and an unlisted paint property is reported with its key', () => {
    expect(checkCss(css, []).unlisted).toEqual(['.x { color }', '@media (forced-colors: active) .x { color }']);
  });

  it('an exception covers exactly its key: the media rule is not covered by the plain one', () => {
    const result = checkCss(css, [{ selector: '.x', property: 'color', reason: 'demo' }]);
    expect(result.unlisted).toEqual(['@media (forced-colors: active) .x { color }']);
  });

  it('reports stale exceptions and empty reasons', () => {
    const result = checkCss('.x { display: block; }', [
      { selector: '.gone', property: 'color', reason: 'old' },
      { selector: '.x', property: 'display', reason: '' },
    ]);
    // `.x { display }` is stale too: display is layout, so it never needs an exception.
    expect(result.stale).toEqual(['.gone { color }', '.x { display }']);
    expect(result.unexplained).toEqual(['.x { display }']);
  });
});
