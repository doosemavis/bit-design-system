import type { AnatomyPart, HighlightKind, ManifestAnatomy } from '../../../manifests/types';
import {
  calloutTarget,
  highlightShape,
  measureBox,
  needsLoupe,
  partMetrics,
  placeCallouts,
  renderedClasses,
  resolveTouch,
  routeLine,
  type PartMetrics,
  type Point,
  type Rect,
} from './geometry';

/** Below this stage width the callouts stack under the instance and the diagram goes away. */
export const STACK_BELOW = 600;
const CALLOUT_GAP = 16;
const LENS_RADIUS = 48;
const LENS_GAP = 24;
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
}

interface Seen {
  box: Rect;
  m: PartMetrics;
  anchor: Point;
  lens: Point | null;
}
interface Draft {
  part: AnatomyPart;
  callout: Rect;
  columnTop: number;
  target: number;
  seen: Seen | null;
}

const stepOf = (part: AnatomyPart) => part.step ?? part.label;
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

/** One column: each callout placed from its target so none overlap, then the route to it. */
function measureSide(drafts: Draft[], instance: Rect, bounds: { top: number; bottom: number }) {
  const placed = placeCallouts(
    drafts.map((d) => ({ key: d.part.label, target: d.target, height: d.callout.height })),
    bounds.top,
    bounds.bottom,
    CALLOUT_GAP,
  );
  const tops: Record<string, number> = {};
  const boxes: Record<string, Rect> = {};
  const parts: StagePart[] = [];
  for (const { part, callout, columnTop, target, seen } of drafts) {
    const top = placed.get(part.label) ?? target;
    tops[part.label] = top - columnTop;
    boxes[part.label] = { ...callout, y: top };
    if (!seen) continue;
    const end = { x: part.side === 'left' ? callout.x + callout.width : callout.x, y: top + callout.height / 2 };
    const { anchor, lens } = seen;
    parts.push({
      label: part.label,
      step: stepOf(part),
      side: part.side,
      kind: part.touch.kind,
      anchor,
      route: lens ? [anchor, { x: anchor.x, y: lens.y - LENS_RADIUS }] : routeLine(anchor, leaveOf(part), end),
      shape: highlightShape(part.touch.kind, part.touch.edge, seen.box, seen.m),
      loupe: lens !== null,
      lens: lens ? lensFor(part, seen, lens, end, instance) : null,
      calloutTop: top - columnTop,
    });
  }
  return { tops, boxes, parts };
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
  const base = { instance, paddingLeft: box?.paddingLeft ?? 0, parts: [], tops: {}, callouts: {}, classes: renderedClasses(stage, anatomy.root), stacked };
  const wrapper = stage.querySelector('[data-instance]');
  if (!box || !wrapper || stacked || stage.hasAttribute('data-stacked')) return base;

  const rel = (r: DOMRect): Rect => ({ x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height });
  const style = getComputedStyle(stage);
  const bounds = { top: parseFloat(style.paddingTop) || 0, bottom: origin.height - (parseFloat(style.paddingBottom) || 0) };
  const callouts = [...stage.querySelectorAll<HTMLElement>('[role="listitem"][data-part]')];

  const draft = (part: AnatomyPart): Draft[] => {
    const el = callouts.find((c) => c.dataset.part === part.label);
    if (!el) return [];
    const callout = rel(el.getBoundingClientRect());
    const columnTop = el.parentElement ? rel(el.parentElement.getBoundingClientRect()).y : 0;
    const target = part.unseen ? null : wrapper.querySelector(part.selector);
    if (!target) return [{ part, callout, columnTop, target: bounds.bottom, seen: null }];
    const partBox = rel(target.getBoundingClientRect());
    const m = partMetrics(target);
    const anchor = resolveTouch(partBox, m, part.touch);
    const lens = needsLoupe(part.touch.kind, m, partBox) ? { x: anchor.x, y: instance.y + instance.height + LENS_GAP + LENS_RADIUS } : null;
    const want = lens ? lens.y - callout.height / 2 : calloutTarget(leaveOf(part), anchor, instance, callout.height);
    return [{ part, callout, columnTop, target: want, seen: { box: partBox, m, anchor, lens } }];
  };

  const sides = (['left', 'right'] as const).map((side) =>
    measureSide(anatomy.parts.filter((p) => p.side === side).flatMap(draft), instance, bounds),
  );
  const order = anatomy.parts.map((p) => p.label);
  const parts = sides.flatMap((s) => s.parts).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return { ...base, parts, tops: Object.assign({}, ...sides.map((s) => s.tops)), callouts: Object.assign({}, ...sides.map((s) => s.boxes)) };
}
