/** The most blocks the blocks variant draws. More steps than this share blocks. */
export const MAX_BLOCKS = 20;

/** Decimal places in a number, so step arithmetic can round away float noise (0.1 + 0.2). */
function decimals(n: number): number {
  const text = String(n);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * The value a native range input settles on: snapped to the nearest step from min, then kept between min and the
 * last step at or under max. A max under min counts as min, as in the browser. Not a number gives min.
 */
export function snapValue(value: number, min: number, max: number, step: number): number {
  const top = Math.max(min, max);
  const size = step > 0 ? step : 1;
  const places = Math.max(decimals(size), decimals(min));
  const round = (n: number) => Number(n.toFixed(places));
  const steps = Math.floor(round((top - min) / size));
  const lastStep = round(min + steps * size);
  if (!Number.isFinite(value)) return min;
  const snapped = round(min + Math.round((value - min) / size) * size);
  return Math.min(Math.max(snapped, min), lastStep);
}

/** How far along the range a value is, from 0 to 1. A range with no width is 0. */
export function fractionOf(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

/** Whole steps from min to max: 0 to 10 by 1 is 10, 0 to 10 by 3 is 3. */
export function stepCount(min: number, max: number, step: number): number {
  if (max <= min || !(step > 0)) return 0;
  return Math.floor((max - min) / step + 1e-9);
}

/** How many blocks to draw: one per step, at least 1 and at most MAX_BLOCKS. */
export function blockCount(min: number, max: number, step: number): number {
  return Math.min(Math.max(stepCount(min, max, step), 1), MAX_BLOCKS);
}

/** How many blocks a fraction lights. Any value over min lights at least one, so a shared block shows it. */
export function litBlocks(fraction: number, count: number): number {
  return Math.min(Math.max(Math.ceil(fraction * count - 1e-9), 0), count);
}

/** The edges of the first and last block on screen, and whether they run right to left. */
export interface BlockEdges {
  first: { left: number; right: number };
  last: { left: number; right: number };
  rtl: boolean;
}

/**
 * The block under a pointer, from 0 (before the first block) to count. A pointer anywhere on block k picks k,
 * so a click lights the block clicked.
 */
export function blockAt(clientX: number, { first, last, rtl }: BlockEdges, count: number): number {
  const start = rtl ? first.right : first.left;
  const end = rtl ? last.left : last.right;
  const span = Math.abs(end - start);
  if (span === 0) return 0;
  const along = rtl ? start - clientX : clientX - start;
  return Math.min(Math.max(Math.ceil((along / span) * count), 0), count);
}
