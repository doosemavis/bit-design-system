import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ANNOUNCER_ID } from './announce';
import { COPY_RESET_MS, useCopyToClipboard } from './useCopyToClipboard';

/** Replace navigator.clipboard for one test; `undefined` removes it. */
function stubClipboard(writeText: ((text: string) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
}

const announcer = () => document.getElementById(ANNOUNCER_ID);

afterEach(() => {
  announcer()?.remove();
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
});

describe('useCopyToClipboard', () => {
  it('starts idle, labelled "Copy"', () => {
    const { result } = renderHook(() => useCopyToClipboard('x'));
    expect(result.current.state).toBe('idle');
    expect(result.current.label).toBe('Copy');
  });

  it('copies the text, resolves true, shows and announces "Copied", then is idle again after 2000ms', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard('pnpm add @bit-ds/react'));
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy();
    });
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('pnpm add @bit-ds/react');
    expect(result.current).toMatchObject({ state: 'copied', label: 'Copied' });
    act(() => vi.advanceTimersByTime(50));
    expect(announcer()).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS - 51));
    expect(result.current.state).toBe('copied');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toMatchObject({ state: 'idle', label: 'Copy' });
  });

  it('a refused write resolves false, shows and announces "Copy failed", then resets', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.reject(new Error('denied')));
    const { result } = renderHook(() => useCopyToClipboard('x'));
    await act(async () => {
      await expect(result.current.copy()).resolves.toBe(false);
    });
    expect(result.current).toMatchObject({ state: 'failed', label: 'Copy failed' });
    act(() => vi.advanceTimersByTime(50));
    expect(announcer()).toHaveTextContent('Copy failed');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS));
    expect(result.current.state).toBe('idle');
  });

  it('no clipboard at all (an insecure page) resolves false and never rejects', async () => {
    stubClipboard(undefined);
    const { result } = renderHook(() => useCopyToClipboard('x'));
    await act(async () => {
      await expect(result.current.copy()).resolves.toBe(false);
    });
    expect(result.current.state).toBe('failed');
  });

  it('copies the current text after it changes', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { result, rerender } = renderHook(({ text }) => useCopyToClipboard(text), { initialProps: { text: 'pnpm add x' } });
    rerender({ text: 'npm install x' });
    await act(async () => {
      await result.current.copy();
    });
    expect(writeText).toHaveBeenCalledWith('npm install x');
  });

  it('a second copy restarts the 2000ms', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard('x'));
    await act(async () => {
      await result.current.copy();
    });
    act(() => vi.advanceTimersByTime(1500));
    await act(async () => {
      await result.current.copy();
    });
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.state).toBe('copied');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.state).toBe('idle');
  });

  it('unmounting clears the reset timer', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    const { result, unmount } = renderHook(() => useCopyToClipboard('x'));
    await act(async () => {
      await result.current.copy();
    });
    // Let announce()'s own short timer finish, so only the reset timer is left.
    act(() => vi.advanceTimersByTime(50));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmounting while the clipboard is busy still resolves, but starts no timer and announces nothing', async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    stubClipboard(() => new Promise<void>((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useCopyToClipboard('x'));
    const pending = result.current.copy();
    unmount();
    await act(async () => finish());
    await expect(pending).resolves.toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(announcer()).toBeNull();
  });
});
