import { describe, expect, it } from 'vitest';
import { placeTooltip, TOOLTIP_EDGE, TOOLTIP_GAP } from './position';

const viewport = { width: 1000, height: 800 };
const bubble = { width: 100, height: 24 };

describe('placeTooltip', () => {
  it('sits 10px above the trigger, centred, pointer at the middle', () => {
    const p = placeTooltip({ top: 300, bottom: 340, left: 450, width: 100 }, bubble, viewport);
    expect(p).toEqual({ placement: 'top', top: 300 - TOOLTIP_GAP - 24, left: 450, arrow: 50 });
  });
  it('stays 8px inside the left edge and the pointer still aims at the trigger', () => {
    const p = placeTooltip({ top: 300, bottom: 340, left: 0, width: 20 }, bubble, viewport);
    expect(p.left).toBe(TOOLTIP_EDGE);
    expect(p.arrow).toBe(10 - TOOLTIP_EDGE);
  });
  it('stays 8px inside the right edge', () => {
    const p = placeTooltip({ top: 300, bottom: 340, left: 980, width: 20 }, bubble, viewport);
    expect(p.left).toBe(1000 - TOOLTIP_EDGE - 100);
    expect(p.arrow).toBe(990 - p.left);
  });
  it('flips below when there is no room above', () => {
    const p = placeTooltip({ top: 20, bottom: 60, left: 450, width: 100 }, bubble, viewport);
    expect(p).toMatchObject({ placement: 'bottom', top: 60 + TOOLTIP_GAP });
  });
});
