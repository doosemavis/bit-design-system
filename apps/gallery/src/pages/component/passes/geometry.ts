import type { Edge, HighlightKind, Touch } from '../../../manifests/types';

export const HIGHLIGHT = '#3DDC74';

export interface Point {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface PartMetrics {
  /** Each side's own border width: a divider is often one bottom border on a box with none elsewhere. */
  borders: Readonly<Record<Edge, number>>;
  radius: number;
  shadowX: number;
  shadowY: number;
}

const FILL_INSET = 10;
const BRACKET_GAP = 10;
const TEXT_GAP = 1;
const CALLOUT_GAP = 24;
const LOUPE_BELOW = 6;

/** The first "Xpx Ypx" offset of a box-shadow, wherever the color sits. */
export function parseShadow(boxShadow: string): { x: number; y: number } {
  const hit = /(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(boxShadow);
  return hit ? { x: Number(hit[1]), y: Number(hit[2]) } : { x: 0, y: 0 };
}

export function partMetrics(el: Element): PartMetrics {
  const cs = getComputedStyle(el);
  const shadow = parseShadow(cs.boxShadow);
  const width = (v: string) => parseFloat(v) || 0;
  return {
    borders: { top: width(cs.borderTopWidth), right: width(cs.borderRightWidth), bottom: width(cs.borderBottomWidth), left: width(cs.borderLeftWidth) },
    radius: parseFloat(cs.borderTopLeftRadius) || 0,
    shadowX: shadow.x,
    shadowY: shadow.y,
  };
}

/** The point on a side of `r`, `at` (0-1) of the way along it, `offset` px outside (negative: inside). */
function onSide(r: Rect, edge: Edge, at: number, offset: number): Point {
  switch (edge) {
    case 'top':
      return { x: r.x + r.width * at, y: r.y - offset };
    case 'bottom':
      return { x: r.x + r.width * at, y: r.y + r.height + offset };
    case 'left':
      return { x: r.x - offset, y: r.y + r.height * at };
    case 'right':
      return { x: r.x + r.width + offset, y: r.y + r.height * at };
  }
}

/**
 * A point strictly inside the padding box, near `edge`: FILL_INSET in from the border, clamped to half the padding box
 * less 1px so a small part (Switch's 16px thumb) never puts it on the border. Along the edge it stays 1px clear too.
 */
function fillPoint(box: Rect, m: PartMetrics, edge: Edge, at: number): Point {
  const { top, right, bottom, left } = m.borders;
  const inner = { x: box.x + left, y: box.y + top, width: box.width - left - right, height: box.height - top - bottom };
  const across = edge === 'left' || edge === 'right' ? inner.width : inner.height;
  const inset = Math.min(FILL_INSET, Math.max(0, across / 2 - 1));
  const within = (v: number, start: number, span: number) => (span > 2 ? Math.min(Math.max(v, start + 1), start + span - 1) : start + span / 2);
  switch (edge) {
    case 'left':
      return { x: inner.x + inset, y: within(box.y + box.height * at, inner.y, inner.height) };
    case 'right':
      return { x: inner.x + inner.width - inset, y: within(box.y + box.height * at, inner.y, inner.height) };
    case 'top':
      return { x: within(box.x + box.width * at, inner.x, inner.width), y: inner.y + inset };
    case 'bottom':
      return { x: within(box.x + box.width * at, inner.x, inner.width), y: inner.y + inner.height - inset };
  }
}

export function resolveTouch(box: Rect, m: PartMetrics, touch: Touch): Point {
  const at = touch.at ?? 0.5;
  switch (touch.kind) {
    case 'ring':
      return onSide(box, touch.edge, at, -m.borders[touch.edge] / 2);
    case 'fill':
      return fillPoint(box, m, touch.edge, at);
    case 'bracket':
      return onSide(box, touch.edge, at, BRACKET_GAP);
    case 'strip': {
      // The hard shadow shows only below and to the right: top maps to the right strip, left to the bottom strip.
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
      if (touch.edge === 'right' || touch.edge === 'top') {
        const y = clamp(box.y + box.height * at, box.y + m.shadowY, box.y + box.height + m.shadowY);
        return { x: box.x + box.width + m.shadowX / 2, y };
      }
      const x = clamp(box.x + box.width * at, box.x + m.shadowX, box.x + box.width + m.shadowX);
      return { x, y: box.y + box.height + m.shadowY / 2 };
    }
    case 'box':
      return onSide(box, touch.edge, at, 0);
    case 'text':
      return { x: box.x + box.width * at, y: box.y + box.height + TEXT_GAP };
  }
}

/** A right-angle route from the part to the callout's anchor. */
export function routeLine(from: Point, leave: Edge, to: Point): Point[] {
  if (leave === 'top' || leave === 'bottom') {
    return [from, { x: from.x, y: to.y }, to];
  }
  if (from.y === to.y) return [from, to];
  const mid = (from.x + to.x) / 2;
  return [from, { x: mid, y: from.y }, { x: mid, y: to.y }, to];
}

/** The top a callout wants: clear of the instance above or below, or level with its anchor beside it. */
export function calloutTarget(leave: Edge, anchor: Point, instance: Rect, height: number): number {
  if (leave === 'top') return instance.y - CALLOUT_GAP - height;
  if (leave === 'bottom') return instance.y + instance.height + CALLOUT_GAP;
  return anchor.y - height / 2;
}

/** Resolve a column of callouts so none overlap, none rise above `top` and the last ends by `bottom` where it can. */
export function placeCallouts(
  items: readonly { key: string; target: number; height: number }[],
  top: number,
  bottom: number,
  gap: number,
): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.target - b.target);
  const tops: number[] = [];
  sorted.forEach((item, i) => {
    const floor = i === 0 ? top : tops[i - 1]! + sorted[i - 1]!.height + gap;
    tops.push(Math.max(item.target, floor));
  });
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const ceiling = i === sorted.length - 1 ? bottom : tops[i + 1]! - gap;
    tops[i] = Math.min(tops[i]!, ceiling - sorted[i]!.height);
  }
  const placed = new Map<string, number>();
  sorted.forEach((item, i) => placed.set(item.key, Math.max(tops[i]!, top)));
  return placed;
}

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const c = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + c} ${y}H${x + w - c}A${c} ${c} 0 0 1 ${x + w} ${y + c}V${y + h - c}` +
    `A${c} ${c} 0 0 1 ${x + w - c} ${y + h}H${x + c}A${c} ${c} 0 0 1 ${x} ${y + h - c}V${y + c}A${c} ${c} 0 0 1 ${x + c} ${y}Z`
  );
}

function bracketPath(box: Rect, edge: Edge): string {
  const lip = 4;
  const { x, y, width: w, height: h } = box;
  const g = BRACKET_GAP;
  switch (edge) {
    case 'left':
      return `M${x - g + lip} ${y}H${x - g}V${y + h}H${x - g + lip}`;
    case 'right':
      return `M${x + w + g - lip} ${y}H${x + w + g}V${y + h}H${x + w + g - lip}`;
    case 'top':
      return `M${x} ${y - g + lip}V${y - g}H${x + w}V${y - g + lip}`;
    case 'bottom':
      return `M${x} ${y + h + g - lip}V${y + h + g}H${x + w}V${y + h + g - lip}`;
  }
}

/**
 * A closed ring whose sides differ in width: each side's center line is inset by its own half width, and each corner is
 * an elliptical arc inset the same way (horizontally by its side's half width, vertically by its top's or bottom's).
 */
function unevenRing(box: Rect, m: PartMetrics): string {
  const { top: t, right: r, bottom: b, left: l } = m.borders;
  const x0 = box.x + l / 2;
  const y0 = box.y + t / 2;
  const x1 = box.x + box.width - r / 2;
  const y1 = box.y + box.height - b / 2;
  const fit = (v: number, span: number) => Math.max(0, Math.min(v, span / 2));
  const rx = (side: number) => fit(m.radius - side / 2, x1 - x0);
  const ry = (side: number) => fit(m.radius - side / 2, y1 - y0);
  const [tlx, tly, trx, tr_y, brx, bry, blx, bly] = [rx(l), ry(t), rx(r), ry(t), rx(r), ry(b), rx(l), ry(b)];
  return (
    `M${x0 + tlx} ${y0}H${x1 - trx}A${trx} ${tr_y} 0 0 1 ${x1} ${y0 + tr_y}V${y1 - bry}A${brx} ${bry} 0 0 1 ${x1 - brx} ${y1}` +
    `H${x0 + blx}A${blx} ${bly} 0 0 1 ${x0} ${y1 - bly}V${y0 + tly}A${tlx} ${tly} 0 0 1 ${x0 + tlx} ${y0}Z`
  );
}

/**
 * The border stroke, traced along its center line: the whole rounded box when all four sides share one width, else only
 * the sides that have a border (a divider lights just its one stroke). No border at all: the box's outline.
 */
function ringPath(box: Rect, m: PartMetrics): string {
  const { x, y, width: w, height: h } = box;
  const { top, right, bottom, left } = m.borders;
  if (top === right && right === bottom && bottom === left) {
    const half = top / 2;
    return roundedRect(x + half, y + half, w - top, h - top, m.radius - half);
  }
  if (top > 0 && right > 0 && bottom > 0 && left > 0) return unevenRing(box, m);
  const sides = [
    top > 0 ? `M${x} ${y + top / 2}H${x + w}` : '',
    right > 0 ? `M${x + w - right / 2} ${y}V${y + h}` : '',
    bottom > 0 ? `M${x} ${y + h - bottom / 2}H${x + w}` : '',
    left > 0 ? `M${x + left / 2} ${y}V${y + h}` : '',
  ];
  return sides.join('');
}

export function highlightShape(
  kind: HighlightKind,
  edge: Edge,
  box: Rect,
  m: PartMetrics,
): { d: string; paint: 'stroke' | 'hatch' | 'solid' } {
  const { x, y, width: w, height: h } = box;
  const right = x + w;
  const bottom = y + h;
  switch (kind) {
    case 'ring':
      return { d: ringPath(box, m), paint: 'stroke' };
    case 'fill': {
      const { top, right: r, bottom: b, left } = m.borders;
      return { d: roundedRect(x + left, y + top, w - left - r, h - top - b, m.radius - Math.max(top, r, b, left)), paint: 'hatch' };
    }
    case 'bracket':
      return { d: bracketPath(box, edge), paint: 'stroke' };
    case 'strip': {
      const { shadowX: sx, shadowY: sy } = m;
      return {
        d: `M${right} ${y + sy}H${right + sx}V${bottom + sy}H${right}Z` + `M${x + sx} ${bottom}H${right}V${bottom + sy}H${x + sx}Z`,
        paint: 'solid',
      };
    }
    case 'box':
      return { d: roundedRect(x, y, w, h, m.radius), paint: 'stroke' };
    case 'text': {
      const at = bottom + TEXT_GAP;
      return { d: `M${x} ${at}H${right}`, paint: 'stroke' };
    }
  }
}

/**
 * The rendered text inside `el`, as one rect: a Range over each of its text nodes, so the box of a block label (wider
 * than its words) or of a child element never counts. Null when nothing renders text, or the engine can't measure ranges.
 */
export function textRunRect(el: Element): DOMRect | null {
  const doc = el.ownerDocument;
  if (typeof doc.createRange !== 'function') return null;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const rects: DOMRect[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const range = doc.createRange();
    range.selectNodeContents(node);
    if (typeof range.getClientRects !== 'function') return null;
    rects.push(...[...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0));
  }
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

/** What a column of callouts needs, top to bottom: each callout's height plus a gap between each two. */
export function columnHeight(heights: readonly number[], gap: number): number {
  return heights.length === 0 ? 0 : heights.reduce((sum, h) => sum + h, 0) + gap * (heights.length - 1);
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Where a loupe of `radius` goes: `want` when its square clears every obstacle (the instance, each callout, other loupes),
 * else the nearest clear center inside `area`, searched on a `step` grid. Falls back to `want` when nothing is clear.
 */
export function placeLoupe(want: Point, radius: number, obstacles: readonly Rect[], area: Rect, step = 4): Point {
  const clear = (c: Point) => {
    const square = { x: c.x - radius, y: c.y - radius, width: 2 * radius, height: 2 * radius };
    return obstacles.every((o) => !overlaps(square, o));
  };
  if (clear(want)) return want;
  let best: Point | null = null;
  let bestDistance = Infinity;
  for (let y = area.y + radius; y <= area.y + area.height - radius; y += step) {
    for (let x = area.x + radius; x <= area.x + area.width - radius; x += step) {
      const distance = Math.hypot(x - want.x, y - want.y);
      if (distance < bestDistance && clear({ x, y })) {
        best = { x, y };
        bestDistance = distance;
      }
    }
  }
  return best ?? want;
}

/**
 * The pen's run from the touch point into the loupe, onto its near rim wherever it sits: straight up or down when the
 * loupe is above or below the point, straight across when it's level, else along then across into its near side.
 */
export function routeIntoLoupe(anchor: Point, center: Point, radius: number): Point[] {
  const dx = anchor.x - center.x;
  const dy = anchor.y - center.y;
  const rim = (offset: number) => Math.sqrt(radius * radius - offset * offset);
  if (Math.abs(dx) < radius) return [anchor, { x: anchor.x, y: center.y + Math.sign(dy) * rim(dx) }];
  if (Math.abs(dy) < radius) return [anchor, { x: center.x + Math.sign(dx) * rim(dy), y: anchor.y }];
  return [anchor, { x: anchor.x, y: center.y }, { x: center.x + Math.sign(dx) * radius, y: center.y }];
}

/** A thin part needs a magnified inset. A ring traces the whole box, so it stays visible. */
export function needsLoupe(kind: HighlightKind, m: PartMetrics, box: Rect): boolean {
  if (kind === 'strip') return Math.min(m.shadowX, m.shadowY) < LOUPE_BELOW;
  if (kind === 'box') return Math.min(box.width, box.height) < LOUPE_BELOW;
  return false;
}

export function highlightColor(): string {
  const forced = typeof window.matchMedia === 'function' && window.matchMedia('(forced-colors: active)').matches;
  return forced ? 'Highlight' : HIGHLIGHT;
}

/** The instance's box relative to the stage, and its left padding, for the Wireframe dimensions. */
export interface BoxMeasure extends Rect {
  paddingLeft: number;
}

/** The component's root inside the stage's first `[data-instance]`: `root` (anatomy.root), or its first child. */
function instanceRoot(stage: HTMLElement, root?: string): Element | null {
  return stage.querySelector('[data-instance]')?.querySelector(root ?? ':scope > *') ?? null;
}

export function measureBox(stage: HTMLElement, root?: string): BoxMeasure | null {
  const target = instanceRoot(stage, root);
  if (!target) return null;
  const origin = stage.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  return {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
    paddingLeft: parseFloat(getComputedStyle(target).paddingLeft) || 0,
  };
}

/** The classes the rendered root really has: the Final pass's "Reads". */
export function renderedClasses(stage: HTMLElement, root?: string): string {
  // getAttribute, not className: an svg root's className is an SVGAnimatedString, not text.
  return instanceRoot(stage, root)?.getAttribute('class') ?? '';
}
