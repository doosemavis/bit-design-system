import { describe, expect, it } from 'vitest';
import {
  advance,
  aspectFor,
  CAT_FROM_LEVEL,
  CAT_SIGHT,
  catStep,
  catStepMs,
  cheeseReducer,
  clearBonus,
  createCheeseRun,
  levelMsFor,
  mazeShape,
  mazeSize,
  move,
  pause,
  reshape,
  START_LIVES,
  togglePause,
} from './engine';
import type { Cat, CheeseState } from './engine';
import { cheeseMessage } from './messages';
import { canMove, distancesFrom, generateMaze, shortestPath } from './maze';
import { DIRS, samePoint, stepPoint } from '../grid';
import type { Dir, Point } from '../grid';

/** The direction from a cell to its neighbour. */
const dirTo = (from: Point, to: Point): Dir => DIRS.find((dir) => samePoint(stepPoint(from, dir), to))!;

/** Walk the rat along the maze's own path to the cheese. */
function runToCheese(state: CheeseState): CheeseState {
  const path = shortestPath(state.maze, state.rat, state.cheese);
  return path.slice(1).reduce((s, cell, i) => move(s, dirTo(path[i]!, cell)), state);
}

/** A direction the rat can't take from where it stands. */
const blocked = (state: CheeseState) => DIRS.find((dir) => !canMove(state.maze, state.rat, dir))!;

describe('Cheese Run engine', () => {
  it('level 1: a 7x7 maze, the rat top left, the cheese reachable at the far end, no cat, 3 lives, ready', () => {
    const state = createCheeseRun({ seed: 9 });
    expect(state.maze.cols).toBe(7);
    expect(state.rat).toEqual({ x: 0, y: 0 });
    const dist = distancesFrom(state.maze, state.rat);
    expect(dist[state.cheese.y * 7 + state.cheese.x]).toBe(Math.max(...dist));
    expect(shortestPath(state.maze, state.rat, state.cheese).length).toBeGreaterThan(1);
    expect(state.cat).toBeNull();
    expect(state.lives).toBe(START_LIVES);
    expect(state.status).toBe('ready');
  });

  it('mazes grow a cell each level up to 14, and bigger mazes get more time', () => {
    expect([1, 2, 3, 8, 20].map(mazeSize)).toEqual([7, 8, 9, 14, 14]);
    expect(levelMsFor(7)).toBe(30_000);
    expect(levelMsFor(14)).toBeGreaterThan(levelMsFor(10));
  });

  it('the clock waits for the first move', () => {
    const ready = createCheeseRun({ seed: 2 });
    expect(advance(ready, 5000)).toBe(ready);
    const moved = move(ready, blocked(ready));
    expect(moved.status).toBe('running');
    expect(moved.rat).toEqual(ready.rat);
    expect(advance(moved, 1000).timeLeftMs).toBe(ready.timeLeftMs - 1000);
  });

  it('walls stop the rat; open sides let it through, one cell at a time, and it faces the way it went', () => {
    const state = createCheeseRun({ seed: 4 });
    const open = DIRS.find((dir) => canMove(state.maze, state.rat, dir))!;
    const moved = move(state, open);
    expect(moved.rat).toEqual(stepPoint(state.rat, open));
    expect(move(move(state, 'left'), 'left').facing).toBe('left');
  });

  it('reaching the cheese scores 100 plus 10 a second left, and builds the next, bigger level', () => {
    const state = runToCheese(createCheeseRun({ seed: 5 }));
    expect(state.level).toBe(2);
    expect(state.maze.cols).toBe(8);
    expect(state.status).toBe('ready');
    expect(state.score).toBe(clearBonus(levelMsFor(7)));
    expect(state.event).toEqual({ kind: 'cleared', level: 1, bonus: clearBonus(levelMsFor(7)) });
    expect(cheeseMessage(state, false)).toBe(`Level 1 cleared, plus ${state.score}. Level 2: find the cheese.`);
    expect(clearBonus(12_900)).toBe(220);
    expect(clearBonus(-5)).toBe(100);
  });

  it('a level is the same maze for the same game seed', () => {
    expect(createCheeseRun({ seed: 77, level: 3 }).maze).toEqual(createCheeseRun({ seed: 77, level: 3 }).maze);
  });

  it('running out of time costs a life and resets the level; the last life ends the game', () => {
    const running = move(createCheeseRun({ seed: 6 }), 'right');
    const lost = advance(running, running.timeLeftMs);
    expect(lost.lives).toBe(START_LIVES - 1);
    expect(lost.status).toBe('ready');
    expect(lost.rat).toEqual(lost.start);
    expect(lost.timeLeftMs).toBe(lost.levelMs);
    expect(cheeseMessage(lost, false)).toBe('Time is up! 2 lives left. Back to the start.');
    const last = advance(move({ ...lost, lives: 1 }, 'right'), lost.levelMs + 1);
    expect(last.status).toBe('over');
    expect(last.lives).toBe(0);
    expect(cheeseMessage(last, true)).toBe(`Time is up. Game over, score 0, a new best. Press Space to play again.`);
    expect(move(last, 'down')).toBe(last);
  });

  it('pause stops the clock; Space toggles; pause() leaves a ready game alone', () => {
    const running = move(createCheeseRun({ seed: 1 }), 'down');
    const paused = togglePause(running);
    expect(paused.status).toBe('paused');
    expect(advance(paused, 10_000)).toBe(paused);
    expect(cheeseMessage(paused, false)).toBe('Paused. Press Space to go on.');
    expect(togglePause(paused).status).toBe('running');
    expect(pause(running).status).toBe('paused');
    const ready = createCheeseRun({ seed: 1 });
    expect(pause(ready)).toBe(ready);
    expect(togglePause(ready)).toBe(ready);
    expect(cheeseMessage(ready, false)).toBe('');
  });
});

