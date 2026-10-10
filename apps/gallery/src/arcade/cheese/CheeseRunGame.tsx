import { useEffect, useReducer, useState } from 'react';
import { Badge } from '@bit-ds/react';
import { GameFrame, useTouchControls } from '../GameFrame';
import { readBest, saveBest } from '../bestScore';
import { newSeed } from '../random';
import { useBoardCanvas } from '../useBoardCanvas';
import { useFixedStep } from '../useFixedStep';
import { useMediaQuery } from '../../ui/useMediaQuery';
import { cheeseReducer, createCheeseRun } from './engine';
import { paintCheese } from './draw';
import { cheeseMessage } from './messages';

/** The clock ticks the engine every 100ms of play: smooth enough for the timer and the cat, cheap to render. */
const TICK_MS = 100;
/** Under this many seconds the time badge turns red (the number says it too). */
const HURRY_SECONDS = 10;

/** Cheese Run, wired: the engine's state in a reducer, a 100ms clock while running, the maze painted on a canvas. */
export default function CheeseRunGame() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [state, dispatch] = useReducer(cheeseReducer, reducedMotion, (slow) => createCheeseRun({ seed: newSeed(), slow }));
  const [best, setBest] = useState(() => readBest('cheese-run'));
  const [bestBefore, setBestBefore] = useState(best);
  const touch = useTouchControls();

  useFixedStep(state.status === 'running', TICK_MS, () => dispatch({ type: 'advance', ms: TICK_MS }));
  useEffect(() => {
    if (state.status === 'over') setBest(saveBest('cheese-run', state.score));
  }, [state.status, state.score]);

  const canvasRef = useBoardCanvas((ctx, size, palette) => paintCheese(ctx, size, palette, state, touch));
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const newBest = state.status === 'over' && state.score > bestBefore;

  return (
    <GameFrame
      title="Cheese Run"
      hud={
        <>
          <Badge color="primary">{`Level ${state.level}`}</Badge>
          <Badge variant="outline" color="neutral">{`Lives ${state.lives}`}</Badge>
          <Badge variant="outline" color={seconds <= HURRY_SECONDS ? 'danger' : 'neutral'}>{`Time ${seconds}`}</Badge>
          <Badge variant="outline" color="neutral">{`Score ${state.score}`}</Badge>
          <Badge variant="outline" color="neutral">{`Best ${Math.max(best, state.score)}`}</Badge>
        </>
      }
      canvasRef={canvasRef}
      howToMove={
        touch
          ? 'Tap the arrows, or use the arrow keys or WASD, to move the rat a cell at a time to the cheese.'
          : 'Arrow keys or WASD move the rat a cell at a time to the cheese.'
      }
      message={cheeseMessage(state, newBest)}
      status={state.status}
      onDir={(dir) => dispatch({ type: 'move', dir })}
      onTogglePause={() => dispatch({ type: 'togglePause' })}
      onRestart={() => {
        setBestBefore(best);
        dispatch({ type: 'restart', seed: newSeed() });
      }}
      onLeave={() => dispatch({ type: 'pause' })}
      slow={state.slow}
      onSlowChange={(slow) => dispatch({ type: 'slow', slow })}
      touch={touch}
    />
  );
}
