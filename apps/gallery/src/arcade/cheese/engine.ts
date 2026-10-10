import { samePoint, stepPoint } from '../grid';
import type { Dir, Point } from '../grid';
import { mixSeed, randomInt } from '../random';
import { canMove, distancesFrom, farthestCell, generateMaze, openNeighbors, shortestPath } from './maze';
import type { Maze } from './maze';

export type CheeseStatus = 'ready' | 'running' | 'paused' | 'over';

/** What last happened, so the page can say it once: a level cleared, or a life lost to the cat or the clock. */
export type CheeseEvent = { kind: 'cleared'; level: number; bonus: number } | { kind: 'caught' } | { kind: 'timeout' };

export interface Cat {
  readonly pos: Point;
  /** The cell it came from, so a wandering cat doesn't turn straight back. */
  readonly prev: Point | null;
  readonly spawn: Point;
  /** Time since its last step. */
  readonly sinceMs: number;
}

export interface CheeseState {
  readonly level: number;
  readonly maze: Maze;
  readonly start: Point;
  readonly rat: Point;
  /** Which way the rat sprite faces. */
  readonly facing: 'left' | 'right';
  readonly cheese: Point;
  readonly cat: Cat | null;
  readonly lives: number;
  readonly score: number;
  readonly timeLeftMs: number;
  readonly levelMs: number;
  readonly status: CheeseStatus;
  /** The game's seed: level n's maze is always the same for one game. */
  readonly gameSeed: number;
  /** The cat's wandering comes from this one. */
  readonly seed: number;
  readonly slow: boolean;
  readonly event: CheeseEvent | null;
}

export const START_LIVES = 3;
export const CAT_FROM_LEVEL = 4;
/** Within this many steps (by path) the cat chases; farther off it wanders. */
export const CAT_SIGHT = 8;
const MAX_SIZE = 14;

/** Level 1 is 7 by 7; each level adds a row and a column, up to 14 by 14. */
export const mazeSize = (level: number): number => Math.min(6 + level, MAX_SIZE);

/** Seconds for a maze, more for a bigger one: 30s for 7 by 7, 88s for 14 by 14. */
export const levelMsFor = (size: number): number => Math.round(10 + size * size * 0.4) * 1000;

/** The cat's pace: 720ms a step at level 4, 40ms quicker each level, never under 380ms. Slow mode is 1.5 times that. */
export function catStepMs(level: number, slow = false): number {
  const base = Math.max(380, 720 - (level - CAT_FROM_LEVEL) * 40);
  return slow ? Math.round(base * 1.5) : base;
}

/** Clearing a level is worth 100, plus 10 for each whole second left on the clock. */
export const clearBonus = (timeLeftMs: number): number => 100 + 10 * Math.floor(Math.max(0, timeLeftMs) / 1000);

/** The cat starts in the corner farthest (by path) from the rat that isn't the cheese. */
function catSpawn(maze: Maze, start: Point, cheese: Point): Point {
  const dist = distancesFrom(maze, start);
  const corners = [
    { x: maze.cols - 1, y: 0 },
    { x: 0, y: maze.rows - 1 },
    { x: maze.cols - 1, y: maze.rows - 1 },
  ].filter((corner) => !samePoint(corner, cheese));
  return corners.reduce((best, corner) => (dist[corner.y * maze.cols + corner.x]! > dist[best.y * maze.cols + best.x]! ? corner : best));
}

interface Carry {
  readonly lives: number;
  readonly score: number;
  readonly slow: boolean;
  readonly gameSeed: number;
  readonly seed: number;
  readonly event: CheeseEvent | null;
}

/** A fresh maze for `level`, the rat top left, the cheese at the far end of the maze, and the cat from level 4. */
export function buildLevel(level: number, carry: Carry): CheeseState {
  const size = mazeSize(level);
  const maze = generateMaze(size, size, mixSeed(carry.gameSeed, level));
  const start = { x: 0, y: 0 };
  const cheese = farthestCell(maze, start);
  const spawn = level >= CAT_FROM_LEVEL ? catSpawn(maze, start, cheese) : null;
  const levelMs = levelMsFor(size);
  return {
    lives: carry.lives,
    score: carry.score,
    slow: carry.slow,
    gameSeed: carry.gameSeed,
    seed: carry.seed,
    event: carry.event,
    level,
    maze,
    start,
    rat: start,
    facing: 'right',
    cheese,
    cat: spawn ? { pos: spawn, prev: null, spawn, sinceMs: 0 } : null,
    timeLeftMs: levelMs,
    levelMs,
    status: 'ready',
  };
}

export function createCheeseRun({ seed, slow = false, level = 1 }: { seed: number; slow?: boolean; level?: number }): CheeseState {
  return buildLevel(level, { lives: START_LIVES, score: 0, slow, gameSeed: seed, seed, event: null });
}

