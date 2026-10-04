import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Preview } from './Preview';

describe('Preview', () => {
  it('renders its children on a labelled stage and toggles the checkerboard with a bit Switch', async () => {
    render(
      <Preview label="Button preview" presets={<span>presets here</span>}>
        <button>hi</button>
      </Preview>,
    );
    const stage = screen.getByRole('region', { name: 'Button preview' });
    expect(stage).toContainElement(screen.getByRole('button', { name: 'hi' }));
    expect(stage).toContainElement(screen.getByText('presets here'));
    expect(stage).not.toHaveAttribute('data-checkerboard');
    const toggle = screen.getByRole('switch', { name: 'Checkerboard' });
    expect(toggle).toHaveClass('bit-switch__input');
    await userEvent.click(toggle);
    expect(stage).toHaveAttribute('data-checkerboard', '');
  });
});
