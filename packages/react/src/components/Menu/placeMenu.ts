import { isRtl, placeDropdown } from '../../system/anchor';

/** Space between the trigger and the menu, in px, as Select's list. */
const GAP = 6;
/** 8rem: below is enough room when this much fits, even if the whole menu doesn't. */
const MIN_ROOM = 128;
/** The height the menu may use, set inline for menu.css's max-height. Private to bit. */
const ROOM = '--_bit-menu-room';

/**
 * Place the menu 6px below its trigger (above when below has too little room), lined up with the trigger's
 * start edge, or its end edge with `data-align="end"`. Start is the left in left-to-right pages and the right
 * in right-to-left ones. Returns the placement, or null when the trigger has left the viewport.
 */
export function placeMenu(trigger: HTMLElement, menu: HTMLElement): string | null {
  const box = trigger.getBoundingClientRect();
  if (box.bottom < 0 || box.top > window.innerHeight) return null;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  // Lifting the room cap to measure can clamp the menu's scroll position; put it back after.
  const scrollTop = menu.scrollTop;
  menu.style.top = '0px';
  menu.style.left = '0px';
  menu.style.removeProperty(ROOM);
  const end = menu.getAttribute('data-align') === 'end';
  const placed = placeDropdown(box, menu.getBoundingClientRect(), viewport, {
    gap: GAP,
    minRoom: MIN_ROOM,
    align: end === isRtl(trigger) ? 'left' : 'right',
  });
  menu.style.top = `${placed.top}px`;
  menu.style.left = `${placed.left}px`;
  menu.style.setProperty(ROOM, `${placed.room}px`);
  menu.scrollTop = scrollTop;
  return placed.placement;
}
