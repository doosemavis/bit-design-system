import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ThemeSelect } from './ThemeSelect';

describe('ThemeSelect', () => {
  it('sets data-theme on the root element', async () => {
    render(<ThemeSelect />);
    await userEvent.selectOptions(screen.getByLabelText('Theme'), 'power-up');
    expect(document.documentElement.dataset.theme).toBe('power-up');
  });
});
