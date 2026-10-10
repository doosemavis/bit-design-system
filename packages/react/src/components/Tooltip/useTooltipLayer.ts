import type { RefObject } from 'react';
import { useAnchoredLayer } from '../../system/useAnchoredLayer';
import { placeTooltip } from './position';

/** The pointer's x from the bubble's left edge, set inline for tooltip.css. Private to bit. */
const ARROW = '--_bit-tooltip-arrow';

/** Measure the bubble at the viewport's corner, place it by the trigger, and write the result to its style. */
function place(trigger: HTMLElement, bubble: HTMLElement): string {
  const box = trigger.getBoundingClientRect();
  bubble.style.top = '0px';
  bubble.style.left = '0px';
  const size = bubble.getBoundingClientRect();
  const placed = placeTooltip(box, size, { width: window.innerWidth, height: window.innerHeight });
  bubble.style.top = `${placed.top}px`;
  bubble.style.left = `${placed.left}px`;
  bubble.style.setProperty(ARROW, `${placed.arrow}px`);
  return placed.placement;
}

/**
 * While `open`, show the bubble in the top layer by the trigger (the shared anchored layer), then mark it
 * `data-entered` so it fades in. It follows the trigger on any scroll or resize, and shows afresh whenever
 * `contentKey` changes (new text changes its size).
 */
export function useTooltipLayer(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  bubbleRef: RefObject<HTMLElement | null>,
  /** The bubble's text when it is a string or number, else ''; a change places it again. */
  contentKey: string,
): void {
  useAnchoredLayer(open, triggerRef, bubbleRef, { place, restartKey: contentKey });
}
