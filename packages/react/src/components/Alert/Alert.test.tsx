import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';
import { COLORS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Alert', () => {
  it('renders role="status" with default decorators and a body element', () => {
    render(<Alert>Saved.</Alert>);
    const alert = screen.getByRole('status');
    expect(alert.className).toBe('bit-alert bit-neutral bit-outline');
    expect(screen.getByText('Saved.').className).toBe('bit-alert__body');
    expect(alert.querySelector('.bit-alert__title')).toBeNull();
  });

  it('renders the title in a title element', () => {
    render(<Alert title="Coins collected">You picked up 42 coins.</Alert>);
    expect(screen.getByText('Coins collected').className).toBe('bit-alert__title');
  });

  it('maps color and variant, and lets role be overridden', () => {
    render(<Alert color="danger" variant="solid" role="alert">Game over</Alert>);
    expect(screen.getByRole('alert').className).toBe('bit-alert bit-danger bit-solid');
  });

  const variants = ['solid', 'outline'] as const;
  const combos = COLORS.flatMap((color) => variants.map((variant) => [color, variant] as const));
  it.each(combos)('color=%s variant=%s has no accessibility violations', async (color, variant) => {
    const { container } = render(<Alert color={color} variant={variant} title="Heads up">Body</Alert>);
    await expectNoA11yViolations(container);
  });
});
