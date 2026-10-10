import { ANCHOR_EDGE, clampToViewport } from '../../system/anchor';
import type { Size, TriggerBox } from '../../system/anchor';

/** Space between the trigger and the bubble, in px (the 8px pointer sits in it). */
export const TOOLTIP_GAP = 10;
/** The bubble keeps at least this far from the viewport's edges, in px. */
export const TOOLTIP_EDGE = ANCHOR_EDGE;

interface TooltipPlacement {
  placement: 'top' | 'bottom';
  top: number;
  left: number;
  /** The pointer's x from the bubble's left edge: the trigger's centre, even when the bubble is clamped. */
  arrow: number;
}

/** Centred above the trigger, kept 8px inside the viewport; below it when above has no room. */
export function placeTooltip(trigger: TriggerBox, bubble: Size, viewport: Size): TooltipPlacement {
  const centre = trigger.left + trigger.width / 2;
  const left = clampToViewport(centre - bubble.width / 2, bubble.width, viewport.width);
  const above = trigger.top - TOOLTIP_GAP - bubble.height;
  const placement = above >= TOOLTIP_EDGE ? 'top' : 'bottom';
  return { placement, top: placement === 'top' ? above : trigger.bottom + TOOLTIP_GAP, left, arrow: centre - left };
}
