import { afterEach, describe, expect, it } from 'vitest';
import { ANCHOR_EDGE, clampToViewport, isRtl, placeDropdown } from './anchor';

const viewport = { width: 1000, height: 800 };
const trigger = (top: number, left = 50, width = 200, height = 40) => ({ top, bottom: top + height, left, width });
const options = { gap: 6, minRoom: 128 };

describe('clampToViewport', () => {
  it('keeps a start 8px inside either edge', () => {
    expect(ANCHOR_EDGE).toBe(8);
    expect(clampToViewport(100, 200, 1000)).toBe(100);
    expect(clampToViewport(-20, 200, 1000)).toBe(8);
    expect(clampToViewport(900, 200, 1000)).toBe(792);
  });

  it('a layer wider than the viewport starts at the edge', () => {
    expect(clampToViewport(300, 2000, 1000)).toBe(8);
  });
});

describe('placeDropdown', () => {
  it('opens below the trigger, lined up with its left edge', () => {
    expect(placeDropdown(trigger(100), { width: 150, height: 200 }, viewport, options)).toEqual({
      placement: 'bottom',
      top: 146,
      left: 50,
      room: 800 - 140 - 6 - 8,
    });
  });

  it("align right lines the layer's right edge up with the trigger's", () => {
    expect(placeDropdown(trigger(100, 500), { width: 150, height: 200 }, viewport, { ...options, align: 'right' }).left).toBe(550);
  });

  it('align right still keeps 8px from the left edge', () => {
    expect(placeDropdown(trigger(100, 10, 40), { width: 150, height: 200 }, viewport, { ...options, align: 'right' }).left).toBe(8);
  });

  it('flips above when below cannot fit it and above has more room', () => {
    expect(placeDropdown(trigger(700), { width: 150, height: 200 }, viewport, options)).toEqual({
      placement: 'top',
      top: 700 - 6 - 200,
      left: 50,
      room: 700 - 6 - 8,
    });
  });

  it('stays below when minRoom fits, even if the layer is taller', () => {
    expect(placeDropdown(trigger(618), { width: 150, height: 500 }, viewport, options).placement).toBe('bottom');
  });

  it('never reports negative room', () => {
    expect(placeDropdown(trigger(0), { width: 150, height: 20 }, { width: 1000, height: 10 }, options).room).toBe(0);
  });
});

describe('isRtl', () => {
  afterEach(() => document.body.replaceChildren());

  it('reads the computed direction, so an ancestor dir counts', () => {
    document.body.innerHTML = '<div dir="rtl"><button>x</button></div><button>y</button>';
    const [inside, outside] = [...document.querySelectorAll('button')];
    expect(isRtl(inside!)).toBe(true);
    expect(isRtl(outside!)).toBe(false);
  });
});
