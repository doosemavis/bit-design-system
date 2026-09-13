import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Preview } from './Preview';

describe('Preview', () => {
  it('renders its children on a labelled stage and toggles the checkerboard', async () => {
    render(
      <Preview label="Button preview">
        <button>hi</button>
      </Preview>,
    );
    const stage = screen.getByRole('region', { name: 'Button preview' });
    expect(stage).toContainElement(screen.getByRole('button', { name: 'hi' }));
    expect(stage).not.toHaveAttribute('data-checkerboard');
    await userEvent.click(screen.getByRole('switch', { name: 'Checkerboard' }));
    expect(stage).toHaveAttribute('data-checkerboard', '');
  });
});
