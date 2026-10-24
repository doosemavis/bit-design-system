import { useEffect, useEffectEvent, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Measures the stage after layout, and again when it resizes or fonts finish loading: everything that moves a
 * leader line or a dimension. Callbacks are batched into one animation frame. Each pass view mounts fresh, so a new
 * pass always measures, with no dependency list to forget. Without ResizeObserver (jsdom), it returns `empty`.
 */
export function useStageMeasure<T>(stage: RefObject<HTMLElement | null>, measure: (stage: HTMLElement) => T, empty: T): T {
  const [value, setValue] = useState<T>(empty);
  const run = useEffectEvent(() => {
    if (stage.current) setValue(measure(stage.current));
  });

  useEffect(() => {
    const element = stage.current;
    if (!element || typeof ResizeObserver !== 'function') return;
    let live = true;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (live) run();
      });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    schedule();
    if ('fonts' in document) {
      void document.fonts.ready.then(() => {
        if (live) schedule();
      });
    }
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [stage]);

  return value;
}
