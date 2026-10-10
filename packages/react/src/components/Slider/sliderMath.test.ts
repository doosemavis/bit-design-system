import { describe, expect, it } from 'vitest';
import { MAX_BLOCKS, blockAt, blockCount, fractionOf, litBlocks, snapValue, stepCount } from './sliderMath';

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
