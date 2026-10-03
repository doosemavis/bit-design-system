import { describe, it, expect } from 'vitest';
import { prettyHtml, toHtml } from './toHtml';
import { renderManifest } from '../engine/renderManifest';
import { defaultState } from '../engine/state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { input } from '../manifests/input';
import { select } from '../manifests/select';

describe('prettyHtml', () => {
  it('puts one element per line with two-space indents and keeps text-only elements on one line', () => {
    expect(prettyHtml('<div class="a"><span>hi</span><p>there</p></div>')).toBe(
      '<div class="a">\n  <span>hi</span>\n  <p>there</p>\n</div>',
    );
  });

  it('void and self-closed elements take one line and no closing tag', () => {
    expect(prettyHtml('<label>Name<input type="text"/></label><br/>')).toBe('<label>Name\n  <input type="text"/>\n</label>\n<br/>');
  });
});

describe('toHtml', () => {
  it("prints the preview's element: Button's classes, type and label", () => {
    expect(toHtml(renderManifest(button, { ...defaultState(button), color: 'danger' }))).toBe(
      '<button class="bit-button bit-danger bit-solid bit-md" type="button">Save</button>',
    );
  });

  it('prints compound parts nested and indented', () => {
    expect(toHtml(renderManifest(card, defaultState(card)))).toBe(
      [
        '<div class="bit-card bit-solid">',
        '  <div class="bit-card__header">Stats</div>',
        '  <div class="bit-card__body">3 coins collected</div>',
        '  <div class="bit-card__footer">Updated today</div>',
        '</div>',
      ].join('\n'),
    );
  });

  it('prints plain HTML children (Select options) and void elements (Input)', () => {
    expect(toHtml(renderManifest(select, defaultState(select)))).toContain('  <option value="success">success</option>');
    expect(toHtml(renderManifest(input, defaultState(input)))).toMatch(/^<input class="bit-input bit-md"[^>]*\/>$/);
  });

  it('escapes markup typed into the children control', () => {
    expect(toHtml(renderManifest(button, { ...defaultState(button), children: '<b>"hi"</b>' }))).toContain(
      '>&lt;b&gt;&quot;hi&quot;&lt;/b&gt;</button>',
    );
  });
});
