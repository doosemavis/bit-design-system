/**
 * `HTMLAttributes` (from `@types/react`) declares a legacy `color?: string` — a holdover
 * from the old `<font color>` attribute. Components with no `color` axis type it away via
 * `Omit<HTMLAttributes<...>, 'color'>`, but a plain-JS caller (no type checking) can still
 * pass it through `...rest`. This drops it before the spread so it never reaches the DOM.
 */
export function dropLegacyColor<T extends Record<string, unknown>>(rest: T): Omit<T, 'color'> {
  if (!('color' in rest)) return rest as Omit<T, 'color'>;
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(rest)) {
    if (key !== 'color') clean[key] = rest[key];
  }
  return clean as Omit<T, 'color'>;
}
