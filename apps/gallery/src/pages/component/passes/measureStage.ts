import type { AnatomyPart, Edge, HighlightKind, ManifestAnatomy } from '../../../manifests/types';
import { stepOf } from './build';
import {
  calloutTarget,
  columnHeight,
  highlightShape,
  measureBox,
  needsLoupe,
  partMetrics,
  placeCallouts,
  placeLoupe,
  renderedClasses,
  resolveTouch,
  routeIntoLoupe,
  routeLine,
  textRunRect,
  type PartMetrics,
  type Point,
  type Rect,
} from './geometry';

/** Below this stage width the callouts stack under the instance and the diagram goes away. */
export const STACK_BELOW = 600;
/** The vertical space kept between two callouts in a column (geometry.ts's CALLOUT_GAP is the callout-to-instance distance). */
const CALLOUT_SPACING = 16;
const LENS_RADIUS = 48;
const LENS_GAP = 24;
/** The loupe keeps this far from the instance (its shadow and focus ring included) and from every callout. */
const LENS_CLEAR = 12;
const ZERO: Rect = { x: 0, y: 0, width: 0, height: 0 };

/** The loupe for a part under 6px: a circle under the instance, with a copy of it magnified around the touch point. */
export interface Lens {
  center: Point;
  radius: number;
  /** The part's thickness in px, for the loupe's measure mark. */
  thickness: number;
  /** Where the Loupe puts its unscaled copy, so the touch point lands on `center`. */
  origin: Rect;
  /** The rest of the line: from the loupe's edge to the callout. */
  onward: Point[];
}

export interface StagePart {
  label: string;
  step: string;
  side: AnatomyPart['side'];
  kind: HighlightKind;
  /** The touched side, and the part's selector: the diagram carries both so a test can check the dot from the page. */
  edge: Edge;
  selector: string;
  anchor: Point;
  /** From the touch point to the callout, or to the loupe's edge when there's a lens (lens.onward goes on). */
  route: Point[];
  shape: ReturnType<typeof highlightShape>;
  loupe: boolean;
  lens: Lens | null;
  /** The callout's top inside its column: its inline `top`. */
  calloutTop: number;
}

export interface StageGeometry {
  instance: Rect;
  paddingLeft: number;
  /** The parts that get a line: seen, matched, with a callout. */
  parts: StagePart[];
  /** Every placed callout's inline top, by label, unseen parts included. */
  tops: Readonly<Record<string, number>>;
  /** Every placed callout's box in the stage, by label, unseen parts included: the lit mark frames it. */
  callouts: Readonly<Record<string, Rect>>;
  /** The root's real classes: Final's "Reads". */
  classes: string;
  stacked: boolean;
  /** The taller column of callouts, every callout counted (landed or not): the stage's min-height holds it. */
  column: number;
}

interface Seen {
  box: Rect;
  m: PartMetrics;
  anchor: Point;
  /** Where the loupe wants to sit, before it's moved clear of the callouts. */
  lens: Point | null;
}
interface Draft {
  part: AnatomyPart;
  callout: Rect;
  columnTop: number;
  target: number;
  seen: Seen | null;
}

const leaveOf = (part: AnatomyPart) => part.touch.leave ?? part.touch.edge;

function thicknessOf(part: AnatomyPart, box: Rect, m: PartMetrics): number {
  if (part.touch.kind !== 'strip') return Math.round(Math.min(box.width, box.height));
  return part.touch.edge === 'right' || part.touch.edge === 'top' ? m.shadowX : m.shadowY;
}

function lensFor(part: AnatomyPart, seen: Seen, center: Point, end: Point, instance: Rect): Lens {
  const exit = { x: center.x + (part.side === 'right' ? LENS_RADIUS : -LENS_RADIUS), y: center.y };
  return {
    center,
    radius: LENS_RADIUS,
    thickness: thicknessOf(part, seen.box, seen.m),
    origin: { ...instance, x: instance.x + center.x - seen.anchor.x, y: instance.y + center.y - seen.anchor.y },
    onward: routeLine(exit, part.side, end),
  };
}

const grow = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, width: r.width + 2 * by, height: r.height + 2 * by });

/** One column: each callout placed from its target so none overlap. */
function placeSide(drafts: Draft[], bounds: { top: number; bottom: number }) {
  const placed = placeCallouts(
    drafts.map((d) => ({ key: d.part.label, target: d.target, height: d.callout.height })),
    bounds.top,
    bounds.bottom,
    CALLOUT_SPACING,
  );
  const tops: Record<string, number> = {};
  const boxes: Record<string, Rect> = {};
  for (const { part, callout, columnTop, target } of drafts) {
    const top = placed.get(part.label) ?? target;
    tops[part.label] = top - columnTop;
    boxes[part.label] = { ...callout, y: top };
  }
  return { tops, boxes };
}

/**
 * Each seen part's line, once every callout has its place: the route to its callout, or to a loupe placed clear of the
 * instance, every callout and every other loupe (narrow components leave no room beside the instance for one).
 */
