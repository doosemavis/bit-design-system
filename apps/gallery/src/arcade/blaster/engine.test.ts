import { describe, expect, it } from 'vitest';
import {
  ALIEN_SIZE,
  alienBox,
  blasterReducer,
  createBlaster,
  DEFAULT_ROWS,
  FIELD_W,
  fire,
  groundOf,
  hold,
  marchTicks,
  MAX_ROWS,
  MIN_ROWS,
  nudge,
  pause,
  resize,
  rowsFor,
  scaleFor,
  SHIELD_COUNT,
  SHIELD_SHAPE,
  SHIP_W,
  shipTopOf,
  START_X,
  SWARM_COLS,
  SWARM_ROWS,
  tick,
  togglePause,
} from './engine';
import type { BlasterAction, BlasterState } from './engine';

const SEED = 42;
const NO_SHIELDS = Array.from({ length: SHIELD_COUNT }, () => SHIELD_SHAPE.map(() => false));
/** A game in play with no bombs coming for a long while: only what a test sets up happens. */
const playing = (overrides: Partial<BlasterState> = {}): BlasterState => ({
  ...createBlaster({ seed: SEED, rows: 300 }),
  status: 'running',
  bombWait: 10_000,
  ...overrides,
});
const ticks = (state: BlasterState, n: number): BlasterState => {
  let next = state;
  for (let i = 0; i < n; i += 1) next = tick(next);
  return next;
};
const solid = (shield: readonly boolean[]) => shield.filter(Boolean).length;

describe('a new game', () => {
  it('waits, with three lives, the ship in the middle, a full swarm of 40 and four whole shields', () => {
    const state = createBlaster({ seed: SEED, rows: 300 });
    expect(state).toMatchObject({ status: 'ready', score: 0, lives: 3, wave: 1, rows: 300, shot: null, bombs: [] });
    expect(state.shipX).toBe(START_X);
    expect(state.swarm.alive).toHaveLength(SWARM_COLS * SWARM_ROWS);
    expect(state.swarm.alive.every(Boolean)).toBe(true);
    expect(state.shields).toHaveLength(SHIELD_COUNT);
    expect(state.shields.every((shield) => solid(shield) === solid(SHIELD_SHAPE))).toBe(true);
    // Nothing moves until it starts.
    expect(tick(state)).toBe(state);
  });

  it('starts on Space or a move key, which also resume a paused game', () => {
    const ready = createBlaster({ seed: SEED });
    expect(fire(ready).status).toBe('running');
    expect(fire(ready).shot).toBeNull();
    expect(hold(ready, 'left', true).status).toBe('running');
    expect(nudge(ready, 'right').status).toBe('running');
    const paused = togglePause(playing());
    expect(paused.status).toBe('paused');
    expect(fire(paused).status).toBe('running');
    expect(hold(paused, 'right', true).status).toBe('running');
  });
});

describe('the field’s size', () => {
  it('takes as many rows as the main area holds, at whole 2x pixels on a laptop', () => {
    // 1440x900: the main area leaves about 1150 by 700 for the field.
    expect(rowsFor(1150, 708)).toBe(354);
    expect(scaleFor(1150, 708, 354)).toBe(2);
    // 1920x1080: as tall as it goes.
    expect(rowsFor(1600, 880)).toBe(MAX_ROWS);
    // 1280x720: still 2x, with fewer rows.
    expect(rowsFor(1000, 478)).toBe(239);
    expect(scaleFor(1000, 478, 239)).toBe(2);
  });

  it('on a phone, fills the width with a fractional pixel', () => {
    const rows = rowsFor(358, 560);
    expect(rows).toBe(350);
    expect(scaleFor(358, 560, rows)).toBeCloseTo(358 / FIELD_W);
  });

  it('keeps between 220 and 420 rows, and the default before the area is measured', () => {
    expect(rowsFor(1150, 200)).toBe(MIN_ROWS);
    // Too short for 220 rows at 2x: 1x, as tall as it is.
    expect(rowsFor(1150, 300)).toBe(300);
    expect(rowsFor(0, 0)).toBe(DEFAULT_ROWS);
    expect(scaleFor(0, 0, DEFAULT_ROWS)).toBe(0);
  });

  it('a game nobody has started takes the new rows; a game in play keeps its own until the next game', () => {
    const ready = createBlaster({ seed: SEED, rows: 300 });
    expect(resize(ready, 320).rows).toBe(320);
    const inPlay = resize(playing(), 320);
    expect(inPlay).toMatchObject({ rows: 300, nextRows: 320 });
    expect(blasterReducer(inPlay, { type: 'restart', seed: 7 })).toMatchObject({ rows: 320, status: 'ready' });
  });
});

