import { inBounds, OPPOSITE, samePoint, stepPoint } from '../grid';
import type { Dir, Point } from '../grid';
import { randomInt } from '../random';

/** ready: waiting for the first turn. running, paused, over: as they say. */
export type SnakeStatus = 'ready' | 'running' | 'paused' | 'over';

export interface SnakeState {
  readonly cols: number;
  readonly rows: number;
  /** Head first. */
  readonly body: readonly Point[];
  readonly dir: Dir;
  /** Turns pressed since the last step, applied one per step, so a quick double turn isn't lost. At most two. */
  readonly queue: readonly Dir[];
  /** Null only when the snake fills the board. */
  readonly food: Point | null;
  readonly score: number;
  readonly status: SnakeStatus;
  /** Where the food goes next comes from this seed, so a game replays exactly. */
  readonly seed: number;
  /** The rows the board has room for now. A game in play keeps its own; the next one uses these. */
  readonly nextRows: number;
}

export const SNAKE_COLS = 15;
export const SNAKE_ROWS = 15;
/** The tallest and shortest boards: the sidebar's height decides between them. */
export const MIN_ROWS = 10;
export const MAX_ROWS = 48;
const START_LENGTH = 3;
const MAX_QUEUE = 2;

/** One random free cell, and the next seed; null when the board is full. */
export function placeFood(body: readonly Point[], cols: number, rows: number, seed: number): { food: Point | null; seed: number } {
  const free: Point[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!body.some((part) => part.x === x && part.y === y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { food: null, seed };
  const pick = randomInt(seed, free.length);
  return { food: free[pick.value]!, seed: pick.seed };
}

/**
 * How many rows fit a grid area `width` by `height` pixels with `cols` square, whole-pixel cells across (as the
 * painter draws them): the board's height follows the space, between MIN_ROWS and MAX_ROWS. An unmeasured board
 * (0 by 0) gets the square default.
 */
export function rowsFor(width: number, height: number, cols = SNAKE_COLS): number {
  const cell = Math.floor(width / cols);
  if (cell <= 0 || height <= 0) return SNAKE_ROWS;
  return Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(height / cell)));
}

/** A new game: a three-cell snake in the middle row, heading right, and one piece of food. */
export function createSnake({ seed, cols = SNAKE_COLS, rows = SNAKE_ROWS }: { seed: number; cols?: number; rows?: number }): SnakeState {
  const y = Math.floor(rows / 2);
  const head = Math.floor(cols / 3) + START_LENGTH - 1;
  const body = Array.from({ length: START_LENGTH }, (_, i) => ({ x: head - i, y }));
  const placed = placeFood(body, cols, rows, seed);
  return { cols, rows, body, dir: 'right', queue: [], food: placed.food, score: 0, status: 'ready', seed: placed.seed, nextRows: rows };
}

/**
 * The board has room for `rows` now. A game nobody has started takes them at once; a game in play (or over)
 * keeps its grid, and the next game gets the new one.
 */
export function resize(state: SnakeState, rows: number): SnakeState {
  if (state.status === 'ready') return rows === state.rows ? state : createSnake({ seed: state.seed, cols: state.cols, rows });
  return rows === state.nextRows ? state : { ...state, nextRows: rows };
}

/**
 * A turn. A reversal (straight back into the neck) and a repeat of the current heading are ignored. Any
 * direction key also starts a ready game and resumes a paused one.
 */
export function turn(state: SnakeState, dir: Dir): SnakeState {
  if (state.status === 'over') return state;
  const status = 'running';
  const heading = state.queue[state.queue.length - 1] ?? state.dir;
  if (dir === heading || dir === OPPOSITE[heading] || state.queue.length >= MAX_QUEUE) {
    return state.status === status ? state : { ...state, status };
  }
  return { ...state, queue: [...state.queue, dir], status };
}

/** One step forward: eat and grow, or die on a wall or on itself. Only a running game moves. */
export function tick(state: SnakeState): SnakeState {
  if (state.status !== 'running') return state;
  const [next, ...queue] = state.queue;
  const dir = next ?? state.dir;
  const head = stepPoint(state.body[0]!, dir);
  if (!inBounds(head, state.cols, state.rows)) return { ...state, dir, queue, status: 'over' };
  const eating = state.food !== null && samePoint(head, state.food);
  // Not eating, the tail moves on this step, so the head may take the cell it leaves.
  const body = eating ? [head, ...state.body] : [head, ...state.body.slice(0, -1)];
  if (body.slice(1).some((part) => samePoint(part, head))) return { ...state, dir, queue, status: 'over' };
  if (!eating) return { ...state, body, dir, queue };
  const placed = placeFood(body, state.cols, state.rows, state.seed);
  return {
    ...state,
    body,
    dir,
    queue,
    score: state.score + 1,
    food: placed.food,
    seed: placed.seed,
    // A full board is the end too: there is nowhere left to go.
    status: placed.food === null ? 'over' : 'running',
  };
}

/** Space and P: pause a running game, resume a paused one. */
export function togglePause(state: SnakeState): SnakeState {
  if (state.status === 'running') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'running' };
  return state;
}

/** Losing focus or hiding the tab pauses a running game and leaves any other state alone. */
export function pause(state: SnakeState): SnakeState {
  return state.status === 'running' ? { ...state, status: 'paused' } : state;
}

/** Milliseconds per step: 160 at the start, 4 faster per food, never under 70. Slow mode takes 1.6 times as long. */
export function stepMs(score: number, slow = false): number {
  const base = Math.max(70, 160 - score * 4);
  return slow ? Math.round(base * 1.6) : base;
}

export type SnakeAction =
  | { type: 'turn'; dir: Dir }
  | { type: 'tick' }
  | { type: 'togglePause' }
  | { type: 'pause' }
  | { type: 'resize'; rows: number }
  | { type: 'restart'; seed: number };

export function snakeReducer(state: SnakeState, action: SnakeAction): SnakeState {
  switch (action.type) {
    case 'turn':
      return turn(state, action.dir);
    case 'tick':
      return tick(state);
    case 'togglePause':
      return togglePause(state);
    case 'pause':
      return pause(state);
    case 'resize':
      return resize(state, action.rows);
    case 'restart':
      return createSnake({ seed: action.seed, cols: state.cols, rows: state.nextRows });
  }
}
