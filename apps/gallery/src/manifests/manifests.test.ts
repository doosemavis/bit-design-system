import { describe, it, expect } from 'vitest';
import * as lib from '@bit-ds/react';
import { MANIFESTS, findManifest, routeFor } from './index';
import { COMPONENTS } from './registry';
import { defaultState, parseState, serializeState } from '../engine/state';
import { stack } from './stack';
import { text } from './text';
import type { ControlState } from './types';

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
      expect(routeFor(m)).toBe(m.group === 'Brand' ? '/brand/logo' : `/components/${m.slug}`);
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

  it('every control default is one of its values and every child spec names a registered component', () => {
    for (const m of MANIFESTS) {
      for (const c of m.controls) {
        if (c.kind === 'select') expect(c.values, `${m.name}.${c.prop}`).toContain(c.default);
        if (c.kind === 'number') expect(c.default).toBeGreaterThanOrEqual(c.min);
      }
      if (Array.isArray(m.children)) {
        for (const child of m.children) expect(COMPONENTS[child.component], child.component).toBeDefined();
      }
    }
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
});
