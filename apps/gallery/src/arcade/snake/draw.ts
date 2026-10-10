import { boardBox, drawBanner, drawSprite, fillBoard } from '../draw';
import type { Size } from '../draw';
import type { Palette } from '../palette';
import { GEM } from '../sprites';
import type { Dir } from '../grid';
import type { SnakeState } from './engine';

/** The banner over the board for each state; none while the snake runs. */
export function snakeBanner(state: SnakeState, touch: boolean): string[] {
  if (state.status === 'ready') return ['SNAKE', touch ? 'TAP AN ARROW' : 'PRESS AN ARROW'];
  if (state.status === 'paused') return ['PAUSED'];
  if (state.status === 'over') return ['GAME OVER', `SCORE ${state.score}`];
  return [];
}

/** Where the two eyes sit in the head (in eighths of a cell), by heading. */
const EYES: Readonly<Record<Dir, readonly [number, number, number, number]>> = {
  right: [5, 2, 5, 5],
  left: [2, 2, 2, 5],
  up: [2, 2, 5, 2],
  down: [2, 5, 5, 5],
};

/** The board: a faint checker, the frame, the gem, the snake (head with eyes), and the banner. */
export function paintSnake(ctx: CanvasRenderingContext2D, size: Size, palette: Palette, state: SnakeState, touch: boolean): void {
  fillBoard(ctx, size, palette);
  const { x, y, cell } = boardBox(size, state.cols, state.rows, 3);
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = palette.line;
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = (row % 2) as number; col < state.cols; col += 2) ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 1, y - 1, cell * state.cols + 2, cell * state.rows + 2);
  if (state.food) {
    const colors = { '#': palette.food, k: palette.line, o: palette.board };
    drawSprite(ctx, GEM, colors, { x: x + state.food.x * cell, y: y + state.food.y * cell, size: cell });
  }
  ctx.fillStyle = palette.snake;
  for (const part of state.body) ctx.fillRect(x + part.x * cell + 1, y + part.y * cell + 1, cell - 2, cell - 2);
  const head = state.body[0];
  if (head) {
    const eye = Math.max(1, Math.round(cell / 6));
    const [ax, ay, bx, by] = EYES[state.dir];
    ctx.fillStyle = palette.board;
    for (const [ex, ey] of [[ax, ay], [bx, by]] as const) {
      ctx.fillRect(x + head.x * cell + Math.round((ex * cell) / 8), y + head.y * cell + Math.round((ey * cell) / 8), eye, eye);
    }
  }
  drawBanner(ctx, size, palette, snakeBanner(state, touch), state.status === 'ready' ? 'bottom' : 'middle');
}
