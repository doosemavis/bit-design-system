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
  borderWidth: number;
  radius: number;
  shadowX: number;
  shadowY: number;
}

const FILL_INSET = 10;
const BRACKET_GAP = 10;
const TEXT_GAP = 2;
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
  return {
    borderWidth: parseFloat(cs.borderTopWidth) || 0,
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

export function resolveTouch(box: Rect, m: PartMetrics, touch: Touch): Point {
  const at = touch.at ?? 0.5;
  switch (touch.kind) {
    case 'ring':
      return onSide(box, touch.edge, at, -m.borderWidth / 2);
    case 'fill':
      return onSide(box, touch.edge, at, -(m.borderWidth + FILL_INSET));
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
    case 'ring': {
      const half = m.borderWidth / 2;
      return {
        d: roundedRect(x + half, y + half, w - m.borderWidth, h - m.borderWidth, m.radius - half),
        paint: 'stroke',
      };
    }
    case 'fill': {
      const b = m.borderWidth;
      return { d: roundedRect(x + b, y + b, w - 2 * b, h - 2 * b, m.radius - b), paint: 'hatch' };
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
function instanceRoot(stage: HTMLElement, root?: string): HTMLElement | null {
  return stage.querySelector('[data-instance]')?.querySelector<HTMLElement>(root ?? ':scope > *') ?? null;
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
  return instanceRoot(stage, root)?.className ?? '';
}
