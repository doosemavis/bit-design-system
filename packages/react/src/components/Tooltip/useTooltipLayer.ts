import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { placeTooltip } from './position';

/** The pointer's x from the bubble's left edge, set inline for tooltip.css. Private to bit. */
const ARROW = '--_bit-tooltip-arrow';

/** Measure the bubble at the viewport's corner, place it by the trigger, and write the result to its style. */
function place(trigger: HTMLElement, bubble: HTMLElement): void {
  const box = trigger.getBoundingClientRect();
  bubble.style.top = '0px';
  bubble.style.left = '0px';
  const size = bubble.getBoundingClientRect();
  const placed = placeTooltip(box, size, { width: window.innerWidth, height: window.innerHeight });
  bubble.style.top = `${placed.top}px`;
  bubble.style.left = `${placed.left}px`;
  bubble.style.setProperty(ARROW, `${placed.arrow}px`);
  bubble.setAttribute('data-placement', placed.placement);
}

/**
 * While `open`, show the bubble in the top layer (Popover API, where the browser has it; the `hidden`
 * attribute does the job elsewhere), place it by the trigger, then mark it `data-entered` so it fades in.
 * It follows the trigger on any scroll or resize, and again whenever `contentKey` changes (new text
 * changes its size). Runs only on the client, so SSR never touches window.
 */
export function useTooltipLayer(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  bubbleRef: RefObject<HTMLElement | null>,
  /** The bubble's text when it is a string or number, else ''; a change places it again. */
  contentKey: string,
): void {
  useLayoutEffect(() => {
    if (!open) return undefined;
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return undefined;
    const topLayer = typeof bubble.showPopover === 'function';
    if (topLayer) {
      // Set here, not rendered: a browser (or jsdom) that hides [popover] but can't show it would
      // otherwise never show the bubble. Closed, the hidden attribute hides it everywhere.
      bubble.setAttribute('popover', 'manual');
      bubble.showPopover();
    }
    const follow = () => place(trigger, bubble);
    follow();
    // Commit the placed, not-yet-entered style first: it is where the fade starts.
    void bubble.offsetHeight;
    bubble.setAttribute('data-entered', '');
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
      bubble.removeAttribute('data-entered');
      bubble.removeAttribute('data-placement');
      if (topLayer) bubble.hidePopover();
    };
  }, [open, triggerRef, bubbleRef, contentKey]);
}