function routeParts(drafts: Draft[], placed: { tops: Readonly<Record<string, number>>; boxes: Readonly<Record<string, Rect>> }, instance: Rect, area: Rect): StagePart[] {
  const { tops, boxes } = placed;
  const obstacles: Rect[] = [grow(instance, LENS_CLEAR), ...Object.values(boxes).map((b) => grow(b, LENS_CLEAR))];
  return drafts.flatMap(({ part, seen }) => {
    const callout = boxes[part.label];
    if (!seen || !callout) return [];
    const end = { x: part.side === 'left' ? callout.x + callout.width : callout.x, y: callout.y + callout.height / 2 };
    const center = seen.lens ? placeLoupe(seen.lens, LENS_RADIUS, obstacles, area) : null;
    if (center) obstacles.push(grow({ x: center.x - LENS_RADIUS, y: center.y - LENS_RADIUS, width: 2 * LENS_RADIUS, height: 2 * LENS_RADIUS }, LENS_CLEAR));
    const { anchor } = seen;
    return [
      {
        label: part.label,
        step: stepOf(part),
        side: part.side,
        kind: part.touch.kind,
        edge: part.touch.edge,
        selector: part.selector,
        anchor,
        route: center ? routeIntoLoupe(anchor, center, LENS_RADIUS) : routeLine(anchor, leaveOf(part), end),
        shape: highlightShape(part.touch.kind, part.touch.edge, seen.box, seen.m),
        loupe: center !== null,
        lens: center ? lensFor(part, seen, center, end, instance) : null,
        calloutTop: tops[part.label] ?? 0,
      },
    ];
  });
}

/**
 * Everything the diagram draws, measured from the rendered stage: the instance, each seen part's touch point, the
 * right-angle route to its callout, its highlight shape and loupe, and each callout's top. Stacked (under 600px), or
 * still laid out as a stack from the last measure, it returns no parts: the next measure, with the columns back, has them.
 */
export function measureStage(stage: HTMLElement, anatomy: ManifestAnatomy): StageGeometry {
  const origin = stage.getBoundingClientRect();
  const stacked = origin.width < STACK_BELOW;
  const box = measureBox(stage, anatomy.root);
  const instance = box ? { x: box.x, y: box.y, width: box.width, height: box.height } : ZERO;
  const base = { instance, paddingLeft: box?.paddingLeft ?? 0, parts: [], tops: {}, callouts: {}, classes: renderedClasses(stage, anatomy.root), stacked, column: 0 };
  const wrapper = stage.querySelector('[data-instance]');
  if (!box || !wrapper || stacked || stage.hasAttribute('data-stacked')) return base;

  const rel = (r: DOMRect): Rect => ({ x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height });
  const style = getComputedStyle(stage);
  const pad = { top: parseFloat(style.paddingTop) || 0, right: parseFloat(style.paddingRight) || 0, bottom: parseFloat(style.paddingBottom) || 0, left: parseFloat(style.paddingLeft) || 0 };
  const bounds = { top: pad.top, bottom: origin.height - pad.bottom };
  const area = { x: pad.left, y: pad.top, width: origin.width - pad.left - pad.right, height: bounds.bottom - bounds.top };
  const callouts = [...stage.querySelectorAll<HTMLElement>('[role="listitem"][data-part]')];

  const draft = (part: AnatomyPart): Draft[] => {
    const el = callouts.find((c) => c.dataset.part === part.label);
    if (!el) return [];
    const callout = rel(el.getBoundingClientRect());
    const columnTop = el.parentElement ? rel(el.parentElement.getBoundingClientRect()).y : 0;
    const target = part.unseen ? null : wrapper.querySelector(part.selector);
    if (!target) return [{ part, callout, columnTop, target: bounds.bottom, seen: null }];
    // A text part is its rendered words, not its box: a block label is wider than "Email".
    const run = part.touch.kind === 'text' ? textRunRect(target) : null;
    const partBox = rel(run ?? target.getBoundingClientRect());
    const m = partMetrics(target);
    const anchor = resolveTouch(partBox, m, part.touch);
    const lens = needsLoupe(part.touch.kind, m, partBox) ? { x: anchor.x, y: instance.y + instance.height + LENS_GAP + LENS_RADIUS } : null;
    const want = lens ? lens.y - callout.height / 2 : calloutTarget(leaveOf(part), anchor, instance, callout.height);
    return [{ part, callout, columnTop, target: want, seen: { box: partBox, m, anchor, lens } }];
  };

  const drafts = (['left', 'right'] as const).map((side) => anatomy.parts.filter((p) => p.side === side).flatMap(draft));
  const sides = drafts.map((list) => placeSide(list, bounds));
  const placed = { tops: Object.assign({}, ...sides.map((s) => s.tops)), boxes: Object.assign({}, ...sides.map((s) => s.boxes)) };
  const order = anatomy.parts.map((p) => p.label);
  const parts = routeParts(drafts.flat(), placed, instance, area).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  const column = Math.max(...drafts.map((list) => columnHeight(list.map((d) => d.callout.height), CALLOUT_SPACING)));
  return { ...base, parts, tops: placed.tops, callouts: placed.boxes, column };
}
