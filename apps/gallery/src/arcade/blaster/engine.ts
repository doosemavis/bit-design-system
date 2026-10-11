import { nextRandom, randomInt } from '../random';

/** ready: waiting for the first move or shot. running, paused, over: as they say. */
export type BlasterStatus = 'ready' | 'running' | 'paused' | 'over';
export type Side = 'left' | 'right';

/**
 * The field, in its own pixels: 224 across, as many rows as the main area holds (220 to 420), so the game is as
 * tall as the space. Everything moves in whole ticks of the 60-a-second clock.
 */
export const FIELD_W = 224;
export const MIN_ROWS = 220;
export const MAX_ROWS = 420;
export const DEFAULT_ROWS = 256;
export const TICK_MS = 1000 / 60;

export const SWARM_COLS = 8;
export const SWARM_ROWS = 5;
export const ALIEN_SIZE = 8;
const ALIEN_PITCH_X = 16;
const ALIEN_PITCH_Y = 14;
/** Points for an alien, by its swarm row, top first. */
export const ROW_POINTS: readonly number[] = [30, 20, 20, 10, 10];

export const SHIP_W = 9;
export const SHIP_H = 6;
export const SHOT_H = 4;
export const SHIELD_COUNT = 4;
export const SHIELD_W = 20;
export const SHIELD_H = 12;

const START_LIVES = 3;
const SHIP_SPEED = 1.5;
const NUDGE = 8;
const SHOT_SPEED = 3.5;
const MAX_BOMBS = 3;
const BOOM_TICKS = 12;
const DYING_TICKS = 60;
const BANNER_TICKS = 84;
const FIRST_BOMB_TICKS = 72;
const MARCH_X = 3;
const MARCH_DROP = 6;

export interface Shot {
  readonly x: number;
  readonly y: number;
}

export interface Bomb {
  readonly x: number;
  readonly y: number;
  /** Ticks since it dropped: its zigzag. */
  readonly age: number;
}

export interface Boom {
  readonly x: number;
  readonly y: number;
  readonly ticks: number;
}

export interface Swarm {
  /** One flag per alien, row by row from the top. */
  readonly alive: readonly boolean[];
  /** The top-left corner of the whole formation. */
  readonly x: number;
  readonly y: number;
  readonly dir: 1 | -1;
  /** Its two-frame shuffle, flipped every march step. */
  readonly frame: 0 | 1;
  /** Ticks until the next march step. */
  readonly wait: number;
}

export interface BlasterState {
  readonly rows: number;
  /** The rows the main area has room for now. A game in play keeps its own; the next one uses these. */
  readonly nextRows: number;
  readonly status: BlasterStatus;
  readonly score: number;
  readonly lives: number;
  readonly wave: number;
  /** The ship's left edge. */
  readonly shipX: number;
  /** The move keys (or on-screen arrows) held down. */
  readonly held: { readonly left: boolean; readonly right: boolean };
  /** One shot at a time. */
  readonly shot: Shot | null;
  readonly swarm: Swarm;
  readonly bombs: readonly Bomb[];
  readonly bombWait: number;
  /** Each shield's pixels, row by row, SHIELD_W by SHIELD_H; a hit wears a few away. */
  readonly shields: readonly (readonly boolean[])[];
  readonly booms: readonly Boom[];
  /** Ticks left of the ship's explosion after a hit; nothing moves until it's over. */
  readonly dying: number;
  /** Ticks left of the WAVE banner between waves. */
  readonly banner: number;
  /** Bombs and the wear on the shields come from this seed, so a game replays exactly. */
  readonly seed: number;
}

/** The green line the ship rides on, and where the ship and the shields sit above it. */
export const groundOf = (rows: number): number => rows - 12;
export const shipTopOf = (rows: number): number => groundOf(rows) - 14;
export const shieldTopOf = (rows: number): number => groundOf(rows) - 44;
export const shieldLeftOf = (index: number): number => 22 + index * 50;
export const START_X = Math.floor((FIELD_W - SHIP_W) / 2);

