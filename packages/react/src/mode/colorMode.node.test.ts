// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { resolveColorMode, setColorMode } from './colorMode';

describe('color mode without a window (SSR, node)', () => {
  it('resolves to light', () => {
    expect(resolveColorMode()).toBe('light');
  });

  it('setColorMode does nothing and does not throw', () => {
    expect(() => setColorMode('dark')).not.toThrow();
  });
});
