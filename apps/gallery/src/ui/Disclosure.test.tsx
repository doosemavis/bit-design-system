import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('starts closed, with its content hidden', () => {
    render(<Disclosure title="More">Hidden text</Disclosure>);
    const button = screen.getByRole('button', { name: 'More' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Hidden text')).not.toBeVisible();
  });

  it('opens and closes on click, and names the region it controls', async () => {
    render(<Disclosure title="More">Hidden text</Disclosure>);
    const button = screen.getByRole('button', { name: 'More' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hidden text')).toBeVisible();
    expect(screen.getByRole('region', { name: 'More' })).toHaveAttribute('id', button.getAttribute('aria-controls'));
    await userEvent.click(button);
    expect(screen.getByText('Hidden text')).not.toBeVisible();
  });

  it('can start open', () => {
    render(<Disclosure title="More" defaultOpen>Shown</Disclosure>);
    expect(screen.getByText('Shown')).toBeVisible();
  });
});