/** A shield: a block with its top corners rounded off and an arch cut underneath. */
export const SHIELD_SHAPE: readonly boolean[] = Array.from({ length: SHIELD_W * SHIELD_H }, (_, i) => {
  const x = i % SHIELD_W;
  const y = Math.floor(i / SHIELD_W);
  const corner = y < 3 && (x < 3 - y || x > SHIELD_W - 4 + y);
  const arch = y > 7 && x > 5 && x < 14;
  return !corner && !arch;
});

/** Where alien `index` (row by row from the top) is now. */
export function alienBox(swarm: Swarm, index: number): { x: number; y: number } {
  const col = index % SWARM_COLS;
  const row = Math.floor(index / SWARM_COLS);
  return { x: swarm.x + col * ALIEN_PITCH_X, y: swarm.y + row * ALIEN_PITCH_Y };
}

/** The swarm row an alien is in, top first: its sprite and its points. */
export const alienRow = (index: number): number => Math.floor(index / SWARM_COLS);

/** Ticks between march steps: slower with a full swarm, faster as it thins and with each wave; never under 3. */
export function marchTicks(aliveCount: number, wave: number): number {
  const seconds = (0.06 + 0.7 * Math.pow(aliveCount / (SWARM_COLS * SWARM_ROWS), 1.3)) / (1 + (wave - 1) * 0.15);
  return Math.max(3, Math.round(seconds * 60));
}

/** A fresh formation for `wave`: starting a little lower each wave, down to a floor. */
function newSwarm(wave: number): Swarm {
  const alive = Array.from({ length: SWARM_COLS * SWARM_ROWS }, () => true);
  return { alive, x: 24, y: Math.min(40 + (wave - 1) * 8, 88), dir: 1, frame: 0, wait: marchTicks(alive.length, wave) };
}

const newShields = (): readonly (readonly boolean[])[] => Array.from({ length: SHIELD_COUNT }, () => SHIELD_SHAPE);

/**
 * How big one field pixel is in CSS pixels for a main area `width` by `height`. Whole pixels (2x or more) wherever
 * the width allows; about one more step per 300 rows of height, and 2x whenever 220 rows fit. A phone, under 2x
 * across, takes the width it has.
 */
function pixelFor(width: number, height: number): number {
  const across = width / FIELD_W;
  if (across < 2) return Math.max(0.5, Math.min(across, height / MIN_ROWS));
  const tall = Math.max(Math.floor(height / 300), height >= 2 * MIN_ROWS ? 2 : 1);
  return Math.max(1, Math.min(Math.floor(across), tall));
}

/** How many rows a new game gets in a main area `width` by `height`: as many as fit, 220 to 420. */
export function rowsFor(width: number, height: number): number {
  if (width <= 0 || height <= 0) return DEFAULT_ROWS;
  return Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(height / pixelFor(width, height))));
}

/** The size of one field pixel to show `rows` rows in `width` by `height`: whole pixels from 2x up, else what fits. */
export function scaleFor(width: number, height: number, rows: number): number {
  if (width <= 0 || height <= 0) return 0;
  const fit = Math.min(width / FIELD_W, height / rows);
  return fit >= 2 ? Math.floor(fit) : fit;
}

/** A new game: the ship in the middle, a full swarm, four whole shields. */
export function createBlaster({ seed, rows = DEFAULT_ROWS }: { seed: number; rows?: number }): BlasterState {
  return {
    rows,
    nextRows: rows,
    status: 'ready',
    score: 0,
    lives: START_LIVES,
    wave: 1,
    shipX: START_X,
    held: { left: false, right: false },
    shot: null,
    swarm: newSwarm(1),
    bombs: [],
    bombWait: FIRST_BOMB_TICKS,
    shields: newShields(),
    booms: [],
    dying: 0,
    banner: 0,
    seed,
  };
}

/** The main area has room for `rows` now: a game nobody has started takes them at once, a game in play waits. */
export function resize(state: BlasterState, rows: number): BlasterState {
  if (state.status === 'ready') return rows === state.rows ? state : createBlaster({ seed: state.seed, rows });
  return rows === state.nextRows ? state : { ...state, nextRows: rows };
}

