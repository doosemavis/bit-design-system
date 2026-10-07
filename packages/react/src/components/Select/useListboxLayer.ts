import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { listboxWidths, placeListbox } from './position';

/** The height the list may use, set inline for select.css's max-height. Private to bit. */
const ROOM = '--_bit-select-room';

/**
 * Size and place the list beside the trigger, writing straight to its style and `data-placement`.
 * Returns false, placing nothing, when the trigger has left the viewport.
 */
function place(trigger: HTMLElement, list: HTMLElement): boolean {
  const box = trigger.getBoundingClientRect();
  if (box.bottom < 0 || box.top > window.innerHeight) return false;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const { minWidth, maxWidth } = listboxWidths(box.width, viewport.width);
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
  list.setAttribute('data-placement', placed.placement);
  return true;
}

/**
 * While `open`, show the list in the top layer (Popover API, where the browser has it; the `hidden`
 * attribute does the job elsewhere), place it, then mark it `data-entered` so it slides in from the
 * side it opened on. It follows the trigger on any scroll or resize, and `onLeave` runs when the
 * trigger scrolls out of view. Runs only on the client, so SSR never touches window.
 */
export function useListboxLayer(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
  onLeave: () => void,
): void {
  useLayoutEffect(() => {
    if (!open) return undefined;
    const trigger = triggerRef.current!;
    const list = listRef.current!;
    const topLayer = typeof list.showPopover === 'function';
    if (topLayer) {
      // Set here, not rendered: a browser (or jsdom) that hides [popover] but can't show it would
      // otherwise never show the list. Closed, the hidden attribute hides it everywhere.
      list.setAttribute('popover', 'manual');
      list.showPopover();
    }
    const follow = () => {
      if (!place(trigger, list)) onLeave();
    };
    follow();
    // Commit the placed, not-yet-entered style first: it is where the slide starts.
    void list.offsetHeight;
    list.setAttribute('data-entered', '');
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
      list.removeAttribute('data-entered');
      list.removeAttribute('data-placement');
      if (topLayer) list.hidePopover();
    };
  }, [open, triggerRef, listRef, onLeave]);
}
