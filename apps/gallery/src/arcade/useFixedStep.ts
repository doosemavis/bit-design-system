import { useEffect, useRef } from 'react';

/** A frame longer than this (a background tab, a debugger pause) counts as this long. */
const MAX_FRAME_MS = 250;

/**
 * Calls `onStep` once every `stepMs` of animation-frame time while `active`, at most once per frame, so a slow
 * frame never jumps the game ahead. Nothing is scheduled while inactive, and unmounting (Back) cancels the frame.
 */
export function useFixedStep(active: boolean, stepMs: number, onStep: () => void): void {
  const latest = useRef({ stepMs, onStep });
  useEffect(() => {
    latest.current = { stepMs, onStep };
  });
  useEffect(() => {
    if (!active) return;
    let last: number | null = null;
    let elapsed = 0;
    let id = 0;
    const frame = (now: number) => {
      if (last !== null) elapsed += Math.min(now - last, MAX_FRAME_MS);
      last = now;
      const step = latest.current.stepMs;
      if (elapsed >= step) {
        elapsed = Math.min(elapsed - step, step);
        latest.current.onStep();
      }
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [active]);
}
