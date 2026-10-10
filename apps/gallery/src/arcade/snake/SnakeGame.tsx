import { useEffect, useReducer, useState } from 'react';
import { Badge } from '@bit-ds/react';
import { GameFrame, useTouchControls } from '../GameFrame';
import { readBest, saveBest } from '../bestScore';
import { newSeed } from '../random';
import { useBoardCanvas } from '../useBoardCanvas';
import { BOARD_INSET } from '../draw';
import { useFixedStep } from '../useFixedStep';
import { useMediaQuery } from '../../ui/useMediaQuery';
import { createSnake, rowsFor, snakeReducer, stepMs } from './engine';
import { paintSnake } from './draw';
import { snakeMessage } from './messages';

/** Snake, wired: the engine's state in a reducer, a step clock while running, the board painted on a canvas. */
export default function SnakeGame() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // Reduce motion starts in slow speed; the switch overrides it either way.
  const [slowChoice, setSlowChoice] = useState<boolean | null>(null);
  const slow = slowChoice ?? reducedMotion;
  const [state, dispatch] = useReducer(snakeReducer, undefined, () => createSnake({ seed: newSeed() }));
  const [best, setBest] = useState(() => readBest('snake'));
  const [bestBefore, setBestBefore] = useState(best);
  const touch = useTouchControls();

  useFixedStep(state.status === 'running', stepMs(state.score, slow), () => dispatch({ type: 'tick' }));
  useEffect(() => {
    if (state.status === 'over') setBest(saveBest('snake', state.score));
  }, [state.status, state.score]);

  const canvasRef = useBoardCanvas((ctx, size, palette) => paintSnake(ctx, size, palette, state, touch));
  const newBest = state.status === 'over' && state.score > bestBefore;

  return (
    <GameFrame
      title="Snake"
      hud={
        <>
          <Badge color="primary">{`Score ${state.score}`}</Badge>
          <Badge variant="outline" color="neutral">{`Best ${Math.max(best, state.score)}`}</Badge>
        </>
      }
      canvasRef={canvasRef}
      howToMove={touch ? 'Tap the arrows, or use the arrow keys or WASD, to turn.' : 'Arrow keys or WASD turn the snake.'}
      message={snakeMessage(state, newBest)}
      status={state.status}
      onDir={(dir) => dispatch({ type: 'turn', dir })}
      onTogglePause={() => dispatch({ type: 'togglePause' })}
      onRestart={() => {
        setBestBefore(best);
        dispatch({ type: 'restart', seed: newSeed() });
      }}
      onLeave={() => dispatch({ type: 'pause' })}
      slow={slow}
      onSlowChange={setSlowChoice}
      touch={touch}
      grid={{ cols: state.cols, rows: state.rows }}
      onBoardSize={({ width, height }) => dispatch({ type: 'resize', rows: rowsFor(width - 2 * BOARD_INSET, height - 2 * BOARD_INSET, state.cols) })}
    />
  );
}
