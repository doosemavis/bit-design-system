import { describe, it, expect } from 'vitest';
import { prettyHtml, readableIds, toHtml } from './toHtml';
import { renderManifest } from '../engine/renderManifest';
import { defaultState } from '../engine/state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { field } from '../manifests/field';
import { input } from '../manifests/input';
import { segmentedControl } from '../manifests/segmentedControl';
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

describe('readableIds', () => {
  it('names each distinct React id example-N in order of first use, the same id the same name', () => {
    expect(readableIds('<label for="_R_1a_">A</label><input id="_R_1a_" aria-describedby="_R_2_-hint"/><p id="_R_2_-hint"></p>')).toBe(
      '<label for="example-1">A</label><input id="example-1" aria-describedby="example-2-hint"/><p id="example-2-hint"></p>',
    );
  });

  it('leaves markup without React ids alone', () => {
    expect(readableIds('<span class="bit-badge">New</span>')).toBe('<span class="bit-badge">New</span>');
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

  it("Field's label still points at its input, by a readable id rather than React's", () => {
    const html = toHtml(renderManifest(field, defaultState(field)));
    expect(html).not.toMatch(/_R_/);
    expect(html).toContain('<label class="bit-field__label" for="example-1">Email</label>');
    expect(html).toMatch(/<input [^>]*id="example-1"\/>/);
  });

  it("SegmentedControl's radios share one readable name", () => {
    const html = toHtml(renderManifest(segmentedControl, defaultState(segmentedControl)));
    expect(html).not.toMatch(/_R_/);
    expect(html.match(/name="example-1"/g)).toHaveLength(3);
  });

  it('escapes markup typed into the children control', () => {
    expect(toHtml(renderManifest(button, { ...defaultState(button), children: '<b>"hi"</b>' }))).toContain(
      '>&lt;b&gt;&quot;hi&quot;&lt;/b&gt;</button>',
    );
  });
});
