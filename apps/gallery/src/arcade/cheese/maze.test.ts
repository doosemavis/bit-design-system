import { describe, expect, it } from 'vitest';
import { canMove, distancesFrom, farthestCell, generateMaze, OPEN, openNeighbors, shortestPath } from './maze';
import type { Maze } from './maze';
import { DIRS, OPPOSITE, stepPoint } from '../grid';

/** Count passages once each (right and down only), so a tree has exactly cells - 1. */
function passages(maze: Maze): number {
  return maze.cells.reduce((n, bits) => n + ((bits & OPEN.right) !== 0 ? 1 : 0) + ((bits & OPEN.down) !== 0 ? 1 : 0), 0);
}

describe('generateMaze', () => {
  it.each([
    [7, 7, 1],
    [10, 10, 42],
    [14, 14, -7],
    [5, 9, 123456],
    [7, 18, 3],
    [14, 42, 99],
  ])('%ix%i (seed %i) is a perfect maze: every cell reachable, one path between any two (a tree)', (cols, rows, seed) => {
    const maze = generateMaze(cols, rows, seed);
    expect(maze.cells).toHaveLength(cols * rows);
    expect(distancesFrom(maze, { x: 0, y: 0 }).every((d) => d >= 0)).toBe(true);
    expect(passages(maze)).toBe(cols * rows - 1);
  });

  it('walls agree from both sides, and the outer edge is closed', () => {
    const maze = generateMaze(9, 9, 5);
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        for (const dir of DIRS) {
          const next = stepPoint({ x, y }, dir);
          const inside = next.x >= 0 && next.y >= 0 && next.x < 9 && next.y < 9;
          if (!inside) expect(canMove(maze, { x, y }, dir)).toBe(false);
          else expect(canMove(maze, { x, y }, dir)).toBe(canMove(maze, next, OPPOSITE[dir]));
        }
      }
    }
  });

  it('is seeded: the same seed gives the same maze, another seed a different one', () => {
    expect(generateMaze(8, 8, 11)).toEqual(generateMaze(8, 8, 11));
    expect(generateMaze(8, 8, 11).cells).not.toEqual(generateMaze(8, 8, 12).cells);
  });

  it('cannot move from outside the maze', () => {
    expect(canMove(generateMaze(3, 3, 1), { x: -1, y: 0 }, 'right')).toBe(false);
  });
});

describe('maze paths', () => {
  const maze = generateMaze(10, 10, 3);
  const start = { x: 0, y: 0 };

  it('the farthest cell has the greatest path distance', () => {
    const far = farthestCell(maze, start);
    const dist = distancesFrom(maze, start);
    expect(dist[far.y * 10 + far.x]).toBe(Math.max(...dist));
  });

  it('shortestPath runs from start to goal through open neighbours only, one step at a time', () => {
    const goal = farthestCell(maze, start);
    const path = shortestPath(maze, start, goal);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);
    expect(path.length - 1).toBe(distancesFrom(maze, start)[goal.y * 10 + goal.x]);
    for (let i = 1; i < path.length; i += 1) expect(openNeighbors(maze, path[i - 1]!)).toContainEqual(path[i]);
  });

  it('a path to itself is one cell, and an unreachable goal has no path', () => {
    expect(shortestPath(maze, start, start)).toEqual([start]);
    const walled: Maze = { cols: 2, rows: 1, cells: [0, 0] };
    expect(shortestPath(walled, { x: 0, y: 0 }, { x: 1, y: 0 })).toEqual([]);
  });
});
