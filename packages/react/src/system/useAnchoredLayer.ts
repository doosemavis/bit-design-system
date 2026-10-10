import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Size and place `layer` by `trigger`, writing straight to its style. Returns its placement (written to
 * `data-placement`), or null, placing nothing, when the trigger has left the viewport.
 */
export type PlaceLayer = (trigger: HTMLElement, layer: HTMLElement) => string | null;

export interface AnchoredLayerOptions {
  /** Where the layer goes. Keep it stable (a module function), or the layer is shown again on every render. */
  place: PlaceLayer;
  /** Called when `place` returns null: the trigger scrolled out of view. Keep it stable too. */
  onLeave?: () => void;
  /** A string that changes when the layer's size does (Select's options): a change while open places it again. */
  contents?: string;
  /** A string whose change while open shows the layer afresh: hidden, placed and entered again (Tooltip's text). */
  restartKey?: string;
}

/**
 * While `open`, show a layer in the top layer (Popover API, where the browser has it; the `hidden` attribute
 * does the job elsewhere), place it by its trigger, then mark it `data-entered` so CSS can play its entrance
 * from the placed spot. It follows the trigger on any scroll (except the layer's own) or resize. Closing
 * hides it and clears `data-entered` and `data-placement`. Runs only on the client, so SSR never touches window.
 * Select's list, Tooltip's bubble and Menu all use it; each brings its own `place`.
 */
export function useAnchoredLayer(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
  { place, onLeave, contents = '', restartKey = '' }: AnchoredLayerOptions,
): void {
  useLayoutEffect(() => {
    if (!open) return undefined;
    // Both are rendered whenever the layer can open.
    const trigger = triggerRef.current!;
    const layer = layerRef.current!;
    const topLayer = typeof layer.showPopover === 'function';
    if (topLayer) {
      // Set here, not rendered: a browser (or jsdom) that hides [popover] but can't show it would
      // otherwise never show the layer. Closed, the hidden attribute hides it everywhere.
      layer.setAttribute('popover', 'manual');
      layer.showPopover();
    }
    const follow = () => {
      if (!placeAndMark(place, trigger, layer)) onLeave?.();
    };
    // The layer's own scrolling (wheel, scrollbar, a row scrolled into view) must not re-place it:
    // measuring can lift a height cap for a moment, and the browser would clamp its scrollTop.
    // A scroll dispatched on window (lazy-load libraries do this) has a target that isn't a Node.
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node) || !layer.contains(target)) follow();
    };
    follow();
    // Commit the placed, not-yet-entered style first: it is where the entrance starts.
    void layer.offsetHeight;
    layer.setAttribute('data-entered', '');
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', follow);
      layer.removeAttribute('data-entered');
      layer.removeAttribute('data-placement');
      if (topLayer) layer.hidePopover();
    };
  }, [open, triggerRef, layerRef, place, onLeave, restartKey]);

  // New contents change the layer's size: place it again (a layer above the trigger grows upward).
  // Only when `contents` really changed: not on opening (placed above) nor on an equal re-render.
  const placedContents = useRef(contents);
  useLayoutEffect(() => {
    const changed = placedContents.current !== contents;
    placedContents.current = contents;
    if (open && changed && !placeAndMark(place, triggerRef.current!, layerRef.current!)) onLeave?.();
  }, [contents, open, triggerRef, layerRef, place, onLeave]);
}

/** Place the layer and record its placement; false when the trigger is out of view. */
function placeAndMark(place: PlaceLayer, trigger: HTMLElement, layer: HTMLElement): boolean {
  const placement = place(trigger, layer);
  if (placement === null) return false;
  layer.setAttribute('data-placement', placement);
  return true;
}
