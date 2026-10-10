import { BOARD_INSET, boardBox, drawBanner, drawSprite, fillBoard } from '../draw';
import type { Size } from '../draw';
import type { Palette } from '../palette';
import { CAT, CHEESE, RAT } from '../sprites';
import { canMove } from './maze';
import type { CheeseState } from './engine';

/** The banner over the maze for each state; none while the rat runs. */
export function cheeseBanner(state: CheeseState, touch: boolean): string[] {
  const go = touch ? 'TAP AN ARROW' : 'PRESS AN ARROW';
  if (state.status === 'paused') return ['PAUSED'];
  if (state.status === 'over') return ['GAME OVER', `SCORE ${state.score}`];
  if (state.status !== 'ready') return [];
  if (state.event?.kind === 'caught') return ['CAUGHT!', go];
  if (state.event?.kind === 'timeout') return ['TIME UP!', go];
  return [`LEVEL ${state.level}`, go];
}

/** The maze: floor, walls in the line color, the cheese, the cat and the rat, then the banner. */
export function paintCheese(ctx: CanvasRenderingContext2D, size: Size, palette: Palette, state: CheeseState, touch: boolean): void {
  fillBoard(ctx, size, palette);
  const { maze } = state;
  const { x, y, cell } = boardBox(size, maze.cols, maze.rows, BOARD_INSET);
  const wall = Math.max(2, Math.round(cell / 7));
  const pad = Math.max(1, Math.round(cell / 8));
  const sprite = (p: { x: number; y: number }) => ({ x: x + p.x * cell + pad, y: y + p.y * cell + pad, size: cell - 2 * pad });

  drawSprite(ctx, CHEESE, { '#': palette.cheese, k: palette.line, o: palette.board }, sprite(state.cheese));
  if (state.cat) drawSprite(ctx, CAT, { '#': palette.cat, o: palette.board }, sprite(state.cat.pos));
  drawSprite(ctx, RAT, { '#': palette.rat, o: palette.board }, sprite(state.rat), state.facing === 'left');

  ctx.fillStyle = palette.line;
  const half = Math.floor(wall / 2);
  for (let row = 0; row < maze.rows; row += 1) {
    for (let col = 0; col < maze.cols; col += 1) {
      const left = x + col * cell;
      const top = y + row * cell;
      const p = { x: col, y: row };
      if (!canMove(maze, p, 'up')) ctx.fillRect(left - half, top - half, cell + wall, wall);
      if (!canMove(maze, p, 'left')) ctx.fillRect(left - half, top - half, wall, cell + wall);
      if (row === maze.rows - 1 && !canMove(maze, p, 'down')) ctx.fillRect(left - half, top + cell - half, cell + wall, wall);
      if (col === maze.cols - 1 && !canMove(maze, p, 'right')) ctx.fillRect(left + cell - half, top - half, wall, cell + wall);
    }
  }
  drawBanner(ctx, size, palette, cheeseBanner(state, touch), state.status === 'ready' ? 'bottom' : 'middle');
}
