/** Grid basics both games share: points, the four directions, and the keys that turn into them. */

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const DIRS: readonly Dir[] = ['up', 'right', 'down', 'left'];

export const DELTA: Readonly<Record<Dir, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Readonly<Record<Dir, Dir>> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Arrow keys and WASD (either case). */
const KEY_DIRS: Readonly<Record<string, Dir>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/** The direction a key turns to, or null for any other key. */
export function keyToDir(key: string): Dir | null {
  return KEY_DIRS[key] ?? KEY_DIRS[key.toLowerCase()] ?? null;
}

/** The point one cell away in `dir`. */
export const stepPoint = (p: Point, dir: Dir): Point => ({ x: p.x + DELTA[dir].x, y: p.y + DELTA[dir].y });

export const samePoint = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

export const inBounds = (p: Point, cols: number, rows: number): boolean => p.x >= 0 && p.y >= 0 && p.x < cols && p.y < rows;
