import { describe, expect, it } from 'vitest';
import { createSnake, MAX_ROWS, MIN_ROWS, pause, placeFood, resize, rowsFor, SNAKE_ROWS, snakeReducer, stepMs, tick, togglePause, turn } from './engine';
import type { SnakeState } from './engine';
import { keyToDir } from '../grid';

/** A running game with the snake and food exactly where a test wants them. */
function at(partial: Partial<SnakeState>): SnakeState {
  return { ...createSnake({ seed: 1, cols: 6, rows: 6 }), status: 'running', ...partial };
}

describe('Snake engine', () => {
  it('starts ready, three cells long, heading right, with food on a free cell', () => {
    const state = createSnake({ seed: 7 });
    expect(state.status).toBe('ready');
    expect(state.body).toHaveLength(3);
    expect(state.dir).toBe('right');
    expect(state.food).not.toBeNull();
    expect(state.body.some((p) => p.x === state.food!.x && p.y === state.food!.y)).toBe(false);
  });

  it('is deterministic: the same seed gives the same food', () => {
    expect(createSnake({ seed: 99 }).food).toEqual(createSnake({ seed: 99 }).food);
  });

  it('does not move until a turn starts it', () => {
    const ready = createSnake({ seed: 3 });
    expect(tick(ready)).toBe(ready);
    const started = turn(ready, 'up');
    expect(started.status).toBe('running');
    expect(tick(started).body[0]).toEqual({ x: ready.body[0]!.x, y: ready.body[0]!.y - 1 });
  });

  it('moves one cell per tick and the tail follows', () => {
    const state = at({ body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }], food: { x: 5, y: 5 } });
    expect(tick(state).body).toEqual([{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
  });

  it('ignores a reversal and a repeat, and queues at most two turns', () => {
    const state = at({ body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }] });
    expect(turn(state, 'left').queue).toEqual([]);
    expect(turn(state, 'right').queue).toEqual([]);
    const twice = turn(turn(state, 'up'), 'left');
    expect(twice.queue).toEqual(['up', 'left']);
    expect(turn(twice, 'down').queue).toEqual(['up', 'left']);
  });

  it('applies a quick double turn over two ticks (up then left makes a U-turn)', () => {
    const state = turn(turn(at({ body: [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }], food: { x: 5, y: 5 } }), 'up'), 'left');
    const after = tick(tick(state));
    expect(after.body[0]).toEqual({ x: 2, y: 2 });
    expect(after.dir).toBe('left');
    expect(after.queue).toEqual([]);
  });

  it('grows by one and scores when it eats, and places new food off the snake', () => {
    const state = at({ body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }], food: { x: 3, y: 2 } });
    const fed = tick(state);
    expect(fed.body).toHaveLength(4);
    expect(fed.score).toBe(1);
    expect(fed.food).not.toEqual({ x: 3, y: 2 });
    expect(fed.body.some((p) => p.x === fed.food!.x && p.y === fed.food!.y)).toBe(false);
    expect(fed.status).toBe('running');
  });

  it('dies on a wall', () => {
    const state = at({ body: [{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }], food: { x: 0, y: 0 } });
    const dead = tick(state);
    expect(dead.status).toBe('over');
    expect(dead.body).toEqual(state.body);
  });

  it('dies on itself', () => {
    // A hook shape: heading down into its own body.
    const body = [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }];
    const state = turn(at({ body, dir: 'up', food: { x: 0, y: 0 } }), 'right');
    expect(tick(state).status).toBe('over');
  });

  it('may move into the cell its tail is leaving', () => {
    const body = [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }];
    const state = at({ body, dir: 'up', queue: ['right'], food: { x: 0, y: 0 } });
    const moved = tick(state);
    expect(moved.status).toBe('running');
    expect(moved.body[0]).toEqual({ x: 3, y: 2 });
  });

  it('ends when the board is full', () => {
    const body = [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }];
    const state = { ...at({ cols: 2, rows: 2, body, food: { x: 1, y: 1 }, dir: 'down' as const }) };
    const full = tick(state);
    expect(full.food).toBeNull();
    expect(full.status).toBe('over');
    expect(full.score).toBe(1);
    expect(placeFood(full.body, 2, 2, 1).food).toBeNull();
  });

  it('pauses and resumes; pause() only pauses a running game; a turn resumes', () => {
    const running = at({});
    const paused = togglePause(running);
    expect(paused.status).toBe('paused');
    expect(tick(paused)).toBe(paused);
    expect(togglePause(paused).status).toBe('running');
    expect(pause(running).status).toBe('paused');
    const ready = createSnake({ seed: 1 });
    expect(pause(ready)).toBe(ready);
    expect(togglePause(ready)).toBe(ready);
    expect(turn(paused, 'up').status).toBe('running');
  });

  it('ignores turns once over, and restart starts a fresh ready game', () => {
    const over = at({ status: 'over', score: 9 });
    expect(turn(over, 'up')).toBe(over);
    const fresh = snakeReducer(over, { type: 'restart', seed: 5 });
    expect(fresh.status).toBe('ready');
    expect(fresh.score).toBe(0);
    expect(fresh.cols).toBe(6);
  });

  it('the reducer routes each action', () => {
    const state = at({ body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }], food: { x: 5, y: 5 } });
    expect(snakeReducer(state, { type: 'turn', dir: 'down' }).queue).toEqual(['down']);
    expect(snakeReducer(state, { type: 'tick' }).body[0]).toEqual({ x: 3, y: 2 });
    expect(snakeReducer(state, { type: 'togglePause' }).status).toBe('paused');
    expect(snakeReducer(state, { type: 'pause' }).status).toBe('paused');
  });

  it('speeds up gently with the score, has a floor, and slow mode is slower', () => {
    expect(stepMs(0)).toBe(160);
    expect(stepMs(5)).toBe(140);
    expect(stepMs(100)).toBe(70);
    expect(stepMs(0, true)).toBeGreaterThan(stepMs(0));
  });
});

