/** The geometry shared by layers anchored to a trigger (Select's list, Tooltip's bubble, Menu). */

/** A layer keeps at least this far from the viewport's edges, in px. */
export const ANCHOR_EDGE = 8;

export interface TriggerBox {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Which way a dropdown lines up with its trigger: its left edge on the trigger's, or its right edge on the trigger's. */
export type InlineAlign = 'left' | 'right';

export interface DropdownOptions {
  /** Space between the trigger and the layer, in px. */
  gap: number;
  /** Below is enough room when this much fits, even if the whole layer doesn't, in px. */
  minRoom: number;
  /** Default: 'left'. */
  align?: InlineAlign;
}

export interface DropdownPlacement {
  placement: 'top' | 'bottom';
  top: number;
  left: number;
  /** The height the layer may use on its side, in px; it scrolls past this. */
  room: number;
}

/** A start position along one axis, kept 8px inside the viewport. A layer wider than the viewport starts at the edge. */
export function clampToViewport(start: number, size: number, viewportSize: number): number {
  return Math.max(ANCHOR_EDGE, Math.min(start, viewportSize - size - ANCHOR_EDGE));
}

/**
 * A dropdown's place: `gap` below the trigger, or above it when below can't fit the layer (or `minRoom`,
 * whichever is smaller) and above has more room. It lines up with the trigger's left edge, or its right
 * edge with `align: 'right'`, kept 8px inside the viewport. `layer` is its measured size.
 */
export function placeDropdown(trigger: TriggerBox, layer: Size, viewport: Size, options: DropdownOptions): DropdownPlacement {
  const { gap, minRoom, align = 'left' } = options;
  const start = align === 'right' ? trigger.left + trigger.width - layer.width : trigger.left;
  const left = clampToViewport(start, layer.width, viewport.width);
  const below = viewport.height - trigger.bottom - gap - ANCHOR_EDGE;
  const above = trigger.top - gap - ANCHOR_EDGE;
  const placement = below < Math.min(layer.height, minRoom) && above > below ? 'top' : 'bottom';
  const room = Math.max(placement === 'top' ? above : below, 0);
  const top = placement === 'top' ? trigger.top - gap - Math.min(layer.height, room) : trigger.bottom + gap;
  return { placement, top, left, room };
}

/** True when `element` lays out right to left: a dir attribute, CSS `direction`, or `dir="auto"` all count. */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
