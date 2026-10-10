import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeToggle } from './ModeToggle';
import { resetColorModeStore } from '../../mode/colorMode';
import { expectNoA11yViolations } from '../../test/a11y';

const root = () => document.documentElement;
const pressed = (name: string) => screen.getAllByRole('button', { name }).map((b) => b.getAttribute('aria-pressed'));

beforeEach(() => {
  localStorage.clear();
  delete root().dataset.mode;
  resetColorModeStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ModeToggle', () => {
  it('renders a labelled group with Light and Dark; the current mode is pressed', () => {
    render(<ModeToggle />);
    const group = screen.getByRole('group', { name: 'Color mode' });
    expect(group.className).toBe('bit-mode-toggle bit-md');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking Dark switches the page and the pressed state, and Light switches back', async () => {
    render(<ModeToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(root().dataset.mode).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(root().dataset.mode).toBe('light');
  });

  it('works from the keyboard', async () => {
    render(<ModeToggle />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(root().dataset.mode).toBe('dark');
  });

  it('two toggles stay in sync', async () => {
    render(
      <>
        <ModeToggle aria-label="Header mode" />
        <ModeToggle aria-label="Preview mode" />
      </>,
    );
    await userEvent.click(buttonIn('Header mode', 'Dark'));
    expect(pressed('Dark')).toEqual(['true', 'true']);
  });

  it('takes size and className, and an aria-label override', () => {
    render(<ModeToggle size="sm" className="extra" aria-label="Theme" />);
    expect(screen.getByRole('group', { name: 'Theme' }).className).toBe('bit-mode-toggle bit-sm extra');
  });

  describe('iconOnly', () => {
    it('shows the sun and moon icons only; each button keeps its name, and the group says data-icon-only', () => {
      render(<ModeToggle iconOnly />);
      const group = screen.getByRole('group', { name: 'Color mode' });
      expect(group).toHaveAttribute('data-icon-only', '');
      const light = screen.getByRole('button', { name: 'Light' });
      const dark = screen.getByRole('button', { name: 'Dark' });
      for (const button of [light, dark]) {
        expect(button.textContent).toBe('');
        // The icon is decoration: the button's name carries it.
        expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('draws the icon one size up from the control: md beside sm, lg beside md', () => {
      const { rerender } = render(<ModeToggle iconOnly size="sm" />);
      expect(screen.getByRole('button', { name: 'Light' }).querySelector('svg')).toHaveClass('bit-md');
      rerender(<ModeToggle iconOnly size="md" />);
      expect(screen.getByRole('button', { name: 'Light' }).querySelector('svg')).toHaveClass('bit-lg');
    });

    it('still switches the mode, and has no accessibility violations', async () => {
      const { container } = render(<ModeToggle iconOnly />);
      await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
      expect(root().dataset.mode).toBe('dark');
      expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
      await expectNoA11yViolations(container);
    });

    it('is off by default: the words and glyphs stay', () => {
      render(<ModeToggle />);
      expect(screen.getByRole('group')).not.toHaveAttribute('data-icon-only');
      expect(screen.getByRole('button', { name: /Light/ }).textContent).toContain('Light');
    });
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of ModeToggleProps
    render(<ModeToggle color="danger" data-testid="t" />);
    expect(screen.getByTestId('t')).not.toHaveAttribute('color');
  });

  it.each(['light', 'dark'] as const)('has no accessibility violations in %s mode', async (mode) => {
    root().dataset.mode = mode;
    const { container } = render(<ModeToggle />);
    await expectNoA11yViolations(container);
  });
});

/** The named button inside the named group. */
function buttonIn(groupName: string, buttonName: string): HTMLElement {
  const group = screen.getByRole('group', { name: groupName });
  const button = [...group.querySelectorAll('button')].find((b) => b.textContent?.includes(buttonName));
  if (!button) throw new Error(`no ${buttonName} button in ${groupName}`);
  return button;
}
