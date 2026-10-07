import { describe, expect, it } from 'vitest';
import { EDGE, GAP, MIN_ROOM, listboxWidths, placeListbox } from './position';

const viewport = { width: 1000, height: 800 };
const trigger = (top: number, left = 50, width = 200, height = 40) => ({ top, bottom: top + height, left, width });

describe('listboxWidths', () => {
  it('is at least the trigger, at most the viewport less 8px each side', () => {
    expect(listboxWidths(200, 1000)).toEqual({ minWidth: 200, maxWidth: 984 });
  });

  it('never asks for more than the viewport can hold', () => {
    expect(listboxWidths(500, 300)).toEqual({ minWidth: 284, maxWidth: 284 });
    expect(listboxWidths(10, 4)).toEqual({ minWidth: 0, maxWidth: 0 });
  });
});

describe('placeListbox', () => {
  it('opens 6px below the trigger, lined up with its left edge', () => {
    expect([GAP, EDGE, MIN_ROOM]).toEqual([6, 8, 128]);
    expect(placeListbox(trigger(100), { width: 200, height: 200 }, viewport)).toEqual({
      placement: 'bottom',
      top: 146,
      left: 50,
      room: 800 - 140 - 6 - 8,
    });
  });

  it('flips above when the list does not fit below and there is more room above', () => {
    expect(placeListbox(trigger(700), { width: 200, height: 200 }, viewport)).toEqual({
      placement: 'top',
      top: 700 - 6 - 200,
      left: 50,
      room: 700 - 6 - 8,
    });
  });

  it('above, a list taller than the room is capped to it and sits against the top edge', () => {
    expect(placeListbox(trigger(300), { width: 200, height: 400 }, { width: 1000, height: 400 })).toEqual({
      placement: 'top',
      top: 8,
      left: 50,
      room: 286,
    });
  });

  it('stays below when 8rem fits, even if the list is taller', () => {
    expect(placeListbox(trigger(618), { width: 200, height: 500 }, viewport).placement).toBe('bottom');
  });

  it('stays below when a short list fits', () => {
    expect(placeListbox(trigger(700), { width: 200, height: 40 }, viewport).placement).toBe('bottom');
  });

  it('stays below when above has no more room than below', () => {
    const placed = placeListbox(trigger(30), { width: 200, height: 200 }, { width: 1000, height: 100 });
    expect(placed.placement).toBe('bottom');
    expect(placed.room).toBe(16);
  });

  it('never reports negative room', () => {
    expect(placeListbox(trigger(0), { width: 200, height: 20 }, { width: 1000, height: 10 }).room).toBe(0);
  });

  it('keeps 8px from the right and left edges', () => {
    expect(placeListbox(trigger(100, 900), { width: 200, height: 100 }, viewport).left).toBe(792);
    expect(placeListbox(trigger(100, -20), { width: 200, height: 100 }, viewport).left).toBe(8);
  });

  it('a list wider than the viewport starts at the left edge', () => {
    expect(placeListbox(trigger(100, 300), { width: 2000, height: 100 }, viewport).left).toBe(8);
  });
});
