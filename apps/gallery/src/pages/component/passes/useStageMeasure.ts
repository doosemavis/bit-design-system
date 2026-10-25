import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Measures the stage after layout, and again when the stage or a rendered instance resizes, fonts finish loading, or
 * `version` changes: everything that moves a leader line or a dimension. The instance (each `[data-instance] > *`) is
 * watched too, because a stage with a min-height that stretches keeps its size when only the instance changes (a token
 * edit). The stage keeps one instance across a build, so a new `version` (a build step) re-measures and watches any
 * instance mounted since (Final's scene). Callbacks are batched into one animation frame. Without ResizeObserver
 * (jsdom), it returns `empty`.
 */
export function useStageMeasure<T>(stage: RefObject<HTMLElement | null>, measure: (stage: HTMLElement) => T, empty: T, version = 0): T {
  const [value, setValue] = useState<T>(empty);
  const rescan = useRef<(() => void) | null>(null);
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
    const watched = new Set<Element>();
    const watch = () => {
      for (const target of [element, ...element.querySelectorAll('[data-instance] > *')]) {
        if (watched.has(target)) continue;
        watched.add(target);
        observer.observe(target);
      }
    };
    watch();
    schedule();
    rescan.current = () => {
      watch();
      schedule();
    };
    if ('fonts' in document) {
      void document.fonts.ready.then(() => {
        if (live) schedule();
      });
    }
    return () => {
      live = false;
      rescan.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [stage]);

  useEffect(() => {
    rescan.current?.();
  }, [version]);

  return value;
}
