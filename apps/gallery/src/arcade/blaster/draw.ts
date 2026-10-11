import { drawBanner } from '../draw';
import type { Size } from '../draw';
import type { Palette } from '../palette';
import { alienBox, alienRow, FIELD_W, groundOf, SHIELD_W, shieldLeftOf, shieldTopOf, SHOT_H, shipTopOf } from './engine';
import type { BlasterState } from './engine';
import { ALIEN_ROWS, BOOM, SHIP } from './sprites';

/** The banner over the field for each state; none while the game runs, except a new wave's number. */
export function blasterBanner(state: BlasterState, touch: boolean): string[] {
  if (state.status === 'ready') return ['BIT BLASTER', touch ? 'TAP FIRE' : 'PRESS SPACE'];
  if (state.status === 'paused') return ['PAUSED'];
  if (state.status === 'over') return ['GAME OVER', `SCORE ${state.score}`];
  if (state.banner > 0) return [`WAVE ${state.wave}`];
  return [];
}

/**
 * The field: space, the ground with the spare ships under it, the shields, the swarm, any bursts, the ship, the shot,
 * the bombs, and the banner. `size` is the board in CSS pixels, FIELD_W field pixels across. Every field pixel's
 * edges land on whole screen pixels (at `ratio`), so the art stays crisp at a phone's in-between sizes too.
 */
export function paintBlaster(
  ctx: CanvasRenderingContext2D,
  size: Size,
  palette: Palette,
  state: BlasterState,
  touch: boolean,
  ratio = window.devicePixelRatio || 1,
): void {
  const pixel = size.width / FIELD_W;
  const snap = (v: number) => Math.round(v * pixel * ratio) / ratio;
  const block = (x: number, y: number, w: number, h: number) => {
    const left = snap(x);
    const top = snap(y);
    ctx.fillRect(left, top, snap(x + w) - left, snap(y + h) - top);
  };
  const sprite = (rows: readonly string[], x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c += 1) if (row[c] === '#') block(Math.round(x) + c, Math.round(y) + r, 1, 1);
    });
  };

  ctx.fillStyle = palette.space;
  ctx.fillRect(0, 0, size.width, size.height);
  const ground = groundOf(state.rows);
  ctx.fillStyle = palette.shield;
  block(0, ground, FIELD_W, 1);
  for (let i = 0; i < state.lives - 1; i += 1) sprite(SHIP, 6 + i * 13, ground + 4, palette.line);

  ctx.fillStyle = palette.shield;
  const shieldTop = shieldTopOf(state.rows);
  state.shields.forEach((pixels, index) => {
    pixels.forEach((on, i) => {
      if (on) block(shieldLeftOf(index) + (i % SHIELD_W), shieldTop + Math.floor(i / SHIELD_W), 1, 1);
    });
  });

  const rowColors = [palette.alienTop, palette.alienMid, palette.alienMid, palette.alienLow, palette.alienLow];
  state.swarm.alive.forEach((alive, i) => {
    if (!alive) return;
    const { x, y } = alienBox(state.swarm, i);
    const row = alienRow(i);
    sprite(ALIEN_ROWS[row]![state.swarm.frame]!, x, y, rowColors[row]!);
  });
  for (const boom of state.booms) sprite(BOOM, boom.x, boom.y, palette.text);

  const shipTop = shipTopOf(state.rows);
  if (state.dying === 0) sprite(SHIP, state.shipX, shipTop, palette.text);
  // A hit ship flickers as a burst, about five times a second.
  else if (Math.floor(state.dying / 6) % 2 === 1) sprite(BOOM, state.shipX, shipTop - 2, palette.alienTop);

  if (state.shot) {
    ctx.fillStyle = palette.text;
    block(Math.round(state.shot.x), Math.round(state.shot.y), 1, SHOT_H);
  }
  ctx.fillStyle = palette.alienLow;
  for (const bomb of state.bombs) {
    // A zigzag: the lower half steps a pixel left and right as it falls.
    const zig = Math.floor(bomb.age / 5) % 2;
    const x = Math.round(bomb.x);
    const y = Math.round(bomb.y);
    block(x, y, 1, 2);
    block(x + (zig ? 1 : -1), y + 2, 1, 2);
  }

  drawBanner(ctx, size, palette, blasterBanner(state, touch));
}
