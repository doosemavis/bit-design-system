import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar, initialsOf } from './Avatar';
import { COLORS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const image = (container: HTMLElement) => container.querySelector('img');

describe('Avatar', () => {
  it('renders a span named by name, with the default decorators and shape', () => {
    render(<Avatar name="Ada Lovelace" />);
    const avatar = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(avatar.tagName).toBe('SPAN');
    expect(avatar.className).toBe('bit-avatar bit-neutral bit-md');
    expect(avatar).toHaveAttribute('data-shape', 'circle');
  });

  it('maps color and size', () => {
    render(<Avatar name="Grace Hopper" color="primary" size="lg" />);
    expect(screen.getByRole('img').className).toBe('bit-avatar bit-primary bit-lg');
  });

  it('flat adds bit-flat once, even when className already has it; off by default', () => {
    render(<Avatar name="A" flat data-testid="a" />);
    render(<Avatar name="B" flat className="bit-flat" data-testid="b" />);
    render(<Avatar name="C" data-testid="c" />);
    expect(screen.getByTestId('a').className).toBe('bit-avatar bit-neutral bit-md bit-flat');
    expect(screen.getByTestId('b').className.split(' ').filter((c) => c === 'bit-flat')).toHaveLength(1);
    expect(screen.getByTestId('c').className).not.toContain('bit-flat');
  });

  it('appends className last, forwards ref, spreads props', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} name="Ada" className="extra" data-testid="a" title="Ada" />);
    const avatar = screen.getByTestId('a');
    expect(avatar.className).toBe('bit-avatar bit-neutral bit-md extra');
    expect(avatar).toHaveAttribute('title', 'Ada');
    expect(ref.current).toBe(avatar);
  });

  it('takes the square and pixel shapes as data-shape, not a class', () => {
    render(<Avatar name="A" shape="square" data-testid="square" />);
    render(<Avatar name="B" shape="pixel" data-testid="pixel" />);
    expect(screen.getByTestId('square')).toHaveAttribute('data-shape', 'square');
    expect(screen.getByTestId('pixel')).toHaveAttribute('data-shape', 'pixel');
    expect(screen.getByTestId('pixel').className).toBe('bit-avatar bit-neutral bit-md');
  });

  describe('unknown shape', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is dropped with a dev warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error only circle, square and pixel exist
      render(<Avatar name="A" shape="hexagon" data-testid="a" />);
      expect(screen.getByTestId('a')).not.toHaveAttribute('data-shape');
      expect(warn.mock.calls[0]?.[0]).toContain('shape="hexagon"');
    });
  });

  it('shows the initials, hidden from screen readers, when there is no photo', () => {
    const { container } = render(<Avatar name="Ada Lovelace" />);
    const initials = container.querySelector('.bit-avatar__initials')!;
    expect(initials).toHaveTextContent('AL');
    expect(initials).toHaveAttribute('aria-hidden', 'true');
    expect(image(container)).toBeNull();
  });

  it('shows the photo over the initials, with an empty alt: the root carries the name', () => {
    const { container } = render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    const img = image(container)!;
    expect(img).toHaveAttribute('src', '/ada.png');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveClass('bit-avatar__image');
    // Under the photo while it loads.
    expect(container.querySelector('.bit-avatar__initials')).toHaveTextContent('AL');
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBe(container.firstChild);
  });

  it('drops a photo that fails to load, and tries a new src again', () => {
    const { container, rerender } = render(<Avatar name="Ada Lovelace" src="/missing.png" />);
    fireEvent.error(image(container)!);
    expect(image(container)).toBeNull();
    expect(container.querySelector('.bit-avatar__initials')).toHaveTextContent('AL');
    rerender(<Avatar name="Ada Lovelace" src="/ada.png" />);
    expect(image(container)).toHaveAttribute('src', '/ada.png');
  });

  it('a missing name, from plain JavaScript, renders without crashing and shows no initials', () => {
    const { container } = render(<Avatar {...({} as { name: string })} />);
    expect(container.querySelector('.bit-avatar__initials')).toHaveTextContent('');
  });

  it('an empty src is no photo', () => {
    const { container } = render(<Avatar name="Ada" src="" />);
    expect(image(container)).toBeNull();
  });

  const shapes = ['circle', 'square', 'pixel'] as const;
  const combos = COLORS.flatMap((color) => shapes.map((shape) => [color, shape] as const));
  it.each(combos)('color=%s shape=%s has no accessibility violations', async (color, shape) => {
    const { container } = render(<Avatar name="Ada Lovelace" color={color} shape={shape} />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with a photo', async () => {
    const { container } = render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    await expectNoA11yViolations(container);
  });
});

describe('initialsOf', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['Cher', 'C'],
    ['Mary Ann Evans', 'ME'],
    ['  grace   hopper ', 'GH'],
    ['élodie durand', 'ÉD'],
    ['😀 Smile', '😀S'],
    ['', ''],
  ])('%j → %j', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
