import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { element } from '../../system/toClasses';
import { fractionAt } from './sliderMath';

interface Drag {
  /** True while a pointer is down on the slider, until it lifts anywhere on the page. */
  dragging: boolean;
  /** While a smooth slider is dragged, how far along the track the pointer is (0 to 1); else null. */
  glide: number | null;
  /** Call on pointer down. Give clientX for the thumb to glide from there. */
  start: (clientX?: number) => void;
}

/**
 * A drag on the slider. A smooth slider (not notched, not blocks) also follows the pointer, so its thumb and fill
 * glide while the input moves a whole step at a time; when the pointer lifts, glide is null and the thumb settles
 * on the input's value.
 */
export function useDrag(rootRef: RefObject<HTMLDivElement | null>, smooth: boolean): Drag {
  const [dragging, setDragging] = useState(false);
  const [glide, setGlide] = useState<number | null>(null);

  const glideAt = useCallback(
    (clientX: number) => {
      const root = rootRef.current;
      const track = root?.querySelector(`.${element('slider', 'track')}`);
      const thumb = root?.querySelector(`.${element('slider', 'thumb')}`);
      if (!root || !track || !thumb) return null;
      const { left, right } = track.getBoundingClientRect();
      const rtl = getComputedStyle(root).direction === 'rtl';
      return fractionAt(clientX, { left, right, thumb: thumb.getBoundingClientRect().width, rtl });
    },
    [rootRef],
  );

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: PointerEvent) => {
      if (smooth) setGlide(glideAt(event.clientX));
    };
    const end = () => {
      setDragging(false);
      setGlide(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging, smooth, glideAt]);

  const start = (clientX?: number) => {
    setDragging(true);
    setGlide(smooth && clientX !== undefined ? glideAt(clientX) : null);
  };
  return { dragging, glide: smooth ? glide : null, start };
}
