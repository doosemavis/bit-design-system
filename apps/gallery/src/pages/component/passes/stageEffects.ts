import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { AnatomyPart } from '../../../manifests/types';
import { drawIn, durationMs, fadeIn, fadeOut, slide } from './motion';
import { applyOverrides } from './overrides';

const HOLD_STEPS = 6;
const DRAW_STEPS = 3;
const stepMs = (steps: number) => steps * durationMs(document.documentElement);
/** The stage's own instance: the first `[data-instance]` (the loupe's copy comes after it). */
const instanceIn = (stage: RefObject<HTMLElement | null>) => stage.current?.querySelector<HTMLElement>('[data-instance]') ?? null;

/** The fresh step, lit for one step-hold after its version lands, then null. The timer clears on the next change and on unmount. */
export function useFreshBeat(fresh: string | null, version: number): string | null {
  const [expired, setExpired] = useState(-1);
  useEffect(() => {
    if (fresh === null) return undefined;
    const timer = setTimeout(() => setExpired(version), stepMs(HOLD_STEPS));
    return () => clearTimeout(timer);
  }, [fresh, version]);
  return fresh !== null && expired !== version ? fresh : null;
}

/**
 * Keeps an element mounted while it fades out after `show` turns false, then lets it go. Under reduced motion (or
 * without animate()) it goes at once, before paint. Showing it again mid-fade cancels the fade.
 */
export function useFadeOut<T extends Element>(show: boolean): { mounted: boolean; ref: RefObject<T | null> } {
  const ref = useRef<T | null>(null);
  const [fading, setFading] = useState(false);
  const [was, setWas] = useState(show);
  if (was !== show) {
    setWas(show);
    setFading(!show);
  }
  useLayoutEffect(() => {
    if (!fading) return undefined;
    const animation = ref.current ? fadeOut(ref.current, stepMs(DRAW_STEPS)) : null;
    if (!animation) {
      setFading(false);
      return undefined;
    }
    animation.finished.then(() => setFading(false), () => {});
    return () => animation.cancel();
  }, [fading]);
  return { mounted: show || fading, ref };
}

/** Turns off the parts not landed yet, on the stage's instance; undoes on change and unmount. */
export function useOverrides(stage: RefObject<HTMLElement | null>, parts: readonly AnatomyPart[], landed: readonly string[], scene: boolean): void {
  useLayoutEffect(() => {
    const wrapper = instanceIn(stage);
    return wrapper ? applyOverrides(wrapper, parts, landed) : undefined;
  }, [stage, parts, landed, scene]);
}

/** Draws the fresh step's lines in, once its own measure is in (`ready`). Each draw ends with no dash left on the path. */
export function useDrawIn(ink: RefObject<SVGSVGElement | null>, labels: readonly string[], ready: boolean, version: number): void {
  const key = labels.join('\n');
  useLayoutEffect(() => {
    if (!ready || key === '' || !ink.current) return undefined;
    const wanted = new Set(key.split('\n'));
    const paths = [...ink.current.querySelectorAll<SVGPathElement>('path[data-role="line"]')].filter((p) => wanted.has(p.dataset.part ?? ''));
    const runs = paths.flatMap((path) => {
      const animation = drawIn(path, stepMs(DRAW_STEPS));
      return animation ? [{ path, animation }] : [];
    });
    const settle = ({ path, animation }: (typeof runs)[number]) => {
      animation.cancel();
      path.style.removeProperty('stroke-dasharray');
    };
    runs.forEach((run) => run.animation.finished.then(() => settle(run), () => {}));
    return () => runs.forEach(settle);
  }, [ink, key, ready, version]);
}

/**
 * Final: slides the instance from where it last was into the scene's slot (FLIP), and fades the scene's other pieces in.
 * Re-reads the instance's box on each new measure, so the slide starts from its latest place.
 */
export function useSlideIntoScene(stage: RefObject<HTMLElement | null>, scene: boolean, measured: unknown): void {
  const last = useRef<DOMRect | null>(null);
  const wasScene = useRef(scene);
  useLayoutEffect(() => {
    const el = instanceIn(stage);
    if (!el) return;
    const now = el.getBoundingClientRect();
    if (scene && !wasScene.current && last.current) {
      slide(el, last.current, now, stepMs(DRAW_STEPS));
      stage.current?.querySelectorAll('[data-scene-piece]').forEach((piece) => fadeIn(piece, stepMs(DRAW_STEPS)));
    }
    wasScene.current = scene;
    last.current = now;
  }, [stage, scene, measured]);
}
