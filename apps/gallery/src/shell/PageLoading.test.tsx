import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ComponentLoading, LOADING_DELAY_MS, PageLoading } from './PageLoading';
import { renderAt } from '../test/renderRoute';

// The Typography page's code never arrives in this file, so its route stays suspended.
vi.mock('../pages/TypographyPage', () => new Promise(() => {}));

afterEach(() => {
  vi.useRealTimers();
});

describe('PageLoading', () => {
  it('shows nothing for the first 300ms, then a Spinner and "Loading <Name>…"', () => {
    vi.useFakeTimers();
    const { container } = render(<PageLoading name="Tokens" />);
    act(() => vi.advanceTimersByTime(LOADING_DELAY_MS - 1));
    expect(container).toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status', { name: 'Loading Tokens…' })).toHaveClass('bit-spinner');
    expect(screen.getByText('Loading Tokens…')).toHaveAttribute('aria-hidden', 'true');
  });

  it('a page that arrives in time never shows it, and leaves no timer behind', () => {
    vi.useFakeTimers();
    const { unmount } = render(<PageLoading name="Tokens" />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('on a component route it names the component, or says "component" for an unknown slug', () => {
    vi.useFakeTimers();
    for (const [path, label] of [
      ['/components/button', 'Loading Button…'],
      ['/components/nope', 'Loading component…'],
    ] as const) {
      const router = createMemoryRouter([{ path: '/components/:slug', element: <ComponentLoading /> }], {
        initialEntries: [path],
      });
      const { unmount } = render(<RouterProvider router={router} />);
      act(() => vi.advanceTimersByTime(LOADING_DELAY_MS));
      expect(screen.getByRole('status', { name: label })).toBeInTheDocument();
      unmount();
    }
  });

  it('moving from one lazy page to another shows the new page\'s loading state, not the old page', async () => {
    const { router } = renderAt('/tokens');
    await screen.findByRole('heading', { level: 1, name: 'Tokens' });
    await act(async () => {
      void router.navigate('/typography');
    });
    expect(await screen.findByRole('status', { name: 'Loading Typography…' }, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Tokens' })).toBeNull();
  });
});
