import { nextRandom } from './random';

/**
 * The pixel swipe between the page and a stage game (owner's pick, 2026-10-11: "B, ragged edge"). The main area is
 * cut into 16px cells; each turns black at its own moment, by its column with a little jitter, so a ragged edge
 * sweeps left to right with a lilac glint along it. Closing runs the same pattern mirrored: the black leaves right
 * to left. Pure, so the timing can be tested; the stage paints it on a canvas.
 */
export const SWIPE_CELL = 16;
export const SWIPE_MS = 620;
/** How close to its moment a cell is drawn in the edge color. */
const EDGE = 0.07;
/** The column decides most of a cell's moment, the jitter the rest: 0 to 0.85 in all. */
const BY_COLUMN = 0.7;
const JITTER = 0.15;
/** The swipe moves in 15 steps, not smoothly, for a console's chunky feel. */
const STEPS = 15;

export type SwipeWay = 'in' | 'out';
export type CellLook = 'clear' | 'edge' | 'black';

/** How far through the swipe `elapsed` milliseconds is, 0 to 1, in whole steps; 1 once it's over. */
export function swipeProgress(elapsed: number): number {
  if (elapsed >= SWIPE_MS) return 1;
  return Math.floor((Math.max(0, elapsed) / SWIPE_MS) * STEPS) / STEPS;
}

/** Each cell's moment, row by row: in, by its column from the left; out, mirrored, from the right. */
export function swipeMoments(cols: number, rows: number, way: SwipeWay, seed: number): number[] {
  const moments: number[] = [];
  let next = seed;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const roll = nextRandom(next);
      next = roll.seed;
      const along = way === 'in' ? col : cols - 1 - col;
      moments.push((along / Math.max(1, cols)) * BY_COLUMN + roll.value * JITTER);
    }
  }
  return moments;
}

/** A cell at `progress`: in, black once its moment has passed; out, black until it does. Near its moment, the edge. */
export function cellLook(progress: number, moment: number, way: SwipeWay): CellLook {
  const black = way === 'in' ? progress > moment : progress <= moment;
  if (!black) return 'clear';
  return Math.abs(progress - moment) < EDGE ? 'edge' : 'black';
}
