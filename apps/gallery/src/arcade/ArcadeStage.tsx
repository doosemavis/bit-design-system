import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType, LazyExoticComponent, RefObject } from 'react';
import { Spinner } from '@bit-ds/react';
import { GameLoadBoundary } from './ArcadePanel';
import { gameLabel, isStageGame } from './games';
import type { StageGameId } from './games';
import { readPalette } from './palette';
import { newSeed } from './random';
import { cellLook, SWIPE_CELL, swipeMoments, swipeProgress } from './swipe';
import type { SwipeWay } from './swipe';
import { useMediaQuery } from '../ui/useMediaQuery';

/** The stage game's region: the skip link's target while one is up. */
export const STAGE_ID = 'gallery-stage';

/**
 * A stage game lives in the history entry it was opened on (its state, not its URL: a page's own query, such as the
 * playground's, stays the page's). So Back closes it, Forward opens it again, and any page link leaves it.
 */
export const stageState = (game: StageGameId) => ({ arcade: game });
export function stageGameOf(state: unknown): StageGameId | null {
  const arcade = typeof state === 'object' && state !== null ? (state as { arcade?: unknown }).arcade : undefined;
  return isStageGame(arcade) ? arcade : null;
}

type GameComponent = ComponentType<{ onBack: () => void }>;
const LOADERS: Readonly<Record<StageGameId, () => Promise<{ default: GameComponent }>>> = {
  'bit-blaster': () => import('./blaster/BitBlasterGame'),
};
/** Each game is its own chunk; the swipe starts loading it, so it's usually there by the time the area is black. */
const GAME_COMPONENTS = Object.fromEntries(
  Object.entries(LOADERS).map(([id, load]) => [id, lazy(load)]),
) as Readonly<Record<StageGameId, LazyExoticComponent<GameComponent>>>;

/** hidden: no stage. in: swiping to black. shown: the game. out: swiping back to the page. */
type Phase = 'hidden' | 'in' | 'shown' | 'out';

/**
 * Paints the swipe on `canvas` while `way` is set, then calls `onDone`. Laid out before the browser paints, so
 * closing covers the area in the same frame the game goes. Where there's no canvas to draw on, it's done at once.
 */
function useSwipe(canvas: RefObject<HTMLCanvasElement | null>, way: SwipeWay | null, onDone: () => void): void {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useLayoutEffect(() => {
    if (!way) return;
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx || typeof requestAnimationFrame !== 'function') {
      done.current();
      return;
    }
    const box = element.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    element.width = Math.max(1, Math.round(box.width * ratio));
    element.height = Math.max(1, Math.round(box.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Read where the canvas sits: inside the stage's .bit-dark, so space is the CodeBlock black and the edge lilac.
    const palette = readPalette(element);
    const cols = Math.ceil(box.width / SWIPE_CELL);
    const rows = Math.ceil(box.height / SWIPE_CELL);
    const moments = swipeMoments(cols, rows, way, newSeed());
    const paint = (progress: number) => {
      ctx.clearRect(0, 0, box.width, box.height);
      moments.forEach((moment, i) => {
        const look = cellLook(progress, moment, way);
        if (look === 'clear') return;
        ctx.fillStyle = look === 'edge' ? palette.alienMid : palette.space;
        ctx.fillRect((i % cols) * SWIPE_CELL, Math.floor(i / cols) * SWIPE_CELL, SWIPE_CELL, SWIPE_CELL);
      });
    };
    paint(0);
    let start: number | null = null;
    let id = 0;
    const frame = (now: number) => {
      start ??= now;
      const progress = swipeProgress(now - start);
      paint(progress);
      if (progress < 1) id = requestAnimationFrame(frame);
      else done.current();
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [canvas, way]);
}

/**
 * While the stage is up the page under it stays where it was: a wheel over the sidebar's end, a key, a touch that
 * would scroll it is put straight back. The page is hidden under the stage, so nothing visible moves; and nothing
 * about the page's own overflow changes, so no scrollbar comes or goes and the header never shifts.
 */
function useHoldScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const top = window.scrollY;
    const hold = () => {
      if (window.scrollY !== top) window.scrollTo({ top, behavior: 'instant' });
    };
    window.addEventListener('scroll', hold);
    return () => window.removeEventListener('scroll', hold);
  }, [active]);
}

interface ArcadeStageProps {
  /** The stage game to show, or null for none. */
  game: StageGameId | null;
  onBack: () => void;
}

/**
 * The main area as an arcade cabinet: while a stage game is open the area under the header and beside the sidebar
 * goes black (a pixel swipe, left to right) with the game in the middle; closing swipes back, right to left, to the
 * page as it was. Reduce motion skips the swipe. The header and the sidebar are never touched.
 */
export function ArcadeStage({ game, onBack }: ArcadeStageProps) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [phase, setPhase] = useState<Phase>('hidden');
  const [current, setCurrent] = useState<StageGameId | null>(game);
  // Derived during render: a game arriving swipes in, the game leaving swipes out.
  if (game !== null && game !== current) setCurrent(game);
  if (game !== null && (phase === 'hidden' || phase === 'out')) setPhase(reduce ? 'shown' : 'in');
  if (game === null && (phase === 'shown' || phase === 'in')) setPhase(reduce ? 'hidden' : 'out');
  const canvas = useRef<HTMLCanvasElement>(null);
  const way: SwipeWay | null = phase === 'in' ? 'in' : phase === 'out' ? 'out' : null;
  useSwipe(canvas, way, () => setPhase((now) => (now === 'in' ? 'shown' : now === 'out' ? 'hidden' : now)));
  useEffect(() => {
    if (phase === 'in' && current) void LOADERS[current]().catch(() => {});
  }, [phase, current]);
  useHoldScroll(phase !== 'hidden');

  if (phase === 'hidden' || current === null) return null;
  const Game = GAME_COMPONENTS[current];
  const label = gameLabel(current);
  return (
    <div className="gallery-stage bit-dark" data-phase={phase}>
      {phase === 'shown' ? (
        <section id={STAGE_ID} className="gallery-stage__game" aria-label={`Arcade: ${label}`} tabIndex={-1}>
          <GameLoadBoundary key={current}>
            <Suspense fallback={<Spinner aria-label={`Loading ${label}`} />}>
              <Game onBack={onBack} />
            </Suspense>
          </GameLoadBoundary>
        </section>
      ) : (
        <canvas ref={canvas} className="gallery-stage__swipe" aria-hidden="true" />
      )}
    </div>
  );
}