describe('the ship', () => {
  it('moves while a key is held, stops when it’s let go, and never leaves the field', () => {
    const moving = ticks(hold(playing(), 'right', true), 10);
    expect(moving.shipX).toBe(START_X + 15);
    const stopped = ticks(hold(moving, 'right', false), 10);
    expect(stopped.shipX).toBe(moving.shipX);
    expect(ticks(hold(playing(), 'right', true), 400).shipX).toBe(FIELD_W - SHIP_W - 4);
    expect(ticks(hold(playing(), 'left', true), 400).shipX).toBe(4);
  });

  it('a nudge (an on-screen arrow from the keyboard) is one 8px step', () => {
    expect(nudge(playing(), 'left').shipX).toBe(START_X - 8);
  });

  it('fires one shot at a time, from its nose', () => {
    const first = fire(playing());
    expect(first.shot).toEqual({ x: START_X + Math.floor(SHIP_W / 2), y: shipTopOf(300) - 4 });
    expect(fire(first)).toBe(first);
  });
});

describe('the shot', () => {
  it('takes the first alien in its path and scores it by row: 10 at the bottom', () => {
    // Under the left column, with nothing in the way and the swarm holding still.
    const base = playing({ shields: NO_SHIELDS });
    const shipX = alienBox(base.swarm, 0).x - 2;
    let next = fire({ ...base, shipX, swarm: { ...base.swarm, wait: 10_000 } });
    for (let i = 0; i < 200 && next.shot; i += 1) next = tick(next);
    const bottomLeft = (SWARM_ROWS - 1) * SWARM_COLS;
    expect(next.swarm.alive[bottomLeft]).toBe(false);
    expect(next.swarm.alive.filter(Boolean)).toHaveLength(39);
    expect(next.score).toBe(10);
    expect(next.booms).toHaveLength(1);
  });

  it('wears a hole in a shield instead, and is gone', () => {
    let next = fire(playing({ shipX: 28 }));
    for (let i = 0; i < 40 && next.shot; i += 1) next = tick(next);
    expect(next.shot).toBeNull();
    expect(solid(next.shields[0]!)).toBeLessThan(solid(SHIELD_SHAPE));
    expect(next.score).toBe(0);
  });

  it('meets a bomb head on: both go', () => {
    const state = playing({ shields: NO_SHIELDS, shot: { x: 100, y: 150 }, bombs: [{ x: 100, y: 140, age: 0 }] });
    const next = ticks(state, 2);
    expect(next.shot).toBeNull();
    expect(next.bombs).toEqual([]);
  });
});

