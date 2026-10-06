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

  it('has no Card of its own: a named region of the bar then the stage, framed by the Playground card', () => {
    render(<Preview label="Button preview">x</Preview>);
    const region = screen.getByRole('region', { name: 'Button preview' });
    expect(region).toHaveClass('gallery-preview');
    expect(region.querySelector('.bit-card')).toBeNull();
    expect([...region.children].map((child) => child.className)).toEqual(['gallery-preview__bar', 'gallery-preview__stage']);
  });
});