/** Pressing a move key starts a ready game and resumes a paused one, as Snake's arrows do. */
const awake = (status: BlasterStatus): BlasterStatus => (status === 'ready' || status === 'paused' ? 'running' : status);

const clampShip = (x: number): number => Math.max(4, Math.min(FIELD_W - SHIP_W - 4, x));

/** A move key (or on-screen arrow) going down or up. */
export function hold(state: BlasterState, side: Side, down: boolean): BlasterState {
  if (state.status === 'over') return state;
  const held = { ...state.held, [side]: down };
  return { ...state, held, status: down ? awake(state.status) : state.status };
}

/** One small step, for an on-screen arrow pressed from the keyboard (Enter), where there is no holding. */
export function nudge(state: BlasterState, side: Side): BlasterState {
  if (state.status === 'over') return state;
  const shipX = clampShip(state.shipX + (side === 'left' ? -NUDGE : NUDGE));
  return { ...state, shipX, status: awake(state.status) };
}

/** Space (or Fire): starts a ready game, resumes a paused one, and in play fires, one shot at a time. */
export function fire(state: BlasterState): BlasterState {
  if (state.status === 'ready' || state.status === 'paused') return { ...state, status: 'running' };
  if (state.status !== 'running' || state.shot || state.dying > 0 || state.banner > 0) return state;
  return { ...state, shot: { x: state.shipX + Math.floor(SHIP_W / 2), y: shipTopOf(state.rows) - SHOT_H } };
}

const LET_GO = { left: false, right: false } as const;

/** P (or the Pause button): pause a running game, resume a paused one. */
export function togglePause(state: BlasterState): BlasterState {
  if (state.status === 'running') return { ...state, status: 'paused', held: LET_GO };
  if (state.status === 'paused') return { ...state, status: 'running' };
  return state;
}

/** Losing focus or hiding the tab: pause a running game, and let go of the keys (their key-up may never come). */
export function pause(state: BlasterState): BlasterState {
  if (state.status === 'running') return { ...state, status: 'paused', held: LET_GO };
  return state.held.left || state.held.right ? { ...state, held: LET_GO } : state;
}

/**
 * A hit at (x, y) on a shield: if it lands on a shield pixel, that pixel and some of those around it (a 5 by 5
 * patch, about two in three, from the seed) wear away. Returns null when it hits no shield.
 */
function wear(state: BlasterState, x: number, y: number): { shields: BlasterState['shields']; seed: number } | null {
  const ly = Math.floor(y - shieldTopOf(state.rows));
  if (ly < 0 || ly >= SHIELD_H) return null;
  for (let index = 0; index < SHIELD_COUNT; index += 1) {
    const lx = Math.floor(x - shieldLeftOf(index));
    const pixels = state.shields[index]!;
    if (lx < 0 || lx >= SHIELD_W || !pixels[ly * SHIELD_W + lx]) continue;
    const next = [...pixels];
    let seed = state.seed;
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const px = lx + dx;
        const py = ly + dy;
        if (px < 0 || px >= SHIELD_W || py < 0 || py >= SHIELD_H) continue;
        const roll = nextRandom(seed);
        seed = roll.seed;
        if ((dx === 0 && dy === 0) || roll.value < 0.65) next[py * SHIELD_W + px] = false;
      }
    }
    return { shields: state.shields.map((shield, i) => (i === index ? next : shield)), seed };
  }
  return null;
}

function moveShip(state: BlasterState): BlasterState {
  const step = (state.held.right ? SHIP_SPEED : 0) - (state.held.left ? SHIP_SPEED : 0);
  return step === 0 ? state : { ...state, shipX: clampShip(state.shipX + step) };
}

