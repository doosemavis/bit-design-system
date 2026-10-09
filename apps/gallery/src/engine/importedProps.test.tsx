import { describe, expect, it } from 'vitest';
import { badge } from '../manifests/badge';
import type { Manifest } from '../manifests/types';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { importedProps } from './importedProps';
import { toJsx } from '../code/toJsx';
import { CODE_FORMATS } from '../code/codeFormats';
import { componentSections } from '../pages/component/sections';

/** Badge with the four hooks: a color axis that starts at none, an imported prop, an HTML override and an extra section. */
const hooked: Manifest = {
  ...badge,
  controls: [
    { kind: 'select', prop: 'pick', values: ['one', 'two'], default: 'one', virtual: true },
    { kind: 'axis', prop: 'color', values: ['none', 'primary', 'danger'], default: 'none' },
  ],
  importedProps: (state) => [{ prop: 'data-pick', name: state.pick === 'two' ? 'pickTwo' : 'pickOne', value: String(state.pick) }],
  html: (state) => `<span class="custom ${String(state.color)}"></span>`,
  extraSection: { id: 'section-extra', title: 'Extra', Component: () => <p>extra</p> },
};

describe('importedProps', () => {
  it('reads the manifest hook with defaults merged, and is empty without one', () => {
    expect(importedProps(hooked, {})).toEqual([{ prop: 'data-pick', name: 'pickOne', value: 'one' }]);
    expect(importedProps(badge, defaultState(badge))).toEqual([]);
  });

  it('the preview receives the value; the axis none sentinel is left off', () => {
    const props = buildProps(hooked, { ...defaultState(hooked), pick: 'two' });
    expect(props['data-pick']).toBe('two');
    expect('color' in props).toBe(false);
    expect(buildProps(hooked, { ...defaultState(hooked), color: 'danger' }).color).toBe('danger');
  });

  it('the code prints the prop by name, first, and imports that name; none prints nothing', () => {
    const code = toJsx(hooked, { ...defaultState(hooked), pick: 'two', color: 'danger' });
    expect(code).toContain("import { Badge, pickTwo } from '@bit-ds/react';");
    expect(code).toContain('<Badge data-pick={pickTwo} color="danger">');
    expect(toJsx(hooked, { ...defaultState(hooked), color: 'danger' }, { decorators: 'className' })).toContain(
      '<Badge data-pick={pickOne} className="bit-danger">',
    );
    expect(toJsx(hooked, defaultState(hooked))).not.toContain('color=');
    expect(toJsx(hooked, defaultState(hooked), { decorators: 'className' })).not.toContain('className=');
  });

  it('the HTML tab uses the html override when a manifest has one', () => {
    const html = CODE_FORMATS.find((f) => f.id === 'html')!;
    expect(html.code(hooked, { ...defaultState(hooked), color: 'danger' })).toBe('<span class="custom danger"></span>');
    expect(html.code(badge, defaultState(badge))).toContain('class="bit-badge');
  });

  it('the extra section sits after Variants and before Usage', () => {
    expect(componentSections(hooked).map((s) => s.title)).toEqual(['Playground', 'Variants', 'Extra', 'Usage', 'Props', 'Accessibility']);
  });
});
