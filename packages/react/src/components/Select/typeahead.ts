/** Keys typed within this many milliseconds of each other build one search. */
export const TYPEAHEAD_MS = 500;

/** What has been typed so far, lower-cased, and when the last key came. */
interface TypeaheadBuffer {
  text: string;
  at: number;
}

export const EMPTY_BUFFER: TypeaheadBuffer = { text: '', at: Number.NEGATIVE_INFINITY };

/** The buffer after typing `char` at `now`: appended within 500ms of the last key, else started again. */
export function nextBuffer(previous: TypeaheadBuffer, char: string, now: number): TypeaheadBuffer {
  const kept = now - previous.at > TYPEAHEAD_MS ? '' : previous.text;
  return { text: kept + char.toLowerCase(), at: now };
}

/** An option as typeahead sees it: its label text and whether it can be chosen. */
interface Searchable {
  label: string;
  disabled?: boolean;
}

/**
 * The enabled option whose label starts with `query` (case-insensitive, leading space ignored), or -1.
 * A longer search starts at the active option, so it stays put while it still matches. One letter, or
 * the same letter repeated, starts after it and cycles through the options starting with that letter.
 */
export function matchTypeahead(items: readonly Searchable[], query: string, active: number): number {
  const repeated = [...query].every((char) => char === query[0]);
  const needle = repeated ? query[0]! : query;
  const start = repeated ? active + 1 : Math.max(active, 0);
  for (let k = 0; k < items.length; k++) {
    const i = (start + k) % items.length;
    const item = items[i]!;
    if (!item.disabled && item.label.trimStart().toLowerCase().startsWith(needle)) return i;
  }
  return -1;
}
