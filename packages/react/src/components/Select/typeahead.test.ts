import { describe, expect, it } from 'vitest';
import { EMPTY_BUFFER, TYPEAHEAD_MS, matchTypeahead, nextBuffer } from './typeahead';

const items = [
  { label: 'Apple' },
  { label: 'Banana' },
  { label: '  Blueberry' },
  { label: 'Cherry' },
  { label: 'Date', disabled: true },
  { label: 'ice cream' },
  { label: 'Ice tea' },
];

describe('typeahead buffer', () => {
  it('starts empty and collects lower-cased characters typed within 500ms', () => {
    expect(TYPEAHEAD_MS).toBe(500);
    const first = nextBuffer(EMPTY_BUFFER, 'B', 1000);
    expect(first).toEqual({ text: 'b', at: 1000 });
    expect(nextBuffer(first, 'L', 1500)).toEqual({ text: 'bl', at: 1500 });
  });

  it('starts again after a pause longer than 500ms', () => {
    expect(nextBuffer({ text: 'bl', at: 1000 }, 'c', 1501)).toEqual({ text: 'c', at: 1501 });
  });
});

describe('matchTypeahead', () => {
  it('matches a label prefix, ignoring case and leading space', () => {
    expect(matchTypeahead(items, 'b', -1)).toBe(1);
    expect(matchTypeahead(items, 'bl', 1)).toBe(2);
    expect(matchTypeahead(items, 'ice t', 5)).toBe(6);
  });

  it('a longer search keeps the active option when it still matches', () => {
    expect(matchTypeahead(items, 'blu', 2)).toBe(2);
  });

  it('one letter, or the same letter again, moves to the next match and cycles', () => {
    expect(matchTypeahead(items, 'b', 1)).toBe(2);
    expect(matchTypeahead(items, 'bb', 2)).toBe(1);
    expect(matchTypeahead(items, 'a', 0)).toBe(0);
  });

  it('skips disabled options', () => {
    expect(matchTypeahead(items, 'd', 0)).toBe(-1);
  });

  it('returns -1 when nothing matches', () => {
    expect(matchTypeahead(items, 'z', 0)).toBe(-1);
    expect(matchTypeahead([], 'a', -1)).toBe(-1);
  });
});
