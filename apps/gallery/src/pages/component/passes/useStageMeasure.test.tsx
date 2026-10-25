import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStageMeasure } from './useStageMeasure';

let observerCallback: (() => void) | undefined;
let observed: Element[] = [];
const disconnect = vi.fn();
let fontsReady: () => void = () => {};

class FakeResizeObserver {
  constructor(callback: () => void) {
    observerCallback = callback;
  }
  observe(target: Element) {
    observed = [...observed, target];
  }
  disconnect = disconnect;
}

let frames: FrameRequestCallback[] = [];
const flushFrames = () =>
  act(() => {
    const queued = frames;
    frames = [];
    queued.forEach((frame) => frame(0));
  });

let measured = 0;
function Probe({ version, swap = false }: { version?: number; swap?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const value = useStageMeasure(stage, () => ++measured, 0, version);
  return (
    <div ref={stage}>
      <span data-testid="value">{value}</span>
      <div data-instance="">
        {swap ? <em data-testid="swapped">swapped</em> : <span data-testid="instance">instance</span>}
      </div>
    </div>
  );
}

beforeEach(() => {
  measured = 0;
  observed = [];
  frames = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready: new Promise<void>((resolve) => (fontsReady = resolve)) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  disconnect.mockClear();
});

describe('useStageMeasure', () => {
  it('returns empty until the first frame, then measures once', () => {
    render(<Probe />);
    expect(screen.getByTestId('value')).toHaveTextContent('0');
    flushFrames();
    expect(screen.getByTestId('value')).toHaveTextContent('1');
  });

  it('a burst of resize callbacks measures once, in one frame', () => {
    render(<Probe />);
    flushFrames();
    act(() => {
      observerCallback?.();
      observerCallback?.();
      observerCallback?.();
    });
    flushFrames();
    expect(measured).toBe(2);
  });

  it('observes the instance too, since a stretched stage keeps its size when only the instance resizes', () => {
    render(<Probe />);
    flushFrames();
    const instance = screen.getByTestId('instance');
    expect(observed).toEqual([instance.closest('[data-instance]')!.parentElement, instance]);
    act(() => observerCallback?.()); // the instance's resize
    flushFrames();
    expect(measured).toBe(2);
  });

  it('measures again when fonts finish loading', async () => {
    render(<Probe />);
    flushFrames();
    await act(async () => fontsReady());
    flushFrames();
    expect(measured).toBe(2);
  });

  it('a new version schedules one new measure, with no new observer', () => {
    const { rerender } = render(<Probe version={0} />);
    flushFrames();
    expect(measured).toBe(1);
    rerender(<Probe version={1} />);
    expect(measured).toBe(1);
    flushFrames();
    expect(measured).toBe(2);
    expect(disconnect).not.toHaveBeenCalled();
    rerender(<Probe version={1} />);
    flushFrames();
    expect(measured).toBe(2);
  });

  it('a new version watches an instance that mounted since, once', () => {
    const { rerender } = render(<Probe version={0} />);
    flushFrames();
    rerender(<Probe version={1} swap />);
    flushFrames();
    const swapped = screen.getByTestId('swapped');
    expect(observed.filter((target) => target === swapped)).toHaveLength(1);
    expect(observed.filter((target) => target === swapped.closest('[data-instance]')!.parentElement)).toHaveLength(1);
  });

  it('returns empty without ResizeObserver, and never measures', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(<Probe />);
    flushFrames();
    expect(screen.getByTestId('value')).toHaveTextContent('0');
  });

  it('disconnects and drops its frame on unmount, and a late font load does nothing', async () => {
    const { unmount } = render(<Probe />);
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    await act(async () => fontsReady());
    flushFrames();
    expect(measured).toBe(0);
  });
});
