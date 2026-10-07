/** Anything with an optional `disabled` flag: an option, for moving the active row. */
interface Navigable {
  disabled?: boolean;
}

/** How many rows PageDown and PageUp move. */
export const PAGE_SIZE = 10;

/** The first enabled index at or after `from`, walking in `dir`; -1 when there is none. */
function scan(items: readonly Navigable[], from: number, dir: 1 | -1): number {
  for (let i = from; i >= 0 && i < items.length; i += dir) {
    if (!items[i]!.disabled) return i;
  }
  return -1;
}

export const firstEnabled = (items: readonly Navigable[]): number => scan(items, 0, 1);

export const lastEnabled = (items: readonly Navigable[]): number => scan(items, items.length - 1, -1);

/** One enabled row from `active` in `dir`. No wrapping: past either end it stays put. */
export function step(items: readonly Navigable[], active: number, dir: 1 | -1): number {
  const next = scan(items, active + dir, dir);
  return next === -1 ? active : next;
}

/**
 * Ten rows from `active` in `dir`, clamped to the ends. Landing on a disabled row backs off toward
 * where it started, so it never skips past the last enabled row.
 */
export function page(items: readonly Navigable[], active: number, dir: 1 | -1): number {
  const target = Math.min(Math.max(active + dir * PAGE_SIZE, 0), items.length - 1);
  const landed = scan(items, target, dir === 1 ? -1 : 1);
  return landed === -1 ? active : landed;
}
