/** Space between the trigger and the bubble, in px (the 8px pointer sits in it). */
export const TOOLTIP_GAP = 10;
/** The bubble keeps at least this far from the viewport's edges, in px. */
export const TOOLTIP_EDGE = 8;

interface TriggerBox { top: number; bottom: number; left: number; width: number }
interface Size { width: number; height: number }

export interface TooltipPlacement {
  placement: 'top' | 'bottom';
  top: number;
  left: number;
  /** The pointer's x from the bubble's left edge: the trigger's centre, even when the bubble is clamped. */
  arrow: number;
}

/** Centred above the trigger, kept 8px inside the viewport; below it when above has no room. */
export function placeTooltip(trigger: TriggerBox, bubble: Size, viewport: Size): TooltipPlacement {
  const centre = trigger.left + trigger.width / 2;
  const maxLeft = Math.max(TOOLTIP_EDGE, viewport.width - TOOLTIP_EDGE - bubble.width);
  const left = Math.min(Math.max(centre - bubble.width / 2, TOOLTIP_EDGE), maxLeft);
  const above = trigger.top - TOOLTIP_GAP - bubble.height;
  const placement = above >= TOOLTIP_EDGE ? 'top' : 'bottom';
  return { placement, top: placement === 'top' ? above : trigger.bottom + TOOLTIP_GAP, left, arrow: centre - left };
}
