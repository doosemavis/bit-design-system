import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { PageError } from './PageError';
import { Shell } from './Shell';
import { buildRoutes } from '../router';
import { expectNoA11yViolations } from '../test/a11y';

function Broken(): never {
  throw new Error('chunk failed to load');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PageError', () => {
  it('a page that throws shows the danger Alert and Reload inside the shell, header and sidebar intact', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReload = vi.fn();
    const router = createMemoryRouter(
      [{ element: <Shell />, children: [{ errorElement: <PageError onReload={onReload} />, children: [{ index: true, element: <Broken /> }] }] }],
      { initialEntries: ['/'] },
    );
    const { container } = render(<RouterProvider router={router} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('bit-alert', 'bit-danger');
    expect(alert).toHaveTextContent("This page didn't load. Check your connection and try again.");
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Tokens' })).toBeInTheDocument();
    const reload = screen.getByRole('button', { name: 'Reload page' });
    expect(reload).toHaveClass('bit-primary', 'bit-solid');
    await userEvent.click(reload);
    expect(onReload).toHaveBeenCalledTimes(1);
    await expectNoA11yViolations(container);
  });

  it('the real route table catches page errors one level under the shell', () => {
    const [shell] = buildRoutes();
    const [pages] = shell!.children!;
    expect(pages!.path).toBeUndefined();
    expect((pages!.errorElement as { type: unknown }).type).toBe(PageError);
    expect(pages!.children!.map((route) => (route.index ? '(index)' : route.path))).toEqual([
      '(index)',
      'getting-started',
      'versions',
      'accessibility',
      'release-notes',
      'tokens',
      'typography',
      'spacing',
      'components/:slug',
      'brand/logo',
      '*',
    ]);
  });
});
