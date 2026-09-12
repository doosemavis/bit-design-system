import { describe, expect, it } from 'vitest';
import { dropLegacyColor } from './dropLegacyColor';

describe('dropLegacyColor', () => {
  it('removes a color key and keeps every other key', () => {
    expect(dropLegacyColor({ color: 'danger', 'data-testid': 'x', id: 'y' })).toEqual({
      'data-testid': 'x',
      id: 'y',
    });
  });

  it('returns an equivalent object unchanged when there is no color key', () => {
    expect(dropLegacyColor({ 'data-testid': 'x' })).toEqual({ 'data-testid': 'x' });
  });

  it('does not mutate the object passed in', () => {
    const rest = { color: 'danger', id: 'y' };
    dropLegacyColor(rest);
    expect(rest).toEqual({ color: 'danger', id: 'y' });
  });
});
