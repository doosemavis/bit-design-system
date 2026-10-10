import type { Palette } from './palette';

export interface Size {
  readonly width: number;
  readonly height: number;
}

/** A square board of `cols` by `rows` cells, centered in the canvas, on whole pixels. */
export interface BoardBox {
  readonly x: number;
  readonly y: number;
  readonly cell: number;
}

export function boardBox(size: Size, cols: number, rows: number, inset = 0): BoardBox {
  const cell = Math.max(1, Math.floor(Math.min((size.width - 2 * inset) / cols, (size.height - 2 * inset) / rows)));
  return { x: Math.floor((size.width - cell * cols) / 2), y: Math.floor((size.height - cell * rows) / 2), cell };
}

export function fillBoard(ctx: CanvasRenderingContext2D, size: Size, palette: Palette): void {
  ctx.fillStyle = palette.board;
  ctx.fillRect(0, 0, size.width, size.height);
}

/**
 * An 8x8 (or any square) pixel pattern: one string per row, one character per pixel. '.' is transparent; every
 * other character is looked up in `colors`. Each pixel's edges are rounded to whole screen pixels so the art
 * stays crisp at any cell size. `flip` mirrors it left to right.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  colors: Readonly<Record<string, string>>,
  box: { x: number; y: number; size: number },
  flip = false,
): void {
  const n = rows.length;
  const edge = (i: number) => Math.round((i * box.size) / n);
  rows.forEach((row, y) => {
    [...row].forEach((char, i) => {
      const color = colors[char];
      if (char === '.' || !color) return;
      const x = flip ? n - 1 - i : i;
      ctx.fillStyle = color;
      ctx.fillRect(box.x + edge(x), box.y + edge(y), edge(x + 1) - edge(x), edge(y + 1) - edge(y));
    });
  });
}

/** The largest multiple of 8px (the pixel face's own grid) at which every line fits `maxWidth`; at least 8. */
function fitFont(ctx: CanvasRenderingContext2D, lines: readonly string[], font: string, maxWidth: number): number {
  for (let px = 24; px > 8; px -= 8) {
    ctx.font = `${px}px ${font}`;
    if (lines.every((line) => ctx.measureText(line).width <= maxWidth)) return px;
  }
  return 8;
}

/** Where a banner sits: across the middle, or along the bottom (so a ready screen doesn't hide the start). */
export type BannerPlace = 'middle' | 'bottom';

/**
 * A message band (READY, PAUSED, GAME OVER) in the pixel face: the board color with line-colored rules above and
 * below, the text in the text color. No flashing, no motion.
 */
export function drawBanner(
  ctx: CanvasRenderingContext2D,
  size: Size,
  palette: Palette,
  lines: readonly string[],
  place: BannerPlace = 'middle',
): void {
  if (lines.length === 0) return;
  const px = fitFont(ctx, lines, palette.font, size.width - 24);
  const lineHeight = Math.round(px * 1.75);
  const height = lineHeight * lines.length + px;
  const top = place === 'bottom' ? Math.round(size.height - height - 3) : Math.round((size.height - height) / 2);
  ctx.fillStyle = palette.board;
  ctx.fillRect(0, top, size.width, height);
  ctx.fillStyle = palette.line;
  ctx.fillRect(0, top - 3, size.width, 3);
  ctx.fillRect(0, top + height, size.width, 3);
  ctx.fillStyle = palette.text;
  ctx.font = `${px}px ${palette.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, size.width / 2, top + px / 2 + lineHeight * (i + 0.5)));
}
