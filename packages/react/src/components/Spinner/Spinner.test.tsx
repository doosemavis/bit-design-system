import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Spinner', () => {
  it('renders role="status" with the required label and default decorators', () => {
    render(<Spinner aria-label="Loading coins" />);
    const el = screen.getByRole('status', { name: 'Loading coins' });
    expect(el.className).toBe('bit-spinner bit-primary bit-md');
  });

  it('maps tone and size and appends className last', () => {
    render(<Spinner aria-label="Loading" tone="danger" size="lg" className="extra" />);
    expect(screen.getByRole('status').className).toBe('bit-spinner bit-danger bit-lg extra');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Spinner aria-label="Loading" />);
    await expectNoA11yViolations(container);
  });
});
