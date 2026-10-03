// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { currentPageEra } from './logoEra';

describe('logo era without a window (SSR, node)', () => {
  it('is the still era, 64', () => {
    expect(currentPageEra()).toBe(64);
  });
});
