import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';

describe('Shell', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it('home shows the logo, the install lines, and the naming rule', async () => {
    const { container } = renderAt('/');
    expect((await screen.findAllByRole('img', { name: 'bit' })).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('bit');
    expect(screen.getByText(/pnpm add @bit\/react/)).toBeInTheDocument();
    expect(screen.getByText('bit-primary')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('has a skip link that targets main', async () => {
    renderAt('/');
    const skip = await screen.findByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).not.toBeNull();
  });

  it('moves focus to the page heading after navigation', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(screen.getByRole('link', { name: 'Tokens' }));
    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Tokens');
      expect(document.activeElement).toBe(h1);
    });
  });

  it('theme select sets data-theme on the root element', async () => {
    renderAt('/');
    const select = await screen.findByLabelText('Theme');
    await userEvent.selectOptions(select, 'power-up');
    expect(document.documentElement.dataset.theme).toBe('power-up');
  });

  it('unknown routes render the 404 with a link home', async () => {
    const { container } = renderAt('/nope');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    await expectNoA11yViolations(container);
  });

  it('menu button toggles the navigation for narrow screens', async () => {
    renderAt('/');
    const button = await screen.findByRole('button', { name: 'Menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Gallery' })).toHaveAttribute('data-open', '');
  });
});
