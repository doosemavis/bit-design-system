import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@bit-ds/react';
import { formatReleaseDate, KIND_BADGE } from './kinds';

describe('KIND_BADGE', () => {
  it('draws Fixed as a warning outline so it stands apart from Changed', () => {
    render(
      <>
        <Badge {...KIND_BADGE.Fixed}>Fixed</Badge>
        <Badge {...KIND_BADGE.Changed}>Changed</Badge>
      </>,
    );
    expect(screen.getByText('Fixed')).toHaveClass('bit-warning', 'bit-outline');
    expect(screen.getByText('Changed')).toHaveClass('bit-primary', 'bit-outline');
  });
});

// Critique 2026-10-11: the rail showed "10-10", with no year.
describe('formatReleaseDate', () => {
  it('writes a CHANGELOG date as a short month, the day and the year', () => {
    expect(formatReleaseDate('2026-10-10')).toBe('Oct 10, 2026');
    expect(formatReleaseDate('2026-01-04')).toBe('Jan 4, 2026');
    expect(formatReleaseDate('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('leaves an empty date empty, and anything that is not YYYY-MM-DD as written', () => {
    expect(formatReleaseDate('')).toBe('');
    expect(formatReleaseDate('soon')).toBe('soon');
    expect(formatReleaseDate('2026-13-01')).toBe('2026-13-01');
  });
});
