/** The count turns to the warning color when this share of the limit, or less, is left. */
const NEAR_SHARE = 0.1;

/** Screen readers hear the count only when it crosses one of these: this many left, then the limit itself. */
const ANNOUNCE_AT = [20, 10] as const;

/** How close the text is to its limit: the count's `data-state`. Undefined while there is room, or no limit. */
export type CountState = 'near' | 'limit' | undefined;

/** "1 character", "42 characters". */
export function characters(n: number): string {
  return `${n} ${n === 1 ? 'character' : 'characters'}`;
}

/** The limit a maxLength sets, or undefined when there is none. A negative maxLength is ignored, as browsers do. */
export function limitOf(maxLength: number | undefined): number | undefined {
  return typeof maxLength === 'number' && Number.isFinite(maxLength) && maxLength >= 0 ? maxLength : undefined;
}

/** The length of a value prop, as the textarea shows it. */
export function lengthOf(value: string | number | readonly string[] | undefined): number {
  return value === undefined || value === null ? 0 : String(value).length;
}

/** What the count shows: "136 / 140" under a limit, "42 characters" without one. */
export function countText(length: number, limit: number | undefined): string {
  return limit === undefined ? characters(length) : `${length} / ${limit}`;
}

export function countState(length: number, limit: number | undefined): CountState {
  if (limit === undefined) return undefined;
  const left = limit - length;
  if (left <= 0) return 'limit';
  return left <= limit * NEAR_SHARE ? 'near' : undefined;
}

/** 0 with room to spare, 1 within 20, 2 within 10, 3 at the limit. */
function step(length: number, limit: number): number {
  const left = limit - length;
  if (left <= 0) return ANNOUNCE_AT.length + 1;
  return ANNOUNCE_AT.filter((at) => left <= at).length;
}

/**
 * What to tell screen readers when the text goes from `before` to `after` characters, or null when it crosses no
 * threshold. Only a step toward the limit speaks, so each threshold is heard once on the way up; deleting back
 * below one lets it speak again next time.
 */
export function crossing(before: number, after: number, limit: number | undefined): string | null {
  if (limit === undefined || step(after, limit) <= step(before, limit)) return null;
  const left = limit - after;
  return left <= 0 ? `Limit reached, ${characters(limit)}` : `${characters(left)} left`;
}
