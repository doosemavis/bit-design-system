import { useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, PointerEvent, MouseEvent, ReactNode, RefCallback } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  iconChevronLeft,
  iconChevronRight,
  IconButton,
  iconKeyboardArrowDown,
  iconKeyboardArrowUp,
  Stack,
  Switch,
  Text,
} from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import { keyToDir } from './grid';
import { NARROW_QUERY, useMediaQuery } from '../ui/useMediaQuery';
import { Disclosure } from '../ui/Disclosure';
import type { Dir } from './grid';

export type GameStatus = 'ready' | 'running' | 'paused' | 'over';

export interface GameFrameProps {
  title: string;
  /** Score, best, level, lives, time: Badges. */
  hud: ReactNode;
  canvasRef: RefCallback<HTMLCanvasElement>;
  /** How to move, in words. The keys for pausing and leaving are added here. */
  howToMove: string;
  /** The live region's line (see snakeMessage / cheeseMessage). */
  message: string;
  status: GameStatus;
  onDir: (dir: Dir) => void;
  onTogglePause: () => void;
  onRestart: () => void;
  /** Focus left the game, or the tab was hidden: pause. */
  onLeave: () => void;
  slow: boolean;
  onSlowChange: (slow: boolean) => void;
  /** Shows the on-screen arrows: a phone, or any touch screen. */
  touch: boolean;
  /** The grid in play, as columns by rows, for the board's data-grid. */
  grid: { cols: number; rows: number };
  /** The board's size in CSS pixels, whenever it changes: the game fits its grid to it. */
  onBoardSize: (size: { width: number; height: number }) => void;
}

const PAD: readonly { dir: Dir; label: string; icon: IconData }[] = [
  { dir: 'up', label: 'Up', icon: iconKeyboardArrowUp },
  { dir: 'left', label: 'Left', icon: iconChevronLeft },
  { dir: 'down', label: 'Down', icon: iconKeyboardArrowDown },
  { dir: 'right', label: 'Right', icon: iconChevronRight },
];

/**
 * The on-screen arrows. A press acts on pointer down, and keeps focus where it was (on the board), so tapping
 * doesn't count as leaving the game; Enter or Space on a focused arrow (a click with no pointer) acts too.
 */
function ArrowPad({ onDir }: { onDir: (dir: Dir) => void }) {
  return (
    <div className="gallery-game__pad" role="group" aria-label="Arrows">
      {PAD.map(({ dir, label, icon }) => (
        <IconButton
          key={dir}
          className={`gallery-game__pad-${dir}`}
          icon={icon}
          label={label}
          size="lg"
          color="neutral"
          onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            onDir(dir);
          }}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            if (event.detail === 0) onDir(dir);
          }}
        />
      ))}
    </div>
  );
}

/**
 * The game's keys, only while the board has focus: arrows and WASD move, Space or P pause and resume (Space
 * or Enter start again after a game over), and Esc pauses a running game. Esc on a game that isn't running is
 * left alone, so it reaches the Arcade panel, which goes back to the menu. Keys with Ctrl, Alt or ⌘ pass through
 * (⌘K still opens search).
 */
function handleKey(event: KeyboardEvent<HTMLDivElement>, props: GameFrameProps): void {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const { key } = event;
  const dir = keyToDir(key);
  const over = props.status === 'over';
  if (dir) props.onDir(dir);
  else if (over && (key === ' ' || key === 'Enter')) props.onRestart();
  else if (!over && (key === ' ' || key.toLowerCase() === 'p')) props.onTogglePause();
  else if (key === 'Escape' && props.status === 'running') props.onTogglePause();
  else return;
  event.preventDefault();
  event.stopPropagation();
}

/** On-screen arrows at phone width, and on any touch screen (a tablet has no arrow keys either). */
export function useTouchControls(): boolean {
  const narrow = useMediaQuery(NARROW_QUERY);
  const coarse = useMediaQuery('(pointer: coarse)');
  return narrow || coarse;
}

/** Reports the board's content size on mount and on every resize (where ResizeObserver exists). */
export function useBoardSize(board: HTMLElement | null, onSize: (size: { width: number; height: number }) => void): void {
  const latest = useRef(onSize);
  useEffect(() => {
    latest.current = onSize;
  });
  useEffect(() => {
    if (!board || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) latest.current({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, [board]);
}

/** Pause when the tab is hidden. */
export function useHiddenPause(onLeave: () => void): void {
  const latest = useRef(onLeave);
  useEffect(() => {
    latest.current = onLeave;
  });
  useEffect(() => {
    const onChange = () => {
      if (document.hidden) latest.current();
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
}

/** A game's chrome: the framed Card with its pixel title strip, the HUD, the board, the controls and the live line. */
export function GameFrame(props: GameFrameProps) {
  const { title, hud, canvasRef, howToMove, message, status, onTogglePause, onRestart, onLeave, slow, onSlowChange, touch } = props;
  const board = useRef<HTMLDivElement>(null);
  const [boardElement, setBoardElement] = useState<HTMLDivElement | null>(null);
  const helpId = useId();
  useHiddenPause(onLeave);
  useBoardSize(boardElement, props.onBoardSize);
  useEffect(() => {
    board.current?.focus();
  }, []);
  const boardRef = (element: HTMLDivElement | null) => {
    board.current = element;
    setBoardElement(element);
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onLeave();
  };
  const canPause = status === 'running' || status === 'paused';
  // After a button, the keys belong to the board again.
  const thenBoard = (action: () => void) => () => {
    action();
    board.current?.focus();
  };

  return (
    <Card className="gallery-game" onBlur={onBlur}>
      <CardHeader className="gallery-game__title">{title}</CardHeader>
      <CardBody className="gallery-game__body">
        <Stack gap={12} className="gallery-game__stack">
          {/* A grid whose columns follow the width alone, so a count gaining a digit never re-wraps the stats. */}
          <div className="gallery-game__hud">{hud}</div>
          <div
            ref={boardRef}
            className="gallery-game__board"
            role="application"
            tabIndex={0}
            aria-label={`${title} board`}
            aria-describedby={helpId}
            data-grid={`${props.grid.cols}x${props.grid.rows}`}
            onKeyDown={(event) => handleKey(event, props)}
          >
            <canvas ref={canvasRef} className="gallery-game__canvas" aria-hidden="true" />
          </div>
          {touch ? <ArrowPad onDir={props.onDir} /> : null}
          <Stack direction="row" gap={8} wrap>
            <Button size="sm" variant="outline" color="neutral" disabled={!canPause} onClick={thenBoard(onTogglePause)}>
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button size="sm" variant={status === 'over' ? 'solid' : 'outline'} color={status === 'over' ? 'primary' : 'neutral'} onClick={thenBoard(onRestart)}>
              {status === 'over' ? 'Play again' : 'Restart'}
            </Button>
          </Stack>
          <Switch size="sm" checked={slow} onChange={(event) => onSlowChange(event.target.checked)}>
            Slow speed
          </Switch>
          {/* Closed by default and under the controls, so the board gets the height and opening it never moves
              the board. The text stays in the DOM while closed, so it still describes the board. */}
          <Disclosure title="How to play">
            <Text id={helpId} color="neutral">
              {`${howToMove} Space or P pauses. Esc pauses, then Esc again goes back.`}
            </Text>
          </Disclosure>
          {/* For screen readers only: on screen the board's own banner says it (PAUSED, GAME OVER and the score,
              LEVEL 2), so the sentence never takes the board's height as it comes and goes. */}
          <Text role="status" className="gallery-game__status">
            {message}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
}
