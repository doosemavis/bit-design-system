import { useEffect, useId, useReducer, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { Badge, Button, Icon, iconArrowBack, iconChevronLeft, iconChevronRight, IconButton, Stack, Switch, Text } from '@bit-ds/react';
import { useBoardSize, useHiddenPause, useTouchControls } from '../GameFrame';
import { readBest, saveBest } from '../bestScore';
import { newSeed } from '../random';
import { useBoardCanvas } from '../useBoardCanvas';
import { useFixedStep } from '../useFixedStep';
import { useMediaQuery } from '../../ui/useMediaQuery';
import { blasterReducer, createBlaster, FIELD_W, rowsFor, scaleFor, tickMs } from './engine';
import type { Side } from './engine';
import { paintBlaster } from './draw';
import { blasterMessage } from './messages';

const sideOf = (key: string): Side | null => {
  if (key === 'ArrowLeft' || key === 'a') return 'left';
  if (key === 'ArrowRight' || key === 'd') return 'right';
  return null;
};

interface PadProps {
  onHold: (side: Side, down: boolean) => void;
  onNudge: (side: Side) => void;
  onFire: () => void;
}

/**
 * The on-screen controls: hold an arrow to move, tap Fire. A press acts on pointer down and keeps focus on the board
 * (so it doesn't count as leaving the game); the arrow keeps its pointer until it's let go, wherever the finger
 * slides. From the keyboard (a click with no pointer), an arrow is one step and Fire fires.
 */
function Pad({ onHold, onNudge, onFire }: PadProps) {
  const arrow = (side: Side) => (
    <IconButton
      icon={side === 'left' ? iconChevronLeft : iconChevronRight}
      label={side === 'left' ? 'Left' : 'Right'}
      size="lg"
      color="neutral"
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        onHold(side, true);
      }}
      onPointerUp={() => onHold(side, false)}
      onPointerCancel={() => onHold(side, false)}
      onLostPointerCapture={() => onHold(side, false)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (event.detail === 0) onNudge(side);
      }}
    />
  );
  return (
    <div className="gallery-blaster__pad" role="group" aria-label="Controls">
      {arrow('left')}
      <Button
        size="lg"
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          event.preventDefault();
          onFire();
        }}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          if (event.detail === 0) onFire();
        }}
      >
        Fire
      </Button>
      {arrow('right')}
    </div>
  );
}

/**
 * Bit Blaster, wired: the engine's state in a reducer, a 60-a-second clock while running, the field painted on a
 * canvas sized to the main area. The keys are the board's while it has focus: the arrows or A and D move (held),
 * Space starts and fires (and starts again after a game over, as Enter does), P pauses, and Esc pauses a running
 * game; Esc on a game that isn't running goes back to the page.
 */
