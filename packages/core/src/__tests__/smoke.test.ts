import { describe, it, expect } from 'vitest';
import { PREFIX } from '../tokens';

describe('@bit-ds/core', () => {
  it('exports the bit prefix', () => {
    expect(PREFIX).toBe('bit');
  });
});
