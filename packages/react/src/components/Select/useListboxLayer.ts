import type { RefObject } from 'react';
import { useAnchoredLayer } from '../../system/useAnchoredLayer';
import { listboxWidths, placeListbox } from './position';

/** The height the list may use, set inline for select.css's max-height. Private to bit. */
const ROOM = '--_bit-select-room';

/**
 * Size and place the list beside the trigger, writing straight to its style. Returns its placement, or
 * null, placing nothing, when the trigger has left the viewport.
 */
function place(trigger: HTMLElement, list: HTMLElement): string | null {
  const box = trigger.getBoundingClientRect();
  if (box.bottom < 0 || box.top > window.innerHeight) return null;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const { minWidth, maxWidth } = listboxWidths(box.width, viewport.width);
  // Lifting the room cap to measure can clamp the list's scroll position; put it back after.
  const scrollTop = list.scrollTop;
  // Measure at the viewport's corner with no room cap, so the list takes its natural size.
  list.style.minWidth = `${minWidth}px`;
  list.style.maxWidth = `${maxWidth}px`;
  list.style.top = '0px';
  list.style.left = '0px';
  list.style.removeProperty(ROOM);
  const placed = placeListbox(box, list.getBoundingClientRect(), viewport);
  list.style.top = `${placed.top}px`;
  list.style.left = `${placed.left}px`;
  list.style.setProperty(ROOM, `${placed.room}px`);
  list.scrollTop = scrollTop;
  return placed.placement;
}

/**
 * While `open`, show the list in the top layer beside the trigger (the shared anchored layer), then mark it
 * `data-entered` so it slides in from the side it opened on. It follows the trigger on any scroll (except the
 * list's own) or resize, and again whenever `contents` changes; `onLeave` runs when the trigger is out of view.
 */
export function useListboxLayer(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
  onLeave: () => void,
  /** A string that changes when the options do (values, disabled flags, count). */
  contents: string,
): void {
  useAnchoredLayer(open, triggerRef, listRef, { place, onLeave, contents });
}
