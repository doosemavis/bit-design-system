import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from './Stack';

describe('Stack', () => {
  it('renders a column with gap 3 by default and no decorator classes', () => {
    render(<Stack data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el.className).toBe('bit-stack');
    expect(el).toHaveAttribute('data-direction', 'column');
    expect(el).toHaveAttribute('data-gap', '3');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-justify');
    expect(el).not.toHaveAttribute('data-wrap');
  });

  it('exposes layout props as data attributes', () => {
    render(<Stack direction="row" gap={6} align="center" justify="between" wrap data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el).toHaveAttribute('data-direction', 'row');
    expect(el).toHaveAttribute('data-gap', '6');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap', '');
  });

  it('appends className last', () => {
    render(<Stack className="extra" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').className).toBe('bit-stack extra');
  });
});
