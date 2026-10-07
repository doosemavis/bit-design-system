import { useLayoutEffect, useRef } from 'react';
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
  list.setAttribute('data-placement', placed.placement);
  return true;
}

/**
 * While `open`, show the list in the top layer (Popover API, where the browser has it; the `hidden`
 * attribute does the job elsewhere), place it, then mark it `data-entered` so it slides in from the
 * side it opened on. It follows the trigger on any scroll (except the list's own) or resize, and
 * again whenever `contents` changes; `onLeave` runs when the trigger is out of view. Runs only on
 * the client, so SSR never touches window.
 */
export function useListboxLayer(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
  onLeave: () => void,
  /** A string that changes when the options do (values, disabled flags, count). */
  contents: string,
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
    // The list's own scrolling (wheel, scrollbar, a row scrolled into view) must not re-place it:
    // measuring lifts the room cap for a moment, and the browser would clamp its scrollTop.
    // A scroll dispatched on window (lazy-load libraries do this) has a target that isn't a Node.
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node) || !list.contains(target)) follow();
    };
    follow();
    // Commit the placed, not-yet-entered style first: it is where the slide starts.
    void list.offsetHeight;
    list.setAttribute('data-entered', '');
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', follow);
      list.removeAttribute('data-entered');
      list.removeAttribute('data-placement');
      if (topLayer) list.hidePopover();
    };
  }, [open, triggerRef, listRef, onLeave]);

  // New options change the list's size: place it again (a list above the trigger grows upward).
  // Only when `contents` really changed: not on opening (placed above) nor on an equal re-render.
  const placedContents = useRef(contents);
  useLayoutEffect(() => {
    const changed = placedContents.current !== contents;
    placedContents.current = contents;
    if (open && changed && !place(triggerRef.current!, listRef.current!)) onLeave();
  }, [contents, open, triggerRef, listRef, onLeave]);
}
