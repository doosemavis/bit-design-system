import { describe, expect, it } from 'vitest';
import { recordingContext } from '../test/canvas';
import { boardBox, drawBanner, drawSprite } from './draw';
import type { Palette } from './palette';
import { SPRITES } from './sprites';
import { createSnake } from './snake/engine';
import { paintSnake, snakeBanner } from './snake/draw';
import { createCheeseRun, CAT_FROM_LEVEL } from './cheese/engine';
import { cheeseBanner, paintCheese } from './cheese/draw';

const PALETTE: Palette = {
  board: 'board',
  line: 'line',
  text: 'text',
  snake: 'snake',
  food: 'food',
  rat: 'rat',
  cheese: 'cheese',
  cat: 'cat',
  font: 'PixelFace',
};
const SIZE = { width: 180, height: 180 };

describe('pixel art', () => {
  it.each(Object.entries(SPRITES))('%s is 8 rows of 8, in the four known characters', (_, rows) => {
    expect(rows).toHaveLength(8);
    for (const row of rows) expect(row).toMatch(/^[.#ok]{8}$/);
  });

  it('draws one square per colored pixel, skips transparent ones, and mirrors when flipped', () => {
    const { ctx, calls } = recordingContext();
    drawSprite(ctx, ['#.', '.o'], { '#': 'red', o: 'blue' }, { x: 10, y: 20, size: 8 });
    expect(calls).toEqual([
      { op: 'fillRect', args: [10, 20, 4, 4], fillStyle: 'red' },
      { op: 'fillRect', args: [14, 24, 4, 4], fillStyle: 'blue' },
    ]);
    const flipped = recordingContext();
    drawSprite(flipped.ctx, ['#.', '..'], { '#': 'red' }, { x: 0, y: 0, size: 8 }, true);
    expect(flipped.calls[0]!.args).toEqual([4, 0, 4, 4]);
  });
});

describe('boardBox', () => {
  it('fits whole cells in the canvas and centers them', () => {
    expect(boardBox({ width: 100, height: 100 }, 7, 7)).toEqual({ x: 1, y: 1, cell: 14 });
    expect(boardBox({ width: 100, height: 60 }, 10, 10, 0).cell).toBe(6);
  });
});

describe('banners', () => {
  it('pick the largest 8px step that fits, in the pixel face, centered', () => {
    const { ctx, calls } = recordingContext();
    drawBanner(ctx, SIZE, PALETTE, ['PAUSED']);
    const text = calls.filter((c) => c.op === 'fillText');
    expect(text).toHaveLength(1);
    expect(text[0]!.args.slice(0, 2)).toEqual(['PAUSED', 90]);
    expect(text[0]!.fillStyle).toBe('text');
    expect(ctx.font).toBe('24px PixelFace');
  });

  it('sit along the bottom when asked, and draw nothing with no lines', () => {
    const middle = recordingContext();
    drawBanner(middle.ctx, SIZE, PALETTE, ['GO']);
    const bottom = recordingContext();
    drawBanner(bottom.ctx, SIZE, PALETTE, ['GO'], 'bottom');
    const topOf = (calls: typeof middle.calls) => calls[0]!.args[1] as number;
    expect(topOf(bottom.calls)).toBeGreaterThan(topOf(middle.calls));
    const none = recordingContext();
    drawBanner(none.ctx, SIZE, PALETTE, []);
    expect(none.calls).toEqual([]);
  });

  it('say what each state needs, with the touch wording on a touch screen', () => {
    const snake = createSnake({ seed: 1 });
    expect(snakeBanner(snake, false)).toEqual(['SNAKE', 'PRESS AN ARROW']);
    expect(snakeBanner(snake, true)).toEqual(['SNAKE', 'TAP AN ARROW']);
    expect(snakeBanner({ ...snake, status: 'running' }, false)).toEqual([]);
    expect(snakeBanner({ ...snake, status: 'paused' }, false)).toEqual(['PAUSED']);
    expect(snakeBanner({ ...snake, status: 'over', score: 4 }, false)).toEqual(['GAME OVER', 'SCORE 4']);
    const cheese = createCheeseRun({ seed: 1, level: 2 });
    expect(cheeseBanner(cheese, false)).toEqual(['LEVEL 2', 'PRESS AN ARROW']);
    expect(cheeseBanner({ ...cheese, event: { kind: 'caught' } }, true)).toEqual(['CAUGHT!', 'TAP AN ARROW']);
    expect(cheeseBanner({ ...cheese, event: { kind: 'timeout' } }, false)).toEqual(['TIME UP!', 'PRESS AN ARROW']);
    expect(cheeseBanner({ ...cheese, status: 'running' }, false)).toEqual([]);
    expect(cheeseBanner({ ...cheese, status: 'paused' }, false)).toEqual(['PAUSED']);
    expect(cheeseBanner({ ...cheese, status: 'over', score: 9 }, false)).toEqual(['GAME OVER', 'SCORE 9']);
  });
});

describe('paintSnake', () => {
  it('fills the board, draws every body part in the snake color, the gem in the food color, and the banner', () => {
    const { ctx, calls } = recordingContext();
    const state = createSnake({ seed: 2 });
    paintSnake(ctx, SIZE, PALETTE, state, false);
    expect(calls[0]).toEqual({ op: 'fillRect', args: [0, 0, 180, 180], fillStyle: 'board' });
    expect(calls.filter((c) => c.op === 'fillRect' && c.fillStyle === 'snake')).toHaveLength(state.body.length);
    expect(calls.some((c) => c.fillStyle === 'food')).toBe(true);
    expect(calls.filter((c) => c.op === 'fillText').map((c) => c.args[0])).toEqual(['SNAKE', 'PRESS AN ARROW']);
  });

  it('draws the eyes for every heading, and no gem once the board is full', () => {
    for (const dir of ['up', 'down', 'left', 'right'] as const) {
      const { ctx, calls } = recordingContext();
      paintSnake(ctx, SIZE, PALETTE, { ...createSnake({ seed: 2 }), dir, food: null, status: 'running' }, false);
      expect(calls.filter((c) => c.fillStyle === 'food')).toEqual([]);
      expect(calls.filter((c) => c.fillStyle === 'board' && c.op === 'fillRect').length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('paintCheese', () => {
  it('draws the cheese, the rat, walls in the line color, and from level 4 the cat', () => {
    const early = recordingContext();
    paintCheese(early.ctx, SIZE, PALETTE, createCheeseRun({ seed: 3 }), false);
    expect(early.calls.some((c) => c.fillStyle === 'cheese')).toBe(true);
    expect(early.calls.some((c) => c.fillStyle === 'rat')).toBe(true);
    expect(early.calls.some((c) => c.fillStyle === 'cat')).toBe(false);
    // A 7x7 perfect maze opens 48 of its 84 inner sides; the 28 outer sides are all walls.
    expect(early.calls.filter((c) => c.fillStyle === 'line' && c.op === 'fillRect').length).toBeGreaterThanOrEqual(36 + 28);
    const late = recordingContext();
    const withCat = createCheeseRun({ seed: 3, level: CAT_FROM_LEVEL });
    paintCheese(late.ctx, SIZE, PALETTE, { ...withCat, facing: 'left', status: 'running' }, true);
    expect(late.calls.some((c) => c.fillStyle === 'cat')).toBe(true);
    expect(late.calls.filter((c) => c.op === 'fillText')).toEqual([]);
  });
});
