// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { colorMode, resetColorModeStore } from './colorMode';

describe('colorMode without a window (SSR, node)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetColorModeStore();
  });

  it('importing it and reading mode and preference does not throw', () => {
    expect(colorMode.mode).toBe('light');
    expect(colorMode.preference).toBe('system');
  });

  it('set and toggle do nothing and do not throw', () => {
    expect(() => colorMode.set('dark')).not.toThrow();
    expect(() => colorMode.toggle()).not.toThrow();
    expect(colorMode.mode).toBe('light');
    expect(colorMode.preference).toBe('system');
  });

  it('onChange returns an unsubscribe that does not throw', () => {
    const unsubscribe = colorMode.onChange(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });

  it('onChange without a window is a true no-op: the listener is never added', () => {
    const listener = vi.fn();
    colorMode.onChange(listener);
    // A window appears later (for example after hydration). The listener from the server must not fire.
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
    colorMode.set('dark');
    expect(colorMode.mode).toBe('dark');
    expect(listener).not.toHaveBeenCalled();
  });
});
