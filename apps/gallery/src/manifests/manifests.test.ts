import { describe, it, expect } from 'vitest';
import * as lib from '@bit-ds/react';
import { MANIFESTS, findManifest, routeFor } from './index';
import { COMPONENTS, HTML_CHILDREN, isHtmlElement } from './registry';
import { defaultState, parseState, serializeState } from '../engine/state';
import { stack } from './stack';
import { text } from './text';
import type { ChildSpec, ControlState } from './types';

/** ChildSpec names, nested parts included, that are neither a registered component nor an allowed HTML element. */
function unknownChildren(children: readonly ChildSpec[]): string[] {
  return children.flatMap((child) => {
    const name = child.component;
    const unknown = isHtmlElement(name) ? !HTML_CHILDREN.includes(name) : COMPONENTS[name] === undefined;
    const nested = typeof child.children === 'object' ? unknownChildren(child.children) : [];
    return unknown ? [name, ...nested] : nested;
  });
}

/**
 * Every runtime export of @bit-ds/react that is a component: PascalCase with a lowercase second
 * character. COLORS, SIZES, ERAS, PREFIX, SEMANTIC_TOKENS are all-caps and excluded; type-only
 * exports do not exist at runtime.
 */
const COMPONENT_EXPORTS = Object.keys(lib)
  .filter((name) => /^[A-Z][a-z]/.test(name))
  .sort();

/** Compound parts are documented on their parent's page, not their own. */
const PARTS = MANIFESTS.flatMap((m) => m.parts ?? []);

describe('manifest contract', () => {
  it('every component export has a manifest or is a documented part', () => {
    const covered = new Set([...MANIFESTS.map((m) => m.name), ...PARTS]);
    const missing = COMPONENT_EXPORTS.filter((name) => !covered.has(name));
    expect(missing).toEqual([]);
  });

  it('every manifest names a real export and its parts are real exports', () => {
    for (const m of MANIFESTS) {
      expect((lib as Record<string, unknown>)[m.name], m.name).toBe(m.component);
      for (const part of m.parts ?? []) expect((lib as Record<string, unknown>)[part], part).toBeDefined();
    }
  });

  it('slugs are unique, lowercase, and routable', () => {
    const slugs = MANIFESTS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const m of MANIFESTS) {
      expect(m.slug).toMatch(/^[a-z]+$/);
      expect(findManifest(m.slug)).toBe(m);
      expect(routeFor(m)).toBe(m.group === 'brand' ? '/brand/logo' : `/components/${m.slug}`);
    }
    expect(findManifest('nope')).toBeUndefined();
  });

  it('axis values are the library constants, not retyped copies', () => {
    for (const m of MANIFESTS) {
      for (const c of m.controls) {
        if (c.kind !== 'axis') continue;
        if (c.prop === 'color') expect([...c.values].every((v) => (lib.COLORS as readonly string[]).includes(v))).toBe(true);
        if (c.prop === 'size') expect([...c.values].every((v) => (lib.SIZES as readonly string[]).includes(v))).toBe(true);
        expect(c.values).toContain(c.default);
      }
    }
  });

  it('every control default is one of its values', () => {
    for (const m of MANIFESTS) {
      for (const c of m.controls) {
        if (c.kind === 'select') expect(c.values, `${m.name}.${c.prop}`).toContain(c.default);
        if (c.kind === 'number') expect(c.default).toBeGreaterThanOrEqual(c.min);
      }
    }
  });

  it('every child spec names a registered component or an allowed HTML element', () => {
    for (const m of MANIFESTS) {
      if (Array.isArray(m.children)) expect(unknownChildren(m.children), m.name).toEqual([]);
    }
  });

  it('the ChildSpec allowlist is option, span, strong, em and code, and catches a typo or a stray tag', () => {
    expect(HTML_CHILDREN).toEqual(['option', 'span', 'strong', 'em', 'code']);
    const children: ChildSpec[] = [
      { component: 'option', children: 'ok' },
      { component: 'opton', children: 'typo' },
      { component: 'div', children: 'not allowed' },
      { component: 'Badge', children: 'registered' },
      { component: 'Nope', children: 'unregistered' },
    ];
    expect(unknownChildren(children)).toEqual(['opton', 'div', 'Nope']);
  });

  it('the allowlist check reaches nested parts (Table rows and cells)', () => {
    const nested: ChildSpec[] = [
      { component: 'TableBody', children: [{ component: 'TableRow', children: [{ component: 'tdd', children: 'typo' }] }] },
    ];
    expect(unknownChildren(nested)).toEqual(['tdd']);
  });
  it('Stack gap and Text size are px numbers, migrated through the D13 table (OV6)', () => {
    expect(stack.controls.find((c) => c.prop === 'gap')).toMatchObject({
      kind: 'select',
      numeric: true,
      default: '12',
      values: ['4', '8', '12', '16', '24', '32', '48', '64'],
    });
    expect(stack.presets?.find((p) => p.label === 'Row, centered')?.state.gap).toBe('16');
    expect(text.controls.find((c) => c.prop === 'size')).toMatchObject({
      kind: 'select',
      numeric: true,
      default: '15',
      values: ['11', '13', '15', '18', '24', '32'],
    });
    expect(text.presets?.map((p) => p.state.size)).toEqual(['32', '13']);
  });

  it('every preset sets only real controls, to values those controls accept (§H.3)', () => {
    for (const m of MANIFESTS) {
      for (const preset of m.presets ?? []) {
        const expected = { ...defaultState(m), ...preset.state } as ControlState;
        expect(parseState(m, serializeState(m, expected)), `${m.name} / ${preset.label}`).toEqual(expected);
      }
    }
  });

  it('groups are the sidebar groups, and only the logo is brand', () => {
    for (const m of MANIFESTS) expect(['components', 'forms', 'brand']).toContain(m.group);
    expect(MANIFESTS.filter((m) => m.group === 'brand').map((m) => m.name)).toEqual(['BitLogo']);
  });

  it('the form controls are in the forms group', () => {
    expect(MANIFESTS.filter((m) => m.group === 'forms').map((m) => m.name)).toEqual(['Field', 'Input', 'Select', 'Switch']);
  });

  it('isHtmlElement follows JSX: lowercase is an HTML tag, PascalCase is a component', () => {
    expect(isHtmlElement('option')).toBe(true);
    expect(isHtmlElement('Badge')).toBe(false);
  });
});