describe('the swarm', () => {
  it('steps sideways, then at an edge drops a row and turns back', () => {
    const start = playing({ swarm: { ...playing().swarm, wait: 1 } });
    const stepped = tick(start);
    expect(stepped.swarm.x).toBe(start.swarm.x + 3);
    expect(stepped.swarm.frame).toBe(1);
    // Its right column is at the right edge: the next step is a drop.
    const atEdge = playing({ swarm: { ...start.swarm, x: FIELD_W - 4 - ALIEN_SIZE - 7 * 16 - 1 } });
    const turned = tick(atEdge);
    expect(turned.swarm).toMatchObject({ x: atEdge.swarm.x, y: atEdge.swarm.y + 6, dir: -1 });
  });

  it('marches faster as it thins out, and each wave', () => {
    expect(marchTicks(40, 1)).toBeGreaterThan(marchTicks(20, 1));
    expect(marchTicks(20, 1)).toBeGreaterThan(marchTicks(1, 1));
    expect(marchTicks(40, 1)).toBeGreaterThan(marchTicks(40, 4));
    expect(marchTicks(1, 9)).toBe(3);
  });

  it('chews through a shield it reaches, and ends the game when it lands', () => {
    const rows = 300;
    // The bottom row's next drop puts it on the shields' top rows.
    const low = playing({ swarm: { ...playing().swarm, wait: 1, y: shipTopOf(rows) - 30 - 4 * 14 - ALIEN_SIZE + 2 } });
    const chewed = tick(low);
    expect(chewed.shields.some((shield) => solid(shield) < solid(SHIELD_SHAPE))).toBe(true);
    const landing = playing({ swarm: { ...playing().swarm, wait: 1, y: groundOf(rows) - 10 - 4 * 14 - ALIEN_SIZE } });
    expect(tick(landing).status).toBe('over');
  });

  it('drops bombs from its lowest alien, three at most, and each falls', () => {
    const state = tick(playing({ bombWait: 1, shields: NO_SHIELDS }));
    expect(state.bombs).toHaveLength(1);
    const [bomb] = state.bombs;
    const bottomRow = state.swarm.y + (SWARM_ROWS - 1) * 14 + ALIEN_SIZE;
    expect(bomb!.y).toBeGreaterThanOrEqual(bottomRow);
    expect(tick(state).bombs[0]!.y).toBeGreaterThan(bomb!.y);
    const full = playing({ bombWait: 1, bombs: [0, 1, 2].map((i) => ({ x: 10 + i * 40, y: 120, age: 0 })) });
    expect(tick(full).bombs).toHaveLength(3);
  });

  it('a cleared wave brings the next, a little lower, after a WAVE banner that holds everything still', () => {
    const last = SWARM_COLS * SWARM_ROWS - 1;
    const base = playing({ shields: NO_SHIELDS });
    const lone = { ...base, swarm: { ...base.swarm, wait: 10_000, alive: base.swarm.alive.map((_, i) => i === last) } };
    const box = alienBox(lone.swarm, last);
    let next = fire({ ...lone, shipX: box.x - 2 });
    for (let i = 0; i < 200 && next.wave === 1; i += 1) next = tick(next);
    expect(next).toMatchObject({ wave: 2, score: 10, shot: null, bombs: [] });
    expect(next.banner).toBeGreaterThan(0);
    expect(next.swarm.alive.every(Boolean)).toBe(true);
    expect(next.swarm.y).toBe(lone.swarm.y + 8);
    expect(tick(next).swarm).toEqual(next.swarm);
    // Fire does nothing under the banner.
    expect(fire(next).shot).toBeNull();
  });
});

describe('getting hit', () => {
  const bombOnShip = (state: BlasterState) => ({ ...state, bombs: [{ x: state.shipX + 4, y: shipTopOf(state.rows) - 5, age: 0 }] });

  it('costs a life; the ship blows up, then comes back in the middle', () => {
    const hit = tick(bombOnShip(playing({ shipX: 120, shields: NO_SHIELDS })));
    expect(hit).toMatchObject({ lives: 2, bombs: [], shot: null });
    expect(hit.dying).toBeGreaterThan(0);
    expect(tick(hit).swarm).toEqual(hit.swarm);
    expect(ticks(hit, hit.dying)).toMatchObject({ dying: 0, shipX: START_X, status: 'running' });
  });

  it('on the last life, the game is over', () => {
    const hit = tick(bombOnShip(playing({ lives: 1, shields: NO_SHIELDS })));
    const over = ticks(hit, hit.dying);
    expect(over.status).toBe('over');
    expect(fire(over)).toBe(over);
  });
});

describe('pausing', () => {
  it('stops the clock and lets go of the keys, so a lost key-up can’t keep the ship moving', () => {
    const paused = pause(hold(playing(), 'left', true));
    expect(paused).toMatchObject({ status: 'paused', held: { left: false, right: false } });
    expect(tick(paused)).toBe(paused);
    expect(togglePause(paused).status).toBe('running');
  });
});

describe('a game replays exactly from its seed', () => {
  it('the same seed and the same moves give the same game', () => {
    const moves: BlasterAction[] = [{ type: 'fire' }, { type: 'hold', side: 'left', down: true }];
    const play = () => {
      let state = createBlaster({ seed: 1234, rows: 300 });
      for (const move of moves) state = blasterReducer(state, move);
      for (let i = 0; i < 900; i += 1) {
        state = blasterReducer(state, { type: 'tick' });
        if (i % 30 === 0) state = blasterReducer(state, { type: 'fire' });
        if (i === 300) state = blasterReducer(state, { type: 'hold', side: 'right', down: true });
      }
      return state;
    };
    const a = play();
    expect(play()).toEqual(a);
    expect(a.score).toBeGreaterThan(0);
  });
});