/** The shot climbs: it ends off the top, on a shield, on an alien (scoring it) or on a bomb (both go). */
function moveShot(state: BlasterState): BlasterState {
  if (!state.shot) return state;
  const shot = { x: state.shot.x, y: state.shot.y - SHOT_SPEED };
  if (shot.y + SHOT_H < 0) return { ...state, shot: null };
  const worn = wear(state, shot.x, shot.y);
  if (worn) return { ...state, ...worn, shot: null };
  const { swarm } = state;
  const hit = swarm.alive.findIndex((alive, i) => {
    if (!alive) return false;
    const box = alienBox(swarm, i);
    return shot.x >= box.x && shot.x < box.x + ALIEN_SIZE && shot.y < box.y + ALIEN_SIZE && shot.y + SHOT_H > box.y;
  });
  if (hit >= 0) {
    const box = alienBox(swarm, hit);
    return {
      ...state,
      shot: null,
      score: state.score + ROW_POINTS[alienRow(hit)]!,
      swarm: { ...swarm, alive: swarm.alive.map((alive, i) => alive && i !== hit) },
      booms: [...state.booms, { x: box.x, y: box.y, ticks: BOOM_TICKS }],
    };
  }
  const bomb = state.bombs.findIndex((b) => Math.abs(b.x - shot.x) < 3 && Math.abs(b.y - shot.y) < 5);
  if (bomb >= 0) return { ...state, shot: null, bombs: state.bombs.filter((_, i) => i !== bomb) };
  return { ...state, shot };
}

/** Clears every shield pixel an alien now covers: the swarm chews through what it reaches. */
function chew(shields: BlasterState['shields'], swarm: Swarm, living: readonly number[], rows: number): BlasterState['shields'] {
  const top = shieldTopOf(rows);
  return shields.map((pixels, index) => {
    const left = shieldLeftOf(index);
    let next: boolean[] | null = null;
    for (const i of living) {
      const box = alienBox(swarm, i);
      for (let y = Math.max(0, box.y - top); y < Math.min(SHIELD_H, box.y + ALIEN_SIZE - top); y += 1) {
        for (let x = Math.max(0, box.x - left); x < Math.min(SHIELD_W, box.x + ALIEN_SIZE - left); x += 1) {
          if (!(next ?? pixels)[y * SHIELD_W + x]) continue;
          next ??= [...pixels];
          next[y * SHIELD_W + x] = false;
        }
      }
    }
    return next ?? pixels;
  });
}

/**
 * Every few ticks the swarm steps sideways, or drops a row and turns at an edge. It chews through any shield it
 * reaches, and if it gets down to the ship's level the game is over.
 */
function march(state: BlasterState): BlasterState {
  const { swarm } = state;
  if (swarm.wait > 1) return { ...state, swarm: { ...swarm, wait: swarm.wait - 1 } };
  const living = swarm.alive.flatMap((alive, i) => (alive ? [i] : []));
  const xs = living.map((i) => alienBox(swarm, i).x);
  const turn = Math.min(...xs) + swarm.dir * MARCH_X < 4 || Math.max(...xs) + ALIEN_SIZE + swarm.dir * MARCH_X > FIELD_W - 4;
  const moved: Swarm = {
    ...swarm,
    x: turn ? swarm.x : swarm.x + swarm.dir * MARCH_X,
    y: turn ? swarm.y + MARCH_DROP : swarm.y,
    dir: turn ? (swarm.dir === 1 ? -1 : 1) : swarm.dir,
    frame: swarm.frame === 0 ? 1 : 0,
    wait: marchTicks(living.length, state.wave),
  };
  const landed = living.some((i) => alienBox(moved, i).y + ALIEN_SIZE >= groundOf(state.rows) - 10);
  return { ...state, swarm: moved, shields: chew(state.shields, moved, living, state.rows), status: landed ? 'over' : state.status };
}

