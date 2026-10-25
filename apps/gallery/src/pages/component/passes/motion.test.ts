import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '../../../test/matchMedia';
import { drawIn, durationMs, fadeIn, prefersReducedMotion, slide } from './motion';

const REDUCE = '(prefers-reduced-motion: reduce)';
let restore: (() => void) | undefined;

afterEach(() => {
  restore?.();
  restore = undefined;
});

function withAnimate(el: Element) {
  const animate = vi.fn(() => ({}) as Animation);
  Object.defineProperty(el, 'animate', { configurable: true, value: animate });
  return animate;
}

describe('durationMs', () => {
  it('reads --bit-duration-normal in ms', () => {
    const el = document.createElement('div');
    el.style.setProperty('--bit-duration-normal', '160ms');
    document.body.append(el);
    expect(durationMs(el)).toBe(160);
    el.style.setProperty('--bit-duration-normal', '0.2s');
    expect(durationMs(el)).toBe(200);
    el.remove();
  });

  it('falls back to 160 when the token is missing', () => {
    expect(durationMs(document.createElement('div'))).toBe(160);
  });
});

describe('motion under reduced motion', () => {
  it('reports it and never calls animate', () => {
    restore = stubMatchMedia(REDUCE);
    const el = document.createElement('div');
    const animate = withAnimate(el);
    expect(prefersReducedMotion()).toBe(true);
    expect(fadeIn(el, 100)).toBeNull();
    expect(slide(el, new DOMRect(), new DOMRect(), 100)).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });
});

describe('motion without animate (jsdom)', () => {
  it('returns null', () => {
    const el = document.createElement('div');
    expect(prefersReducedMotion()).toBe(false);
    expect(fadeIn(el, 100)).toBeNull();
  });
});

describe('motion with animate', () => {
  it('fadeIn runs opacity 0 to 1', () => {
    const el = document.createElement('div');
    const animate = withAnimate(el);
    expect(fadeIn(el, 120)).not.toBeNull();
    expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], expect.objectContaining({ duration: 120 }));
  });

  it('slide passes FLIP translate and scale keyframes', () => {
    const el = document.createElement('div');
    const animate = withAnimate(el);
    slide(el, new DOMRect(10, 20, 100, 50), new DOMRect(30, 60, 200, 100), 150);
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translate(-20px,-40px) scale(0.5,0.5)' }, { transform: 'none' }],
      expect.objectContaining({ duration: 150 }),
    );
  });

  it('drawIn runs stroke-dashoffset from the path length to 0', () => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.getTotalLength = () => 80;
    const animate = withAnimate(path);
    drawIn(path, 480);
    expect(path.style.strokeDasharray).toBe('80');
    expect(animate).toHaveBeenCalledWith(
      [{ strokeDashoffset: 80 }, { strokeDashoffset: 0 }],
      expect.objectContaining({ duration: 480 }),
    );
  });
});