export default function BitBlasterGame({ onBack }: { onBack: () => void }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // Reduce motion starts in slow speed; the switch overrides it either way.
  const [slowChoice, setSlowChoice] = useState<boolean | null>(null);
  const slow = slowChoice ?? reducedMotion;
  const [state, dispatch] = useReducer(blasterReducer, undefined, () => createBlaster({ seed: newSeed() }));
  const [best, setBest] = useState(() => readBest('bit-blaster'));
  const [bestBefore, setBestBefore] = useState(best);
  const touch = useTouchControls();
  const helpId = useId();
  const board = useRef<HTMLDivElement>(null);
  const [field, setField] = useState<HTMLDivElement | null>(null);
  const [space, setSpace] = useState({ width: 0, height: 0 });

  useFixedStep(state.status === 'running', tickMs(slow), () => dispatch({ type: 'tick' }));
  useHiddenPause(() => dispatch({ type: 'pause' }));
  useBoardSize(field, (size) => {
    setSpace(size);
    dispatch({ type: 'resize', rows: rowsFor(size.width, size.height) });
  });
  useEffect(() => {
    if (state.status === 'over') setBest(saveBest('bit-blaster', state.score));
  }, [state.status, state.score]);
  useEffect(() => {
    board.current?.focus();
  }, []);

  const canvasRef = useBoardCanvas((ctx, size, palette) => paintBlaster(ctx, size, palette, state, touch));
  const scale = scaleFor(space.width, space.height, state.rows);
  const over = state.status === 'over';
  const canPause = state.status === 'running' || state.status === 'paused';
  const restart = () => {
    setBestBefore(best);
    dispatch({ type: 'restart', seed: newSeed() });
  };
  // After a button, the keys belong to the board again.
  const thenBoard = (action: () => void) => () => {
    action();
    board.current?.focus();
  };

  const onBoardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const side = sideOf(key);
    if (side) dispatch({ type: 'hold', side, down: true });
    else if (over && (key === ' ' || key === 'Enter')) restart();
    else if (key === ' ') dispatch({ type: 'fire' });
    else if (key === 'p' && !over) dispatch({ type: 'togglePause' });
    else if (key === 'Escape' && state.status === 'running') dispatch({ type: 'pause' });
    else return;
    event.preventDefault();
    event.stopPropagation();
  };
  const onBoardKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    const side = sideOf(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    if (side) dispatch({ type: 'hold', side, down: false });
  };
  // Esc that the board didn't take (the game isn't running, or focus is on a button) goes back to the page.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    onBack();
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) dispatch({ type: 'pause' });
  };

  return (
    <div className="gallery-blaster" onKeyDown={onKeyDown} onBlur={onBlur}>
      <div className="gallery-blaster__bar">
        <Button variant="outline" color="neutral" size="sm" className="gallery-blaster__back" onClick={onBack}>
          <Icon icon={iconArrowBack} size="sm" />
          Back to page
        </Button>
        {/* Fixed columns, so a count gaining a digit never moves the badges or the field. */}
        <div className="gallery-game__hud gallery-blaster__hud">
          <Badge color="primary">{`Score ${state.score}`}</Badge>
          <Badge variant="outline" color="neutral">{`Best ${Math.max(best, state.score)}`}</Badge>
          <Badge variant="outline" color="neutral">{`Lives ${state.lives}`}</Badge>
          <Badge variant="outline" color="neutral">{`Wave ${state.wave}`}</Badge>
        </div>
        <Stack direction="row" gap={8} align="center" wrap className="gallery-blaster__controls">
          <Button size="sm" variant="outline" color="neutral" disabled={!canPause} onClick={thenBoard(() => dispatch({ type: 'togglePause' }))}>
            {state.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
          <Button size="sm" variant={over ? 'solid' : 'outline'} color={over ? 'primary' : 'neutral'} onClick={thenBoard(restart)}>
            {over ? 'Play again' : 'Restart'}
          </Button>
          <Switch size="sm" checked={slow} onChange={(event) => setSlowChoice(event.target.checked)}>
            Slow speed
          </Switch>
        </Stack>
      </div>
      {/* The field takes the height the bar and the controls leave, and the game fits its rows to it. */}
      <div ref={setField} className="gallery-blaster__field">
        <div
          ref={board}
          className="gallery-blaster__board"
          role="application"
          tabIndex={0}
          aria-label="Bit Blaster board"
          aria-describedby={helpId}
          data-rows={state.rows}
          style={{ width: FIELD_W * scale, height: state.rows * scale }}
          onKeyDown={onBoardKeyDown}
          onKeyUp={onBoardKeyUp}
        >
          <canvas ref={canvasRef} className="gallery-game__canvas" aria-hidden="true" />
        </div>
      </div>
      {touch ? (
        <Pad
          onHold={(side, down) => dispatch({ type: 'hold', side, down })}
          onNudge={(side) => dispatch({ type: 'nudge', side })}
          onFire={() => (over ? restart() : dispatch({ type: 'fire' }))}
        />
      ) : null}
      <Text id={helpId} color="neutral" className="gallery-blaster__keys">
        {touch
          ? 'Hold an arrow to move, tap Fire to shoot. Esc pauses, then Esc again goes back to the page.'
          : 'The arrow keys or A and D move the ship. Space fires. P pauses. Esc pauses, then Esc again goes back to the page.'}
      </Text>
      {/* For screen readers only: on screen the field's banner says it (PAUSED, WAVE 2, GAME OVER and the score). */}
      <Text role="status" className="gallery-game__status">
        {blasterMessage(state, over && state.score > bestBefore)}
      </Text>
    </div>
  );
}
