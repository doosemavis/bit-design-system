// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { colorMode } from './colorMode';

describe('colorMode without a window (SSR, node)', () => {
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
});
