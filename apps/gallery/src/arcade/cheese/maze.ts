import { DIRS, inBounds, OPPOSITE, stepPoint } from '../grid';
import type { Dir, Point } from '../grid';
import { randomInt } from '../random';

/** One bit per side a cell is open on. A wall is a side whose bit is clear. */
export const OPEN: Readonly<Record<Dir, number>> = { up: 1, right: 2, down: 4, left: 8 };

export interface Maze {
  readonly cols: number;
  readonly rows: number;
  /** Row by row, each cell's OPEN bits. */
  readonly cells: readonly number[];
}

const indexOf = (maze: Pick<Maze, 'cols'>, p: Point) => p.y * maze.cols + p.x;

/** True when the rat (or the cat) can step from `p` toward `dir`: inside the maze and no wall between. */
export function canMove(maze: Maze, p: Point, dir: Dir): boolean {
  return inBounds(p, maze.cols, maze.rows) && ((maze.cells[indexOf(maze, p)] ?? 0) & OPEN[dir]) !== 0;
}

/** The cells one step from `p` with no wall between. */
export function openNeighbors(maze: Maze, p: Point): Point[] {
  return DIRS.filter((dir) => canMove(maze, p, dir)).map((dir) => stepPoint(p, dir));
}

/**
 * A perfect maze (exactly one path between any two cells) by the recursive backtracker, run with an explicit
 * stack: walk to a random unvisited neighbour, knocking the wall down, and back up when there is none.
 */
export function generateMaze(cols: number, rows: number, seed: number): Maze {
  const cells = new Array<number>(cols * rows).fill(0);
  const visited = new Array<boolean>(cols * rows).fill(false);
  const stack: Point[] = [{ x: 0, y: 0 }];
  visited[0] = true;
  let rng = seed;
  while (stack.length > 0) {
    const here = stack[stack.length - 1]!;
    const options = DIRS.filter((dir) => {
      const next = stepPoint(here, dir);
      return inBounds(next, cols, rows) && !visited[next.y * cols + next.x];
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const pick = randomInt(rng, options.length);
    rng = pick.seed;
    const dir = options[pick.value]!;
    const next = stepPoint(here, dir);
    cells[here.y * cols + here.x]! |= OPEN[dir];
    cells[next.y * cols + next.x]! |= OPEN[OPPOSITE[dir]];
    visited[next.y * cols + next.x] = true;
    stack.push(next);
  }
  return { cols, rows, cells };
}

/** Steps from `from` to every cell (breadth first); -1 for a cell that can't be reached. */
export function distancesFrom(maze: Maze, from: Point): number[] {
  const dist = new Array<number>(maze.cols * maze.rows).fill(-1);
  dist[indexOf(maze, from)] = 0;
  const queue: Point[] = [from];
  for (let head = 0; head < queue.length; head += 1) {
    const here = queue[head]!;
    for (const next of openNeighbors(maze, here)) {
      const i = indexOf(maze, next);
      if (dist[i] !== -1) continue;
      dist[i] = dist[indexOf(maze, here)]! + 1;
      queue.push(next);
    }
  }
  return dist;
}

/** The cell farthest from `from` by path (the first one found on a tie): where the cheese goes. */
export function farthestCell(maze: Maze, from: Point): Point {
  const dist = distancesFrom(maze, from);
  const best = dist.reduce((bestIndex, d, i) => (d > dist[bestIndex]! ? i : bestIndex), 0);
  return { x: best % maze.cols, y: Math.floor(best / maze.cols) };
}

/** The cells from `from` to `to`, both included, along the maze's paths; empty when there is no way through. */
export function shortestPath(maze: Maze, from: Point, to: Point): Point[] {
  const dist = distancesFrom(maze, to);
  if (dist[indexOf(maze, from)] === -1) return [];
  // Walk downhill from `from` toward `to`: each step goes to a neighbour one closer.
  const path: Point[] = [from];
  let here = from;
  while (dist[indexOf(maze, here)] !== 0) {
    const d = dist[indexOf(maze, here)]!;
    here = openNeighbors(maze, here).find((next) => dist[indexOf(maze, next)] === d - 1)!;
    path.push(here);
  }
  return path;
}
