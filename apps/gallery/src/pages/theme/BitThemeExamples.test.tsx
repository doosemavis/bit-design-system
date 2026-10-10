import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { colorMode } from '@bit-ds/react';
import { BitThemeExamples } from './BitThemeExamples';
import { expectNoA11yViolations } from '../../test/a11y';

afterEach(() => {
  colorMode.set('system');
  localStorage.clear();
});

describe('BitThemeExamples', () => {
  it('shows the five forms, each a live sample in a Box beside its code, with no axe violations', async () => {
    const { container } = render(<BitThemeExamples />);
    const examples = screen.getAllByRole('article');
    expect(examples.map((e) => within(e).getAllByRole('heading')[0]!.textContent)).toEqual([
      'Whole app',
      'Follow the system',
      'Scoped',
      'Switching from code',
      'The data- attribute form',
    ]);
    for (const example of examples) {
      expect(example.querySelector('.gallery-example__sample.bit-box')).not.toBeNull();
      expect(example.querySelector('.bit-code__block')).not.toBeNull();
    }
    await expectNoA11yViolations(container);
  });

  it('the whole-app and attribute samples draw both modes side by side, by class and by data-mode', () => {
    render(<BitThemeExamples />);
    const whole = screen.getByRole('article', { name: 'Whole app' });
    expect(whole.querySelector('.bit-theme.bit-theme-power-up.bit-light')).not.toBeNull();
    expect(whole.querySelector('.bit-theme.bit-theme-power-up.bit-dark')).not.toBeNull();
    expect(whole).toHaveTextContent('<html lang="en" class="bit-theme-power-up bit-light">');
    const attribute = screen.getByRole('article', { name: 'The data- attribute form' });
    expect(attribute.querySelector('.bit-theme[data-theme="power-up"][data-mode="dark"]')).not.toBeNull();
  });

  it('the scoped sample is a dark aside next to the light page', () => {
    render(<BitThemeExamples />);
    expect(screen.getByRole('complementary', { name: 'Dark sidebar sample' })).toHaveClass('bit-theme', 'bit-dark');
  });

  it('switching from code writes the class and data-mode on <html>', async () => {
    const user = userEvent.setup();
    render(<BitThemeExamples />);
    const example = screen.getByRole('article', { name: 'Switching from code' });
    await user.click(within(example).getByRole('button', { name: 'Dark' }));
    expect(document.documentElement).toHaveClass('bit-dark');
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(example).toHaveTextContent('Showing dark.');
    await user.click(within(example).getByRole('button', { name: 'Follow the system' }));
    expect(document.documentElement).not.toHaveClass('bit-dark');
    expect(document.documentElement.dataset.mode).toBe('system');
  });

  it('each constraint is explained in a primary outline note', () => {
    render(<BitThemeExamples />);
    const notes = screen.getAllByRole('note');
    expect(notes.length).toBeGreaterThanOrEqual(3);
    for (const note of notes) expect(note).toHaveClass('bit-alert', 'bit-primary', 'bit-outline');
    expect(screen.getByRole('article', { name: 'Whole app' })).toHaveTextContent('not <body>');
  });
});
