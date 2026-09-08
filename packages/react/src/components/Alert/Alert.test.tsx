import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';
import { TONES } from '../../system/axes';
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

  it('maps tone and variant, and lets role be overridden', () => {
    render(<Alert tone="danger" variant="solid" role="alert">Game over</Alert>);
    expect(screen.getByRole('alert').className).toBe('bit-alert bit-danger bit-solid');
  });

  it.each(TONES)('tone=%s has no accessibility violations', async (tone) => {
    const { container } = render(<Alert tone={tone} title="Heads up">Body</Alert>);
    await expectNoA11yViolations(container);
  });
});