/**
 * The cat's next cell: straight along the maze toward the rat when it is within CAT_SIGHT steps, otherwise a
 * wander to a random open neighbour, not the one it just left unless it is in a dead end.
 */
export function catStep(maze: Maze, cat: Cat, rat: Point, seed: number): { cat: Cat; seed: number } {
  const path = shortestPath(maze, cat.pos, rat);
  if (path.length > 1 && path.length - 1 <= CAT_SIGHT) {
    return { cat: { ...cat, pos: path[1]!, prev: cat.pos }, seed };
  }
  const all = openNeighbors(maze, cat.pos);
  const forward = all.filter((p) => !cat.prev || !samePoint(p, cat.prev));
  const options = forward.length > 0 ? forward : all;
  if (options.length === 0) return { cat, seed };
  const pick = randomInt(seed, options.length);
  return { cat: { ...cat, pos: options[pick.value]!, prev: cat.pos }, seed: pick.seed };
}

/** A life lost: the last one ends the game; otherwise the rat and cat go back to their starts with a full clock. */
function loseLife(state: CheeseState, kind: 'caught' | 'timeout'): CheeseState {
  const lives = state.lives - 1;
  const event = { kind };
  if (lives <= 0) return { ...state, lives: 0, status: 'over', event };
  return {
    ...state,
    lives,
    rat: state.start,
    facing: 'right',
    cat: state.cat ? { ...state.cat, pos: state.cat.spawn, prev: null, sinceMs: 0 } : null,
    timeLeftMs: state.levelMs,
    status: 'ready',
    event,
  };
}

/** The cheese: score the level and move straight on to the next, bigger maze. */
function clearLevel(state: CheeseState): CheeseState {
  const bonus = clearBonus(state.timeLeftMs);
  return buildLevel(state.level + 1, { ...state, score: state.score + bonus, event: { kind: 'cleared', level: state.level, bonus } });
}

/** One cell in `dir`, if no wall is in the way. Any direction key starts the clock and resumes a paused game. */
export function move(state: CheeseState, dir: Dir): CheeseState {
  if (state.status === 'over') return state;
  const facing = dir === 'left' || dir === 'right' ? dir : state.facing;
  const started: CheeseState = { ...state, status: 'running', facing };
  if (!canMove(state.maze, state.rat, dir)) return started;
  const rat = stepPoint(state.rat, dir);
  const moved = { ...started, rat };
  if (samePoint(rat, state.cheese)) return clearLevel(moved);
  if (state.cat && samePoint(rat, state.cat.pos)) return loseLife(moved, 'caught');
  return moved;
}

/** Time passes: the clock runs down and the cat takes its steps. Only a running game changes. */
export function advance(state: CheeseState, ms: number): CheeseState {
  if (state.status !== 'running') return state;
  const timeLeftMs = state.timeLeftMs - ms;
  if (timeLeftMs <= 0) return loseLife({ ...state, timeLeftMs: 0 }, 'timeout');
  if (!state.cat) return { ...state, timeLeftMs };
  const pace = catStepMs(state.level, state.slow);
  let cat: Cat = { ...state.cat, sinceMs: state.cat.sinceMs + ms };
  let seed = state.seed;
  while (cat.sinceMs >= pace) {
    const stepped = catStep(state.maze, cat, state.rat, seed);
    cat = { ...stepped.cat, sinceMs: cat.sinceMs - pace };
    seed = stepped.seed;
    if (samePoint(cat.pos, state.rat)) return loseLife({ ...state, cat, seed, timeLeftMs }, 'caught');
  }
  return { ...state, cat, seed, timeLeftMs };
}

export function togglePause(state: CheeseState): CheeseState {
  if (state.status === 'running') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'running' };
  return state;
}

export function pause(state: CheeseState): CheeseState {
  return state.status === 'running' ? { ...state, status: 'paused' } : state;
}

export type CheeseAction =
  | { type: 'move'; dir: Dir }
  | { type: 'advance'; ms: number }
  | { type: 'togglePause' }
  | { type: 'pause' }
  | { type: 'slow'; slow: boolean }
  | { type: 'restart'; seed: number };

export function cheeseReducer(state: CheeseState, action: CheeseAction): CheeseState {
  switch (action.type) {
    case 'move':
      return move(state, action.dir);
    case 'advance':
      return advance(state, action.ms);
    case 'togglePause':
      return togglePause(state);
    case 'pause':
      return pause(state);
    case 'slow':
      return state.slow === action.slow ? state : { ...state, slow: action.slow };
    case 'restart':
      return createCheeseRun({ seed: action.seed, slow: state.slow });
  }
}
