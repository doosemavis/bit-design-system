import { describe, expect, it } from 'vitest';
import { button } from '../../../manifests/button';
import type { ManifestAnatomy } from '../../../manifests/types';
import { PASSES } from '../../../engine/pageParams';
import { endOf, stepNames, stepsOf } from './build';

const anatomy = button.anatomy as ManifestAnatomy;
const ALL = ['Edge', 'Face', 'Size', 'Shadow'];

function sharedStep(...labels: string[]): ManifestAnatomy {
  const parts = anatomy.parts.filter((p) => labels.includes(p.label)).map((p) => ({ ...p, step: 'Edges' }));
  return { ...anatomy, parts };
}

describe('stepNames', () => {
  it('lists each part once, in part order', () => {
    expect(stepNames(anatomy)).toEqual(ALL);
  });

  it('merges parts that share a step', () => {
    const shared = sharedStep('Edge', 'Face', 'Size');
    expect(stepNames(shared)).toEqual(['Edges']);
  });
});

describe('stepsOf', () => {
  it('wireframe is one state: outline and grid only', () => {
    const [only, ...rest] = stepsOf(anatomy, 'wireframe');
    expect(rest).toEqual([]);
    expect(only).toMatchObject({ landed: [], outline: true, grid: true, lines: false, scene: false, live: false });
  });

  it('tokens lands one step at a time, with lines on', () => {
    const run = stepsOf(anatomy, 'tokens');
    expect(run).toHaveLength(4);
    expect(run.map((s) => s.landed)).toEqual([ALL.slice(0, 1), ALL.slice(0, 2), ALL.slice(0, 3), ALL]);
    expect(run.map((s) => s.fresh)).toEqual(ALL);
    for (const s of run) expect(s).toMatchObject({ lines: true, outline: false, grid: true });
    expect(run[0]?.note).toBe('Edge: --bit-border-width, --bit-radius-10px');
    expect(run[3]).toMatchObject({ landed: ALL, fresh: 'Shadow' });
  });

  it('a shared step joins its parts in one note', () => {
    const [first] = stepsOf(sharedStep('Edge', 'Face'), 'tokens');
    expect(first?.note).toBe('Edge: --bit-border-width, --bit-radius-10px · Face: --bit-color-primary, --bit-weight-bold');
  });

  it('states cycles Default, Disabled, Loading, Default with everything landed', () => {
    const run = stepsOf(anatomy, 'states');
    expect(run.map((s) => s.chip)).toEqual(['Default', 'Disabled', 'Loading', 'Default']);
    for (const s of run) expect(s).toMatchObject({ landed: ALL, lines: false, live: false, fresh: null, grid: true });
    expect(endOf(anatomy, 'states').chip).toBe('Default');
  });

  it('final is one live scene state', () => {
    const [only, ...rest] = stepsOf(anatomy, 'final');
    expect(rest).toEqual([]);
    expect(only).toMatchObject({
      landed: ALL,
      grid: false,
      lines: false,
      scene: true,
      live: true,
      note: anatomy.scene.caption,
    });
  });
});

describe('endOf', () => {
  it.each(PASSES)('%s ends on the last state of its run', (pass) => {
    expect(endOf(anatomy, pass)).toEqual(stepsOf(anatomy, pass).at(-1));
  });
});
