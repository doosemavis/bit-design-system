import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { BitTheme } from './BitTheme';
import { Button } from '../Button/Button';
import { expectNoA11yViolations } from '../../test/a11y';

describe('BitTheme', () => {
  it('renders a div.bit-theme with no mode or theme class of its own by default', () => {
    const { container } = render(<BitTheme>Hi</BitTheme>);
    const root = container.firstElementChild!;
    expect(root.tagName).toBe('DIV');
    expect(root.className).toBe('bit-theme');
  });

  it('mode is the bit-light or bit-dark class, and theme the bit-theme-<name> class', () => {
    const { container } = render(
      <BitTheme theme="power-up" mode="dark">
        Hi
      </BitTheme>,
    );
    expect(container.firstElementChild!.className).toBe('bit-theme bit-dark bit-theme-power-up');
  });

  it('takes any theme name, so a theme of your own works the same', () => {
    const { container } = render(<BitTheme theme="arcade-night-2">Hi</BitTheme>);
    expect(container.firstElementChild).toHaveClass('bit-theme-arcade-night-2');
  });

  it('drops a name that is not a theme name, with a dev warning, rather than writing a broken class', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<BitTheme theme="Power Up!">Hi</BitTheme>);
    expect(container.firstElementChild!.className).toBe('bit-theme');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[bit] BitTheme received theme="Power Up!"'));
    warn.mockRestore();
  });

  it('drops an unknown mode, as every axis does', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error system is not a BitTheme mode
    const { container } = render(<BitTheme mode="system">Hi</BitTheme>);
    expect(container.firstElementChild!.className).toBe('bit-theme');
    warn.mockRestore();
  });

  it('className decorators mirror the props: bit-dark replaces mode, bit-theme-<name> replaces theme', () => {
    const { container } = render(
      <BitTheme theme="power-up" mode="light" className="bit-dark bit-theme-retro sidebar">
        Hi
      </BitTheme>,
    );
    expect(container.firstElementChild!.className).toBe('bit-theme bit-dark bit-theme-retro sidebar');
  });

  it('forwards the ref and spreads other props onto the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <BitTheme ref={ref} mode="dark" data-testid="side" aria-label="Sidebar" role="complementary">
        Hi
      </BitTheme>,
    );
    expect(ref.current).toBe(screen.getByTestId('side'));
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toHaveClass('bit-theme', 'bit-dark');
  });

  it('asChild puts the classes on the one child instead of a div', () => {
    const ref = createRef<HTMLElement>();
    render(
      <BitTheme asChild mode="dark" ref={ref as never}>
        <aside className="sidebar">Hi</aside>
      </BitTheme>,
    );
    const aside = screen.getByRole('complementary');
    expect(aside.className).toBe('bit-theme bit-dark sidebar');
    expect(ref.current).toBe(aside);
    expect(document.querySelector('div.bit-theme')).toBeNull();
  });

  it('rejects the legacy DOM color attribute', () => {
    // @ts-expect-error color is not a BitTheme prop
    const { container } = render(<BitTheme color="danger">Hi</BitTheme>);
    expect(container.firstElementChild).not.toHaveAttribute('color');
  });

  it('has no accessibility violations around themed content', async () => {
    const { container } = render(
      <BitTheme theme="power-up" mode="dark">
        <Button>Save</Button>
      </BitTheme>,
    );
    await expectNoA11yViolations(container);
  });
});