describe('the cat', () => {
  it(`walks from level ${CAT_FROM_LEVEL}, starting in a far corner that isn't the cheese`, () => {
    expect(createCheeseRun({ seed: 3, level: CAT_FROM_LEVEL - 1 }).cat).toBeNull();
    const state = createCheeseRun({ seed: 3, level: CAT_FROM_LEVEL });
    expect(state.cat).not.toBeNull();
    expect(state.cat!.pos).not.toEqual(state.cheese);
    expect(state.cat!.pos).not.toEqual(state.rat);
    expect(cheeseMessage({ ...state, event: { kind: 'cleared', level: 3, bonus: 100 } }, false)).toMatch(/Watch out: a cat/);
  });

  it('chases along the maze when the rat is within sight', () => {
    const maze = generateMaze(10, 10, 8);
    const rat = { x: 0, y: 0 };
    const path = shortestPath(maze, rat, { x: 9, y: 9 });
    const near = path[Math.min(CAT_SIGHT, path.length - 1)]!;
    const cat: Cat = { pos: near, prev: null, spawn: near, sinceMs: 0 };
    const stepped = catStep(maze, cat, rat, 1);
    expect(stepped.cat.pos).toEqual(shortestPath(maze, near, rat)[1]);
    expect(stepped.cat.prev).toEqual(near);
    expect(stepped.seed).toBe(1);
  });

  it('wanders when the rat is out of sight, never straight back unless at a dead end', () => {
    const maze = generateMaze(14, 14, 21);
    const rat = { x: 0, y: 0 };
    const dist = distancesFrom(maze, rat);
    const farIndex = dist.findIndex((d) => d > CAT_SIGHT + 4);
    const far = { x: farIndex % 14, y: Math.floor(farIndex / 14) };
    let cat: Cat = { pos: far, prev: null, spawn: far, sinceMs: 0 };
    let seed = 5;
    for (let i = 0; i < 20; i += 1) {
      const before = cat;
      const stepped = catStep(maze, cat, rat, seed);
      cat = stepped.cat;
      seed = stepped.seed;
      expect(shortestPath(maze, before.pos, cat.pos)).toHaveLength(2);
      const ways = DIRS.filter((dir) => canMove(maze, before.pos, dir)).length;
      if (before.prev && ways > 1 && shortestPath(maze, before.pos, rat).length - 1 > CAT_SIGHT) {
        expect(cat.pos).not.toEqual(before.prev);
      }
    }
  });

  it('stays put in a cell with no way out', () => {
    const cat: Cat = { pos: { x: 0, y: 0 }, prev: null, spawn: { x: 0, y: 0 }, sinceMs: 0 };
    expect(catStep({ cols: 2, rows: 1, cells: [0, 0] }, cat, { x: 1, y: 0 }, 3).cat).toBe(cat);
  });

  it('steps at its own pace, slower in slow mode, and catching the rat costs a life', () => {
    expect(catStepMs(CAT_FROM_LEVEL)).toBe(720);
    expect(catStepMs(30)).toBe(380);
    expect(catStepMs(CAT_FROM_LEVEL, true)).toBe(1080);
    const state = createCheeseRun({ seed: 3, level: CAT_FROM_LEVEL });
    const running = move(state, blocked(state));
    expect(advance(running, 700).cat!.pos).toEqual(state.cat!.pos);
    // Put the rat one step from the cat: the cat's next step lands on it.
    const next = shortestPath(state.maze, state.cat!.pos, state.rat)[1]!;
    const caught = advance({ ...running, rat: next }, catStepMs(CAT_FROM_LEVEL));
    expect(caught.lives).toBe(START_LIVES - 1);
    expect(caught.event).toEqual({ kind: 'caught' });
    expect(caught.rat).toEqual(caught.start);
    expect(caught.cat!.pos).toEqual(caught.cat!.spawn);
    expect(cheeseMessage(caught, false)).toBe('Caught by the cat! 2 lives left. Back to the start.');
  });

  it('walking into the cat costs a life too, and the last life is game over', () => {
    const state = createCheeseRun({ seed: 3, level: CAT_FROM_LEVEL });
    const into = DIRS.find((dir) => canMove(state.maze, state.rat, dir))!;
    const catThere: CheeseState = { ...state, lives: 1, cat: { ...state.cat!, pos: stepPoint(state.rat, into) } };
    const over = move(catThere, into);
    expect(over.status).toBe('over');
    expect(cheeseMessage(over, false)).toBe('Caught by the cat. Game over, score 0. Press Space to play again.');
  });
});

