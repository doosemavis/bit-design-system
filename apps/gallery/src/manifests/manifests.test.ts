import { describe, it, expect } from 'vitest';
import * as lib from '@bit-ds/react';
import { MANIFESTS, findManifest, routeFor } from './index';
import { COMPONENTS } from './registry';

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
        if (c.prop === 'size') expect([...c.values].every((v) => ([...lib.SIZES, ...lib.TEXT_SIZES] as readonly string[]).includes(v))).toBe(true);
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
});
