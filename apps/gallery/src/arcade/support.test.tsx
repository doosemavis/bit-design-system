import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bestKey, readBest, saveBest } from './bestScore';
import { readPalette } from './palette';
import { useFixedStep } from './useFixedStep';
import { mixSeed, nextRandom, randomInt } from './random';
import { stubMatchMedia } from '../test/matchMedia';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('best score', () => {
  it('reads 0 with nothing saved, saves only a better score, and reads it back', () => {
    expect(readBest('snake')).toBe(0);
    expect(saveBest('snake', 12)).toBe(12);
    expect(window.localStorage.getItem(bestKey('snake'))).toBe('12');
    expect(saveBest('snake', 5)).toBe(12);
    expect(readBest('snake')).toBe(12);
    expect(readBest('cheese-run')).toBe(0);
  });

  it('reads junk as 0', () => {
    window.localStorage.setItem(bestKey('snake'), 'lots');
    expect(readBest('snake')).toBe(0);
    window.localStorage.setItem(bestKey('snake'), '-4');
    expect(readBest('snake')).toBe(0);
  });

  it('never throws when storage is blocked: no best, and a new best still counts for this visit', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readBest('snake')).toBe(0);
    expect(saveBest('snake', 3)).toBe(3);
  });
});

describe('palette', () => {
  function withHost(read: (host: HTMLCanvasElement) => void) {
    const host = document.createElement('canvas');
    document.body.append(host);
    read(host);
    host.remove();
  }

  it('falls back to the light colors where var() does not resolve (jsdom), so a board always paints, and leaves no probe', () => {
    withHost((host) => {
      const palette = readPalette(host);
      expect(palette.snake).toBe('#7c3aed');
      expect(palette.food).toBe('#ffc800');
      expect(palette.font).toBe('monospace');
      expect(document.body.querySelectorAll('span[aria-hidden]')).toHaveLength(0);
    });
  });

  it('reads the pixel font from --bit-font-pixel where the canvas sits', () => {
    withHost((host) => {
      host.style.setProperty('--bit-font-pixel', '"Press Start 2P", monospace');
      expect(readPalette(host).font).toBe('"Press Start 2P", monospace');
    });
  });

  it('uses system colors in forced-colors mode: the board Canvas, the snake and rat CanvasText, the goals Highlight, the cat LinkText', () => {
    const restore = stubMatchMedia('(forced-colors: active)');
    withHost((host) => {
      const palette = readPalette(host);
      // jsdom resolves the system colors to its defaults; a browser resolves them to the user's.
      expect(palette.board).toBe(getComputedProbe('Canvas'));
      expect(palette.snake).toBe(getComputedProbe('CanvasText'));
      expect(palette.rat).toBe(getComputedProbe('CanvasText'));
      expect(palette.food).toBe(getComputedProbe('Highlight'));
      expect(palette.cheese).toBe(getComputedProbe('Highlight'));
      expect(palette.cat).toBe(getComputedProbe('LinkText'));
    });
    restore();
  });
});

/** What the browser (here jsdom) resolves a color keyword to. */
function getComputedProbe(color: string): string {
  const span = document.createElement('span');
  span.style.color = color;
  document.body.append(span);
  const value = getComputedStyle(span).color;
  span.remove();
  return value;
}

describe('random', () => {
  it('is a pure step: the same seed, the same number and next seed; values in [0, 1)', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
    let seed = 1;
    for (let i = 0; i < 200; i += 1) {
      const r = nextRandom(seed);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      seed = r.seed;
    }
    expect(randomInt(9, 4).value).toBeLessThan(4);
    expect(mixSeed(1, 2)).not.toBe(mixSeed(1, 3));
  });
});

describe('useFixedStep', () => {
  /** A hand-cranked requestAnimationFrame: each frame() runs the queued callbacks at the given time. */
  function manualFrames() {
    let queue: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queue.push(cb);
      return queue.length;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      queue = [];
    });
    return {
      frame(now: number) {
        const run = queue;
        queue = [];
        run.forEach((cb) => cb(now));
      },
      cancel,
      pending: () => queue.length,
    };
  }

  it('steps once per stepMs of frame time, at most once a frame, only while active', () => {
    const frames = manualFrames();
    const onStep = vi.fn();
    const { rerender, unmount } = renderHook(({ active }) => useFixedStep(active, 100, onStep), { initialProps: { active: false } });
    expect(frames.pending()).toBe(0);
    rerender({ active: true });
    frames.frame(0);
    frames.frame(50);
    expect(onStep).not.toHaveBeenCalled();
    frames.frame(100);
    expect(onStep).toHaveBeenCalledTimes(1);
    // A long frame (a background tab) still steps once, not five times.
    frames.frame(600);
    expect(onStep).toHaveBeenCalledTimes(2);
    rerender({ active: false });
    expect(frames.cancel).toHaveBeenCalled();
    frames.frame(1000);
    expect(onStep).toHaveBeenCalledTimes(2);
    unmount();
  });
});