describe('keyToDir', () => {
  it('maps arrows and WASD in either case, and nothing else', () => {
    expect(keyToDir('ArrowUp')).toBe('up');
    expect(keyToDir('ArrowLeft')).toBe('left');
    expect(keyToDir('s')).toBe('down');
    expect(keyToDir('D')).toBe('right');
    expect(keyToDir('x')).toBeNull();
    expect(keyToDir('Enter')).toBeNull();
  });
});

describe('Snake on a tall board', () => {
  it('rowsFor fits whole-pixel square cells to the height, between the minimum and maximum', () => {
    expect(rowsFor(180, 520)).toBe(43); // 12px cells
    expect(rowsFor(177, 514)).toBe(46); // 11px cells
    expect(rowsFor(180, 60)).toBe(MIN_ROWS);
    expect(rowsFor(180, 5000)).toBe(MAX_ROWS);
    expect(rowsFor(0, 0)).toBe(SNAKE_ROWS);
    expect(rowsFor(10, 400)).toBe(SNAKE_ROWS);
  });

  it('starts mid-height on a grid with more rows than columns, and dies on the bottom wall, not at row 15', () => {
    const tall = createSnake({ seed: 4, cols: 15, rows: 40 });
    expect(tall.body[0]).toEqual({ x: 7, y: 20 });
    let state = turn(tall, 'down');
    for (let i = 0; i < 19; i += 1) state = { ...tick(state), food: null };
    expect(state.status).toBe('running');
    expect(state.body[0]).toEqual({ x: 7, y: 39 });
    expect(tick(state).status).toBe('over');
  });

  it('a game nobody has started takes a new height at once; a game in play keeps its grid until the next game', () => {
    const ready = createSnake({ seed: 4 });
    expect(resize(ready, 15)).toBe(ready);
    const tall = resize(ready, 30);
    expect([tall.rows, tall.status]).toEqual([30, 'ready']);
    const running = turn(tall, 'up');
    const later = resize(running, 20);
    expect(later.rows).toBe(30);
    expect(later.nextRows).toBe(20);
    expect(resize(later, 20)).toBe(later);
    expect(snakeReducer(later, { type: 'resize', rows: 20 })).toBe(later);
    expect(snakeReducer(later, { type: 'restart', seed: 1 }).rows).toBe(20);
  });
});
