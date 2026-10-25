import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PASSES, type Pass } from '../../../engine/pageParams';
import type { ManifestAnatomy } from '../../../manifests/types';
import { endOf, stepsOf, type BuildState } from './build';
import { durationMs, HOLD_STEPS, prefersReducedMotion } from './motion';

export interface BuildApi {
  state: BuildState;
  /** Changes on every state change, so measuring re-runs. */
  version: number;
  /** Call right before setPass from the pass control or Next: the coming pass plays its steps if it's later. */
  markForward: () => void;
  /** Plays all four passes locally from Wireframe, then calls onDone (PassesSection pushes ?pass=final). */
  play: (onDone: () => void) => void;
  stop: () => void;
  /** Cancels any run and shows a pass's end at once, as an arrival does (PassesSection: the URL already names it). */
  jumpTo: (pass: Pass) => void;
  playing: boolean;
  /** States: apply a chip (a state label, or 'Try it'). */
  pickChip: (label: string) => void;
}

/** A pass's end as an arrival shows it: nothing fresh, so nothing replays (only played steps carry `fresh`). */
const arrival = (anatomy: ManifestAnatomy, pass: Pass): BuildState => ({ ...endOf(anatomy, pass), fresh: null });

export function useBuild(anatomy: ManifestAnatomy, pass: Pass, hold?: number): BuildApi {
  const [shown, setShown] = useState(() => ({ state: arrival(anatomy, pass), version: 0 }));
  const [playing, setPlaying] = useState(false);
  const current = useRef(shown.state);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forward = useRef(false);
  const previous = useRef(pass);
  const playedToFinal = useRef(false);
  const latest = useRef({ anatomy, hold });
  latest.current = { anatomy, hold };

  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback((state: BuildState) => {
    current.current = state;
    setShown((prev) => ({ state, version: prev.version + 1 }));
  }, []);

  const holdMs = () => latest.current.hold ?? HOLD_STEPS * durationMs(document.documentElement);

  /** Shows each state in turn, holding each for one hold, then calls `done` after the last. */
  const run = useCallback(
    (states: BuildState[], done?: () => void) => {
      const at = (i: number) => {
        show(states[i] as BuildState);
        if (i < states.length - 1) {
          timer.current = setTimeout(() => at(i + 1), holdMs());
        } else {
          timer.current = null;
          done?.();
        }
      };
      at(0);
    },
    [show],
  );

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pass;
    const marked = forward.current;
    forward.current = false;
    const arrived = playedToFinal.current;
    playedToFinal.current = false;
    if (from === pass) return;
    // Play already ended at Final; the parent is catching up to it.
    if (!marked && arrived && pass === 'final') return;
    clear();
    setPlaying(false);
    const later = PASSES.indexOf(pass) > PASSES.indexOf(from);
    if (marked && later && !prefersReducedMotion()) run(stepsOf(latest.current.anatomy, pass));
    else show(arrival(latest.current.anatomy, pass));
  }, [pass, clear, run, show]);

  useEffect(() => clear, [clear]);

  const markForward = useCallback(() => {
    forward.current = true;
  }, []);

  const stop = useCallback(() => {
    clear();
    setPlaying(false);
  }, [clear]);

  const jumpTo = useCallback(
    (target: Pass) => {
      clear();
      setPlaying(false);
      show(arrival(latest.current.anatomy, target));
    },
    [clear, show],
  );

  const play = useCallback(
    (onDone: () => void) => {
      clear();
      const reduced = prefersReducedMotion();
      const states = PASSES.flatMap((p) => (reduced ? [arrival(latest.current.anatomy, p)] : stepsOf(latest.current.anatomy, p)));
      setPlaying(true);
      playedToFinal.current = false;
      run(states, () => {
        playedToFinal.current = true;
        setPlaying(false);
        onDone();
      });
    },
    [clear, run],
  );

  const pickChip = useCallback(
    (label: string) => {
      clear();
      setPlaying(false);
      show({ ...current.current, chip: label, live: label === 'Try it' });
    },
    [clear, show],
  );

  return { state: shown.state, version: shown.version, markForward, play, stop, jumpTo, playing, pickChip };
}
