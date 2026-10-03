import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { COLORS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Badge', () => {
  it('renders a span with the default decorators', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toBe('bit-badge bit-neutral bit-solid bit-md');
  });

  it('maps color, variant, and size', () => {
    render(<Badge color="success" variant="outline" size="sm">1-Up</Badge>);
    expect(screen.getByText('1-Up').className).toBe('bit-badge bit-success bit-outline bit-sm');
  });

  it('appends className last, forwards ref, spreads props', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref} className="extra" data-testid="b">X</Badge>);
    expect(screen.getByTestId('b').className).toBe('bit-badge bit-neutral bit-solid bit-md extra');
    expect(ref.current).toBe(screen.getByTestId('b'));
  });

  it('is a pill by default and square on request, as data-shape (not a class)', () => {
    render(<Badge data-testid="pill">A</Badge>);
    render(<Badge shape="square" data-testid="square">B</Badge>);
    expect(screen.getByTestId('pill')).toHaveAttribute('data-shape', 'pill');
    expect(screen.getByTestId('square')).toHaveAttribute('data-shape', 'square');
    expect(screen.getByTestId('square').className).toBe('bit-badge bit-neutral bit-solid bit-md');
  });

  describe('unknown shape', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is dropped with a dev warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error only pill and square exist
      render(<Badge shape="round" data-testid="b">C</Badge>);
      expect(screen.getByTestId('b')).not.toHaveAttribute('data-shape');
      expect(warn.mock.calls[0]?.[0]).toContain('shape="round"');
    });
  });

  const variants = ['solid', 'outline'] as const;
  const combos = COLORS.flatMap((color) => variants.map((variant) => [color, variant] as const));
  it.each(combos)('color=%s variant=%s has no accessibility violations', async (color, variant) => {
    const { container } = render(<Badge color={color} variant={variant}>Tag</Badge>);
    await expectNoA11yViolations(container);
  });
});
