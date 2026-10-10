/** Space between the trigger and the list, in px. */
export const GAP = 6;
/** The list keeps at least this far from the viewport's edges, in px. */
export const EDGE = 8;
/** 8rem: below is enough room when this much fits, even if the whole list doesn't. */
export const MIN_ROOM = 128;

interface TriggerBox {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

interface Size {
  width: number;
  height: number;
}

interface ListboxPlacement {
  placement: 'top' | 'bottom';
  top: number;
  left: number;
  /** The height the list may use on its side, in px; it scrolls past this. */
  room: number;
}

/** At least the trigger's width, never wider than the viewport less 8px each side. */
export function listboxWidths(triggerWidth: number, viewportWidth: number): { minWidth: number; maxWidth: number } {
  const maxWidth = Math.max(viewportWidth - EDGE * 2, 0);
  return { minWidth: Math.min(triggerWidth, maxWidth), maxWidth };
}

/**
 * Where the list goes: 6px below the trigger, or above it when below can't fit the list (or 8rem,
 * whichever is smaller) and above has more room. Its left edge lines up with the trigger's, kept 8px
 * inside the viewport. `list` is its measured size, already at least as wide as the trigger.
 */
export function placeListbox(trigger: TriggerBox, list: Size, viewport: Size): ListboxPlacement {
  const { minWidth, maxWidth } = listboxWidths(trigger.width, viewport.width);
  const width = Math.min(Math.max(list.width, minWidth), maxWidth);
  const left = Math.max(EDGE, Math.min(trigger.left, viewport.width - width - EDGE));
  const below = viewport.height - trigger.bottom - GAP - EDGE;
  const above = trigger.top - GAP - EDGE;
  const placement = below < Math.min(list.height, MIN_ROOM) && above > below ? 'top' : 'bottom';
  const room = Math.max(placement === 'top' ? above : below, 0);
  const top = placement === 'top' ? trigger.top - GAP - Math.min(list.height, room) : trigger.bottom + GAP;
  return { placement, top, left, room };
}
