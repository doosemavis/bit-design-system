import { render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import { NARROW_QUERY, useMediaQuery } from './useMediaQuery';
import { stubMatchMedia } from '../test/matchMedia';

function Probe() {
  return <p>{useMediaQuery(NARROW_QUERY) ? 'narrow' : 'wide'}</p>;
}

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe('useMediaQuery', () => {
  it('is the phone breakpoint the CSS uses', () => {
    expect(NARROW_QUERY).toBe('(max-width: 720px)');
  });

  it('is false without matchMedia (jsdom), so tests get the desktop layout', () => {
    render(<Probe />);
    expect(screen.getByText('wide')).toBeInTheDocument();
  });

  it('is true while the query matches', () => {
    restore = stubMatchMedia(NARROW_QUERY);
    render(<Probe />);
    expect(screen.getByText('narrow')).toBeInTheDocument();
  });
});
