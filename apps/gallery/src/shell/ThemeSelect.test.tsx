import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ThemeSelect } from './ThemeSelect';
import { THEMES } from './themes';
import { chooseOption, chosenLabel, optionLabels } from '../test/select';

describe('ThemeSelect', () => {
  it('sets data-theme on the root element', async () => {
    render(<ThemeSelect />);
    const trigger = screen.getByRole('combobox', { name: 'Theme' });
    await chooseOption(userEvent.setup(), trigger, 'power-up');
    expect(document.documentElement.dataset.theme).toBe('power-up');
    expect(chosenLabel(trigger)).toBe('power-up');
    expect(trigger).toHaveTextContent('power-up');
  });

  it('is a bit Select named Theme, one option per theme', () => {
    const { container } = render(<ThemeSelect />);
    const trigger = screen.getByRole('combobox', { name: 'Theme' });
    expect(trigger).toHaveClass('bit-select__control');
    expect(optionLabels(trigger)).toEqual([...THEMES]);
    expect(container.querySelector('.gallery-theme__select')).toBeNull();
  });
});
