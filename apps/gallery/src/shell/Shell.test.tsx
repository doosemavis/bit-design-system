import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';

describe('Shell', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it('has a skip link that targets main', async () => {
    renderAt('/');
    const skip = await screen.findByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');
    // Neutral, so .gallery-skip's text colour isn't beaten by the primary link colour.
    expect(skip).toHaveClass('bit-link', 'bit-neutral', 'gallery-skip');
    expect(skip).not.toHaveClass('bit-primary');
    expect(document.getElementById('main')).toHaveAttribute('tabindex', '-1');
  });

  it('the skip link focuses main and keeps the route (a #main href would be the route /main)', async () => {
    const { router } = renderAt('/components/button?color=danger');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.activeElement).toBe(document.getElementById('main'));
    expect(router.state.location.pathname).toBe('/components/button');
    expect(router.state.location.search).toBe('?color=danger');
  });

  it('does not move focus to the heading on first load', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    expect(document.activeElement).toBe(document.body);
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

  it('Escape closes the sheet and hands focus back to Menu', async () => {
    renderAt('/');
    const button = await screen.findByRole('button', { name: 'Menu' });
    await userEvent.click(button);
    within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Tokens' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('navigation', { name: 'Gallery' })).not.toHaveAttribute('data-open');
    expect(document.activeElement).toBe(button);
  });

  it.each([
    ['Getting started', 'Getting started'],
    ['Versions', 'Versions'],
    ['Release notes', 'Release notes'],
  ])('a Start here link (%s) in the Menu sheet closes it', async (link, title) => {
    renderAt('/tokens');
    const button = await screen.findByRole('button', { name: 'Menu' });
    await userEvent.click(button);
    const nav = screen.getByRole('navigation', { name: 'Gallery' });
    await userEvent.click(within(nav).getByRole('link', { name: link }));
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(nav).not.toHaveAttribute('data-open');
  });

  it('navigating closes the sheet, by a link in it or by Back', async () => {
    const { router } = renderAt('/');
    const button = await screen.findByRole('button', { name: 'Menu' });
    await userEvent.click(button);
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Badge' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await act(() => router.navigate(-1));
    expect(button).toHaveAttribute('aria-expanded', 'false');
    // Forward to the page it was opened on must not bring the closed sheet back.
    await act(() => router.navigate(1));
    expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
