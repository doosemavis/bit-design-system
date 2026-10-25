import { afterEach, describe, expect, it } from 'vitest';
import { stubMatchMedia } from '../../../test/matchMedia';
import type { Edge, HighlightKind } from '../../../manifests/types';
import {
  HIGHLIGHT,
  calloutTarget,
  highlightColor,
  highlightShape,
  needsLoupe,
  parseShadow,
  partMetrics,
  placeCallouts,
  resolveTouch,
  routeLine,
  type PartMetrics,
  type Rect,
} from './geometry';

const box: Rect = { x: 100, y: 50, width: 100, height: 52 };
const m: PartMetrics = { borderWidth: 3, radius: 10, shadowX: 4, shadowY: 4 };
const touch = (kind: HighlightKind, edge: Edge, at?: number) => resolveTouch(box, m, { kind, edge, at });

describe('resolveTouch', () => {
  it('lands on the painted pixels of each kind', () => {
    expect(touch('ring', 'top', 0.68)).toEqual({ x: 168, y: 51.5 });
    expect(touch('fill', 'left', 0.3)).toEqual({ x: 113, y: 65.6 });
    expect(touch('bracket', 'left')).toEqual({ x: 90, y: 76 });
    expect(touch('strip', 'bottom', 0.72)).toEqual({ x: 172, y: 104 });
    expect(touch('strip', 'right', 0.5)).toEqual({ x: 202, y: 76 });
    expect(touch('box', 'top', 0.5)).toEqual({ x: 150, y: 50 });
    expect(touch('text', 'bottom', 0.5)).toEqual({ x: 150, y: 104 });
  });
});

describe('routeLine', () => {
  it('leaves top and bottom vertically first', () => {
    expect(routeLine({ x: 113, y: 65 }, 'top', { x: 40, y: 20 })).toEqual([
      { x: 113, y: 65 },
      { x: 113, y: 20 },
      { x: 40, y: 20 },
    ]);
  });
  it('goes straight when the heights match', () => {
    expect(routeLine({ x: 90, y: 76 }, 'left', { x: 40, y: 76 })).toEqual([
      { x: 90, y: 76 },
      { x: 40, y: 76 },
    ]);
  });
  it('elbows at the x midpoint when the heights differ', () => {
    expect(routeLine({ x: 90, y: 76 }, 'left', { x: 30, y: 20 })).toEqual([
      { x: 90, y: 76 },
      { x: 60, y: 76 },
      { x: 60, y: 20 },
      { x: 30, y: 20 },
    ]);
  });
  it('only ever runs horizontally or vertically', () => {
    const edges: Edge[] = ['top', 'right', 'bottom', 'left'];
    for (let i = 0; i < 20; i += 1) {
      const from = { x: Math.random() * 300, y: Math.random() * 300 };
      const to = { x: Math.random() * 300, y: Math.random() * 300 };
      const pts = routeLine(from, edges[i % 4]!, to);
      expect(pts[0]).toEqual(from);
      expect(pts[pts.length - 1]).toEqual(to);
      pts.slice(1).forEach((p, j) => {
        const q = pts[j]!;
        expect(p.x === q.x || p.y === q.y).toBe(true);
      });
    }
  });
});

describe('calloutTarget', () => {
  it('sits 24px above the instance when leaving top', () => {
    expect(calloutTarget('top', { x: 0, y: 0 }, box, 40) + 40).toBe(box.y - 24);
  });
  it('sits 24px below the instance when leaving bottom', () => {
    expect(calloutTarget('bottom', { x: 0, y: 0 }, box, 40)).toBe(box.y + box.height + 24);
  });
  it('centers on the anchor when leaving a side', () => {
    expect(calloutTarget('left', { x: 0, y: 80 }, box, 40)).toBe(60);
  });
});

describe('placeCallouts', () => {
  it('stacks colliding items with the gap', () => {
    const out = placeCallouts(
      [
        { key: 'a', target: 100, height: 40 },
        { key: 'b', target: 100, height: 40 },
      ],
      0,
      1000,
      16,
    );
    expect(out.get('a')).toBe(100);
    expect(out.get('b')).toBe(156);
  });
  it('never goes above top', () => {
    expect(placeCallouts([{ key: 'a', target: -50, height: 40 }], 10, 1000, 16).get('a')).toBe(10);
  });
  it('shifts up from bottom when it would overflow', () => {
    const out = placeCallouts(
      [
        { key: 'a', target: 150, height: 40 },
        { key: 'b', target: 160, height: 40 },
      ],
      0,
      200,
      16,
    );
    expect(out.get('b')).toBe(160);
    expect(out.get('a')).toBe(104);
  });
});

describe('highlightShape', () => {
  it('draws strips solid, only in the shadow', () => {
    const s = highlightShape('strip', 'right', box, m);
    expect(s.paint).toBe('solid');
    const nums = (s.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    expect(nums.length).toBeGreaterThan(0);
    expect(nums).toEqual(expect.arrayContaining([200, 204, 102, 106]));
    expect(Math.max(...nums)).toBe(204);
  });
  it('hatches fills inset by the border', () => {
    const s = highlightShape('fill', 'left', box, m);
    expect(s.paint).toBe('hatch');
    expect(s.d).toContain('103');
    expect(s.d).toContain('53');
  });
  it('strokes rings', () => {
    expect(highlightShape('ring', 'top', box, m).paint).toBe('stroke');
  });
});

describe('needsLoupe', () => {
  it('flags thin strips and boxes only', () => {
    expect(needsLoupe('strip', m, box)).toBe(true);
    expect(needsLoupe('ring', m, box)).toBe(false);
    expect(needsLoupe('box', m, { ...box, height: 1 })).toBe(true);
    expect(needsLoupe('box', m, { ...box, width: 40, height: 20 })).toBe(false);
  });
});

describe('parseShadow', () => {
  it('reads the first offset', () => {
    expect(parseShadow('4px 4px 0 rgb(0,0,0)')).toEqual({ x: 4, y: 4 });
    expect(parseShadow('rgb(0, 0, 0) 3px 5px 0px 0px')).toEqual({ x: 3, y: 5 });
  });
  it('is zero for none', () => {
    expect(parseShadow('none')).toEqual({ x: 0, y: 0 });
  });
});

describe('partMetrics', () => {
  it('reads border, radius and shadow from computed style', () => {
    const el = document.createElement('div');
    el.style.borderTop = '3px solid black';
    el.style.borderTopLeftRadius = '10px';
    el.style.boxShadow = '4px 4px 0 rgb(0, 0, 0)';
    document.body.append(el);
    expect(partMetrics(el)).toEqual({ borderWidth: 3, radius: 10, shadowX: 4, shadowY: 4 });
    el.remove();
  });
});

describe('highlightColor', () => {
  let restore = () => {};
  afterEach(() => restore());
  it('is the green normally', () => {
    restore = stubMatchMedia();
    expect(highlightColor()).toBe(HIGHLIGHT);
  });
  it('is the system Highlight under forced colors', () => {
    restore = stubMatchMedia('(forced-colors: active)');
    expect(highlightColor()).toBe('Highlight');
  });
});
