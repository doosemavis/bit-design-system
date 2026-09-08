import { describe, it, expect } from 'vitest';
import { PREFIX } from './index';

describe('@bit/react', () => {
  it('re-exports the prefix from core', () => {
    expect(PREFIX).toBe('bit');
  });
});
