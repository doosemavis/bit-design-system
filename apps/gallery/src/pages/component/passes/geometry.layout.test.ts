import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  columnHeight,
  highlightShape,
  placeCallouts,
  placeLoupe,
  renderedClasses,
  resolveTouch,
  routeIntoLoupe,
  textRunRect,
  type PartMetrics,
  type Rect,
} from './geometry';

const box: Rect = { x: 100, y: 50, width: 200, height: 40 };
/** A divider: one 2px bottom border on a box with none elsewhere (Card's header, a Table head cell). */
const divider: PartMetrics = { borders: { top: 0, right: 0, bottom: 2, left: 0 }, radius: 0, shadowX: 0, shadowY: 0 };
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const squareOf = (c: { x: number; y: number }, r: number): Rect => ({ x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r });

describe("per-edge borders: the touched edge's own width", () => {
  it('lands a bottom ring on the center of the bottom stroke, not offset by the top border', () => {
    expect(resolveTouch(box, divider, { kind: 'ring', edge: 'bottom', at: 0.5 })).toEqual({ x: 200, y: 89 });
  });

  it("insets a fill from the touched edge by that edge's border", () => {
    const m: PartMetrics = { ...divider, borders: { top: 0, right: 0, bottom: 2, left: 4 } };
    expect(resolveTouch(box, m, { kind: 'fill', edge: 'left', at: 0.5 })).toEqual({ x: 114, y: 70 });
  });

  it("clamps a fill's inset so the dot is strictly inside a small padding box (Switch's 16px thumb, a 10px box)", () => {
    const thick: PartMetrics = { borders: { top: 3, right: 3, bottom: 3, left: 3 }, radius: 8, shadowX: 0, shadowY: 0 };
    const strictlyInside = (b: Rect, p: { x: number; y: number }) => p.x > b.x + 3 && p.x < b.x + b.width - 3 && p.y > b.y + 3 && p.y < b.y + b.height - 3;
    for (const size of [16, 10]) {
      const small: Rect = { x: 772, y: 1538, width: size, height: size };
      for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
        for (const at of [0, 0.3, 0.5, 1]) {
          const p = resolveTouch(small, thick, { kind: 'fill', edge, at });
          expect(strictlyInside(small, p), `${size}px ${edge} at ${at}: ${p.x},${p.y}`).toBe(true);
        }
      }
    }
    // 16px with a 3px border: a 10px padding box, so the inset is 5 - 1 = 4, not 10.
    expect(resolveTouch({ x: 772, y: 1538, width: 16, height: 16 }, thick, { kind: 'fill', edge: 'left', at: 0.5 })).toEqual({ x: 779, y: 1546 });
  });

  it('keeps the full 10px fill inset on a part with room for it', () => {
    const thin: PartMetrics = { borders: { top: 2, right: 2, bottom: 2, left: 2 }, radius: 0, shadowX: 0, shadowY: 0 };
    expect(resolveTouch(box, thin, { kind: 'fill', edge: 'left', at: 0.5 })).toEqual({ x: 112, y: 70 });
  });

  it('traces only the sides that have a border: a divider lights its one stroke', () => {
    expect(highlightShape('ring', 'bottom', box, divider).d).toBe('M100 89H300');
  });

  it('traces the whole rounded box when all four sides share one width', () => {
    const uniform: PartMetrics = { borders: { top: 2, right: 2, bottom: 2, left: 2 }, radius: 8, shadowX: 0, shadowY: 0 };
    const { d } = highlightShape('ring', 'top', box, uniform);
    expect(d.startsWith('M108 51H292A7 7')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('keeps the rounded corners when the sides differ in width, each inset by its own half width', () => {
    const uneven: PartMetrics = { borders: { top: 2, right: 4, bottom: 2, left: 4 }, radius: 10, shadowX: 0, shadowY: 0 };
    // Center lines: x 102–298, y 51–89. Corners: rx 10 - 4/2 = 8, ry 10 - 2/2 = 9.
    expect(highlightShape('ring', 'top', box, uneven).d).toBe(
      'M110 51H290A8 9 0 0 1 298 60V80A8 9 0 0 1 290 89H110A8 9 0 0 1 102 80V60A8 9 0 0 1 110 51Z',
    );
  });

  it("insets a fill highlight by each side's own border", () => {
    const m: PartMetrics = { ...divider, borders: { top: 1, right: 2, bottom: 3, left: 4 } };
    expect(highlightShape('fill', 'left', box, m).d.startsWith('M104 51H298')).toBe(true);
  });
});

describe('textRunRect', () => {
  afterEach(() => vi.restoreAllMocks());

  it("spans the text nodes' rects only, never the element's wider box or a child element's box", () => {
    const label = document.createElement('label');
    label.append('Email', Object.assign(document.createElement('span'), { textContent: ' *' }), document.createTextNode('  '));
    document.body.append(label);
    const runs = new Map<string, DOMRect[]>([
      ['Email', [new DOMRect(10, 20, 40, 18)]],
      [' *', [new DOMRect(50, 20, 8, 18)]],
    ]);
    const nodes: string[] = [];
    vi.spyOn(Range.prototype, 'selectNodeContents').mockImplementation(function (this: Range, node: Node) {
      nodes.push(node.textContent ?? '');
    });
    Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList;
    vi.spyOn(Range.prototype, 'getClientRects').mockImplementation(() => (runs.get(nodes.at(-1) ?? '') ?? []) as unknown as DOMRectList);
    const run = textRunRect(label)!;
    expect(nodes).toEqual(['Email', ' *']);
    expect([run.left, run.top, run.width, run.height]).toEqual([10, 20, 48, 18]);
    label.remove();
  });

  it('is null when nothing renders text', () => {
    const empty = document.createElement('div');
    empty.append(document.createElement('span'));
    expect(textRunRect(empty)).toBeNull();
  });
});

describe('placeLoupe', () => {
  const area: Rect = { x: 0, y: 0, width: 600, height: 400 };

  it('keeps the wanted place when it is clear', () => {
    expect(placeLoupe({ x: 300, y: 300 }, 48, [{ x: 0, y: 0, width: 100, height: 100 }], area)).toEqual({ x: 300, y: 300 });
  });

  it('moves to the nearest clear place when a callout sits where it wants to be, clearing the callout and the instance', () => {
    const instance: Rect = { x: 280, y: 150, width: 40, height: 40 };
    const callout: Rect = { x: 344, y: 230, width: 150, height: 80 };
    const obstacles = [instance, callout];
    const want = { x: 309, y: 262 };
    const at = placeLoupe(want, 48, obstacles, area);
    expect(at).not.toEqual(want);
    for (const o of obstacles) expect(overlaps(squareOf(at, 48), o)).toBe(false);
    expect(at.x - 48).toBeGreaterThanOrEqual(0);
    expect(at.y + 48).toBeLessThanOrEqual(400);
  });
});

describe('routeIntoLoupe', () => {
  it('drops straight onto the rim when the loupe is under the touch point', () => {
    expect(routeIntoLoupe({ x: 100, y: 50 }, { x: 100, y: 200 }, 48)).toEqual([
      { x: 100, y: 50 },
      { x: 100, y: 152 },
    ]);
  });

  it('runs straight up onto the bottom rim when the loupe is above the touch point', () => {
    expect(routeIntoLoupe({ x: 100, y: 300 }, { x: 100, y: 150 }, 48)).toEqual([
      { x: 100, y: 300 },
      { x: 100, y: 198 },
    ]);
  });

  it('runs straight across onto the near rim when the loupe is level with the touch point, on either side', () => {
    expect(routeIntoLoupe({ x: 100, y: 100 }, { x: 250, y: 100 }, 48)).toEqual([
      { x: 100, y: 100 },
      { x: 202, y: 100 },
    ]);
    expect(routeIntoLoupe({ x: 400, y: 100 }, { x: 250, y: 100 }, 48)).toEqual([
      { x: 400, y: 100 },
      { x: 298, y: 100 },
    ]);
  });

  it('runs down, then across into the side, when the loupe sits off to one side', () => {
    expect(routeIntoLoupe({ x: 100, y: 50 }, { x: 200, y: 200 }, 48)).toEqual([
      { x: 100, y: 50 },
      { x: 100, y: 200 },
      { x: 152, y: 200 },
    ]);
  });
});

describe('a tall column of callouts', () => {
  it('sums the heights and the gaps between them', () => {
    expect(columnHeight([40, 60, 50], 16)).toBe(182);
    expect(columnHeight([], 16)).toBe(0);
  });

  it('places six callouts in one column with no two overlapping, in a stage grown to the column', () => {
    const heights = [64, 96, 64, 128, 96, 64];
    const items = heights.map((height, i) => ({ key: `p${i}`, target: 120, height }));
    const top = 32;
    const bottom = top + columnHeight(heights, 16);
    const placed = placeCallouts(items, top, bottom, 16);
    const spans = items.map((item) => ({ top: placed.get(item.key)!, bottom: placed.get(item.key)! + item.height })).sort((a, b) => a.top - b.top);
    spans.slice(1).forEach((span, i) => expect(span.top).toBeGreaterThanOrEqual(spans[i]!.bottom + 16));
    expect(spans[0]!.top).toBeGreaterThanOrEqual(top);
    expect(spans.at(-1)!.bottom).toBeLessThanOrEqual(bottom);
  });
});

describe('renderedClasses on an svg root', () => {
  it("reads the class attribute as text (an svg's className is an SVGAnimatedString)", () => {
    const stage = document.createElement('div');
    const instance = document.createElement('div');
    instance.dataset.instance = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'bit-icon bit-md');
    instance.append(svg);
    stage.append(instance);
    expect(renderedClasses(stage)).toBe('bit-icon bit-md');
  });
});
