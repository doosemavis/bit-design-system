import { act, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { useFocusHeading } from './useFocusHeading';

function Layout() {
  useFocusHeading();
  return (
    <main>
      <Outlet />
    </main>
  );
}

/** A page whose first h1s are presentational samples, like the Typography page's heading table. */
function SamplePage() {
  return (
    <>
      <h1 role="presentation">Page title sample</h1>
      <h1 role="none">Another sample</h1>
      <h1>Real title</h1>
    </>
  );
}

describe('useFocusHeading', () => {
  it('skips presentational h1 samples and focuses the real page heading', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <h1>Home</h1> },
            { path: '/samples', element: <SamplePage /> },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );
    const { getByText } = render(<RouterProvider router={router} />);
    await act(() => router.navigate('/samples'));
    await waitFor(() => expect(document.activeElement).toBe(getByText('Real title')));
  });

  it('a query-only change (a control on a component page) keeps focus where it is', async () => {
    const router = createMemoryRouter(
      [{ element: <Layout />, children: [{ path: '/page', element: <h1>Page</h1> }] }],
      { initialEntries: ['/page'] },
    );
    render(<RouterProvider router={router} />);
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    await act(() => router.navigate('/page?color=danger'));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('coming back to the first page is a page change too, so its heading takes focus', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <h1>Home</h1> },
            { path: '/other', element: <h1>Other</h1> },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );
    const { getByText } = render(<RouterProvider router={router} />);
    await act(() => router.navigate('/other'));
    await waitFor(() => expect(document.activeElement).toBe(getByText('Other')));
    await act(() => router.navigate('/'));
    await waitFor(() => expect(document.activeElement).toBe(getByText('Home')));
  });
});
