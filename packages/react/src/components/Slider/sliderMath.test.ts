import { describe, expect, it } from 'vitest';
import { MAX_BLOCKS, MAX_NOTCHES, blockAt, blockCount, fractionAt, fractionOf, litBlocks, notchFractions, snapValue, stepCount, valueChars } from './sliderMath';

describe('snapValue: what a native range input settles on', () => {
  it.each([
    [37, 0, 100, 10, 40],
    [34, 0, 100, 10, 30],
    [150, 0, 100, 1, 100],
    [-5, 0, 100, 1, 0],
    [7, 2, 12, 5, 7],
    [9, 2, 12, 5, 7],
    [11, 0, 10, 3, 9],
    [0.3, 0, 1, 0.1, 0.3],
    [0.30000000000000004, 0, 1, 0.1, 0.3],
    [5, 10, 0, 1, 10],
    [Number.NaN, 0, 100, 1, 0],
    [2.4, 0, 10, 0, 2],
    [0.00000015, 0, 0.000001, 1e-7, 2e-7],
  ])('%s in %s..%s by %s is %s', (value, min, max, step, expected) => {
    expect(snapValue(value, min, max, step)).toBe(expected);
  });
});

describe('fractionOf', () => {
  it('is how far along the range a value is, kept in 0..1', () => {
    expect(fractionOf(25, 0, 100)).toBe(0.25);
    expect(fractionOf(-10, 0, 100)).toBe(0);
    expect(fractionOf(5, 5, 5)).toBe(0);
  });
});

describe('blocks', () => {
  it('one block per step, capped at MAX_BLOCKS and never under one', () => {
    expect(stepCount(0, 10, 1)).toBe(10);
    expect(stepCount(0, 10, 3)).toBe(3);
    expect(stepCount(0, 1, 0.1)).toBe(10);
    expect(blockCount(0, 10, 1)).toBe(10);
    expect(blockCount(0, 100, 1)).toBe(MAX_BLOCKS);
    expect(blockCount(0, 0, 1)).toBe(1);
  });

  it('lights one block per step up to the value, and at least one for any value over min', () => {
    expect(litBlocks(0, 10)).toBe(0);
    expect(litBlocks(0.6, 10)).toBe(6);
    expect(litBlocks(1, 10)).toBe(10);
    expect(litBlocks(0.01, 20)).toBe(1);
  });

  const edges = { first: { left: 10, right: 30 }, last: { left: 190, right: 210 }, rtl: false };

  it('a pointer anywhere on block k picks k; before the first block picks 0', () => {
    expect(blockAt(5, edges, 10)).toBe(0);
    expect(blockAt(10, edges, 10)).toBe(0);
    expect(blockAt(11, edges, 10)).toBe(1);
    expect(blockAt(29, edges, 10)).toBe(1);
    expect(blockAt(125, edges, 10)).toBe(6);
    expect(blockAt(209, edges, 10)).toBe(10);
    expect(blockAt(400, edges, 10)).toBe(10);
  });

  it('right to left, the first block is on the right', () => {
    const rtl = { first: { left: 190, right: 210 }, last: { left: 10, right: 30 }, rtl: true };
    expect(blockAt(209, rtl, 10)).toBe(1);
    expect(blockAt(11, rtl, 10)).toBe(10);
    expect(blockAt(300, rtl, 10)).toBe(0);
  });

  it('blocks with no size pick 0', () => {
    expect(blockAt(5, { first: { left: 0, right: 0 }, last: { left: 0, right: 0 }, rtl: false }, 10)).toBe(0);
  });
});

describe('fractionAt: where a pointer is along a track, as the thumb\'s middle travels it', () => {
  const track = { left: 100, right: 324, thumb: 24, rtl: false };

  it('is 0 half a thumb in from the start, 1 half a thumb in from the end, and kept in 0..1', () => {
    expect(fractionAt(112, track)).toBe(0);
    expect(fractionAt(312, track)).toBe(1);
    expect(fractionAt(212, track)).toBe(0.5);
    expect(fractionAt(162, track)).toBe(0.25);
    expect(fractionAt(0, track)).toBe(0);
    expect(fractionAt(999, track)).toBe(1);
  });

  it('runs from the right, right to left', () => {
    expect(fractionAt(312, { ...track, rtl: true })).toBe(0);
    expect(fractionAt(262, { ...track, rtl: true })).toBe(0.25);
  });

  it('is null when the track has no room for the thumb to travel (not laid out yet)', () => {
    expect(fractionAt(10, { left: 0, right: 0, thumb: 0, rtl: false })).toBeNull();
    expect(fractionAt(10, { left: 0, right: 20, thumb: 24, rtl: false })).toBeNull();
  });
});

describe('notchFractions: where notched draws its marks', () => {
  it('one mark at min and at every step after it, placed as the thumb would be', () => {
    expect(notchFractions(0, 100, 25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(notchFractions(1, 5, 1)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('stops at the last step at or under max', () => {
    expect(notchFractions(0, 10, 3)).toEqual([0, 0.3, 0.6, 0.9]);
  });

  it(`draws ${MAX_NOTCHES} marks at most, and none past that`, () => {
    expect(notchFractions(0, 19, 1)).toHaveLength(MAX_NOTCHES);
    expect(notchFractions(0, 20, 1)).toEqual([]);
    expect(notchFractions(0, 100, 1)).toEqual([]);
  });
});

describe('valueChars: how many characters the longest value takes, so the number box fits it', () => {
  it.each([
    [0, 100, 1, 3],
    [0, 10, 1, 2],
    [-50, 50, 1, 3],
    [-100, 0, 5, 4],
    [0, 1, 0.05, 4],
    [0.5, 2, 0.5, 3],
  ])('%s to %s by %s is %s', (min, max, step, chars) => {
    expect(valueChars(min, max, step)).toBe(chars);
  });
});
