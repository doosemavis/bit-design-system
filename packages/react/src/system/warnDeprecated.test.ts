import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDeprecationWarnings, warnDeprecated } from './warnDeprecated';

describe('warnDeprecated', () => {
  beforeEach(() => resetDeprecationWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('warns once per key, prefixed with [bit]', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnDeprecated('a', 'A is going away.');
    warnDeprecated('a', 'A is going away.');
    warnDeprecated('b', 'B too.');
    expect(warn.mock.calls).toEqual([['[bit] A is going away.'], ['[bit] B too.']]);
  });

  it('reset forgets the keys, so a key can warn again', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnDeprecated('a', 'A is going away.');
    resetDeprecationWarnings();
    warnDeprecated('a', 'A is going away.');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('is silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnDeprecated('a', 'A is going away.');
    expect(warn).not.toHaveBeenCalled();
  });
});