describe('cheeseReducer', () => {
  it('routes each action; slow is a setting; restart keeps it and starts over', () => {
    const state = createCheeseRun({ seed: 1 });
    expect(cheeseReducer(state, { type: 'move', dir: 'down' }).status).toBe('running');
    const running = cheeseReducer(state, { type: 'move', dir: 'down' });
    expect(cheeseReducer(running, { type: 'advance', ms: 100 }).timeLeftMs).toBe(running.timeLeftMs - 100);
    expect(cheeseReducer(running, { type: 'togglePause' }).status).toBe('paused');
    expect(cheeseReducer(running, { type: 'pause' }).status).toBe('paused');
    const slow = cheeseReducer(running, { type: 'slow', slow: true });
    expect(slow.slow).toBe(true);
    expect(cheeseReducer(slow, { type: 'slow', slow: true })).toBe(slow);
    const fresh = cheeseReducer({ ...slow, score: 500, level: 6 }, { type: 'restart', seed: 2 });
    expect(fresh).toMatchObject({ level: 1, score: 0, slow: true, status: 'ready', lives: START_LIVES });
  });
});

describe('Cheese Run on a tall board', () => {
  it('aspectFor reads the board as height over width, 1 to 3, to a tenth', () => {
    expect(aspectFor(183, 520)).toBe(2.8);
    expect(aspectFor(333, 316)).toBe(1);
    expect(aspectFor(100, 900)).toBe(3);
    expect(aspectFor(0, 0)).toBe(1);
  });

  it('mazeShape keeps the per-level growth in columns and stretches the rows to the shape', () => {
    expect(mazeShape(1, 1)).toEqual({ cols: 7, rows: 7 });
    expect(mazeShape(1, 2.8)).toEqual({ cols: 7, rows: 20 });
    expect(mazeShape(8, 3)).toEqual({ cols: 14, rows: 42 });
    expect(mazeShape(2, 9)).toEqual({ cols: 8, rows: 24 });
  });

  it('a tall level is a perfect maze with the cheese at its far end, and more cells mean more time', () => {
    const state = createCheeseRun({ seed: 12, aspect: 2.5 });
    const { cols, rows } = state.maze;
    expect([cols, rows]).toEqual([7, 18]);
    const dist = distancesFrom(state.maze, state.rat);
    expect(dist.every((d) => d >= 0)).toBe(true);
    expect(dist[state.cheese.y * cols + state.cheese.x]).toBe(Math.max(...dist));
    expect(state.levelMs).toBe(levelMsFor(7, 18));
    expect(levelMsFor(7, 18)).toBeGreaterThan(levelMsFor(7));
  });

  it('a tall level from 4 puts the cat in a corner of the tall maze, and clearing a level keeps the shape', () => {
    const state = createCheeseRun({ seed: 3, level: CAT_FROM_LEVEL, aspect: 2 });
    const { cols, rows } = state.maze;
    expect(rows).toBe(cols * 2);
    const corners = [
      { x: cols - 1, y: 0 },
      { x: 0, y: rows - 1 },
      { x: cols - 1, y: rows - 1 },
    ];
    expect(corners).toContainEqual(state.cat!.pos);
    const next = runToCheese(createCheeseRun({ seed: 5, aspect: 2 }));
    expect([next.maze.cols, next.maze.rows]).toEqual([8, 16]);
  });

  it('reshapes an untouched maze at once; a maze in play (or after a lost life) keeps its shape until the next level', () => {
    const fresh = createCheeseRun({ seed: 2 });
    expect(reshape(fresh, 1)).toBe(fresh);
    const tall = reshape(fresh, 2);
    expect(tall.maze.rows).toBe(14);
    const running = move(tall, 'right');
    const kept = reshape(running, 3);
    expect(kept.maze).toBe(running.maze);
    expect(kept.aspect).toBe(3);
    const lost = advance(running, running.timeLeftMs);
    expect(reshape(lost, 1).maze).toBe(lost.maze);
    const cleared = runToCheese(tall);
    expect(reshape(cleared, 1).maze.rows).toBe(8);
    expect(cheeseReducer(running, { type: 'shape', aspect: 2 })).toBe(running);
    expect(cheeseReducer(kept, { type: 'restart', seed: 4 }).maze.rows).toBe(21);
  });
});
