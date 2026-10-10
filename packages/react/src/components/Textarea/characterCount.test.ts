import { describe, expect, it } from 'vitest';
import { characters, countState, countText, crossing, lengthOf, limitOf } from './characterCount';

describe('characterCount', () => {
  it('says "1 character" and "N characters"', () => {
    expect(characters(0)).toBe('0 characters');
    expect(characters(1)).toBe('1 character');
    expect(characters(42)).toBe('42 characters');
  });

  it('reads "136 / 140" under a limit and "42 characters" without one', () => {
    expect(countText(136, 140)).toBe('136 / 140');
    expect(countText(42, undefined)).toBe('42 characters');
    expect(countText(1, undefined)).toBe('1 character');
  });

  it('ignores a missing or negative maxLength, as browsers do; 0 is a real limit', () => {
    expect(limitOf(undefined)).toBeUndefined();
    expect(limitOf(-1)).toBeUndefined();
    expect(limitOf(Number.NaN)).toBeUndefined();
    expect(limitOf(0)).toBe(0);
    expect(limitOf(140)).toBe(140);
  });

  it('measures a value prop as the textarea shows it', () => {
    expect(lengthOf(undefined)).toBe(0);
    expect(lengthOf('')).toBe(0);
    expect(lengthOf('hello')).toBe(5);
    expect(lengthOf(1234)).toBe(4);
  });

  it('is near with 10% or less left, and at the limit with none left', () => {
    expect(countState(125, 140)).toBeUndefined();
    expect(countState(126, 140)).toBe('near');
    expect(countState(139, 140)).toBe('near');
    expect(countState(140, 140)).toBe('limit');
    // A controlled value can be longer than the limit; it still reads as the limit.
    expect(countState(150, 140)).toBe('limit');
    expect(countState(5000, undefined)).toBeUndefined();
  });

  it('speaks when the text crosses 20 left, 10 left and the limit, and not between them', () => {
    expect(crossing(119, 120, 140)).toBe('20 characters left');
    expect(crossing(120, 121, 140)).toBeNull();
    expect(crossing(129, 130, 140)).toBe('10 characters left');
    expect(crossing(130, 139, 140)).toBeNull();
    expect(crossing(139, 140, 140)).toBe('Limit reached, 140 characters');
  });

  it('a paste that jumps past a threshold says where it landed, and the limit wins', () => {
    expect(crossing(0, 125, 140)).toBe('15 characters left');
    expect(crossing(0, 139, 140)).toBe('1 character left');
    expect(crossing(0, 140, 140)).toBe('Limit reached, 140 characters');
  });

  it('is silent while deleting, and without a limit', () => {
    expect(crossing(140, 139, 140)).toBeNull();
    expect(crossing(121, 120, 140)).toBeNull();
    expect(crossing(0, 9000, undefined)).toBeNull();
  });
});