/** Now and then the lowest alien in a random column drops a bomb; at most three are falling at once. */
function dropBombs(state: BlasterState): BlasterState {
  if (state.bombWait > 1) return { ...state, bombWait: state.bombWait - 1 };
  if (state.bombs.length >= MAX_BOMBS) return state;
  const { swarm } = state;
  const columns = [...new Set(swarm.alive.flatMap((alive, i) => (alive ? [i % SWARM_COLS] : [])))];
  const pick = randomInt(state.seed, columns.length);
  const column = columns[pick.value]!;
  let lowest = column;
  for (let i = column; i < swarm.alive.length; i += SWARM_COLS) if (swarm.alive[i]) lowest = i;
  const box = alienBox(swarm, lowest);
  const gap = nextRandom(pick.seed);
  const seconds = Math.max(0.35, 1.1 - state.wave * 0.08) * (0.6 + gap.value * 0.8);
  return {
    ...state,
    bombs: [...state.bombs, { x: box.x + ALIEN_SIZE / 2, y: box.y + ALIEN_SIZE, age: 0 }],
    bombWait: Math.max(1, Math.round(seconds * 60)),
    seed: gap.seed,
  };
}

/** Bombs fall: one ends on the ground or a shield, and one that hits the ship costs a life. */
function moveBombs(state: BlasterState): BlasterState {
  const speed = (80 + state.wave * 6) / 60;
  const ground = groundOf(state.rows);
  const shipTop = shipTopOf(state.rows);
  let next: BlasterState = state;
  const falling: Bomb[] = [];
  for (const bomb of state.bombs) {
    const moved = { x: bomb.x, y: bomb.y + speed, age: bomb.age + 1 };
    if (moved.y > ground) continue;
    const worn = wear(next, moved.x, moved.y + 4);
    if (worn) {
      next = { ...next, ...worn };
      continue;
    }
    if (moved.x >= next.shipX && moved.x <= next.shipX + SHIP_W && moved.y + 4 >= shipTop && moved.y <= shipTop + SHIP_H) {
      return { ...next, lives: next.lives - 1, dying: DYING_TICKS, bombs: [], shot: null };
    }
    falling.push(moved);
  }
  return { ...next, bombs: falling };
}

const ageBooms = (booms: readonly Boom[]): readonly Boom[] =>
  booms.length === 0 ? booms : booms.flatMap((boom) => (boom.ticks > 1 ? [{ ...boom, ticks: boom.ticks - 1 }] : []));

/** One tick of the clock. Only a running game moves; a hit, or a new wave's banner, holds everything still a moment. */
export function tick(state: BlasterState): BlasterState {
  if (state.status !== 'running') return state;
  if (state.banner > 0) return { ...state, banner: state.banner - 1 };
  const booms = ageBooms(state.booms);
  if (state.dying > 0) {
    const dying = state.dying - 1;
    if (dying > 0) return { ...state, booms, dying };
    if (state.lives <= 0) return { ...state, booms, dying: 0, status: 'over' };
    return { ...state, booms, dying: 0, shipX: START_X };
  }
  const shot = moveShot(moveShip({ ...state, booms }));
  if (!shot.swarm.alive.some(Boolean)) {
    const wave = shot.wave + 1;
    return { ...shot, wave, swarm: newSwarm(wave), shot: null, bombs: [], bombWait: FIRST_BOMB_TICKS, banner: BANNER_TICKS };
  }
  const marched = march(shot);
  return marched.status === 'over' ? marched : moveBombs(dropBombs(marched));
}

/** Milliseconds per tick: a 60-a-second clock, or 1.6 times as long in slow speed. */
export const tickMs = (slow = false): number => (slow ? TICK_MS * 1.6 : TICK_MS);

export type BlasterAction =
  | { type: 'hold'; side: Side; down: boolean }
  | { type: 'nudge'; side: Side }
  | { type: 'fire' }
  | { type: 'tick' }
  | { type: 'togglePause' }
  | { type: 'pause' }
  | { type: 'resize'; rows: number }
  | { type: 'restart'; seed: number };

export function blasterReducer(state: BlasterState, action: BlasterAction): BlasterState {
  switch (action.type) {
    case 'hold':
      return hold(state, action.side, action.down);
    case 'nudge':
      return nudge(state, action.side);
    case 'fire':
      return fire(state);
    case 'tick':
      return tick(state);
    case 'togglePause':
      return togglePause(state);
    case 'pause':
      return pause(state);
    case 'resize':
      return resize(state, action.rows);
    case 'restart':
      return createBlaster({ seed: action.seed, rows: state.nextRows });
  }
}
