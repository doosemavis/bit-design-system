import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStageMeasure } from './useStageMeasure';

let observerCallback: (() => void) | undefined;
const disconnect = vi.fn();
let fontsReady: () => void = () => {};

class FakeResizeObserver {
  constructor(callback: () => void) {
    observerCallback = callback;
  }
  observe() {}
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
function Probe() {
  const stage = useRef<HTMLDivElement>(null);
  const value = useStageMeasure(stage, () => ++measured, 0);
  return (
    <div ref={stage} data-testid="value">
      {value}
    </div>
  );
}

beforeEach(() => {
  measured = 0;
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

  it('measures again when fonts finish loading', async () => {
    render(<Probe />);
    flushFrames();
    await act(async () => fontsReady());
    flushFrames();
    expect(measured).toBe(2);
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
